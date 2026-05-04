<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\StoreProductRequest;
use App\Http\Requests\Catalog\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\CatalogProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class ProductController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
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

        return ProductResource::collection(
            $query->paginate($perPage)->withQueryString()
        );
    }

    public function show(Product $product): ProductResource
    {
        if (! $product->is_active) {
            abort(Response::HTTP_NOT_FOUND);
        }

        return new ProductResource($product->load(['category', 'images', 'variants']));
    }

    public function store(StoreProductRequest $request, CatalogProductService $catalog): JsonResponse
    {
        $product = $catalog->store($request);

        return (new ProductResource($product))->response()->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(UpdateProductRequest $request, Product $product, CatalogProductService $catalog): ProductResource
    {
        return new ProductResource($catalog->update($request, $product));
    }

    public function destroy(Product $product): Response
    {
        $product->delete();

        return response()->noContent();
    }
}
