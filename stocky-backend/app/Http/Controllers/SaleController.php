<?php

namespace App\Http\Controllers;

use App\Events\SaleCompleted;
use App\Http\Resources\SaleResource;
use App\Models\Product;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SaleController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $sale = DB::transaction(function () use ($validated, $request) {
            $total = 0;
            $itemsData = [];

            foreach ($validated['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);

                if ($product->quantity < $item['quantity']) {
                    throw ValidationException::withMessages([
                        'items' => ["Not enough stock for {$product->name}. Available: {$product->quantity}"],
                    ]);
                }

                $subtotal = $product->price * $item['quantity'];
                $total += $subtotal;

                $itemsData[] = [
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $product->price,
                ];
            }

            $sale = Sale::create([
                'user_id' => $request->user()->id,
                'total' => $total,
                'status' => 'completed',
            ]);

            $sale->items()->createMany($itemsData);

            return $sale;
        });

        event(new SaleCompleted($sale->load('items.product')));

        return new SaleResource($sale->load('items.product', 'user'));
    }

    public function index(Request $request)
    {
        $query = Sale::with('items.product', 'user')->latest();

        if (! $request->user()->hasAnyRole(['admin', 'manager'])) {
            $query->where('user_id', $request->user()->id);
        }

        return SaleResource::collection($query->get());
    }
}