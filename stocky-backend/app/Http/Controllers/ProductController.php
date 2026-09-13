<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function index()
    {
        $products = Product::with(['category', 'supplier'])->get();

        return \App\Http\Resources\ProductResource::collection($products);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|unique:products,sku',
            'price' => 'required|numeric|min:0',
            'quantity' => 'required|integer|min:0',
            'min_stock' => 'required|integer|min:0',
            'category_name' => 'required|string|max:255',
            'supplier_name' => 'required|string|max:255',
            'image' => 'nullable|image|max:4096',
        ]);

        $category = Category::firstOrCreate(['name' => trim($validated['category_name'])]);
        $supplier = Supplier::firstOrCreate(['name' => trim($validated['supplier_name'])]);

        $data = [
            'name' => $validated['name'],
            'sku' => $validated['sku'],
            'price' => $validated['price'],
            'quantity' => $validated['quantity'],
            'min_stock' => $validated['min_stock'],
            'category_id' => $category->id,
            'supplier_id' => $supplier->id,
        ];

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('products', 'public');
        }

        $product = Product::create($data);

        return new \App\Http\Resources\ProductResource($product->load('category', 'supplier'));
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'sku' => 'sometimes|string|unique:products,sku,'.$product->id,
            'price' => 'sometimes|numeric|min:0',
            'quantity' => 'sometimes|integer|min:0',
            'min_stock' => 'sometimes|integer|min:0',
            'category_name' => 'sometimes|string|max:255',
            'supplier_name' => 'sometimes|string|max:255',
            'image' => 'nullable|image|max:4096',
        ]);

        $data = collect($validated)->except(['category_name', 'supplier_name', 'image'])->toArray();

        if (isset($validated['category_name'])) {
            $data['category_id'] = Category::firstOrCreate(['name' => trim($validated['category_name'])])->id;
        }

        if (isset($validated['supplier_name'])) {
            $data['supplier_id'] = Supplier::firstOrCreate(['name' => trim($validated['supplier_name'])])->id;
        }

        if ($request->hasFile('image')) {
            if ($product->image_path) {
                Storage::disk('public')->delete($product->image_path);
            }
            $data['image_path'] = $request->file('image')->store('products', 'public');
        }

        $product->update($data);

        return new \App\Http\Resources\ProductResource($product->load('category', 'supplier'));
    }

    public function destroy(Product $product)
    {
        if ($product->image_path) {
            Storage::disk('public')->delete($product->image_path);
        }

        $product->delete();

        return response()->json(['message' => 'Product deleted successfully']);
    }

    public function findByBarcode(string $barcode)
    {
        $product = Product::with(['category', 'supplier'])
            ->where('barcode', $barcode)
            ->first();

        if (! $product) {
            return response()->json(['message' => 'No product found with this barcode'], 404);
        }

        return new \App\Http\Resources\ProductResource($product);
    }
}