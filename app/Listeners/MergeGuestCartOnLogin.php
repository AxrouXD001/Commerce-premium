<?php

namespace App\Listeners;

use App\Models\Cart;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\DB;

class MergeGuestCartOnLogin
{
    public function handle(Login $event): void
    {
        $cookieName = config('checkout.guest_cart_cookie_name');
        $guestKey = request()->cookie($cookieName);

        if (! is_string($guestKey) || $guestKey === '') {
            return;
        }

        $guestCart = Cart::query()
            ->where('guest_cart_key', $guestKey)
            ->whereNull('user_id')
            ->first();

        if ($guestCart === null) {
            Cookie::queue(Cookie::forget($cookieName));

            return;
        }

        DB::transaction(function () use ($guestCart, $event): void {
            /** @var Cart $userCart */
            $userCart = Cart::query()->firstOrCreate(
                ['user_id' => $event->user->getKey()],
                [],
            );

            foreach ($guestCart->items()->get() as $guestItem) {
                $match = $userCart->items()
                    ->where('product_id', $guestItem->product_id)
                    ->when(
                        $guestItem->product_variant_id !== null,
                        fn ($q) => $q->where('product_variant_id', $guestItem->product_variant_id),
                        fn ($q) => $q->whereNull('product_variant_id'),
                    )
                    ->first();

                if ($match !== null) {
                    $match->update(['quantity' => $match->quantity + $guestItem->quantity]);
                    $guestItem->delete();
                } else {
                    $guestItem->update(['cart_id' => $userCart->getKey()]);
                }
            }

            if ($userCart->coupon_id === null && $guestCart->coupon_id !== null) {
                $userCart->update(['coupon_id' => $guestCart->coupon_id]);
            }

            $guestCart->delete();
        });

        Cookie::queue(Cookie::forget($cookieName));
    }
}
