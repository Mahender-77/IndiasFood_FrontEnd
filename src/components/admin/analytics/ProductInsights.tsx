import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductDrillRow } from './types';

interface ProductInsightsProps {
  rows: ProductDrillRow[];
}

export function ProductInsights({ rows }: ProductInsightsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Drill Down</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No product rows match current filters.</p>
        ) : (
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b">
                  <th className="text-left p-2.5">Name</th>
                  <th className="text-right p-2.5">Stock</th>
                  <th className="text-right p-2.5">Sold</th>
                  <th className="text-right p-2.5">GiveAway</th>
                  <th className="text-right p-2.5">Expired</th>
                  <th className="text-right p-2.5">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.productId} className="border-b last:border-0">
                    <td className="p-2.5 font-medium">{row.name}</td>
                    <td className="p-2.5 text-right">{row.stock}</td>
                    <td className="p-2.5 text-right">{row.sold}</td>
                    <td className="p-2.5 text-right text-amber-700">{row.giveAway}</td>
                    <td className="p-2.5 text-right text-red-700">{row.expired}</td>
                    <td className="p-2.5 text-right">₹{row.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

