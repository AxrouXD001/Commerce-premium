<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ProductSearchSyncService
{
    /**
     * @return array<string, mixed>
     */
    public function buildPayload(Product $product): array
    {
        $product->loadMissing(['category', 'variants', 'images']);

        return [
            'id' => $product->id,
            'name' => $product->name,
            'slug' => $product->slug,
            'sku' => $product->sku,
            'description' => $product->description,
            'price' => (float) $product->price,
            'compare_at_price' => $product->compare_at_price !== null ? (float) $product->compare_at_price : null,
            'stock' => (int) $product->stock,
            'is_active' => (bool) $product->is_active,
            'category_id' => $product->category_id,
            'category_name' => $product->category?->name,
            'category_slug' => $product->category?->slug,
            'deleted_at' => $product->deleted_at?->toIso8601String(),
            'variants' => $product->variants->map(fn ($v) => [
                'id' => $v->id,
                'name' => $v->name,
                'sku' => $v->sku,
                'price_adjustment' => (float) $v->price_adjustment,
                'stock' => (int) $v->stock,
            ])->values()->all(),
            'image_urls' => $product->images->map(fn ($i) => $i->absoluteUrl())->values()->all(),
            'updated_at' => $product->updated_at?->toIso8601String(),
        ];
    }

    public function upsert(Product $product): void
    {
        $url = rtrim((string) config('services.search.url'), '/');
        if ($url === '') {
            return;
        }

        $token = config('services.search.token');

        try {
            $request = Http::timeout(5)->acceptJson();
            if ($token) {
                $request = $request->withToken((string) $token);
            }

            $request->post($url.'/internal/products', $this->buildPayload($product));
        } catch (\Throwable $e) {
            Log::warning('Product search sync failed', ['message' => $e->getMessage()]);
        }
    }

    public function remove(int $productId): void
    {
        $url = rtrim((string) config('services.search.url'), '/');
        if ($url === '') {
            return;
        }

        $token = config('services.search.token');

        try {
            $request = Http::timeout(5)->acceptJson();
            if ($token) {
                $request = $request->withToken((string) $token);
            }

            $request->delete($url.'/internal/products/'.$productId);
        } catch (\Throwable $e) {
            Log::warning('Product search delete failed', ['message' => $e->getMessage()]);
        }
    }

    public function scheduleUpsertAfterCommit(Product $product): void
    {
        $id = $product->id;

        DB::afterCommit(function () use ($id): void {
            $fresh = Product::query()->withTrashed()->with(['category', 'variants', 'images'])->find($id);
            if ($fresh) {
                $this->upsert($fresh);
            }
        });
    }

    public function scheduleRemoveAfterCommit(int $productId): void
    {
        DB::afterCommit(function () use ($productId): void {
            $this->remove($productId);
        });
    }
}
