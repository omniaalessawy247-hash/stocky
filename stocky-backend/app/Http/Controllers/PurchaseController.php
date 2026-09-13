<?php

namespace App\Http\Controllers;

use App\Events\PurchaseCompleted;
use App\Http\Resources\PurchaseResource;
use App\Models\Purchase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_cost' => 'required|numeric|min:0',
        ]);

        $purchase = DB::transaction(function () use ($validated) {
            $total = 0;
            $itemsData = [];

            foreach ($validated['items'] as $item) {
                $subtotal = $item['unit_cost'] * $item['quantity'];
                $total += $subtotal;

                $itemsData[] = [
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_cost' => $item['unit_cost'],
                ];
            }

            $purchase = Purchase::create([
                'supplier_id' => $validated['supplier_id'],
                'total' => $total,
            ]);

            $purchase->items()->createMany($itemsData);

            return $purchase;
        });

        event(new PurchaseCompleted($purchase->load('items.product')));

        return new PurchaseResource($purchase->load('items.product', 'supplier'));
    }

    public function index()
    {
        return PurchaseResource::collection(
            Purchase::with('items.product', 'supplier')->latest()->get()
        );
    }
}