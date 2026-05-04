<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCustomerRequest extends FormRequest
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
            'email' => ['required', 'email', 'max:255', Rule::unique('customers', 'email')],
            'first_name' => ['nullable', 'string', 'max:120'],
            'last_name' => ['nullable', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:32'],
            'company' => ['nullable', 'string', 'max:160'],
            'status' => ['sometimes', Rule::in(['active', 'inactive'])],
            'user_id' => ['nullable', 'integer', 'exists:users,id', Rule::unique('customers', 'user_id')],
            'segment_ids' => ['sometimes', 'array'],
            'segment_ids.*' => ['integer', 'exists:segments,id'],
        ];
    }
}
