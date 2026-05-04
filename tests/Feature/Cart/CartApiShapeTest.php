<?php

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use App\Services\Inventory\InventoryLedgerService;
use Database\Seeders\CatalogSeeder;

test('cart json exposes items and meta at top level without data wrapper', function () {
    $this->seed(CatalogSeeder::class);

    $product = Product::query()->firstOrFail();

    $user = User::factory()->create();
    $this->actingAs($user);

    $empty = $this->getJson('/api/v1/cart');
    $empty->assertSuccessful();
    $empty->assertJsonStructure(['id', 'coupon_code', 'items', 'meta']);
    expect($empty->json())->not->toHaveKey('data');

    $this->postJson('/api/v1/cart/add', [
        'product_id' => $product->id,
        'quantity' => 2,
    ])->assertSuccessful();

    $filled = $this->getJson('/api/v1/cart');
    $filled->assertSuccessful();
    $body = $filled->json();
    expect($body)->not->toHaveKey('data');
    expect($body['items'])->toBeArray()->not->toBeEmpty();
    expect($body['meta']['grand_total'] ?? null)->not->toBeNull();
});

test('cart add requires matching variant when product has variants', function () {
    $this->seed(CatalogSeeder::class);

    $product = Product::query()->where('slug', 'laptop-ejemplo')->firstOrFail();
    $variant = ProductVariant::query()->create([
        'product_id' => $product->id,
        'name' => '16 GB RAM',
        'sku' => 'LAP-VAR-001',
        'price_adjustment' => 0,
        'stock' => 10,
        'position' => 0,
    ]);
    app(InventoryLedgerService::class)->syncOnHandFromCatalogProduct($product->fresh(['variants']));

    $this->postJson('/api/v1/cart/add', [
        'product_id' => $product->id,
        'quantity' => 1,
    ])->assertUnprocessable()->assertInvalid(['product_variant_id']);

    $this->postJson('/api/v1/cart/add', [
        'product_id' => $product->id,
        'product_variant_id' => $variant->id,
        'quantity' => 1,
    ])->assertSuccessful();
});
