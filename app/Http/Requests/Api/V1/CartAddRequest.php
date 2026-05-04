<?php

namespace App\Http\Requests\Api\V1;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class CartAddRequest extends FormRequest
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
        return [
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'product_variant_id' => [
                'nullable',
                'integer',
                Rule::exists('product_variants', 'id')->where(fn ($query) => $query->where(
                    'product_id',
                    (int) $this->input('product_id'),
                )),
            ],
            'quantity' => ['required', 'integer', 'min:1', 'max:999'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $raw = $this->input('product_variant_id');
        if ($raw === '' || $raw === false) {
            $this->merge(['product_variant_id' => null]);
        }
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $productId = $this->input('product_id');
            if ($productId === null || $productId === '') {
                return;
            }

            $variantInput = $this->input('product_variant_id');

            /** @var Product|null $product */
            $product = Product::query()->withCount('variants')->find((int) $productId);

            if ($product === null) {
                return;
            }

            if ($product->variants_count > 0 && ($variantInput === null || $variantInput === '')) {
                $validator->errors()->add(
                    'product_variant_id',
                    'Debes elegir una variante.',
                );
            }
        });
    }
}
