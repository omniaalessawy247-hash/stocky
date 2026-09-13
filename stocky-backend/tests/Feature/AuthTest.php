<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

test('user can login with correct credentials', function () {
    Role::create(['name' => 'admin']);

    $user = User::factory()->create([
        'email' => 'test@stocky.com',
        'password' => Hash::make('password123'),
    ]);
    $user->assignRole('admin');

    $response = $this->postJson('/api/login', [
        'email' => 'test@stocky.com',
        'password' => 'password123',
    ]);

    $response->assertStatus(200)
        ->assertJsonStructure(['user', 'token']);
});

test('user cannot login with wrong password', function () {
    $user = User::factory()->create([
        'email' => 'test@stocky.com',
        'password' => Hash::make('password123'),
    ]);

    $response = $this->postJson('/api/login', [
        'email' => 'test@stocky.com',
        'password' => 'wrongpassword',
    ]);

    $response->assertStatus(422);
});