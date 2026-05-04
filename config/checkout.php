<?php

return [

    'tax_rate' => (float) env('CHECKOUT_TAX_RATE', '0.18'),

    'currency' => env('CHECKOUT_CURRENCY', 'PEN'),

    'guest_cart_cookie_name' => env('CHECKOUT_GUEST_CART_COOKIE', 'guest_cart_key'),

    'guest_cart_cookie_minutes' => (int) env('CHECKOUT_GUEST_CART_TTL_MINUTES', 525600),

];
