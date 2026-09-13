<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'total' => $this->total,
            'status' => $this->status,
            'cashier' => $this->whenLoaded('user', fn () => $this->user->name),
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($item) => [
                'product' => $item->product->name ?? null,
                'quantity' => $item->quantity,
                'unit_price' => $item->unit_price,
            ])),
            'created_at' => $this->created_at,
        ];
    }
}