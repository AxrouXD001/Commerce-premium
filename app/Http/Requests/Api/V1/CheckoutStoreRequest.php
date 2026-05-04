<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $guest = $this->user() === null;

        return [
            'customer_email' => array_filter([
                $guest ? 'required' : 'nullable',
                'email:rfc',
                'max:190',
            ]),
            'customer_name' => ['nullable', 'string', 'max:190'],
            'notes_customer' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
