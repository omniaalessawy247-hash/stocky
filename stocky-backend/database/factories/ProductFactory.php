<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->words(2, true),
            'sku' => fake()->unique()->bothify('SKU-####'),
            'price' => fake()->randomFloat(2, 5, 100),
            'quantity' => fake()->numberBetween(10, 100),
            'min_stock' => 5,
            'category_id' => Category::factory(),
            'supplier_id' => Supplier::factory(),
        ];
    }
}