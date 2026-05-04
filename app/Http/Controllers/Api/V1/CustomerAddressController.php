<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreCustomerAddressRequest;
use App\Http\Requests\Api\V1\UpdateCustomerAddressRequest;
use App\Http\Resources\CustomerAddressResource;
use App\Models\Customer;
use App\Models\CustomerAddress;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class CustomerAddressController extends Controller
{
    public function store(StoreCustomerAddressRequest $request, Customer $customer): JsonResponse
    {
        $data = $request->validated();
        $isDefault = (bool) ($data['is_default'] ?? false);

        $address = $customer->addresses()->create($data);

        if ($isDefault) {
            $this->ensureSingleDefault($customer, $address);
        }

        return (new CustomerAddressResource($address->fresh()))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(UpdateCustomerAddressRequest $request, Customer $customer, CustomerAddress $address): CustomerAddressResource
    {
        $this->assertAddressBelongsToCustomer($customer, $address);

        $data = $request->validated();
        $address->fill($data);
        $address->save();

        if (($data['is_default'] ?? null) === true) {
            $this->ensureSingleDefault($customer, $address);
        }

        return new CustomerAddressResource($address->fresh());
    }

    public function destroy(Customer $customer, CustomerAddress $address): Response
    {
        $this->assertAddressBelongsToCustomer($customer, $address);
        $address->delete();

        return response()->noContent();
    }

    protected function assertAddressBelongsToCustomer(Customer $customer, CustomerAddress $address): void
    {
        if ((int) $address->customer_id !== (int) $customer->getKey()) {
            abort(Response::HTTP_NOT_FOUND);
        }
    }

    protected function ensureSingleDefault(Customer $customer, CustomerAddress $defaultAddress): void
    {
        $customer->addresses()
            ->where('id', '!=', $defaultAddress->getKey())
            ->update(['is_default' => false]);

        if (! $defaultAddress->is_default) {
            $defaultAddress->forceFill(['is_default' => true])->save();
        }
    }
}
