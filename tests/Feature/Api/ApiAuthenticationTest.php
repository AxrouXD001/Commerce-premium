<?php

use App\Models\User;

test('api login returns access token and roles', function () {
    $user = User::factory()->create();
    $user->assignRole('vendedor');

    $response = $this->postJson('/api/auth/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $response->assertOk()
        ->assertJsonPath('user.email', $user->email)
        ->assertJsonPath('token_type', 'Bearer')
        ->assertJsonStructure([
            'user' => ['id', 'name', 'email', 'roles'],
            'access_token',
            'expires_at',
        ]);

    expect($response->json('user.roles'))->toContain('vendedor');
    expect($response->json('expires_at'))->not->toBeNull();
});

test('api register assigns admin to first user and returns token', function () {
    $response = $this->postJson('/api/auth/register', [
        'name' => 'API User',
        'email' => 'api-user@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertCreated();

    /** @var User|null $user */
    $user = User::where('email', 'api-user@example.com')->first();

    expect($user)->not->toBeNull();
    expect($user->hasRole('admin'))->toBeTrue();

    expect($response->json('user.roles'))->toContain('admin');
});

test('api register assigns cliente to second user', function () {
    User::factory()->create();

    $this->postJson('/api/auth/register', [
        'name' => 'API User Two',
        'email' => 'api-user-two@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertCreated();

    /** @var User|null $user */
    $user = User::where('email', 'api-user-two@example.com')->first();

    expect($user)->not->toBeNull();
    expect($user->hasRole('cliente'))->toBeTrue();
});

test('api me returns authenticated user when bearer token is valid', function () {
    $user = User::factory()->create();
    $token = $user->createToken('sales-api')->plainTextToken;

    $response = $this->withHeader('Authorization', 'Bearer '.$token)
        ->getJson('/api/auth/me');

    $response->assertOk()
        ->assertJsonPath('email', $user->email)
        ->assertJsonStructure([
            'id',
            'name',
            'email',
            'roles',
        ]);
});

test('api logout revokes current token', function () {
    $user = User::factory()->create();
    $token = $user->createToken('sales-api')->plainTextToken;

    $this->withHeader('Authorization', 'Bearer '.$token)
        ->postJson('/api/auth/logout')
        ->assertNoContent();

    $this->app['auth']->forgetGuards();

    $this->withHeader('Authorization', 'Bearer '.$token)
        ->getJson('/api/auth/me')
        ->assertUnauthorized();
});

test('api refresh rotates the bearer token', function () {
    $user = User::factory()->create();
    $initial = $user->createToken('sales-api')->plainTextToken;

    $refresh = $this->withHeader('Authorization', 'Bearer '.$initial)
        ->postJson('/api/auth/refresh');

    $refresh->assertOk();

    $newToken = $refresh->json('access_token');

    expect($newToken)->not->toBe($initial);

    $this->app['auth']->forgetGuards();

    $this->withHeader('Authorization', 'Bearer '.$initial)
        ->getJson('/api/auth/me')
        ->assertUnauthorized();

    $this->withHeader('Authorization', 'Bearer '.$newToken)
        ->getJson('/api/auth/me')
        ->assertOk();
});

test('admin-only api route rejects users without admin role', function () {
    $user = User::factory()->create();
    $user->assignRole('cliente');
    $token = $user->createToken('sales-api')->plainTextToken;

    $this->withHeader('Authorization', 'Bearer '.$token)
        ->getJson('/api/auth/admin-health')
        ->assertForbidden();
});

test('admin-only api route allows admin role', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');
    $token = $user->createToken('sales-api')->plainTextToken;

    $this->withHeader('Authorization', 'Bearer '.$token)
        ->getJson('/api/auth/admin-health')
        ->assertOk()
        ->assertJsonPath('role', 'admin');
});
