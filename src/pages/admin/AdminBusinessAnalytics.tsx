import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SEO } from '@/components/seo/SEO';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { FiltersBar } from '@/components/admin/analytics/FiltersBar';
import { SummaryCards } from '@/components/admin/analytics/SummaryCards';
import { RevenueInsights } from '@/components/admin/analytics/RevenueInsights';
import { GiveAwayInsights } from '@/components/admin/analytics/GiveAwayInsights';
import { ChargesInsights } from '@/components/admin/analytics/ChargesInsights';
import { OrderInsights } from '@/components/admin/analytics/OrderInsights';
import { ProductInsights } from '@/components/admin/analytics/ProductInsights';
import { AnalyticsFilters, ProductDrillRow, SummaryMetrics } from '@/components/admin/analytics/types';
import { Product, Order } from '@/types';

const DEFAULT_FILTERS: AnalyticsFilters = {
  search: '',
  status: 'all',
  fromDate: '',
  toDate: '',
};

export default function AdminBusinessAnalytics() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filters, setFilters] = useState<AnalyticsFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  // Ref to scroll into view when search is active
  const productSectionRef = useRef<HTMLDivElement>(null);
  const prevSearch = useRef('');

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const productsPromise = api.get('/products');
      const ordersPromise = api
        .get('/orders')
        .catch(() => api.get('/admin/orders'));

      const [productsRes, ordersRes] = await Promise.all([productsPromise, ordersPromise]);

      const productsPayload = productsRes.data;
      const productsList = Array.isArray(productsPayload)
        ? productsPayload
        : Array.isArray(productsPayload?.products)
          ? productsPayload.products
          : [];

      const ordersPayload = ordersRes.data;
      const ordersList = Array.isArray(ordersPayload) ? ordersPayload : [];

      setProducts(productsList);
      setOrders(ordersList);
    } catch (error: any) {
      toast({
        title: 'Failed to load analytics',
        description: error?.response?.data?.message || 'Unable to fetch products/orders.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(false);
  }, []);

  // Auto-scroll to product results when user starts typing in search
  useEffect(() => {
    const wasEmpty = prevSearch.current === '';
    const isNowFilled = filters.search.trim() !== '';
    if (wasEmpty && isNowFilled && productSectionRef.current) {
      productSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    prevSearch.current = filters.search;
  }, [filters.search]);

  // Also scroll when status filter changes to non-"all"
  useEffect(() => {
    if (filters.status !== 'all' && productSectionRef.current) {
      productSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [filters.status]);

  const productRows: ProductDrillRow[] = useMemo(() => {
    const now = Date.now();
    return products.map((product) => {
      let stock = 0;
      let sold = 0;
      let giveAway = 0;
      let expired = 0;
      let revenue = 0;
      let giveAwayValue = 0;
      let dealUnits = 0;
      let hasDeal = false;

      for (const inv of product.inventory || []) {
        for (const batch of inv.batches || []) {
          const qty = Number(batch.quantity || 0);
          const soldQty = Number((batch as any).soldQuantity || 0);
          const giveAwayQty = Number((batch as any).giveAwayQuantity || (batch as any).giveawayQuantity || 0);
          const sellingPrice = Number(batch.sellingPrice || 0);
          const expiry = batch.expiryDate ? new Date(batch.expiryDate as any).getTime() : Number.POSITIVE_INFINITY;
          const expDate = new Date(batch.expiryDate as any);
          const daysLeft = Math.ceil((expDate.getTime() - now) / (1000 * 60 * 60 * 24));
          const triggerDays = Number((batch as any).dealTriggerDays ?? (product as any).dealTriggerDays ?? 0);
          const dealDiscountPercent = Number(
            (batch as any).dealDiscountPercent ?? (product as any).dealDiscountPercent ?? 0
          );
          const isDealNow = triggerDays > 0 && dealDiscountPercent > 0 && daysLeft >= 0 && daysLeft <= triggerDays;

          stock += qty;
          sold += soldQty;
          giveAway += giveAwayQty;
          revenue += Number((batch as any).revenue || soldQty * sellingPrice);
          giveAwayValue += giveAwayQty * sellingPrice;
          if (expiry < now) expired += qty;
          if (isDealNow) {
            hasDeal = true;
            dealUnits += soldQty;
          }
        }
      }

      return {
        productId: product._id,
        name: product.name,
        stock,
        sold,
        giveAway,
        expired,
        revenue,
        giveAwayValue,
        dealUnits,
        hasDeal,
        hasExpired: expired > 0,
        isLowStock: stock <= 5,
      };
    });
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return productRows.filter((row) => {
      if (q && !row.name.toLowerCase().includes(q)) return false;
      if (filters.status === 'deal' && !row.hasDeal) return false;
      if (filters.status === 'expired' && !row.hasExpired) return false;
      if (filters.status === 'low_stock' && !row.isLowStock) return false;
      return true;
    });
  }, [productRows, filters.search, filters.status]);

  const filteredOrders = useMemo(() => {
    const fromTs = filters.fromDate ? new Date(filters.fromDate).getTime() : null;
    const toTs = filters.toDate ? new Date(filters.toDate).getTime() + 24 * 60 * 60 * 1000 - 1 : null;
    return orders.filter((order: any) => {
      const createdTs = new Date(order.createdAt || Date.now()).getTime();
      if (fromTs != null && createdTs < fromTs) return false;
      if (toTs != null && createdTs > toTs) return false;
      return true;
    });
  }, [orders, filters.fromDate, filters.toDate]);

  const metrics: SummaryMetrics = useMemo(() => {
    let totalStock = 0;
    let totalSold = 0;
    let totalGiveAwayUnits = 0;
    let totalExpired = 0;
    let totalRevenue = 0;
    let totalDeliveryCharges = 0;
    let totalDealSales = 0;
    let deliveredOrders = 0;
    let cancelledOrders = 0;
    let deliveryOrdersCount = 0;

    for (const row of filteredProducts) {
      totalStock += row.stock;
      totalSold += row.sold;
      totalGiveAwayUnits += row.giveAway;
      totalExpired += row.expired;
      totalDealSales += row.dealUnits;
    }

    const totalGiveAwayValue = filteredProducts.reduce((s, row) => s + row.giveAwayValue, 0);

    for (const order of filteredOrders as any[]) {
      totalRevenue += Number(order.totalAmount ?? order.totalPrice ?? 0);

      const deliveryFee = Number(
        order.deliveryFee ?? order.uengageDeliveryFee ?? order.shippingPrice ?? 0
      );
      totalDeliveryCharges += deliveryFee;
      if (deliveryFee > 0) deliveryOrdersCount += 1;
      if (order.isDelivered || order.status === 'delivered') deliveredOrders += 1;
      if (order.status === 'cancelled') cancelledOrders += 1;

      for (const item of order.items || order.orderItems || []) {
        if ((item as any).isDealApplied) {
          totalDealSales += Number(item.qty || 0);
        }
      }
    }

    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
    const avgDeliveryFeePerOrder = deliveryOrdersCount ? totalDeliveryCharges / deliveryOrdersCount : 0;
    const netEarnings = totalRevenue - totalGiveAwayValue;

    return {
      totalStock,
      totalSold,
      totalGiveAwayUnits,
      totalGiveAwayValue,
      totalExpired,
      totalRevenue,
      totalDeliveryCharges,
      totalDealSales,
      totalOrders,
      deliveredOrders,
      cancelledOrders,
      avgOrderValue,
      avgDeliveryFeePerOrder,
      deliveryOrdersCount,
      netEarnings,
    };
  }, [filteredOrders, filteredProducts]);

  const topGiveAwayProducts = useMemo(
    () =>
      [...filteredProducts]
        .filter((p) => p.giveAway > 0)
        .sort((a, b) => b.giveAway - a.giveAway)
        .map((p) => ({ name: p.name, units: p.giveAway, value: p.giveAwayValue })),
    [filteredProducts]
  );

  const isFiltering =
    filters.search.trim() !== '' || filters.status !== 'all';

  if (loading) {
    return (
      <Layout>
        <section className="section-padding bg-cream min-h-[70vh]">
          <div className="container-custom flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading business analytics...
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO
        title="Business Analytics - India's Food Admin"
        description="Global business analytics dashboard for revenue, giveaway, deals, orders, and delivery charges."
      />

      {/* Full-screen layout: flex column filling viewport height below Layout header */}
      <div className="flex flex-col bg-cream" style={{ minHeight: 'calc(100vh - var(--layout-header-height, 64px))' }}>

        {/* ── Sticky page header + filters — offset clears site navbar + subnav ── */}
        <div
          className="sticky z-20 bg-cream/95 backdrop-blur-sm border-b border-border shadow-sm"
          style={{ top: 'var(--layout-navbar-height, 130px)' }}
        >
          <div className="container-custom py-3 space-y-3">
            {/* Title row */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Link>
                <span className="text-muted-foreground/40 select-none">|</span>
                <h1 className="font-display text-xl font-bold tracking-tight">
                  Global Business Analytics
                </h1>
                {isFiltering && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                    Filtered · {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="gap-2 text-sm"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Filters always visible in sticky bar */}
            <FiltersBar filters={filters} onChange={setFilters} />
          </div>
        </div>

        {/* ── Scrollable content area ───────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
        <div className={`container-custom py-5 space-y-5 `}>

            {/* Summary + insights — hidden when user is actively filtering by product */}
            {!isFiltering && (
              <>
                <SummaryCards metrics={metrics} />

                <RevenueInsights
                  totalRevenue={metrics.totalRevenue}
                  totalDeliveryCharges={metrics.totalDeliveryCharges}
                  totalGiveAwayValue={metrics.totalGiveAwayValue}
                  netEarnings={metrics.netEarnings}
                />

                <div className="grid gap-4 lg:grid-cols-2">
                  <OrderInsights
                    totalOrders={metrics.totalOrders}
                    deliveredOrders={metrics.deliveredOrders}
                    cancelledOrders={metrics.cancelledOrders}
                    avgOrderValue={metrics.avgOrderValue}
                    totalDealSales={metrics.totalDealSales}
                  />
                  <ChargesInsights
                    totalDeliveryCharges={metrics.totalDeliveryCharges}
                    avgDeliveryFeePerOrder={metrics.avgDeliveryFeePerOrder}
                    deliveryOrdersCount={metrics.deliveryOrdersCount}
                  />
                </div>

                <GiveAwayInsights
                  totalUnits={metrics.totalGiveAwayUnits}
                  totalValue={metrics.totalGiveAwayValue}
                  topProducts={topGiveAwayProducts}
                />
              </>
            )}

            {/* When filtering, show a compact metrics strip above the table */}
            {isFiltering && (
              <div className="rounded-xl border border-border bg-background/60 px-4 py-3">
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  <span className="text-muted-foreground">
                    Revenue:{' '}
                    <span className="font-semibold text-foreground">
                      ₹{metrics.totalRevenue.toLocaleString('en-IN')}
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    Sold:{' '}
                    <span className="font-semibold text-foreground">{metrics.totalSold}</span>
                  </span>
                  <span className="text-muted-foreground">
                    Stock:{' '}
                    <span className="font-semibold text-foreground">{metrics.totalStock}</span>
                  </span>
                  <span className="text-muted-foreground">
                    Give-away:{' '}
                    <span className="font-semibold text-foreground">{metrics.totalGiveAwayUnits}</span>
                  </span>
                  <span className="text-muted-foreground">
                    Expired:{' '}
                    <span className="font-semibold text-foreground">{metrics.totalExpired}</span>
                  </span>
                </div>
              </div>
            )}

            {/* Product table — always rendered, ref used for scroll target */}
            <div ref={productSectionRef} className="scroll-mt-[440px] ">
              <ProductInsights rows={filteredProducts} />
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}