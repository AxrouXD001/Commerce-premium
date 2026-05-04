<?php

use App\Models\Inventory;
use App\Models\Product;
use Database\Seeders\CatalogSeeder;

test('catalog seeder creates active products with inventory rows', function () {
    $this->seed(CatalogSeeder::class);

    expect(Product::query()->where('is_active', true)->count())->toBeGreaterThanOrEqual(10);

    foreach (Product::query()->where('is_active', true)->get() as $product) {
        expect(
            Inventory::query()
                ->where('product_id', $product->id)
                ->where('product_variant_key', 0)
                ->exists(),
        )->toBeTrue();
    }
});
