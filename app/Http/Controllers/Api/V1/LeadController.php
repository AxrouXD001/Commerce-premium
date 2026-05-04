<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\LeadStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreLeadRequest;
use App\Http\Requests\Api\V1\UpdateLeadRequest;
use App\Http\Resources\LeadResource;
use App\Models\Lead;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class LeadController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Lead::query()->orderByDesc('id');

        if ($request->filled('q')) {
            $raw = (string) $request->query('q');
            $term = '%'.str_replace(['%', '_'], ['\\%', '\\_'], $raw).'%';
            $query->where(function (Builder $w) use ($term): void {
                $w->where('email', 'like', $term)
                    ->orWhere('first_name', 'like', $term)
                    ->orWhere('last_name', 'like', $term)
                    ->orWhere('company', 'like', $term);
            });
        }

        if ($request->filled('status')) {
            $query->where('status', (string) $request->query('status'));
        }

        if ($request->filled('assigned_user_id')) {
            $query->where('assigned_user_id', (int) $request->query('assigned_user_id'));
        }

        $perPage = min(100, max(5, (int) $request->integer('per_page', 15)));

        return LeadResource::collection($query->paginate($perPage)->withQueryString());
    }

    public function store(StoreLeadRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['status'] = LeadStatus::New;

        $lead = Lead::query()->create($data);

        return (new LeadResource($lead))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Lead $lead): LeadResource
    {
        return new LeadResource($lead);
    }

    public function update(UpdateLeadRequest $request, Lead $lead): LeadResource
    {
        $data = $request->validated();

        if (array_key_exists('status', $data) && $data['status'] !== null) {
            $data['status'] = LeadStatus::from((string) $data['status']);
        }

        $lead->fill($data);
        $lead->save();

        return new LeadResource($lead->fresh());
    }

    public function destroy(Lead $lead): Response
    {
        $lead->delete();

        return response()->noContent();
    }
}
