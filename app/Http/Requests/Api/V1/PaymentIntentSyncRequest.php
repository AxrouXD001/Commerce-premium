<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class PaymentIntentSyncRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'payment_intent_id' => ['required', 'string', 'max:255'],
            'payment_setup_secret' => ['required', 'string'],
        ];
    }
}
