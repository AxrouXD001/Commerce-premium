<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLeadRequest extends FormRequest
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
            'email' => ['sometimes', 'email', 'max:255'],
            'first_name' => ['sometimes', 'nullable', 'string', 'max:120'],
            'last_name' => ['sometimes', 'nullable', 'string', 'max:120'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:32'],
            'company' => ['sometimes', 'nullable', 'string', 'max:160'],
            'source' => ['sometimes', 'string', 'max:64'],
            'message' => ['sometimes', 'nullable', 'string', 'max:8000'],
            'status' => ['sometimes', Rule::in(['new', 'contacted', 'qualified', 'won', 'lost'])],
            'assigned_user_id' => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
            'converted_customer_id' => ['sometimes', 'nullable', 'integer', 'exists:customers,id'],
        ];
    }
}
