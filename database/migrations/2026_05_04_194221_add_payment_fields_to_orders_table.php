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
        Schema::table('orders', function (Blueprint $table) {
            $table->string('payment_setup_secret_hash')->nullable()->after('grand_total');
            $table->string('receipt_access_token', 64)->nullable()->unique()->after('payment_setup_secret_hash');
            $table->string('receipt_path')->nullable()->after('receipt_access_token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['payment_setup_secret_hash', 'receipt_access_token', 'receipt_path']);
        });
    }
};
