import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TopGiveAwayProduct {
  name: string;
  units: number;
  value: number;
}

interface GiveAwayInsightsProps {
  totalUnits: number;
  totalValue: number;
  topProducts: TopGiveAwayProduct[];
}

export function GiveAwayInsights({ totalUnits, totalValue, topProducts }: GiveAwayInsightsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>GiveAway Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Total units given</p>
            <p className="text-lg font-bold text-amber-700">{totalUnits}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total value lost</p>
            <p className="text-lg font-bold text-amber-700">₹{totalValue.toFixed(2)}</p>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold mb-2">Top giveaway products</p>
          {topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No giveaway data.</p>
          ) : (
            <div className="space-y-2">
              {topProducts.slice(0, 5).map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded border p-2">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.units} units · ₹{item.value.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

