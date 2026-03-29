import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { SEO } from '@/components/seo/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/types';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { ArrowLeft, Download, FileText, RefreshCw, Search, X } from 'lucide-react';

interface StoreLocation {
  storeId: string;
  name: string;
  displayName: string;
}

interface ProductVariant {
  type: 'weight' | 'pieces' | 'box';
  value: string;
  originalPrice: number;
  offerPrice?: number;
  isActive?: boolean;
}

type BatchStatusFilter = 'all' | 'expired' | 'expiring_soon' | 'ok';

export function AdminProductAnalyticsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navState = location.state as { product?: Product; locations?: StoreLocation[] } | null;

  const [product, setProduct] = useState<Product | null>(navState?.product ?? null);
  const locations: StoreLocation[] = navState?.locations ?? [];
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const inFlightRef = useRef(false);
  const fetchProduct = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = !!opts?.silent;
    if (!id) return;
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    if (!silent) setRefreshing(true);
    try {
      const { data } = await api.get(`/products/${id}`);
      setProduct(data.product ?? null);
      if (!silent) {
        toast({ title: 'Refreshed', description: 'Product analytics data updated.' });
      }
    } catch {
      if (!silent) {
        toast({
          title: 'Refresh failed',
          description: 'Could not load updated product data.',
          variant: 'destructive',
        });
      }
    } finally {
      if (!silent) setRefreshing(false);
      inFlightRef.current = false;
    }
  }, [id, toast]);

  // Keep analytics in sync with admin inventory changes (GiveAway, checkout, etc.)
  useEffect(() => {
    if (!id) return;

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { productIds?: string[] } | undefined;
      const productIds = detail?.productIds;
      if (!Array.isArray(productIds)) return;
      if (!productIds.includes(id)) return;
      fetchProduct({ silent: true });
    };

    window.addEventListener('inventory:giveaway-updated', handler);

    // Fallback polling (in case user applies updates from another tab/page)
    const interval = window.setInterval(() => {
      fetchProduct({ silent: true });
    }, 20000);

    return () => {
      window.removeEventListener('inventory:giveaway-updated', handler);
      window.clearInterval(interval);
    };
  }, [id, fetchProduct]);

  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<BatchStatusFilter>('all');

  const resetFilters = () => {
    setSearch('');
    setLocationFilter('all');
    setStatusFilter('all');
  };

  const variants: ProductVariant[] = (product as any)?.variants || [];
  const hasVariants = variants.length > 0;

  const allBatches = useMemo(() => {
    if (!product?.inventory) return [];
    return product.inventory.flatMap((inv) => {
      const loc = locations.find((l) => l.name === inv.location);
      return (inv.batches || []).map((b) => ({
        ...b,
        location: inv.location,
        locationDisplayName: loc?.displayName || inv.location,
      }));
    });
  }, [product, locations]);

  const now = new Date();
  const withMeta = useMemo(
    () =>
      allBatches.map((b) => {
        const exp =
          typeof b.expiryDate === 'string'
            ? new Date(b.expiryDate)
            : (b.expiryDate as Date);
        const daysLeft = Math.ceil(
          (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        const status: 'expired' | 'expiring_soon' | 'ok' =
          daysLeft < 0
            ? 'expired'
            : daysLeft <= 3
              ? 'expiring_soon'
              : 'ok';

        const triggerDays = (b as { dealTriggerDays?: number }).dealTriggerDays;
        const discountPercent = (b as { dealDiscountPercent?: number }).dealDiscountPercent;
        const isInDealWindow =
          typeof triggerDays === 'number' &&
          triggerDays > 0 &&
          daysLeft >= 0 &&
          daysLeft <= triggerDays &&
          typeof discountPercent === 'number' &&
          discountPercent > 0;

        const sold = (b as any).soldQuantity || 0;
        const revenue = (b as any).revenue || 0;
        const remainingQty = b.quantity || 0;
        const expiredUnits = status === 'expired' ? remainingQty : 0;
        const explicitGiveAwayQty = Number(
          (b as any).giveAwayQuantity ?? (b as any).giveawayQuantity ?? -1
        );
        const initialQty = Number(
          (b as any).initialQuantity ??
            (b as any).originalQuantity ??
            (b as any).openingQuantity ??
            NaN
        );
        const inferredGiveAwayQty = Number.isFinite(initialQty)
          ? Math.max(0, initialQty - remainingQty - sold)
          : 0;
        const giveAwayQty =
          explicitGiveAwayQty >= 0 ? explicitGiveAwayQty : inferredGiveAwayQty;
        const giveAwayValue = giveAwayQty * (b.sellingPrice || 0);

        const unitLabel =
          hasVariants && typeof (b as any).variantIndex === 'number' && variants[(b as any).variantIndex]
            ? variants[(b as any).variantIndex].value
            : product?.name || 'Unit';

        return {
          ...b,
          locationDisplayName: (b as { locationDisplayName: string }).locationDisplayName,
          daysLeft,
          status,
          isInDealWindow,
          dealLabel: isInDealWindow ? `${discountPercent}% OFF` : '—',
          unitLabel,
          sold,
          revenue,
          expiredUnits,
          giveAwayQty,
          giveAwayValue,
        };
      }),
    [allBatches, now, variants, hasVariants, product]
  );

  const filteredBatches = useMemo(() => {
    let list = withMeta;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (b) =>
          b.batchNumber?.toLowerCase().includes(q) ||
          (b as { locationDisplayName?: string }).locationDisplayName?.toLowerCase().includes(q) ||
          b.location?.toLowerCase().includes(q)
      );
    }
    if (locationFilter !== 'all') {
      list = list.filter((b) => b.location === locationFilter);
    }
    if (statusFilter !== 'all') {
      list = list.filter((b) => b.status === statusFilter);
    }
    // FIFO-friendly: earliest expiry first
    return [...list].sort((a, b) => a.daysLeft - b.daysLeft);
  }, [
    withMeta,
    search,
    locationFilter,
    statusFilter,
  ]);

  const reportSummary = useMemo(() => {
    const totalUnits = filteredBatches.reduce((s, b) => s + (b.quantity || 0), 0);
    const totalSoldUnits = filteredBatches.reduce((s, b) => s + (b.sold || 0), 0);
    const totalExpiredUnits = filteredBatches.reduce((s, b) => s + (b.expiredUnits || 0), 0);
    const totalRevenue = filteredBatches.reduce((s, b) => s + (b.revenue || 0), 0);
    const totalGiveAwayUnits = filteredBatches.reduce((s, b) => s + ((b as any).giveAwayQty || 0), 0);
    const totalGiveAwayValue = filteredBatches.reduce(
      (s, b) => s + ((b as any).giveAwayValue || 0),
      0
    );
    return {
      totalUnits,
      totalSoldUnits,
      totalExpiredUnits,
      totalRevenue,
      totalGiveAwayUnits,
      totalGiveAwayValue,
      batchCount: filteredBatches.length,
    };
  }, [filteredBatches]);

  const formatDate = (d: string | Date) => {
    if (!d) return '-';
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const downloadCSV = () => {
    const headers = [
      'Location',
      'Batch #',
      'Unit',
      'Qty Left',
      'Sold',
      'Expired Units',
      'Mfg Date',
      'Expiry Date',
      'Days Left',
      'Status',
      'Selling ₹',
      'Revenue ₹',
      'GiveAway Units',
      'GiveAway Value ₹',
    ];
    const rows = filteredBatches.map((b) =>
      [
        b.locationDisplayName,
        b.batchNumber,
        (b as any).unitLabel,
        b.quantity ?? 0,
        b.sold ?? 0,
        b.expiredUnits ?? 0,
        formatDate(b.manufacturingDate),
        formatDate(b.expiryDate),
        b.daysLeft,
        b.status,
        (b.sellingPrice ?? 0).toFixed(2),
        (b.revenue ?? 0).toFixed(2),
        ((b as any).giveAwayQty ?? 0).toFixed(2),
        ((b as any).giveAwayValue ?? 0).toFixed(2),
      ].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product-analytics-${product?.name?.replace(/\s+/g, '-') || id || 'report'}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSummaryReport = () => {
    const lines = [
      `Product: ${product?.name ?? id ?? '—'}`,
      `Generated: ${new Date().toLocaleString('en-IN')}`,
      '',
      '--- Summary (filtered) ---',
      `Total Batches: ${reportSummary.batchCount}`,
      `Total Units (current stock): ${reportSummary.totalUnits}`,
      `Total Units Sold: ${reportSummary.totalSoldUnits}`,
      `Total Units Expired: ${reportSummary.totalExpiredUnits}`,
      `Total Revenue (realised): ₹${reportSummary.totalRevenue.toFixed(2)}`,
      `Total GiveAway Units: ${reportSummary.totalGiveAwayUnits}`,
      `Total GiveAway Value: ₹${reportSummary.totalGiveAwayValue.toFixed(2)}`,
    ];
    const text = lines.join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product-summary-${product?.name?.replace(/\s+/g, '-') || id || 'report'}-${new Date()
      .toISOString()
      .slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const title = product ? `Product Analytics – ${product.name}` : 'Product Analytics';

  return (
    <Layout>
      <SEO
        title={title}
        description="Batch-wise inventory analytics with expiry, deal, and selling value insights for a single product."
      />
      <div className="mx-auto px-4 py-6 space-y-4" style={{ width: '80%' }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin/inventory')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            {product && id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchProduct()}
                disabled={refreshing}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            )}
            <div>
              <h1 className="text-xl font-semibold">{title}</h1>
              {product && (
                <p className="text-xs text-muted-foreground">
                  Full-screen analytics with filters, search and downloads. Batch quantities reflect current stock after
                  checkout sales and admin GiveAway deductions (refresh after changes).
                </p>
              )}
              {!product && (
                <p className="text-xs text-red-600">
                  Product data was not provided. Please open analytics from the Admin Inventory page.
                </p>
              )}
            </div>
          </div>
        </div>

        {!product ? null : (
          <>
            {/* Simplified Search & Filters */}
            <div className="flex flex-wrap items-end gap-3 p-4 border rounded-lg bg-slate-50">
              <div className="flex-1 min-w-[180px]">
                <Label className="text-xs text-muted-foreground">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Batch # or location..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-9"
                  />
                </div>
              </div>
              <div className="w-[140px]">
                <Label className="text-xs text-muted-foreground">Location</Label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All locations</SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc.storeId} value={loc.name}>
                        {loc.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[140px]">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as BatchStatusFilter)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
                    <SelectItem value="ok">OK</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="ghost" size="sm" className="h-9" onClick={resetFilters}>
                <X className="h-4 w-4 mr-1" /> Reset
              </Button>
            </div>

            {/* Key Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="p-3 border rounded-lg bg-white">
                <p className="text-xs text-muted-foreground">Total Stock</p>
                <p className="text-lg font-bold">{reportSummary.totalUnits}</p>
              </div>
              <div className="p-3 border rounded-lg bg-white">
                <p className="text-xs text-muted-foreground">Total Sold Units</p>
                <p className="text-lg font-bold text-emerald-700">{reportSummary.totalSoldUnits}</p>
              </div>
              <div className="p-3 border rounded-lg bg-white">
                <p className="text-xs text-muted-foreground">Total Expired Units</p>
                <p className="text-lg font-bold text-red-700">{reportSummary.totalExpiredUnits}</p>
              </div>
              <div className="p-3 border rounded-lg bg-white">
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="text-lg font-bold text-green-700">₹{reportSummary.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="p-3 border rounded-lg bg-amber-50">
                <p className="text-xs text-muted-foreground">GiveAway Units</p>
                <p className="text-lg font-bold text-amber-700">{reportSummary.totalGiveAwayUnits}</p>
              </div>
              <div className="p-3 border rounded-lg bg-blue-50">
                <p className="text-xs text-muted-foreground">GiveAway Value</p>
                <p className="text-lg font-bold text-blue-700">₹{reportSummary.totalGiveAwayValue.toFixed(2)}</p>
              </div>
            </div>

            {/* Download actions */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={downloadCSV} className="gap-2">
                <Download className="h-4 w-4" />
                Download CSV (filtered)
              </Button>
              <Button variant="outline" size="sm" onClick={downloadSummaryReport} className="gap-2">
                <FileText className="h-4 w-4" />
                Download Summary Report
              </Button>
            </div>

            {/* Batch table */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Batch-wise details ({filteredBatches.length} rows)
              </Label>
              {filteredBatches.length === 0 ? (
                <p className="text-sm text-muted-foreground border rounded p-4 bg-white">
                  No batches match the current filters.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200">
                        <th className="text-left py-2.5 px-3 font-semibold text-gray-700">Location</th>
                        <th className="text-left py-2.5 px-3 font-semibold text-gray-700">Batch #</th>
                        <th className="text-left py-2.5 px-3 font-semibold text-gray-700">Unit</th>
                        <th className="text-right py-2.5 px-3 font-semibold text-gray-700">Qty Left</th>
                        <th className="text-right py-2.5 px-3 font-semibold text-gray-700">Sold</th>
                        <th className="text-right py-2.5 px-3 font-semibold text-gray-700">Expired</th>
                        <th className="text-left py-2.5 px-3 font-semibold text-gray-700">Mfg</th>
                        <th className="text-left py-2.5 px-3 font-semibold text-gray-700">Expiry</th>
                        <th className="text-left py-2.5 px-3 font-semibold text-gray-700">Status</th>
                        <th className="text-right py-2.5 px-3 font-semibold text-gray-700">Sell ₹</th>
                        <th className="text-right py-2.5 px-3 font-semibold text-gray-700">Revenue ₹</th>
                        <th className="text-right py-2.5 px-3 font-semibold text-gray-700">GiveAway Units</th>
                        <th className="text-right py-2.5 px-3 font-semibold text-gray-700">GiveAway Value ₹</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBatches.map((b, idx) => (
                        <tr
                          key={b.batchNumber + idx}
                          className={`border-b border-gray-100 last:border-0 ${
                            b.status === 'expired'
                              ? 'bg-red-50/60 text-gray-400'
                              : idx % 2 === 1
                                ? 'bg-gray-50/50'
                                : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 font-medium text-gray-900">
                            {b.locationDisplayName}
                          </td>
                          <td className="py-2.5 px-3 text-gray-800">{b.batchNumber}</td>
                          <td className="py-2.5 px-3 text-gray-800 text-xs">
                            {(b as any).unitLabel}
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold">{b.quantity ?? 0}</td>
                          <td className="py-2.5 px-3 text-right font-semibold">{(b as any).sold ?? 0}</td>
                          <td className="py-2.5 px-3 text-right font-semibold">{(b as any).expiredUnits ?? 0}</td>
                          <td className="py-2.5 px-3 text-gray-700">{formatDate(b.manufacturingDate)}</td>
                          <td className="py-2.5 px-3 text-gray-700">{formatDate(b.expiryDate)}</td>
                          <td className="py-2.5 px-3">
                            {b.status === 'expired' && (
                              <Badge variant="destructive" className="text-xs">
                                Expired
                              </Badge>
                            )}
                            {b.status === 'expiring_soon' && (
                              <Badge className="text-xs bg-amber-100 text-amber-800">
                                Soon ({b.daysLeft}d)
                              </Badge>
                            )}
                            {b.status === 'ok' && (
                              <Badge className="text-xs bg-green-100 text-green-800">
                                OK ({b.daysLeft}d)
                              </Badge>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right text-gray-700">
                            ₹{b.sellingPrice?.toFixed(2) ?? '0.00'}
                          </td>
                          <td className="py-2.5 px-3 text-right text-gray-700">
                            ₹{(b as any).revenue?.toFixed(2) ?? '0.00'}
                          </td>
                          <td className="py-2.5 px-3 text-right text-gray-700">
                            {(b as any).giveAwayQty ?? 0}
                          </td>
                          <td className="py-2.5 px-3 text-right text-gray-700">
                            ₹{((b as any).giveAwayValue ?? 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

