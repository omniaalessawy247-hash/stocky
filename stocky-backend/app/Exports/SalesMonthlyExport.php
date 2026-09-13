<?php

namespace App\Exports;

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class SalesMonthlyExport
{
    public static function build($sales)
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Sales');

        $headings = ['Receipt No', 'Date', 'Cashier', 'Items', 'Total'];
        $sheet->fromArray($headings, null, 'A1');

        $headerStyle = $sheet->getStyle('A1:E1');
        $headerStyle->getFont()->setBold(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('FFFFFFFF'));
        $headerStyle->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF4F46E5');
        $headerStyle->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $row = 2;
        foreach ($sales as $sale) {
            $itemsSummary = $sale->items->map(function ($item) {
                return ($item->product->name ?? 'N/A') . ' x' . $item->quantity;
            })->implode(', ');

            $sheet->setCellValue("A{$row}", str_pad($sale->id, 6, '0', STR_PAD_LEFT));
            $sheet->setCellValue("B{$row}", $sale->created_at->format('Y-m-d H:i'));
            $sheet->setCellValue("C{$row}", $sale->user->name ?? 'N/A');
            $sheet->setCellValue("D{$row}", $itemsSummary);
            $sheet->setCellValue("E{$row}", (float) $sale->total);
            $row++;
        }

        $lastRow = $row - 1;
        if ($lastRow >= 2) {
            $sheet->getStyle("E2:E{$lastRow}")->getNumberFormat()->setFormatCode('#,##0.00');
        }

        foreach (['A', 'B', 'C', 'D', 'E'] as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        return new Xlsx($spreadsheet);
    }
}