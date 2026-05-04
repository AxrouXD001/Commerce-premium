<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('coupon_id')->nullable()->constrained()->nullOnDelete();
            $table->string('coupon_code_snapshot')->nullable();
            $table->string('order_number')->unique();
            $table->string('status');
            $table->string('customer_email')->nullable();
            $table->string('customer_name')->nullable();
            $table->text('notes_customer')->nullable();
            $table->char('currency', 3)->default('PEN');
            $table->decimal('tax_rate_snapshot', 5, 4);
            $table->decimal('subtotal', 12, 2);
            $table->decimal('discount_total', 12, 2)->default('0');
            $table->decimal('tax_total', 12, 2);
            $table->decimal('grand_total', 12, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
