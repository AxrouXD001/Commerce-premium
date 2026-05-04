<?php

namespace App\Models;

use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'customer_id',
        'coupon_id',
        'coupon_code_snapshot',
        'order_number',
        'status',
        'customer_email',
        'customer_name',
        'notes_customer',
        'currency',
        'tax_rate_snapshot',
        'subtotal',
        'discount_total',
        'tax_total',
        'grand_total',
        'payment_setup_secret_hash',
        'receipt_access_token',
        'receipt_path',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => OrderStatus::class,
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'order_number';
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Customer, $this>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * @return BelongsTo<Coupon, $this>
     */
    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }

    /**
     * @return HasMany<OrderItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * @return HasMany<OrderStatusHistory, $this>
     */
    public function statusHistories(): HasMany
    {
        return $this->hasMany(OrderStatusHistory::class)->latest('created_at');
    }

    /**
     * @return HasMany<Payment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class)->latest();
    }

    /**
     * @param  numeric-string|null  $plainSetupSecret Devuelta una sola vez al crear la orden (checkout).
     */
    public function validPaymentSetup(?string $plainSetupSecret): bool
    {
        if ($plainSetupSecret === null || $plainSetupSecret === '') {
            return false;
        }

        return $this->status === OrderStatus::Pendiente
            && $this->payment_setup_secret_hash !== null
            && Hash::check($plainSetupSecret, $this->payment_setup_secret_hash);
    }
}

