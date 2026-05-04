<?php

namespace App\Services;

use App\Http\Requests\Catalog\StoreProductRequest;
use App\Http\Requests\Catalog\UpdateProductRequest;
use App\Models\Product;
use App\Services\Inventory\InventoryLedgerService;
use Illuminate\Support\Facades\DB;

class CatalogProductService
{
    public function __construct(
        private InventoryLedgerService $inventoryLedger,
    ) {}

    public function store(StoreProductRequest $request): Product
    {
        return DB::transaction(function () use ($request): Product {
            $data = $request->safe()->except(['variants', 'images']);
            $data['slug'] = Product::makeUniqueSlug($data['slug'] ?? $data['name']);
            $data['is_active'] = $data['is_active'] ?? true;

            $product = Product::query()->create($data);

            $this->syncVariants($product, $request->input('variants', []));
            $this->storeUploadedImages($product, $request);

            $fresh = $product->fresh(['category', 'images', 'variants']) ?? $product;
            $this->inventoryLedger->syncOnHandFromCatalogProduct($fresh);

            return $fresh->fresh(['category', 'images', 'variants']) ?? $fresh;
        });
    }

    public function update(UpdateProductRequest $request, Product $product): Product
    {
        return DB::transaction(function () use ($request, $product): Product {
            $data = $request->safe()->except(['variants', 'delete_image_ids', 'images']);

            if (array_key_exists('slug', $data)) {
                $data['slug'] = Product::makeUniqueSlug($data['slug'], $product->id);
            }

            if ($data !== []) {
                $product->fill($data);
                $product->save();
            }

            if (array_key_exists('variants', $request->validated())) {
                $product->variants()->delete();
                $this->syncVariants($product, $request->input('variants', []));
            }

            $deleteIds = $request->validated('delete_image_ids');
            if (is_array($deleteIds) && $deleteIds !== []) {
                $product->images()->whereIn('id', $deleteIds)->delete();
            }

            $this->storeUploadedImages($product, $request);

            $fresh = $product->fresh(['category', 'images', 'variants']) ?? $product;
            $this->inventoryLedger->syncOnHandFromCatalogProduct($fresh);

            return $fresh->fresh(['category', 'images', 'variants']) ?? $fresh;
        });
    }

    /**
     * @param  array<int, array<string, mixed>>  $variants
     */
    protected function syncVariants(Product $product, array $variants): void
    {
        $position = 0;
        foreach ($variants as $row) {
            $product->variants()->create([
                'name' => $row['name'],
                'sku' => $row['sku'],
                'price_adjustment' => $row['price_adjustment'] ?? 0,
                'stock' => $row['stock'] ?? 0,
                'position' => $row['position'] ?? $position,
            ]);
            $position++;
        }
    }

    protected function storeUploadedImages(Product $product, StoreProductRequest|UpdateProductRequest $request): void
    {
        if (! $request->hasFile('images')) {
            return;
        }

        $disk = (string) config('catalog.images_disk');
        $max = (int) $product->images()->max('sort_order');

        foreach ($request->file('images', []) as $idx => $file) {
            if ($file === null) {
                continue;
            }

            $path = $file->store('products', $disk);

            $product->images()->create([
                'disk' => $disk,
                'path' => $path,
                'alt_text' => null,
                'sort_order' => $max + $idx + 1,
            ]);
        }
    }
}
