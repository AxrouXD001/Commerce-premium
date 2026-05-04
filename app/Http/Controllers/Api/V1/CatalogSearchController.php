<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\ProductResource;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Http;

class CatalogSearchController extends Controller
{
    public function __invoke(Request $request): JsonResponse|AnonymousResourceCollection
    {
        $base = rtrim((string) config('services.search.url'), '/');

        if ($base !== '') {
            try {
                $response = Http::timeout(8)
                    ->acceptJson()
                    ->get($base.'/search', $request->query());

                if ($response->successful()) {
                    /** @var array<string, mixed> $decoded */
                    $decoded = $response->json();

                    return response()->json($decoded);
                }
            } catch (\Throwable) {
                //
            }
        }

        return $this->databaseSearch($request);
    }

    protected function databaseSearch(Request $request): AnonymousResourceCollection
    {
        $query = Product::query()
            ->active()
            ->with(['category', 'images', 'variants'])
            ->search($request->query('q'))
            ->when(
                $request->filled('category_id'),
                fn ($q) => $q->forCategory((int) $request->query('category_id'))
            )
            ->priceBetween($request->query('min_price'), $request->query('max_price'))
            ->ordered($request->query('sort', 'latest'));

        $perPage = min(max((int) $request->query('per_page', 12), 1), 50);

        $paginator = $query->paginate($perPage)->withQueryString();

        $facetCategories = Category::query()
            ->active()
            ->whereHas('products', fn ($q) => $q->active())
            ->withCount([
                'products as active_products_count' => fn ($q) => $q->active(),
            ])
            ->orderBy('name')
            ->get();

        return ProductResource::collection($paginator)->additional([
            'facets' => [
                'categories' => CategoryResource::collection($facetCategories)->resolve(),
            ],
        ]);
    }
}
