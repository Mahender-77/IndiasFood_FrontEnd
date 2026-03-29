import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RevenueInsightsProps {
  totalRevenue: number;
  totalDeliveryCharges: number;
  totalGiveAwayValue: number;
  netEarnings: number;
}

export function RevenueInsights({
  totalRevenue,
  totalDeliveryCharges,
  totalGiveAwayValue,
  netEarnings,
}: RevenueInsightsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue & Accounts</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Total Revenue</p>
          <p className="text-lg font-bold text-green-700">₹{totalRevenue.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Delivery Charges</p>
          <p className="text-lg font-bold text-blue-700">₹{totalDeliveryCharges.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">GiveAway Loss</p>
          <p className="text-lg font-bold text-amber-700">₹{totalGiveAwayValue.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Net Earnings</p>
          <p className="text-lg font-bold text-slate-900">₹{netEarnings.toFixed(2)}</p>
        </div>
      </CardContent>
    </Card>
  );
}

