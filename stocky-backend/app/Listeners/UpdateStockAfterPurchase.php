<?php

namespace App\Listeners;

use App\Events\PurchaseCompleted;
use App\Models\StockMovement;

class UpdateStockAfterPurchase
{
    public function handle(PurchaseCompleted $event): void
    {
        foreach ($event->purchase->items as $item) {
            $product = $item->product;

            $product->increment('quantity', $item->quantity);

            StockMovement::create([
                'product_id' => $product->id,
                'type' => 'in',
                'quantity' => $item->quantity,
                'reason' => 'Purchase #'.$event->purchase->id,
            ]);
        }
    }
}