<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        // Users with roles
        $admin = User::firstOrCreate(
            ['email' => 'admin@stocky.com'],
            ['name' => 'Admin User', 'password' => Hash::make('password')]
        );
        $admin->assignRole('admin');

        $manager = User::firstOrCreate(
            ['email' => 'manager@stocky.com'],
            ['name' => 'Manager User', 'password' => Hash::make('password')]
        );
        $manager->assignRole('manager');

        $cashier = User::firstOrCreate(
            ['email' => 'cashier@stocky.com'],
            ['name' => 'Cashier User', 'password' => Hash::make('password')]
        );
        $cashier->assignRole('cashier');

        // Categories
        $categories = collect(['Beverages', 'Snacks', 'Dairy', 'Bakery'])
            ->map(fn ($name) => Category::firstOrCreate(['name' => $name]));

        // Suppliers
        $suppliers = collect([
            ['name' => 'Nile Trading Co.', 'phone' => '0100000001'],
            ['name' => 'Delta Distributors', 'phone' => '0100000002'],
        ])->map(fn ($s) => Supplier::firstOrCreate(['name' => $s['name']], $s));

        // Products
        $products = [
            ['name' => 'Cola 330ml', 'sku' => 'BEV-001', 'price' => 15.00, 'quantity' => 50, 'min_stock' => 10],
            ['name' => 'Orange Juice 1L', 'sku' => 'BEV-002', 'price' => 35.00, 'quantity' => 20, 'min_stock' => 5],
            ['name' => 'Potato Chips', 'sku' => 'SNK-001', 'price' => 10.00, 'quantity' => 3, 'min_stock' => 10],
            ['name' => 'Chocolate Bar', 'sku' => 'SNK-002', 'price' => 12.50, 'quantity' => 40, 'min_stock' => 8],
            ['name' => 'Milk 1L', 'sku' => 'DRY-001', 'price' => 28.00, 'quantity' => 15, 'min_stock' => 10],
            ['name' => 'White Bread', 'sku' => 'BKY-001', 'price' => 8.00, 'quantity' => 25, 'min_stock' => 5],
        ];

        foreach ($products as $index => $p) {
            Product::firstOrCreate(
                ['sku' => $p['sku']],
                array_merge($p, [
                    'category_id' => $categories[$index % $categories->count()]->id,
                    'supplier_id' => $suppliers[$index % $suppliers->count()]->id,
                ])
            );
        }
    }
}