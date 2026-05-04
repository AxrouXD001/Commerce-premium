<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreCustomerNoteRequest;
use App\Http\Resources\CustomerNoteResource;
use App\Models\Customer;
use App\Models\CustomerNote;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class CustomerNoteController extends Controller
{
    public function store(StoreCustomerNoteRequest $request, Customer $customer): JsonResponse
    {
        $note = $customer->notes()->create([
            'body' => $request->validated('body'),
            'author_user_id' => $request->user()?->getKey(),
        ]);

        return (new CustomerNoteResource($note))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function destroy(Customer $customer, CustomerNote $note): Response
    {
        if ((int) $note->customer_id !== (int) $customer->getKey()) {
            abort(Response::HTTP_NOT_FOUND);
        }

        $note->delete();

        return response()->noContent();
    }
}
