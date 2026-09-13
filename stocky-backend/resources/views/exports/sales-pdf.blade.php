<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #1a1a1a; }
h1 { font-size: 22px; margin-bottom: 2px; letter-spacing: 2px; }
p.subtitle { color: #666; margin-top: 0; margin-bottom: 24px; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 8px; border-bottom: 1px solid #ddd; text-align: left; }
th { text-transform: uppercase; font-size: 10px; color: #888; }
td.num, th.num { text-align: right; }
tfoot td { font-weight: bold; border-top: 2px solid #1a1a1a; }
</style>
</head>
<body>
<h1>STOCKY</h1>
<p class="subtitle">Sales report - {{ $monthName }}</p>
<table>
<thead>
<tr>
<th>Receipt</th>
<th>Date</th>
<th>Cashier</th>
<th class="num">Total</th>
</tr>
</thead>
<tbody>
@foreach ($sales as $sale)
<tr>
<td>#{{ str_pad($sale->id, 6, '0', STR_PAD_LEFT) }}</td>
<td>{{ $sale->created_at->format('d M Y, H:i') }}</td>
<td>{{ $sale->user->name ?? 'N/A' }}</td>
<td class="num">${{ number_format($sale->total, 2) }}</td>
</tr>
@endforeach
</tbody>
<tfoot>
<tr>
<td colspan="3">Total</td>
<td class="num">${{ number_format($total, 2) }}</td>
</tr>
</tfoot>
</table>
</body>
</html>