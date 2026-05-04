<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\CartAddRequest;
use App\Http\Requests\Api\V1\CartCouponRequest;
use App\Http\Requests\Api\V1\CartRemoveRequest;
use App\Http\Requests\Api\V1\CartUpdateRequest;
use App\Http\Resources\CartResource;
use App\Models\CartItem;
use App\Services\Ecommerce\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;

class CartController extends Controller
{
    public function __construct(
        private CartService $cartService,
    ) {}

    public function show(Request $request): JsonResponse
    {
        [$cart, $guestKey] = $this->cartService->resolveCart($request);
        $this->queueGuestCookie($guestKey);
        $this->cartService->loadCartRelations($cart);

        return CartResource::make($cart)
            ->additional(['meta' => $this->cartService->totals($cart)])
            ->response();
    }

    public function add(CartAddRequest $request): JsonResponse
    {
        [$cart, $guestKey] = $this->cartService->resolveCart($request);
        $this->queueGuestCookie($guestKey);

        $validated = $request->validated();
        $this->cartService->addOrMergeLine(
            $cart,
            (int) $validated['product_id'],
            isset($validated['product_variant_id']) ? (int) $validated['product_variant_id'] : null,
            (int) $validated['quantity'],
        );

        $cart->refresh();
        $this->cartService->loadCartRelations($cart);

        return CartResource::make($cart)
            ->additional(['meta' => $this->cartService->totals($cart)])
            ->response();
    }

    public function update(CartUpdateRequest $request): JsonResponse
    {
        [$cart, $guestKey] = $this->cartService->resolveCart($request);
        $this->queueGuestCookie($guestKey);

        $validated = $request->validated();
        /** @var CartItem $item */
        $item = CartItem::query()->findOrFail((int) $validated['cart_item_id']);

        $this->cartService->updateQuantityOwned($cart, $item, (int) $validated['quantity']);

        $cart->refresh();
        $this->cartService->loadCartRelations($cart);

        return CartResource::make($cart)
            ->additional(['meta' => $this->cartService->totals($cart)])
            ->response();
    }

    public function remove(CartRemoveRequest $request): JsonResponse
    {
        [$cart, $guestKey] = $this->cartService->resolveCart($request);
        $this->queueGuestCookie($guestKey);

        $validated = $request->validated();
        /** @var CartItem $item */
        $item = CartItem::query()->findOrFail((int) $validated['cart_item_id']);

        $this->cartService->removeItemOwned($cart, $item);

        $cart->refresh();
        $this->cartService->loadCartRelations($cart);

        return CartResource::make($cart)
            ->additional(['meta' => $this->cartService->totals($cart)])
            ->response();
    }

    public function applyCoupon(CartCouponRequest $request): JsonResponse
    {
        [$cart, $guestKey] = $this->cartService->resolveCart($request);
        $this->queueGuestCookie($guestKey);

        $this->cartService->applyCoupon($cart, $request->validated('code'));

        $cart->refresh();
        $this->cartService->loadCartRelations($cart);

        return CartResource::make($cart)
            ->additional(['meta' => $this->cartService->totals($cart)])
            ->response();
    }

    public function removeCoupon(Request $request): JsonResponse
    {
        [$cart, $guestKey] = $this->cartService->resolveCart($request);
        $this->queueGuestCookie($guestKey);

        $this->cartService->removeCoupon($cart);

        $cart->refresh();
        $this->cartService->loadCartRelations($cart);

        return CartResource::make($cart)
            ->additional(['meta' => $this->cartService->totals($cart)])
            ->response();
    }

    protected function queueGuestCookie(?string $guestKey): void
    {
        if ($guestKey === null) {
            return;
        }

        Cookie::queue(cookie(
            name: config('checkout.guest_cart_cookie_name'),
            value: $guestKey,
            minutes: (int) config('checkout.guest_cart_cookie_minutes'),
            path: '/',
            domain: config('session.domain'),
            secure: (bool) config('session.secure'),
            httpOnly: true,
            raw: false,
            sameSite: (string) config('session.same_site', 'lax'),
        ));
    }
}
