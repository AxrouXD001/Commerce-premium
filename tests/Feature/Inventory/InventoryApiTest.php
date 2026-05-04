<?php

use App\Models\User;

test('inventory list requires authentication', function () {
    $this->getJson('/api/v1/inventory')->assertUnauthorized();
});

test('admin bearer can access inventory list', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');
    $token = $user->createToken('sales-api')->plainTextToken;

    $response = $this->withHeader('Authorization', 'Bearer '.$token)
        ->getJson('/api/v1/inventory');

    $response->assertOk()
        ->assertJsonStructure([
            'data',
            'links',
            'meta',
        ]);
});
