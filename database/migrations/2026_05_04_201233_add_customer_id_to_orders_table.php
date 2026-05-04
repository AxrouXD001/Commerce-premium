<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('customer_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
            $table->index(['customer_id', 'created_at']);
        });

        $orders = DB::table('orders')->whereNull('customer_id')->orderBy('id')->get();

        foreach ($orders as $order) {
            $emailRaw = $order->customer_email ?? null;
            if ($emailRaw === null || trim((string) $emailRaw) === '') {
                continue;
            }

            $email = strtolower(trim((string) $emailRaw));
            $customerId = DB::table('customers')->where('email', $email)->value('id');

            if ($customerId === null) {
                $display = trim((string) ($order->customer_name ?? ''));
                $first = null;
                $last = null;
                if ($display !== '') {
                    $parts = preg_split('/\s+/', $display, 2, PREG_SPLIT_NO_EMPTY);
                    $first = $parts[0] ?? null;
                    $last = $parts[1] ?? null;
                }

                $userId = null;
                if ($order->user_id !== null) {
                    $taken = DB::table('customers')->where('user_id', $order->user_id)->exists();
                    if (! $taken) {
                        $userId = $order->user_id;
                    }
                }

                $customerId = DB::table('customers')->insertGetId([
                    'user_id' => $userId,
                    'email' => $email,
                    'first_name' => $first,
                    'last_name' => $last,
                    'phone' => null,
                    'company' => null,
                    'status' => 'active',
                    'created_at' => $order->created_at ?? now(),
                    'updated_at' => $order->updated_at ?? now(),
                    'deleted_at' => null,
                ]);
            } elseif ($order->user_id !== null) {
                $row = DB::table('customers')->where('id', $customerId)->first();
                if ($row !== null && $row->user_id === null) {
                    $taken = DB::table('customers')->where('user_id', $order->user_id)->where('id', '!=', $customerId)->exists();
                    if (! $taken) {
                        DB::table('customers')->where('id', $customerId)->update([
                            'user_id' => $order->user_id,
                            'updated_at' => now(),
                        ]);
                    }
                }
            }

            DB::table('orders')->where('id', $order->id)->update(['customer_id' => $customerId]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('customer_id');
        });
    }
};
