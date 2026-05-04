<?php

use App\Models\Product;
use App\Models\User;
use Database\Seeders\CatalogSeeder;

test('post orders json exposes order fields and payment_setup_secret at top level', function () {
    $this->seed(CatalogSeeder::class);

    $user = User::factory()->create();
    $this->actingAs($user);

    $product = Product::query()->firstOrFail();

    $this->postJson('/api/v1/cart/add', [
        'product_id' => $product->id,
        'quantity' => 1,
    ])->assertSuccessful();

    $response = $this->postJson('/api/v1/orders', []);

    $response->assertCreated();
    $body = $response->json();
    expect($body)->not->toHaveKey('data');
    expect($body['order_number'] ?? null)->toBeString()->not->toBe('');
    expect($body['payment_setup_secret'] ?? null)->toBeString()->not->toBe('');
});
