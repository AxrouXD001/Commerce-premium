<?php

namespace App\Models;

use App\Enums\CouponDiscountType;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'code',
        'description',
        'discount_type',
        'percent_value',
        'fixed_amount',
        'min_subtotal',
        'max_discount_amount',
        'starts_at',
        'ends_at',
        'usage_limit',
        'used_count',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'discount_type' => CouponDiscountType::class,
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @param  numeric-string|null  $subtotal
     * @return numeric-string
     */
    public function isCurrentlyValid(?CarbonInterface $moment = null): bool
    {
        if (! $this->is_active) {
            return false;
        }

        $moment ??= now();

        if ($this->starts_at !== null && $moment->lt($this->starts_at)) {
            return false;
        }

        if ($this->ends_at !== null && $moment->gt($this->ends_at)) {
            return false;
        }

        if ($this->usage_limit !== null && $this->used_count >= $this->usage_limit) {
            return false;
        }

        return true;
    }

    public function passesUsageQuota(): bool
    {
        if ($this->usage_limit === null) {
            return true;
        }

        return $this->used_count < $this->usage_limit;
    }

    /**
     * @param  numeric-string|null  $subtotal
     * @return numeric-string
     */
    public function computeDiscount(?string $subtotal): string
    {
        if ($subtotal === null) {
            return '0.00';
        }

        if ($this->min_subtotal !== null && (float) $subtotal < (float) $this->min_subtotal) {
            return '0.00';
        }

        $subtotalFloat = (float) $subtotal;

        $amount = match ($this->discount_type) {
            CouponDiscountType::Percent => $this->percent_value !== null
                ? round($subtotalFloat * ((float) $this->percent_value / 100), 2)
                : 0.0,
            CouponDiscountType::FixedAmount => $this->fixed_amount !== null
                ? (float) $this->fixed_amount
                : 0.0,
        };

        if ($amount > $subtotalFloat) {
            $amount = $subtotalFloat;
        }

        if ($this->max_discount_amount !== null) {
            $amount = min($amount, (float) $this->max_discount_amount);
        }

        return number_format(round($amount, 2), 2, '.', '');
    }
}
