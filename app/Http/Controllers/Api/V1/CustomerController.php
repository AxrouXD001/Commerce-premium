<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\CustomerStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\IndexCustomerRequest;
use App\Http\Requests\Api\V1\StoreCustomerRequest;
use App\Http\Requests\Api\V1\UpdateCustomerRequest;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CustomerController extends Controller
{
    public function index(IndexCustomerRequest $request): AnonymousResourceCollection
    {
        $query = $this->baseCustomerQuery();
        $this->applyCustomerFilters($query, $request);

        $perPage = min(100, max(5, (int) ($request->validated('per_page') ?? $request->integer('per_page', 15))));

        return CustomerResource::collection(
            $query->orderByDesc('id')->paginate($perPage)->withQueryString()
        );
    }

    public function exportCsv(IndexCustomerRequest $request): StreamedResponse
    {
        $query = Customer::query()
            ->withCount('orders')
            ->withSum('orders', 'grand_total');
        $this->applyCustomerFilters($query, $request);
        $query->orderByDesc('id');

        $filename = 'customers-'.now()->format('Y-m-d-His').'.csv';

        return response()->streamDownload(function () use ($query): void {
            $handle = fopen('php://output', 'w');
            if ($handle === false) {
                return;
            }

            fputcsv($handle, [
                'id',
                'email',
                'first_name',
                'last_name',
                'phone',
                'company',
                'status',
                'orders_count',
                'lifetime_total',
                'created_at',
            ]);

            $query->chunkById(200, function ($customers) use ($handle): void {
                foreach ($customers as $customer) {
                    /** @var Customer $customer */
                    fputcsv($handle, [
                        $customer->id,
                        $customer->email,
                        $customer->first_name,
                        $customer->last_name,
                        $customer->phone,
                        $customer->company,
                        $customer->status instanceof \BackedEnum ? $customer->status->value : (string) $customer->status,
                        (int) ($customer->orders_count ?? 0),
                        (string) ($customer->orders_sum_grand_total ?? '0'),
                        $customer->created_at?->toIso8601String() ?? '',
                    ]);
                }
            });
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function store(StoreCustomerRequest $request): JsonResponse
    {
        $data = $request->validated();
        $segmentIds = $data['segment_ids'] ?? [];
        unset($data['segment_ids']);

        if (isset($data['status'])) {
            $data['status'] = CustomerStatus::from((string) $data['status']);
        } else {
            $data['status'] = CustomerStatus::Active;
        }

        $customer = Customer::query()->create($data);
        $customer->segments()->sync($segmentIds);

        return (new CustomerResource($customer->load(['segments'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Customer $customer): CustomerResource
    {
        $customer->load([
            'segments',
            'addresses',
            'notes',
        ])->loadCount('orders')->loadSum('orders', 'grand_total');

        return new CustomerResource($customer);
    }

    public function update(UpdateCustomerRequest $request, Customer $customer): CustomerResource
    {
        $data = $request->validated();
        $segmentIds = $data['segment_ids'] ?? null;
        unset($data['segment_ids']);

        if (array_key_exists('status', $data) && $data['status'] !== null) {
            $data['status'] = CustomerStatus::from((string) $data['status']);
        }

        $customer->fill($data);
        $customer->save();

        if (is_array($segmentIds)) {
            $customer->segments()->sync($segmentIds);
        }

        return new CustomerResource($customer->fresh(['segments', 'addresses', 'notes'])->loadCount('orders')->loadSum('orders', 'grand_total'));
    }

    public function destroy(Customer $customer): Response
    {
        $customer->delete();

        return response()->noContent();
    }

    /**
     * @return Builder<Customer>
     */
    protected function baseCustomerQuery(): Builder
    {
        return Customer::query()
            ->with(['segments'])
            ->withCount('orders')
            ->withSum('orders', 'grand_total');
    }

    protected function applyCustomerFilters(Builder $query, Request $request): void
    {
        if ($request->filled('q')) {
            $raw = (string) $request->input('q');
            $term = '%'.str_replace(['%', '_'], ['\\%', '\\_'], $raw).'%';
            $query->where(function (Builder $w) use ($term): void {
                $w->where('email', 'like', $term)
                    ->orWhere('first_name', 'like', $term)
                    ->orWhere('last_name', 'like', $term)
                    ->orWhere('company', 'like', $term)
                    ->orWhere('phone', 'like', $term);
            });
        }

        if ($request->filled('segment_id')) {
            $segmentId = (int) $request->input('segment_id');
            $query->whereHas('segments', function (Builder $q) use ($segmentId): void {
                $q->where('segments.id', $segmentId);
            });
        }

        if ($request->boolean('has_orders')) {
            $query->has('orders');
        }

        if ($request->filled('date_from') || $request->filled('date_to')) {
            $from = $request->filled('date_from')
                ? $request->date('date_from')->startOfDay()
                : now()->subYears(50)->startOfDay();
            $to = $request->filled('date_to')
                ? $request->date('date_to')->endOfDay()
                : now()->endOfDay();

            $query->whereHas('orders', function (Builder $q) use ($from, $to): void {
                $q->whereBetween('created_at', [$from, $to]);
            });
        }

        if ($request->filled('min_orders')) {
            $min = max(0, (int) $request->input('min_orders'));
            $query->has('orders', '>=', $min);
        }

        if ($request->filled('min_lifetime_total')) {
            $min = (string) $request->input('min_lifetime_total');
            $query->whereRaw(
                '(select coalesce(sum(grand_total), 0) from orders where orders.customer_id = customers.id) >= ?',
                [$min]
            );
        }
    }
}
