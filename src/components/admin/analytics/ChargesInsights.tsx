import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChargesInsightsProps {
  totalDeliveryCharges: number;
  avgDeliveryFeePerOrder: number;
  deliveryOrdersCount: number;
}

export function ChargesInsights({
  totalDeliveryCharges,
  avgDeliveryFeePerOrder,
  deliveryOrdersCount,
}: ChargesInsightsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Charges Insights</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs text-muted-foreground">Total delivery charges collected</p>
          <p className="text-lg font-bold text-blue-700">₹{totalDeliveryCharges.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Avg delivery fee per order</p>
          <p className="text-lg font-bold text-blue-700">₹{avgDeliveryFeePerOrder.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total orders with delivery</p>
          <p className="text-lg font-bold text-slate-900">{deliveryOrdersCount}</p>
        </div>
      </CardContent>
    </Card>
  );
}

