<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\InventoryLineResource;
use App\Models\Inventory;
use App\Services\Inventory\InventoryLedgerService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class InventoryController extends Controller
{
    public function index(Request $request, InventoryLedgerService $ledger): AnonymousResourceCollection
    {
        $warehouseId = (int) $request->integer('warehouse_id', $ledger->defaultWarehouseId());

        $query = Inventory::query()
            ->where('warehouse_id', $warehouseId)
            ->with(['product:id,name,sku']);

        if ($request->filled('q')) {
            $term = '%'.str_replace(['%', '_'], ['\\%', '\\_'], (string) $request->query('q')).'%';
            $query->whereHas('product', function ($q) use ($term): void {
                $q->where('name', 'like', $term)
                    ->orWhere('sku', 'like', $term);
            });
        }

        $perPage = min(50, max(5, (int) $request->integer('per_page', 25)));

        return InventoryLineResource::collection(
            $query->orderBy('product_id')->orderBy('product_variant_key')->paginate($perPage),
        );
    }
}
