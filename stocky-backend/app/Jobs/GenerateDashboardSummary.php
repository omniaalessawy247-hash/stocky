<?php

namespace App\Jobs;

use App\Models\Product;
use App\Models\Sale;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class GenerateDashboardSummary implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, SerializesModels;

    public function __construct(protected string $lang = 'en')
    {
    }

    public function handle(): void
    {
        $todaySales = Sale::whereDate('created_at', today())->sum('total');
        $yesterdaySales = Sale::whereDate('created_at', today()->subDay())->sum('total');
        $todayOrders = Sale::whereDate('created_at', today())->count();

        $lowStockProducts = Product::whereColumn('quantity', '<=', 'min_stock')->get(['name', 'quantity', 'min_stock']);

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

        $stats = [
            'today_sales' => round($todaySales, 2),
            'yesterday_sales' => round($yesterdaySales, 2),
            'today_orders' => $todayOrders,
            'low_stock_count' => $lowStockProducts->count(),
            'low_stock_products' => $lowStockProducts,
            'top_product' => $topProduct,
        ];

        $stats['ai_summary'] = $this->generateAiSummary($stats);
        $stats['status'] = 'ready';

        Cache::put('dashboard_summary_'.$this->lang, $stats, now()->addMinutes(30));
    }

    protected function generateAiSummary(array $stats): string
    {
        $apiKey = env('GEMINI_API_KEY');

        if (! $apiKey) {
            return $this->lang === 'ar'
                ? 'التحليل الذكي غير متاح حالياً.'
                : 'AI summary unavailable (no API key configured).';
        }

        $langInstruction = $this->lang === 'ar'
            ? 'Write the summary in Modern Standard Arabic.'
            : 'Write the summary in English.';

        $prompt = "You are a retail business analyst. Summarize this data in 2-3 short sentences in a professional consulting tone. {$langInstruction} Data: ".json_encode($stats);

        try {
            $response = Http::timeout(15)
                ->withHeaders(['x-goog-api-key' => $apiKey])
                ->post(
                    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
                    [
                        'contents' => [
                            ['parts' => [['text' => $prompt]]],
                        ],
                    ]
                );

            if ($response->successful()) {
                return $response->json('candidates.0.content.parts.0.text') ?? 'No summary generated.';
            }

            return 'AI summary unavailable.';
        } catch (\Exception $e) {
            return 'AI summary unavailable.';
        }
    }
}