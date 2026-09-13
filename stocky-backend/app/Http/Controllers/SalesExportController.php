<?php

namespace App\Http\Controllers;

use App\Exports\SalesMonthlyExport;
use App\Models\Sale;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;

class SalesExportController extends Controller
{
    private function filteredSales(Request $request)
    {
        $month = (int) ($request->query('month') ?: now()->month);
        $year = (int) ($request->query('year') ?: now()->year);

        $query = Sale::with('items.product', 'user')
            ->whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->latest();

        if (! $request->user()->hasAnyRole(['admin', 'manager'])) {
            $query->where('user_id', $request->user()->id);
        }

        return [$query->get(), $month, $year];
    }

    public function pdf(Request $request)
    {
        [$sales, $month, $year] = $this->filteredSales($request);

        if ($sales->isEmpty()) {
            return response()->json(['message' => 'No sales found for this period'], 404);
        }

        $total = $sales->sum('total');
        $monthName = Carbon::createFromDate($year, $month, 1)->format('F Y');

        $pdf = Pdf::loadView('exports.sales-pdf', [
            'sales' => $sales,
            'total' => $total,
            'monthName' => $monthName,
        ]);

        return $pdf->download("sales-{$year}-{$month}.pdf");
    }

    public function excel(Request $request)
    {
        [$sales, $month, $year] = $this->filteredSales($request);

        if ($sales->isEmpty()) {
            return response()->json(['message' => 'No sales found for this period'], 404);
        }

        $writer = SalesMonthlyExport::build($sales);

        $filename = "sales-{$year}-{$month}.xlsx";
        $tempPath = tempnam(sys_get_temp_dir(), 'sales_export');
        $writer->save($tempPath);

        return response()->download($tempPath, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }
}