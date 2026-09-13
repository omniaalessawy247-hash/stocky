<?php

namespace App\Listeners;

use App\Events\SaleCompleted;
use App\Models\StockMovement;

class UpdateStockAfterSale
{
    public function handle(SaleCompleted $event): void
    {
        foreach ($event->sale->items as $item) {
            $product = $item->product;

            $product->decrement('quantity', $item->quantity);

            StockMovement::create([
                'product_id' => $product->id,
                'type' => 'out',
                'quantity' => $item->quantity,
                'reason' => 'Sale #'.$event->sale->id,
            ]);
        }
    }
}