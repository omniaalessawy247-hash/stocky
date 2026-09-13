<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\User;
use Spatie\Permission\Models\Role;

test('sale reduces product stock correctly', function () {
    Role::create(['name' => 'admin']);

    $user = User::factory()->create();
    $user->assignRole('admin');

    $category = Category::factory()->create();
    $supplier = Supplier::factory()->create();

    $product = Product::factory()->create([
        'category_id' => $category->id,
        'supplier_id' => $supplier->id,
        'quantity' => 10,
        'price' => 20,
    ]);

    $response = $this->actingAs($user)->postJson('/api/sales', [
        'items' => [
            ['product_id' => $product->id, 'quantity' => 3],
        ],
    ]);

    $response->assertStatus(201);

    expect($product->fresh()->quantity)->toBe(7);
});

test('sale fails when stock is insufficient', function () {
    Role::create(['name' => 'admin']);

    $user = User::factory()->create();
    $user->assignRole('admin');

    $category = Category::factory()->create();
    $supplier = Supplier::factory()->create();

    $product = Product::factory()->create([
        'category_id' => $category->id,
        'supplier_id' => $supplier->id,
        'quantity' => 2,
        'price' => 20,
    ]);

    $response = $this->actingAs($user)->postJson('/api/sales', [
        'items' => [
            ['product_id' => $product->id, 'quantity' => 5],
        ],
    ]);

    $response->assertStatus(422);

    expect($product->fresh()->quantity)->toBe(2);
});