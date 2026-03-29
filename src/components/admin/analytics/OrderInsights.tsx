import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OrderInsightsProps {
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  avgOrderValue: number;
  totalDealSales: number;
}

export function OrderInsights({
  totalOrders,
  deliveredOrders,
  cancelledOrders,
  avgOrderValue,
  totalDealSales,
}: OrderInsightsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Insights</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <p className="text-xs text-muted-foreground">Total Orders</p>
          <p className="text-lg font-bold">{totalOrders}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Delivered</p>
          <p className="text-lg font-bold text-green-700">{deliveredOrders}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Cancelled</p>
          <p className="text-lg font-bold text-red-700">{cancelledOrders}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Avg Order Value</p>
          <p className="text-lg font-bold">₹{avgOrderValue.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Deal Sales Count</p>
          <p className="text-lg font-bold text-orange-700">{totalDealSales}</p>
        </div>
      </CardContent>
    </Card>
  );
}

