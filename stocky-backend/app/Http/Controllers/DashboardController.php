<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Purchase;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class DashboardController extends Controller
{
    public function summary(Request $request)
    {
        $cacheKey = 'dashboard_summary_en';

        $cached = Cache::get($cacheKey);
        if ($cached) {
            return response()->json($cached);
        }

        $stats = $this->buildStats();

        try {
            Cache::put($cacheKey, $stats, now()->addMinutes(10));
        } catch (\Exception $e) {
            // Caching is best-effort only; ignore failures.
        }

        return response()->json($stats);
    }

    protected function buildStats(): array
    {
        $todaySales = Sale::whereDate('created_at', today())->sum('total');
        $yesterdaySales = Sale::whereDate('created_at', today()->subDay())->sum('total');
        $weekSales = Sale::whereDate('created_at', '>=', now()->subDays(7))->sum('total');
        $todayOrders = Sale::whereDate('created_at', today())->count();

        $lowStockProducts = Product::whereColumn('quantity', '<=', 'min_stock')->get(['name', 'quantity', 'min_stock']);

        $outOfStockCount = Product::where('quantity', '<=', 0)->count();

        $topProduct = Sale::with('items.product')
            ->get()
            ->flatMap(fn ($sale) => $sale->items)
            ->groupBy('product_id')
            ->map(fn ($items) => [
                'name' => $items->first()->product->name,
                'total_qty' => $items->sum('quantity'),
            ])
            ->sortByDesc('total_qty')
            ->first();

        $newProducts = [];
        try {
            $newProducts = Product::where('created_at', '>=', now()->subDays(7))
                ->get(['name', 'sku', 'created_at'])
                ->map(fn ($p) => [
                    'name' => $p->name,
                    'sku' => $p->sku,
                    'added_at' => $p->created_at->format('Y-m-d'),
                ])->toArray();
        } catch (\Exception $e) {
            $newProducts = [];
        }

        $recentPurchases = [];
        try {
            $recentPurchases = Purchase::with('supplier')
                ->latest()
                ->take(5)
                ->get()
                ->map(fn ($p) => [
                    'supplier' => optional($p->supplier)->name ?? 'Unknown',
                    'total' => $p->total ?? 0,
                    'date' => $p->created_at->format('Y-m-d'),
                ])->toArray();
        } catch (\Exception $e) {
            $recentPurchases = [];
        }

        $stats = [
            'today_sales' => round($todaySales, 2),
            'yesterday_sales' => round($yesterdaySales, 2),
            'week_sales' => round($weekSales, 2),
            'today_orders' => $todayOrders,
            'low_stock_count' => $lowStockProducts->count(),
            'low_stock_products' => $lowStockProducts,
            'out_of_stock_count' => $outOfStockCount,
            'top_product' => $topProduct,
            'new_products' => $newProducts,
            'recent_purchases' => $recentPurchases,
        ];

        $stats['ai_sections'] = $this->generateAiSections($stats);
        $stats['status'] = 'ready';

        return $stats;
    }

    protected function generateAiSections(array $stats): array
    {
        $fallback = [
            'sales' => 'AI summary unavailable (no API key configured).',
            'inventory' => '',
            'new_products' => '',
            'recommendations' => '',
        ];

        $apiKey = env('GEMINI_API_KEY');
        if (! $apiKey) {
            return $fallback;
        }

        $prompt = 'You are a retail business analyst. Based on the JSON data below, return ONLY a valid JSON object '
            .'(no markdown, no code fences, no extra text) with exactly these four keys: '
            .'"sales" (2-3 sentences on todays and this weeks sales performance and the top-selling product), '
            .'"inventory" (2-3 sentences on low stock items and any stockouts, mention specific product names if relevant), '
            .'"new_products" (1-2 sentences about products added recently, or state none were added), '
            .'"recommendations" (2-3 concrete, actionable recommendations, such as which products to restock). '
            .'Write in English, in a professional consulting tone. Data: '.json_encode($stats);

        try {
            $response = Http::timeout(45)
                ->withHeaders(['x-goog-api-key' => $apiKey])
                ->post(
                    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
                    [
                        'contents' => [
                            ['parts' => [['text' => $prompt]]],
                        ],
                    ]
                );

            if (! $response->successful()) {
                $fallback['sales'] = 'AI ERROR (HTTP '.$response->status().'): '.$response->body();

                return $fallback;
            }

            $text = $response->json('candidates.0.content.parts.0.text') ?? '';
            $text = trim($text);
            $text = preg_replace('/^```(json)?/i', '', $text);
            $text = preg_replace('/```$/', '', $text);
            $text = trim($text);

            $decoded = json_decode($text, true);

            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                return array_merge($fallback, $decoded);
            }

            $fallback['sales'] = $text !== '' ? $text : 'No summary generated.';

            return $fallback;
        } catch (\Exception $e) {
            $fallback['sales'] = 'AI ERROR: '.$e->getMessage();

            return $fallback;
        }
    }
}