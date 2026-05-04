<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\V1\CartController;
use App\Http\Controllers\Api\V1\CatalogSearchController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\CheckoutController;
use App\Http\Controllers\Api\V1\CustomerAddressController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\CustomerNoteController;
use App\Http\Controllers\Api\V1\CustomerOrderController;
use App\Http\Controllers\Api\V1\LeadController;
use App\Http\Controllers\Api\V1\SegmentController;
use App\Http\Controllers\Api\V1\InventoryAdjustController;
use App\Http\Controllers\Api\V1\InventoryController;
use App\Http\Controllers\Api\V1\OrderReceiptPdfController;
use App\Http\Controllers\Api\V1\PaymentIntentController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\StripePaymentSyncController;
use App\Http\Controllers\StripeWebhookController;
use Illuminate\Support\Facades\Route;

Route::post('webhooks/stripe', StripeWebhookController::class)->middleware('throttle:500,1');

Route::middleware(['throttle:60,1'])->prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('register', [AuthController::class, 'register'])->middleware('throttle:10,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::get('me', [AuthController::class, 'me']);
    });
});

Route::middleware(['auth:sanctum', 'role:admin'])->get('/auth/admin-health', fn () => [
    'role' => 'admin',
])->name('api.auth.admin-health');

Route::prefix('v1')->group(function () {
    Route::get('categories', [CategoryController::class, 'index']);
    Route::get('products/search', CatalogSearchController::class);
    Route::get('products', [ProductController::class, 'index']);
    Route::get('products/{product}', [ProductController::class, 'show']);

    Route::get('cart', [CartController::class, 'show'])->middleware('throttle:120,1');
    Route::post('cart/add', [CartController::class, 'add'])->middleware('throttle:120,1');
    Route::put('cart/update', [CartController::class, 'update'])->middleware('throttle:120,1');
    Route::delete('cart/remove', [CartController::class, 'remove'])->middleware('throttle:120,1');
    Route::post('cart/coupon', [CartController::class, 'applyCoupon'])->middleware('throttle:30,1');
    Route::delete('cart/coupon', [CartController::class, 'removeCoupon'])->middleware('throttle:30,1');
    Route::post('orders', [CheckoutController::class, 'store'])->middleware('throttle:20,1');
    Route::post('payments/setup', [PaymentIntentController::class, 'store'])->middleware('throttle:30,1');
    Route::post('payments/sync', [StripePaymentSyncController::class, 'store'])->middleware('throttle:30,1');
    Route::get('orders/{order}/receipt.pdf', [OrderReceiptPdfController::class, 'show'])
        ->middleware('throttle:60,1')
        ->name('api.orders.receipt.pdf');

    Route::middleware(['auth:sanctum', 'role:admin|vendedor'])->group(function () {
        Route::post('products', [ProductController::class, 'store']);
        Route::put('products/{product}', [ProductController::class, 'update']);
        Route::patch('products/{product}', [ProductController::class, 'update']);
        Route::delete('products/{product}', [ProductController::class, 'destroy']);

        Route::get('inventory', [InventoryController::class, 'index'])->middleware('throttle:120,1');
        Route::post('inventory/adjust', [InventoryAdjustController::class, 'store'])->middleware('throttle:30,1');

        Route::get('customers/export', [CustomerController::class, 'exportCsv'])->middleware('throttle:30,1');
        Route::apiResource('customers', CustomerController::class)->middleware('throttle:120,1');
        Route::get('customers/{customer}/orders', [CustomerOrderController::class, 'index'])->middleware('throttle:120,1');
        Route::post('customers/{customer}/addresses', [CustomerAddressController::class, 'store'])->middleware('throttle:60,1');
        Route::patch('customers/{customer}/addresses/{address}', [CustomerAddressController::class, 'update'])->middleware('throttle:60,1');
        Route::delete('customers/{customer}/addresses/{address}', [CustomerAddressController::class, 'destroy'])->middleware('throttle:60,1');
        Route::post('customers/{customer}/notes', [CustomerNoteController::class, 'store'])->middleware('throttle:60,1');
        Route::delete('customers/{customer}/notes/{note}', [CustomerNoteController::class, 'destroy'])->middleware('throttle:60,1');
        Route::apiResource('leads', LeadController::class)->middleware('throttle:120,1');
        Route::get('segments', [SegmentController::class, 'index'])->middleware('throttle:120,1');
    });
});
