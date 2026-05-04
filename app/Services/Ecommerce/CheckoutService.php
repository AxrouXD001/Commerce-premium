<?php

namespace App\Services\Ecommerce;

use App\Enums\OrderStatus;
use App\Models\Cart;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Services\Crm\CustomerSyncService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CheckoutService
{
    public function __construct(
        private StockService $stock,
        private ProductPricingService $pricing,
        private CustomerSyncService $customerSync,
    ) {}

    /**
     * @param  array{
     *   customer_email?: string|null,
     *   customer_name?: string|null,
     *   notes_customer?: string|null
     * }  $validated
     * @return array{0: Order, 1: string}
     */
    public function placeFromCart(Cart $cart, array $validated, ?User $user): array
    {
        $email = $user?->email ?? ($validated['customer_email'] ?? null);
        $name = $validated['customer_name'] ?? ($user?->name ?? null);

        if ($email === null || trim((string) $email) === '') {
            throw ValidationException::withMessages([
                'customer_email' => 'Indica un correo electrónico de contacto.',
            ]);
        }

        return DB::transaction(function () use ($cart, $validated, $user, $email, $name): array {
            /** @var Cart $lockedCart */
            $lockedCart = Cart::query()->whereKey($cart->getKey())->lockForUpdate()->firstOrFail();

            $lockedCart->load([
                'items.product.images',
                'items.productVariant',
                'coupon',
            ]);

            if ($lockedCart->items->isEmpty()) {
                throw ValidationException::withMessages([
                    'cart' => 'Tu carrito está vacío.',
                ]);
            }

            $coupon = $lockedCart->coupon instanceof Coupon ? $lockedCart->coupon : null;

            if ($coupon !== null) {
                /** @var Coupon $coupon */
                $coupon = Coupon::query()->whereKey($coupon->getKey())->lockForUpdate()->firstOrFail();

                if (! $coupon->isCurrentlyValid() || ! $coupon->passesUsageQuota()) {
                    throw ValidationException::withMessages([
                        'coupon' => 'El cupón ya no puede aplicarse. Eliminalo y verifica antes de pagar.',
                    ]);
                }

                $lockedCart->setRelation('coupon', $coupon);
            }

            $linesSorted = $lockedCart->items->sortBy(function ($item): string {
                $pid = str_pad((string) $item->product_id, 8, '0', STR_PAD_LEFT);
                $vid = $item->product_variant_id !== null
                    ? str_pad((string) $item->product_variant_id, 8, '0', STR_PAD_LEFT)
                    : '00000000';

                return "{$pid}-{$vid}";
            })->values();

            /** @var list<array{product: \App\Models\Product, variant?: \App\Models\ProductVariant, quantity: int, unit_price: string, line_subtotal: string, sku: string}> $priced */
            $priced = [];

            foreach ($linesSorted as $item) {
                $product = $item->product;
                $variant = $item->product_variant_id !== null ? $item->productVariant : null;

                if (! $product->is_active || $product->deleted_at !== null) {
                    throw ValidationException::withMessages([
                        'cart' => 'Un artículo dejó de estar disponible. Actualiza tu carrito.',
                    ]);
                }

                $this->stock->assertEligibleLine($product, $variant);
                $this->stock->assertQuantityWithinStock($product, $variant, (int) $item->quantity);

                $unitPrice = $this->pricing->unitSalePrice($product, $variant);
                $lineSubtotal = $this->pricing->lineTotal($unitPrice, (int) $item->quantity);

                $sku = '';
                if ($variant !== null && $variant->sku !== '') {
                    $sku = $variant->sku;
                } elseif ($product->sku !== null) {
                    $sku = (string) $product->sku;
                }

                $priced[] = [
                    'product' => $product,
                    'variant' => $variant,
                    'quantity' => (int) $item->quantity,
                    'unit_price' => $unitPrice,
                    'line_subtotal' => $lineSubtotal,
                    'sku' => $sku !== '' ? $sku : Str::slug($product->name).'-'.$product->getKey(),
                ];
            }

            $subtotalNumeric = collect($priced)->sum(static fn ($row): float => (float) $row['line_subtotal']);
            $subtotalFormatted = number_format($subtotalNumeric, 2, '.', '');

            $discountFormatted = $coupon instanceof Coupon ? $coupon->computeDiscount($subtotalFormatted) : '0.00';
            $taxableNumeric = max(0.0, $subtotalNumeric - (float) $discountFormatted);
            $taxRateSnapshot = round((float) config('checkout.tax_rate'), 4);
            $taxTotal = round($taxableNumeric * $taxRateSnapshot, 2);
            $grandTotal = round($taxableNumeric + $taxTotal, 2);

            /** @phpstan-ignore-next-line */
            $couponCodeSnapshot = $coupon?->code;

            $orderNumber = $this->makeUniqueOrderNumber();

            /** @var Order $order */
            $order = Order::query()->create([
                'user_id' => $user?->getKey(),
                'coupon_id' => $coupon instanceof Coupon ? $coupon->getKey() : null,
                'coupon_code_snapshot' => $couponCodeSnapshot,
                'order_number' => $orderNumber,
                'status' => OrderStatus::Pendiente,
                'customer_email' => $email,
                'customer_name' => $name,
                'notes_customer' => $validated['notes_customer'] ?? null,
                'currency' => config('checkout.currency'),
                'tax_rate_snapshot' => number_format($taxRateSnapshot, 4, '.', ''),
                'subtotal' => $subtotalFormatted,
                'discount_total' => $discountFormatted,
                'tax_total' => number_format($taxTotal, 2, '.', ''),
                'grand_total' => number_format($grandTotal, 2, '.', ''),
            ]);

            foreach ($priced as $row) {
                OrderItem::query()->create([
                    'order_id' => $order->getKey(),
                    'product_id' => $row['product']->getKey(),
                    'product_variant_id' => $row['variant']?->getKey(),
                    'product_name_snapshot' => $row['product']->name,
                    'variant_name_snapshot' => $row['variant']?->name,
                    'sku_snapshot' => $row['sku'],
                    'quantity' => $row['quantity'],
                    'unit_price' => $row['unit_price'],
                    'line_subtotal' => $row['line_subtotal'],
                ]);

                $this->stock->reserveForOrderLine($order, $row['product'], $row['variant'] ?? null, $row['quantity']);
            }

            if ($coupon instanceof Coupon) {
                /** @var Coupon $lockedCoupon */
                $lockedCoupon = Coupon::query()->whereKey($coupon->getKey())->lockForUpdate()->firstOrFail();

                if (! $lockedCoupon->passesUsageQuota()) {
                    throw ValidationException::withMessages([
                        'coupon' => 'El cupón alcanzó su límite de usos.',
                    ]);
                }

                $lockedCoupon->increment('used_count');
            }

            foreach ($lockedCart->items()->get() as $lineItem) {
                $lineItem->delete();
            }

            $lockedCart->update(['coupon_id' => null]);

            $plainPaymentSetupSecret = Str::password(48);
            $order->forceFill([
                'payment_setup_secret_hash' => Hash::make($plainPaymentSetupSecret),
            ])->save();

            $this->customerSync->assignCustomerToOrder($order, $user, (string) $email, $name);

            return [$order->fresh()->load('items'), $plainPaymentSetupSecret];
        });
    }

    protected function makeUniqueOrderNumber(): string
    {
        do {
            $number = 'ORD-'.now()->format('Ymd').'-'.strtoupper(Str::random(6));
        } while (Order::query()->where('order_number', $number)->exists());

        return $number;
    }
}
