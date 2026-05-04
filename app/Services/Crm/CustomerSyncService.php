<?php

namespace App\Services\Crm;

use App\Enums\CustomerStatus;
use App\Models\Customer;
use App\Models\Order;
use App\Models\User;

class CustomerSyncService
{
    /**
     * Asocia o crea el cliente CRM del pedido (misma transacción que el checkout).
     */
    public function assignCustomerToOrder(Order $order, ?User $user, string $email, ?string $displayName): void
    {
        $email = strtolower(trim($email));
        if ($email === '') {
            return;
        }

        /** @var Customer|null $byUser */
        $byUser = $user !== null
            ? Customer::query()->where('user_id', $user->getKey())->lockForUpdate()->first()
            : null;

        /** @var Customer|null $byEmail */
        $byEmail = Customer::query()->where('email', $email)->lockForUpdate()->first();

        $customer = $byUser ?? $byEmail;

        if ($customer === null) {
            $customer = new Customer;
            $customer->email = $email;
            $customer->status = CustomerStatus::Active;
        } elseif ($customer->user_id === null) {
            $customer->email = $email;
        }

        if ($user !== null && $customer->user_id === null) {
            $conflict = Customer::query()
                ->where('user_id', $user->getKey())
                ->where('id', '!=', $customer->getKey())
                ->exists();

            if (! $conflict) {
                $customer->user_id = $user->getKey();
            }
        }

        $this->mergeDisplayName($customer, $displayName);
        $customer->save();

        $order->forceFill(['customer_id' => $customer->getKey()])->save();
    }

    protected function mergeDisplayName(Customer $customer, ?string $displayName): void
    {
        if ($displayName === null || trim($displayName) === '') {
            return;
        }

        if ($customer->first_name !== null && $customer->last_name !== null) {
            return;
        }

        $parts = preg_split('/\s+/', trim($displayName), 2, PREG_SPLIT_NO_EMPTY);
        if ($customer->first_name === null && isset($parts[0])) {
            $customer->first_name = $parts[0];
        }
        if ($customer->last_name === null && isset($parts[1])) {
            $customer->last_name = $parts[1];
        }
    }
}
