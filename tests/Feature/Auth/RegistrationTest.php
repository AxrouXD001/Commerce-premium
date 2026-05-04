<?php

test('registration screen can be rendered', function () {
    $response = $this->get('/register');

    $response->assertStatus(200);
});

test('new users can register', function () {
    $response = $this->post('/register', [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));

    /** @var \App\Models\User $user */
    $user = \App\Models\User::where('email', 'test@example.com')->first();

    expect($user->hasRole('admin'))->toBeTrue();
});

test('second registered user gets cliente role', function () {
    \App\Models\User::factory()->create();

    $this->post('/register', [
        'name' => 'Second User',
        'email' => 'second@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();

    /** @var \App\Models\User $user */
    $user = \App\Models\User::where('email', 'second@example.com')->first();

    expect($user->hasRole('cliente'))->toBeTrue();
});