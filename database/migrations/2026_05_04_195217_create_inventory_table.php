<?php

use App\Models\Product;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('inventory', function (Blueprint $table) {
            $table->id();
            $table->foreignId('warehouse_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            /** 0 = producto sin variante; >0 = id de product_variants */
            $table->unsignedBigInteger('product_variant_key')->default(0);
            $table->unsignedInteger('on_hand')->default(0);
            $table->unsignedInteger('reserved')->default(0);
            $table->unsignedInteger('reorder_point')->default(5);
            $table->timestamp('last_low_stock_alert_at')->nullable();
            $table->timestamps();

            $table->unique(['warehouse_id', 'product_id', 'product_variant_key']);
            $table->index(['warehouse_id', 'product_id']);
        });

        $warehouseId = (int) DB::table('warehouses')->where('is_default', true)->value('id');

        if ($warehouseId < 1) {
            return;
        }

        Product::query()->with('variants')->chunkById(100, function ($products) use ($warehouseId): void {
            foreach ($products as $product) {
            if ($product->variants->isNotEmpty()) {
                foreach ($product->variants as $variant) {
                    DB::table('inventory')->insert([
                        'warehouse_id' => $warehouseId,
                        'product_id' => $product->getKey(),
                        'product_variant_key' => $variant->getKey(),
                        'on_hand' => max(0, (int) $variant->stock),
                        'reserved' => 0,
                        'reorder_point' => 5,
                        'last_low_stock_alert_at' => null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                continue;
            }

            DB::table('inventory')->insert([
                'warehouse_id' => $warehouseId,
                'product_id' => $product->getKey(),
                'product_variant_key' => 0,
                'on_hand' => max(0, (int) $product->stock),
                'reserved' => 0,
                'reorder_point' => 5,
                'last_low_stock_alert_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory');
    }
};
