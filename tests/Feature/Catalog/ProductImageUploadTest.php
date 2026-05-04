<?php

use App\Models\Product;
use App\Models\User;
use Database\Seeders\CatalogSeeder;
use Illuminate\Http\UploadedFile;

test('product update via post with method spoof stores new images', function () {
    $this->seed(CatalogSeeder::class);

    $product = Product::query()->where('slug', 'laptop-ejemplo')->firstOrFail();
    $before = $product->images()->count();

    $user = User::factory()->create();
    $user->assignRole('admin');

    $file = UploadedFile::fake()->create('nueva.jpg', 10, 'image/jpeg');

    $this->actingAs($user)
        ->post("/catalog/products/{$product->slug}", [
            '_method' => 'PUT',
            'name' => $product->name,
            'slug' => $product->slug,
            'sku' => $product->sku,
            'category_id' => (string) $product->category_id,
            'description' => (string) $product->description,
            'price' => (string) $product->price,
            'compare_at_price' => $product->compare_at_price !== null ? (string) $product->compare_at_price : '',
            'stock' => (string) $product->stock,
            'is_active' => '1',
            'images' => [$file],
        ])
        ->assertRedirect();

    expect($product->fresh()->images()->count())->toBe($before + 1);
});
