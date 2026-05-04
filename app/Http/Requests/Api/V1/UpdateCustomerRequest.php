<?php

namespace App\Http\Requests\Api\V1;

use App\Models\Customer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCustomerRequest extends FormRequest
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
        /** @var Customer $customer */
        $customer = $this->route('customer');

        return [
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('customers', 'email')->ignore($customer->getKey())],
            'first_name' => ['sometimes', 'nullable', 'string', 'max:120'],
            'last_name' => ['sometimes', 'nullable', 'string', 'max:120'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:32'],
            'company' => ['sometimes', 'nullable', 'string', 'max:160'],
            'status' => ['sometimes', Rule::in(['active', 'inactive'])],
            'user_id' => ['sometimes', 'nullable', 'integer', 'exists:users,id', Rule::unique('customers', 'user_id')->ignore($customer->getKey())],
            'segment_ids' => ['sometimes', 'array'],
            'segment_ids.*' => ['integer', 'exists:segments,id'],
        ];
    }
}
