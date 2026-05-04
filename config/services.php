<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    | Node search service (Fase 2.2): full-text search + facets. When empty,
    | Laravel performs database search via /api/v1/products/search.
    */
    'search' => [
        'url' => env('SEARCH_SERVICE_URL', ''),
        'token' => env('SEARCH_SYNC_TOKEN'),
    ],

    /*
    | Fase 4 — Stripe (PaymentIntents). El webhook debe apuntar a /api/webhooks/stripe.
    */
    'stripe' => [
        'key' => env('STRIPE_KEY'),
        'secret' => env('STRIPE_SECRET'),
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
    ],

    /*
    | Worker Node opcional: notificación tras pago completado (Bearer PAYMENT_NOTIFY_TOKEN).
    */
    'payments' => [
        'notify_url' => env('PAYMENT_NOTIFY_URL'),
        'notify_token' => env('PAYMENT_NOTIFY_TOKEN'),
    ],

    /*
    | Fase 5 — Socket.IO (servicio Node) para avisos de inventario al panel admin.
    | emit_url: POST server-to-server (Laravel → Node). client_url: origen CORS + cliente browser.
    */
    'inventory_socket' => [
        'emit_url' => env('INVENTORY_SOCKET_EMIT_URL'),
        'client_url' => env('INVENTORY_SOCKET_CLIENT_URL', 'http://127.0.0.1:4010'),
        'token' => env('INVENTORY_SOCKET_TOKEN'),
    ],

];

