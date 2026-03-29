import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AnalyticsFilters, StatusFilter } from './types';

interface FiltersBarProps {
  filters: AnalyticsFilters;
  onChange: (next: AnalyticsFilters) => void;
}

export function FiltersBar({ filters, onChange }: FiltersBarProps) {
  const update = <K extends keyof AnalyticsFilters>(key: K, value: AnalyticsFilters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Label className="text-xs text-muted-foreground">Product Search</Label>
          <Input
            value={filters.search}
            onChange={(e) => update('search', e.target.value)}
            placeholder="Search product name..."
            className="h-9"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => update('status', value as StatusFilter)}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="deal">Deal</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="low_stock">Low stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">From Date</Label>
          <Input
            type="date"
            value={filters.fromDate}
            onChange={(e) => update('fromDate', e.target.value)}
            className="h-9"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">To Date</Label>
          <Input
            type="date"
            value={filters.toDate}
            onChange={(e) => update('toDate', e.target.value)}
            className="h-9"
          />
        </div>
      </div>
      <div className="mt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange({ search: '', status: 'all', fromDate: '', toDate: '' })}
        >
          Reset Filters
        </Button>
      </div>
    </div>
  );
}

