<?php

use App\Enums\OrderStatus;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Segment;
use App\Models\User;

test('customers list requires authentication', function () {
    $this->getJson('/api/v1/customers')->assertUnauthorized();
});

test('cliente role cannot list customers', function () {
    $user = User::factory()->create();
    $user->assignRole('cliente');
    $token = $user->createToken('sales-api')->plainTextToken;

    $this->withHeader('Authorization', 'Bearer '.$token)
        ->getJson('/api/v1/customers')
        ->assertForbidden();
});

test('admin can create show update address orders export and soft delete customer', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');
    $token = $user->createToken('sales-api')->plainTextToken;
    $segment = Segment::query()->where('slug', 'vip')->firstOrFail();

    $create = $this->withHeader('Authorization', 'Bearer '.$token)
        ->postJson('/api/v1/customers', [
            'email' => 'crm-api@example.com',
            'first_name' => 'Api',
            'last_name' => 'Crm',
            'segment_ids' => [$segment->getKey()],
        ]);

    $create->assertCreated()
        ->assertJsonPath('email', 'crm-api@example.com')
        ->assertJsonPath('segments.0.slug', 'vip');

    $id = (int) $create->json('id');
    expect($id)->toBeGreaterThan(0);

    $this->withHeader('Authorization', 'Bearer '.$token)
        ->getJson('/api/v1/customers/'.$id)
        ->assertOk()
        ->assertJsonPath('email', 'crm-api@example.com');

    $this->withHeader('Authorization', 'Bearer '.$token)
        ->patchJson('/api/v1/customers/'.$id, [
            'company' => 'ACME',
            'status' => 'inactive',
        ])
        ->assertOk()
        ->assertJsonPath('company', 'ACME')
        ->assertJsonPath('status', 'inactive');

    $this->withHeader('Authorization', 'Bearer '.$token)
        ->postJson('/api/v1/customers/'.$id.'/addresses', [
            'line1' => 'Av. Siempre Viva 742',
            'city' => 'Lima',
            'country' => 'PE',
            'is_default' => true,
        ])
        ->assertCreated()
        ->assertJsonPath('line1', 'Av. Siempre Viva 742');

    $customer = Customer::query()->findOrFail($id);
    Order::query()->create([
        'user_id' => null,
        'customer_id' => $customer->getKey(),
        'coupon_id' => null,
        'coupon_code_snapshot' => null,
        'order_number' => 'ORD-CRM-TEST-1',
        'status' => OrderStatus::Pendiente,
        'customer_email' => $customer->email,
        'customer_name' => 'Api Crm',
        'notes_customer' => null,
        'currency' => 'PEN',
        'tax_rate_snapshot' => '0.1800',
        'subtotal' => '10.00',
        'discount_total' => '0.00',
        'tax_total' => '1.80',
        'grand_total' => '11.80',
        'payment_setup_secret_hash' => null,
        'receipt_access_token' => null,
        'receipt_path' => null,
    ]);

    $this->withHeader('Authorization', 'Bearer '.$token)
        ->getJson('/api/v1/customers/'.$id.'/orders')
        ->assertOk()
        ->assertJsonPath('data.0.order_number', 'ORD-CRM-TEST-1');

    $csv = $this->withHeader('Authorization', 'Bearer '.$token)
        ->get('/api/v1/customers/export');

    $csv->assertOk();
    expect($csv->streamedContent())->toContain('crm-api@example.com');

    $this->withHeader('Authorization', 'Bearer '.$token)
        ->deleteJson('/api/v1/customers/'.$id)
        ->assertNoContent();

    $this->withHeader('Authorization', 'Bearer '.$token)
        ->getJson('/api/v1/customers/'.$id)
        ->assertNotFound();
});

test('admin can list segments', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');
    $token = $user->createToken('sales-api')->plainTextToken;

    $this->withHeader('Authorization', 'Bearer '.$token)
        ->getJson('/api/v1/segments')
        ->assertOk()
        ->assertJsonFragment(['slug' => 'vip']);
});

test('admin can create and update leads', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');
    $token = $user->createToken('sales-api')->plainTextToken;

    $res = $this->withHeader('Authorization', 'Bearer '.$token)
        ->postJson('/api/v1/leads', [
            'email' => 'lead@example.com',
            'first_name' => 'Lead',
            'source' => 'web',
        ]);

    $res->assertCreated()->assertJsonPath('status', 'new');

    $leadId = (int) $res->json('id');

    $this->withHeader('Authorization', 'Bearer '.$token)
        ->patchJson('/api/v1/leads/'.$leadId, [
            'status' => 'contacted',
        ])
        ->assertOk()
        ->assertJsonPath('status', 'contacted');
});
