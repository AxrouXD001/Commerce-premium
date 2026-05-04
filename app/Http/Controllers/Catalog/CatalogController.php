<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\StoreProductRequest;
use App\Http\Requests\Catalog\UpdateProductRequest;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\ProductResource;
use App\Models\Category;
use App\Models\Product;
use App\Services\CatalogProductService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CatalogController extends Controller
{
    public function index(): Response
    {
        $categories = Category::query()->active()->orderBy('name')->get();

        return Inertia::render('catalog/product-list', [
            'categories' => CategoryResource::collection($categories)->resolve(),
        ]);
    }

    public function show(Product $product): Response
    {
        if (! $product->is_active) {
            abort(404);
        }

        return Inertia::render('catalog/product-detail', [
            'product' => (new ProductResource($product->load(['category', 'images', 'variants'])))->resolve(),
        ]);
    }

    public function create(): Response
    {
        $categories = Category::query()->active()->orderBy('name')->get();

        return Inertia::render('catalog/product-form', [
            'product' => null,
            'categories' => CategoryResource::collection($categories)->resolve(),
        ]);
    }

    public function edit(Product $product): Response
    {
        $categories = Category::query()->active()->orderBy('name')->get();

        return Inertia::render('catalog/product-form', [
            'product' => (new ProductResource($product->load(['category', 'images', 'variants'])))->resolve(),
            'categories' => CategoryResource::collection($categories)->resolve(),
        ]);
    }

    public function store(StoreProductRequest $request, CatalogProductService $catalog): RedirectResponse
    {
        $catalog->store($request);

        return to_route('catalog.index');
    }

    public function update(UpdateProductRequest $request, Product $product, CatalogProductService $catalog): RedirectResponse
    {
        $catalog->update($request, $product);

        return to_route('catalog.show', $product);
    }

    public function destroy(Product $product): RedirectResponse
    {
        $product->delete();

        return to_route('catalog.index');
    }
}
