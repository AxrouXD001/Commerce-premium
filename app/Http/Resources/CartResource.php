<?php

namespace App\Http\Resources;

use App\Models\Cart;
use App\Services\Ecommerce\CartService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Http\Resources\Json\ResourceResponse;

/**
 * @mixin Cart
 */
class CartResource extends JsonResource
{
    public static $wrap = null;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Cart $cart */
        $cart = $this->resource;

        $cartService = app(CartService::class);
        $cartService->loadCartRelations($cart);

        /**
         * Los totales deben ir en el mismo nivel que `items`. Si se usa solo `->additional(['meta' => …])`
         * en el controlador con `$wrap = null`, Laravel anida el recurso en `data` y el cliente Axios
         * recibe `items` dentro de `response.data.data`, rompiendo `cart.items` en el front.
         *
         * @see ResourceResponse::wrap
         */
        return [
            'id' => $cart->id,
            'coupon_code' => $cart->coupon?->code,
            'items' => CartItemResource::collection($cart->items),
            'meta' => $cartService->totals($cart),
        ];
    }
}
