<?php

namespace App\Observers;

use App\Models\PriceHistory;
use App\Models\Product;
use App\Services\ProductSearchSyncService;

class ProductObserver
{
    public function __construct(
        protected ProductSearchSyncService $searchSync,
    ) {}

    public function updated(Product $product): void
    {
        if ($product->wasChanged('price')) {
            PriceHistory::query()->create([
                'product_id' => $product->id,
                'old_price' => $product->getOriginal('price'),
                'new_price' => $product->price,
                'changed_by' => auth()->id(),
                'recorded_at' => now(),
            ]);
        }
    }

    public function saved(Product $product): void
    {
        $this->searchSync->scheduleUpsertAfterCommit($product);
    }

    public function deleted(Product $product): void
    {
        if ($product->isForceDeleting()) {
            $this->searchSync->scheduleRemoveAfterCommit($product->id);
        }
    }

    public function restored(Product $product): void
    {
        $this->searchSync->scheduleUpsertAfterCommit($product);
    }
}
