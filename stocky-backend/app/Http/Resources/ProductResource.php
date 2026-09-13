<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'sku' => $this->sku,
            'barcode' => $this->barcode,
            'price' => $this->price,
            'quantity' => $this->quantity,
            'min_stock' => $this->min_stock,
            'stock_status' => $this->quantity <= $this->min_stock ? 'low' : 'ok',
            'category' => $this->whenLoaded('category', fn () => $this->category->name),
            'supplier' => $this->whenLoaded('supplier', fn () => $this->supplier->name),
            'image_url' => $this->image_path ? asset('storage/'.$this->image_path) : null,
        ];
    }
}