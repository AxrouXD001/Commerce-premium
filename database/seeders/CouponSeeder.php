<?php

namespace Database\Seeders;

use App\Enums\CouponDiscountType;
use App\Models\Coupon;
use Illuminate\Database\Seeder;

class CouponSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Coupon::query()->firstOrCreate(
            ['code' => 'BIENVENIDO10'],
            [
                'description' => 'Descuento 10% hasta S/ 150 máx.',
                'discount_type' => CouponDiscountType::Percent,
                'percent_value' => 10,
                'fixed_amount' => null,
                'min_subtotal' => null,
                'max_discount_amount' => 150,
                'starts_at' => now()->startOfYear(),
                'ends_at' => now()->copy()->addYear(),
                'usage_limit' => 10000,
                'used_count' => 0,
                'is_active' => true,
            ],
        );

        Coupon::query()->firstOrCreate(
            ['code' => 'DESCUENTO20'],
            [
                'description' => 'Cupón de S/ 20 en compras mayores a S/ 200',
                'discount_type' => CouponDiscountType::FixedAmount,
                'percent_value' => null,
                'fixed_amount' => '20',
                'min_subtotal' => '200',
                'max_discount_amount' => null,
                'starts_at' => now()->startOfYear(),
                'ends_at' => now()->copy()->addYear(),
                'usage_limit' => 5000,
                'used_count' => 0,
                'is_active' => true,
            ],
        );
    }
}
