<?php

namespace App\Services\Ecommerce;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Coupon;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CartService
{
    public function __construct(
        private StockService $stock,
        private ProductPricingService $pricing,
    ) {}

    /**
     * Si el segundo valor no es null, el cliente debe recibir esa cookie persistente (`guest_cart_key`).
     *
     * @return array{Cart, string|null}
     */
    public function resolveCart(Request $request): array
    {
        if ($request->user() !== null) {
            $cart = Cart::query()->firstOrCreate(
                ['user_id' => $request->user()->getKey()],
                [],
            );

            return [$cart, null];
        }

        $cookieName = config('checkout.guest_cart_cookie_name');
        $guestKeyCookie = $request->cookie($cookieName);

        if ($guestKeyCookie !== null && is_string($guestKeyCookie)) {
            /** @var Cart $cart */
            $cart = Cart::query()->firstOrCreate(
                [
                    'guest_cart_key' => $guestKeyCookie,
                    'user_id' => null,
                ],
                [],
            );

            return [$cart, null];
        }

        $guestUuid = (string) Str::uuid();

        /** @var Cart $cart */
        $cart = Cart::query()->create([
            'guest_cart_key' => $guestUuid,
            'user_id' => null,
        ]);

        return [$cart, $guestUuid];
    }

    public function loadCartRelations(Cart $cart): Cart
    {
        $cart->load([
            'items.product.images',
            'items.productVariant',
            'coupon',
        ]);

        return $cart;
    }

    /**
     * Totales usando precios de catálogo actuales (no snapshot).
     *
     * @return array{
     *   subtotal: string,
     *   discount_total: string,
     *   taxable_subtotal: string,
     *   tax_rate: float,
     *   tax_total: string,
     *   grand_total: string,
     * }
     */
    public function totals(Cart $cart): array
    {
        $cart = $this->loadCartRelations($cart);

        $subtotalAmount = $this->subtotalNumeric($cart);
        $subtotalFormatted = number_format($subtotalAmount, 2, '.', '');
        $discount = $this->couponDiscountNumeric($cart, $subtotalFormatted);
        $taxable = max(0.0, $subtotalAmount - $discount);
        $taxRate = (float) config('checkout.tax_rate');
        $taxTotal = round($taxable * $taxRate, 2);
        $grandTotal = round($taxable + $taxTotal, 2);

        return [
            'subtotal' => $subtotalFormatted,
            'discount_total' => number_format($discount, 2, '.', ''),
            'taxable_subtotal' => number_format($taxable, 2, '.', ''),
            'tax_rate' => $taxRate,
            'tax_total' => number_format($taxTotal, 2, '.', ''),
            'grand_total' => number_format($grandTotal, 2, '.', ''),
        ];
    }

    /**
     * @param  numeric-string|null  $code
     */
    public function applyCoupon(Cart $cart, ?string $code): Coupon
    {
        if ($code === null || trim($code) === '') {
            throw ValidationException::withMessages([
                'code' => 'Ingresa un código de cupón.',
            ]);
        }

        $normalized = strtoupper(trim($code));

        /** @var Coupon|null $coupon */
        $coupon = Coupon::query()->whereRaw('upper(code) = ?', [$normalized])->first();

        if ($coupon === null) {
            throw ValidationException::withMessages([
                'code' => 'Cupón no encontrado.',
            ]);
        }

        if (! $coupon->isCurrentlyValid()) {
            throw ValidationException::withMessages([
                'code' => 'Este cupón no está vigente.',
            ]);
        }

        $cart->update(['coupon_id' => $coupon->getKey()]);
        $cart->setRelation('coupon', $coupon);

        return $coupon;
    }

    public function removeCoupon(Cart $cart): void
    {
        $cart->update(['coupon_id' => null]);
        $cart->unsetRelation('coupon');
    }

    public function removeItemOwned(Cart $cart, CartItem $item): void
    {
        if ((int) $item->cart_id !== (int) $cart->getKey()) {
            abort(403, 'Este ítem no pertenece a tu carrito.');
        }

        $item->delete();
    }

    public function updateQuantityOwned(Cart $cart, CartItem $item, int $quantity): void
    {
        if ((int) $item->cart_id !== (int) $cart->getKey()) {
            abort(403, 'Este ítem no pertenece a tu carrito.');
        }

        $variant = $item->product_variant_id !== null ? $item->productVariant ?? ProductVariant::query()->findOrFail((int) $item->product_variant_id) : null;
        /** @var Product $product */
        $product = $item->relationLoaded('product') ? $item->product : Product::query()->findOrFail((int) $item->product_id);

        if (! $product->is_active || $product->deleted_at !== null) {
            $item->delete();

            throw ValidationException::withMessages([
                'cart_item_id' => 'El producto ya no está disponible y fue quitado.',
            ]);
        }

        $this->stock->assertEligibleLine($product, $variant);
        $this->stock->assertQuantityWithinStock($product, $variant, $quantity);

        $item->update(['quantity' => $quantity]);
    }

    public function addOrMergeLine(Cart $cart, int $productId, ?int $variantId, int $quantity): CartItem
    {
        $product = Product::query()->active()->whereKey($productId)->firstOrFail();
        $variant = $variantId !== null ? ProductVariant::query()->whereKey($variantId)->first() : null;

        if ($variant === null && $variantId !== null) {
            throw ValidationException::withMessages([
                'product_variant_id' => 'Variante no encontrada.',
            ]);
        }

        $this->stock->assertEligibleLine($product, $variant);

        /** @var CartItem|null $existing */
        $existing = $cart->items()
            ->where('product_id', $product->getKey())
            ->when(
                $variant !== null,
                fn ($q) => $q->where('product_variant_id', $variant->getKey()),
                fn ($q) => $q->whereNull('product_variant_id'),
            )
            ->first();

        $targetQuantity = $quantity + (int) ($existing?->quantity ?? 0);

        $this->stock->assertQuantityWithinStock($product, $variant, $targetQuantity);

        if ($existing instanceof CartItem) {
            $existing->update(['quantity' => $targetQuantity]);
            $existing->refresh();

            return $existing;
        }

        /** @var CartItem $created */
        $created = $cart->items()->create([
            'product_id' => $product->getKey(),
            'product_variant_id' => $variant?->getKey(),
            'quantity' => $quantity,
        ]);

        return $created;
    }

    private function subtotalNumeric(Cart $cart): float
    {
        $sum = 0.0;

        foreach ($cart->items as $item) {
            $product = $item->product;
            $variant = $item->product_variant_id !== null ? $item->productVariant : null;
            $unitPrice = $this->pricing->unitSalePrice($product, $variant);
            $sum += round((float) $unitPrice * (int) $item->quantity, 2);
        }

        return round($sum, 2);
    }

    /**
     * @param  numeric-string|null  $subtotalFormatted
     */
    private function couponDiscountNumeric(Cart $cart, string $subtotalFormatted): float
    {
        $coupon = $cart->coupon;

        if ($coupon === null) {
            return 0.0;
        }

        if (! $coupon->isCurrentlyValid()) {
            $cart->update(['coupon_id' => null]);
            $cart->unsetRelation('coupon');

            return 0.0;
        }

        return (float) $coupon->computeDiscount($subtotalFormatted);
    }
}
