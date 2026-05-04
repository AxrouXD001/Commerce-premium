<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ApiLoginRequest;
use App\Http\Requests\Api\ApiRegisterRequest;
use App\Http\Resources\AuthUserResource;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public const TOKEN_NAME = 'sales-api';

    /**
     * @return array{access_token: string, token_type: string, expires_at: string|null}
     */
    protected function buildTokenPayload(User $user): array
    {
        $plainTextTokenResult = $user->createToken(self::TOKEN_NAME);
        $accessTokenModel = $plainTextTokenResult->accessToken;

        $expirationMinutes = config('sanctum.expiration');
        $expiresAt = $accessTokenModel->expires_at;
        if (! $expiresAt && $expirationMinutes) {
            $expiresAt = $accessTokenModel->created_at->copy()->addMinutes((int) $expirationMinutes);
        }

        return [
            'access_token' => $plainTextTokenResult->plainTextToken,
            'token_type' => 'Bearer',
            'expires_at' => $expiresAt?->toIso8601String(),
        ];
    }

    public function register(ApiRegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $role = User::defaultRoleNameForNewRegistration();
        User::ensureSpatieRoleExists($role);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        $user->assignRole($role);

        event(new Registered($user));

        return response()->json([
            'user' => AuthUserResource::make($user),
            ...$this->buildTokenPayload($user),
        ], 201);
    }

    public function login(ApiLoginRequest $request): JsonResponse
    {
        /** @var string $email */
        $email = $request->validated('email');

        /** @var string $password */
        $password = $request->validated('password');

        $user = User::where('email', $email)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => [__('auth.failed')],
            ]);
        }

        return response()->json([
            'user' => AuthUserResource::make($user),
            ...$this->buildTokenPayload($user),
        ]);
    }

    public function logout(Request $request): Response
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->noContent();
    }

    public function refresh(Request $request): JsonResponse
    {
        $user = $request->user();

        $user->currentAccessToken()?->delete();

        return response()->json([
            'user' => AuthUserResource::make($user),
            ...$this->buildTokenPayload($user),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return AuthUserResource::make($request->user())->response();
    }
}
