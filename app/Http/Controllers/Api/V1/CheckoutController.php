<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\CheckoutStoreRequest;
use App\Http\Resources\OrderResource;
use App\Services\Ecommerce\CartService;
use App\Services\Ecommerce\CheckoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

        return OrderResource::make($order)
            ->additional(['payment_setup_secret' => $paymentSetupSecret])
            ->response()
            ->setStatusCode(201);
    }
}
