<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\SegmentResource;
use App\Models\Segment;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SegmentController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $segments = Segment::query()->orderBy('name')->get();

        return SegmentResource::collection($segments);
    }
}
