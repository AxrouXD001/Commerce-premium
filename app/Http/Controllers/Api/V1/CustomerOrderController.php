<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CustomerOrderSummaryResource;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CustomerOrderController extends Controller
{
    public function index(Request $request, Customer $customer): AnonymousResourceCollection
    {
        $perPage = min(100, max(5, (int) $request->integer('per_page', 15)));

        $orders = $customer->orders()
            ->latest('created_at')
            ->paginate($perPage)
            ->withQueryString();

        return CustomerOrderSummaryResource::collection($orders);
    }
}
