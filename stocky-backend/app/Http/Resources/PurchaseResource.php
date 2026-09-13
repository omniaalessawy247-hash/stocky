<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'total' => $this->total,
            'supplier' => $this->whenLoaded('supplier', fn () => $this->supplier->name),
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($item) => [
                'product' => $item->product->name ?? null,
                'quantity' => $item->quantity,
                'unit_cost' => $item->unit_cost,
            ])),
            'created_at' => $this->created_at,
        ];
    }
}