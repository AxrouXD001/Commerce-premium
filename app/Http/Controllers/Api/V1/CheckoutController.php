<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\CheckoutStoreRequest;
use App\Http\Resources\OrderResource;
use App\Services\Ecommerce\CartService;
use App\Services\Ecommerce\CheckoutService;
use Illuminate\Http\JsonResponse;

class CheckoutController extends Controller
{
    public function __construct(
        private CartService $cartService,
        private CheckoutService $checkoutService,
    ) {}

    public function store(CheckoutStoreRequest $request): JsonResponse
    {
        [$cart] = $this->cartService->resolveCart($request);

        [$order, $paymentSetupSecret] = $this->checkoutService->placeFromCart(
            $cart,
            $request->validated(),
            $request->user(),
        );

        /**
         * Sin `data` anidado: con `$wrap = null`, `->additional()` fuerza a Laravel a envolver
         * el recurso en `data` (ver ResourceResponse::wrap), y el cliente espera `order_number`
         * en la raíz junto a `payment_setup_secret` (mismo criterio que CartResource).
         */
        return response()->json(
            array_merge(
                OrderResource::make($order)->resolve($request),
                ['payment_setup_secret' => $paymentSetupSecret]
            ),
            201
        );
    }
}
