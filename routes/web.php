<?php

use App\Http\Controllers\Catalog\CatalogController;
use App\Http\Controllers\Web\CheckoutPaymentPageController;
use App\Http\Controllers\Web\OrderConfirmationController;
use App\Http\Controllers\Web\OrderReceiptPageController;
use App\Models\Customer;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/catalog', [CatalogController::class, 'index'])->name('catalog.index');

Route::get('/cart', fn () => Inertia::render('cart/cart'))->name('cart.index');

Route::get('/checkout', fn () => Inertia::render('checkout/checkout'))->name('checkout.index');

Route::get('/orders/confirmation/{order}', OrderConfirmationController::class)->name('orders.confirmation');

Route::get('/checkout/payment/{order:order_number}', CheckoutPaymentPageController::class)->name('checkout.payment');

Route::get('/orders/{order}/recibo', OrderReceiptPageController::class)->name('orders.receipt');

Route::middleware(['auth', 'role:admin|vendedor'])->group(function () {
    Route::get('/catalog/products/create', [CatalogController::class, 'create'])->name('catalog.products.create');
    Route::post('/catalog/products', [CatalogController::class, 'store'])->name('catalog.products.store');
    Route::get('/catalog/products/{product}/edit', [CatalogController::class, 'edit'])->name('catalog.products.edit');
    Route::put('/catalog/products/{product}', [CatalogController::class, 'update'])->name('catalog.products.update');
    Route::delete('/catalog/products/{product}', [CatalogController::class, 'destroy'])->name('catalog.products.destroy');

    Route::get('/catalog/inventory', fn () => Inertia::render('inventory/inventory-list'))->name('catalog.inventory.index');
    Route::get('/catalog/inventory/adjust', fn () => Inertia::render('inventory/stock-adjustment'))->name('catalog.inventory.adjust');

    Route::get('/crm/customers/create', fn () => Inertia::render('crm/customer-form'))->name('crm.customers.create');
    Route::get('/crm/customers', fn () => Inertia::render('crm/customer-list'))->name('crm.customers.index');
    Route::get('/crm/customers/{customer}/edit', fn (Customer $customer) => Inertia::render('crm/customer-form', [
        'customerId' => $customer->getKey(),
    ]))->name('crm.customers.edit');
    Route::get('/crm/customers/{customer}', fn (Customer $customer) => Inertia::render('crm/customer-detail', [
        'customerId' => $customer->getKey(),
    ]))->name('crm.customers.show');
});

Route::get('/catalog/products/{product}', [CatalogController::class, 'show'])->name('catalog.show');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
