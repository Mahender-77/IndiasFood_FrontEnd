import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SummaryMetrics } from './types';

interface SummaryCardsProps {
  metrics: SummaryMetrics;
}

export function SummaryCards({ metrics }: SummaryCardsProps) {
  const cards = [
    { label: 'Total Stock', value: metrics.totalStock, tone: 'text-slate-900' },
    { label: 'Total Sold', value: metrics.totalSold, tone: 'text-emerald-700' },
    { label: 'GiveAway Units', value: metrics.totalGiveAwayUnits, tone: 'text-amber-700' },
    { label: 'Revenue', value: `₹${metrics.totalRevenue.toFixed(2)}`, tone: 'text-green-700' },
    {
      label: 'Delivery Charges',
      value: `₹${metrics.totalDeliveryCharges.toFixed(2)}`,
      tone: 'text-blue-700',
    },
    { label: 'Expired Units', value: metrics.totalExpired, tone: 'text-red-700' },
    { label: 'Deal Sales Count', value: metrics.totalDealSales, tone: 'text-orange-700' },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">{card.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-xl font-bold ${card.tone}`}>{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

