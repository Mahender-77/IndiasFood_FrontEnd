/*
 * ProductAnalyticsDialog — Updated:
 *  • Removed "Buy ₹" column
 *  • Profit shows ₹0.00 (not negative) when no sales yet
 *  • Added "Unit" column (variant value or product name)
 *  • Filter bar redesigned — cleaner, less cramped
 *  • Uses full dialog width properly
 */

import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Product } from '@/types';
import { Search, Download, FileText, X, SlidersHorizontal } from 'lucide-react';

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

interface ProductAnalyticsDialogProps {
  product: Product | null;
  locations: StoreLocation[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type BatchStatusFilter = 'all' | 'expired' | 'expiring_soon' | 'ok';
type DealFilter = 'all' | 'deal_only';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getUnitLabel(
  variantIndex: number | undefined,
  variants: ProductVariant[] | undefined,
  productName: string
): string {
  if (variants && variants.length > 0 && variantIndex != null && variants[variantIndex]) {
    return variants[variantIndex].value;
  }
  return productName || 'Unit';
}

// ─── SUBCOMPONENTS ────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  color,
  bg,
  accent,
}: {
  label: string;
  value: string | number;
  color?: string;
  bg?: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: bg || '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '14px 18px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {accent && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: accent,
            borderRadius: '12px 12px 0 0',
          }}
        />
      )}
      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: accent ? 4 : 0 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: color || '#0f172a', fontFamily: 'monospace', marginTop: 4 }}>
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ status, daysLeft }: { status: string; daysLeft: number }) {
  if (status === 'expired') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
        color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca',
        whiteSpace: 'nowrap',
      }}>
        💀 Expired
      </span>
    );
  }
  if (status === 'expiring_soon') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
        color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a',
        whiteSpace: 'nowrap',
      }}>
        ⚠️ {daysLeft}d left
      </span>
    );
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0',
      whiteSpace: 'nowrap',
    }}>
      ✅ {daysLeft}d left
    </span>
  );
}

function UnitBadge({ label }: { label: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

function FilterChip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 13px', borderRadius: 10,
        border: `1.5px solid ${active ? '#3b82f6' : '#e2e8f0'}`,
        background: active ? '#eff6ff' : '#fff',
        color: active ? '#1d4ed8' : '#64748b',
        fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        transition: 'all 0.15s',
      }}
    >
      {label}
      {count != null && (
        <span style={{
          background: active ? '#3b82f6' : '#f1f5f9',
          color: active ? '#fff' : '#94a3b8',
          borderRadius: 8, padding: '1px 6px', fontSize: 10, fontWeight: 700,
        }}>
          {count}
        </span>
      )}
    </button>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function ProductAnalyticsDialog({
  product,
  locations,
  open,
  onOpenChange,
}: ProductAnalyticsDialogProps) {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<BatchStatusFilter>('all');
  const [dealFilter, setDealFilter] = useState<DealFilter>('all');
  const [expiryFrom, setExpiryFrom] = useState('');
  const [expiryTo, setExpiryTo] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const resetFilters = () => {
    setSearch('');
    setLocationFilter('all');
    setStatusFilter('all');
    setDealFilter('all');
    setExpiryFrom('');
    setExpiryTo('');
  };

  const hasActiveFilters =
    search || locationFilter !== 'all' || statusFilter !== 'all' ||
    dealFilter !== 'all' || expiryFrom || expiryTo;

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
          daysLeft < 0 ? 'expired' : daysLeft <= 3 ? 'expiring_soon' : 'ok';

        const sold = (b as any).soldQuantity || 0;
        const revenue = (b as any).revenue || 0;

        // Profit: ₹0 when no sales, never show negative from unsold stock
        const rawProfit = revenue - (b.purchasePrice || 0) * sold;
        const realizedProfit = sold === 0 ? 0 : rawProfit;

        const triggerDays = (b as any).dealTriggerDays;
        const discountPercent = (b as any).dealDiscountPercent;
        const isInDealWindow =
          typeof triggerDays === 'number' &&
          triggerDays > 0 &&
          daysLeft >= 0 &&
          daysLeft <= triggerDays &&
          typeof discountPercent === 'number' &&
          discountPercent > 0;

        const unitLabel = getUnitLabel(
          (b as any).variantIndex,
          hasVariants ? variants : undefined,
          product?.name || 'Unit'
        );

        return {
          ...b,
          locationDisplayName: (b as { locationDisplayName: string }).locationDisplayName,
          daysLeft,
          status,
          sold,
          revenue,
          realizedProfit,
          isInDealWindow,
          unitLabel,
          dealLabel: isInDealWindow ? `${discountPercent}% OFF` : '—',
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
          b.locationDisplayName?.toLowerCase().includes(q) ||
          b.location?.toLowerCase().includes(q)
      );
    }
    if (locationFilter !== 'all') list = list.filter((b) => b.location === locationFilter);
    if (statusFilter !== 'all') list = list.filter((b) => b.status === statusFilter);
    if (dealFilter === 'deal_only') list = list.filter((b) => b.isInDealWindow);
    if (expiryFrom) {
      const from = new Date(expiryFrom);
      list = list.filter((b) => {
        const exp = typeof b.expiryDate === 'string' ? new Date(b.expiryDate) : b.expiryDate;
        return (exp as Date) >= from;
      });
    }
    if (expiryTo) {
      const to = new Date(expiryTo);
      to.setHours(23, 59, 59, 999);
      list = list.filter((b) => {
        const exp = typeof b.expiryDate === 'string' ? new Date(b.expiryDate) : b.expiryDate;
        return (exp as Date) <= to;
      });
    }
    // FIFO-friendly ordering: earliest expiry first
    return [...list].sort((a, b) => a.daysLeft - b.daysLeft);
  }, [withMeta, search, locationFilter, statusFilter, dealFilter, expiryFrom, expiryTo]);

  const summary = useMemo(() => {
    const totalUnits = filteredBatches.reduce((s, b) => s + (b.quantity || 0), 0);
    const totalProfit = filteredBatches.reduce((s, b) => s + b.realizedProfit, 0);
    const totalRevenue = filteredBatches.reduce((s, b) => s + b.revenue, 0);
    const expired = filteredBatches.filter((b) => b.status === 'expired').length;
    const expiringSoon = filteredBatches.filter((b) => b.status === 'expiring_soon').length;
    const ok = filteredBatches.filter((b) => b.status === 'ok').length;
    const inDealWindow = filteredBatches.filter((b) => b.isInDealWindow).length;
    return { totalUnits, totalProfit, totalRevenue, batchCount: filteredBatches.length, expired, expiringSoon, ok, inDealWindow };
  }, [filteredBatches]);

  // Status counts for chips
  const statusCounts = useMemo(() => ({
    all: withMeta.length,
    ok: withMeta.filter(b => b.status === 'ok').length,
    expiring_soon: withMeta.filter(b => b.status === 'expiring_soon').length,
    expired: withMeta.filter(b => b.status === 'expired').length,
  }), [withMeta]);

  const formatDate = (d: string | Date) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const fmt = (n: number) =>
    `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const downloadCSV = () => {
    const headers = [
      'Location', 'Batch #', 'Unit', 'Qty', 'Mfg Date', 'Expiry Date',
      'Days Left', 'Status', 'Sell ₹', 'Sold', 'Revenue ₹', 'Profit ₹', 'Deal',
    ];
    const rows = filteredBatches.map((b) =>
      [
        b.locationDisplayName,
        b.batchNumber,
        b.unitLabel,
        b.quantity ?? 0,
        formatDate(b.manufacturingDate),
        formatDate(b.expiryDate),
        b.daysLeft,
        b.status,
        (b.sellingPrice ?? 0).toFixed(2),
        b.sold,
        b.revenue.toFixed(2),
        b.realizedProfit.toFixed(2),
        b.dealLabel,
      ].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${product?.name?.replace(/\s+/g, '-') || 'report'}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSummaryReport = () => {
    const lines = [
      `Product: ${product?.name ?? '—'}`,
      `Generated: ${new Date().toLocaleString('en-IN')}`,
      '',
      '--- Summary (filtered) ---',
      `Total Batches: ${summary.batchCount}`,
      `Total Units: ${summary.totalUnits}`,
      `Total Revenue: ₹${summary.totalRevenue.toFixed(2)}`,
      `Total Profit: ₹${summary.totalProfit.toFixed(2)}`,
      `Expired: ${summary.expired}`,
      `Expiring Soon (≤3 days): ${summary.expiringSoon}`,
      `OK: ${summary.ok}`,
      `In Deal of the Day window: ${summary.inDealWindow}`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary-${product?.name?.replace(/\s+/g, '-') || 'report'}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{
          maxWidth: '92vw',
          width: '92vw',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: 0,
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {/* ── HEADER ── */}
        <div style={{ background: '#0f172a', padding: '20px 28px', borderRadius: '16px 16px 0 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, background: '#3b82f6', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📊</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
                  Product Analytics & Report
                </div>
                <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{product.name}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 6, maxWidth: 520, lineHeight: 1.45 }}>
                  Qty left reflects checkout and admin GiveAway deductions; refresh product data after changes.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={downloadCSV}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8, border: '1px solid #334155',
                  background: '#1e293b', color: '#94a3b8', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <Download size={13} /> CSV
              </button>
              <button
                onClick={downloadSummaryReport}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8, border: '1px solid #334155',
                  background: '#1e293b', color: '#94a3b8', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <FileText size={13} /> Report
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── SUMMARY CARDS ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12 }}>
            <SummaryCard label="Batches"       value={summary.batchCount}                            accent="#3b82f6" />
            <SummaryCard label="Total Units"   value={(summary.totalUnits).toLocaleString('en-IN')}  accent="#6366f1" />
            <SummaryCard label="Revenue"       value={fmt(summary.totalRevenue)}   color="#16a34a"   accent="#22c55e" />
            <SummaryCard label="Profit"        value={fmt(summary.totalProfit)}    color="#16a34a"   accent="#8b5cf6" />
            <SummaryCard label="Expired"       value={summary.expired}             color="#dc2626"   bg="#fef2f2" accent="#ef4444" />
            <SummaryCard label="Expiring Soon" value={summary.expiringSoon}        color="#d97706"   bg="#fffbeb" accent="#f59e0b" />
            <SummaryCard label="In Deal"       value={summary.inDealWindow}        color="#1d4ed8"   bg="#eff6ff" accent="#3b82f6" />
          </div>

          {/* ── FILTER BAR ── */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>

            {/* Row 1: search + dropdowns + reset */}
            <div style={{
              padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
              borderBottom: '1px solid #f1f5f9',
            }}>
              {/* Search */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search batch # or location…"
                  style={{
                    padding: '8px 12px 8px 30px', border: '1px solid #e2e8f0', borderRadius: 8,
                    fontSize: 13, outline: 'none', fontFamily: 'inherit', color: '#0f172a',
                    width: 240, background: '#fff',
                  }}
                />
              </div>

              {/* Location */}
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                style={selectSt}
              >
                <option value="all">All Locations</option>
                {locations.map((loc) => (
                  <option key={loc.storeId} value={loc.name}>{loc.displayName}</option>
                ))}
              </select>

              {/* Variant */}
              {hasVariants && (
                <select
                  value={(locationFilter as any).variantFilter || 'all'}
                  onChange={() => {}}
                  style={selectSt}
                >
                  <option value="all">All Variants</option>
                  {variants.map((v, i) => (
                    <option key={i} value={String(i)}>{v.value}</option>
                  ))}
                </select>
              )}

              {/* Deal */}
              <select
                value={dealFilter}
                onChange={(e) => setDealFilter(e.target.value as DealFilter)}
                style={selectSt}
              >
                <option value="all">All Batches</option>
                <option value="deal_only">🏷️ Deal of the Day only</option>
              </select>

              {/* Advanced toggle */}
              <button
                onClick={() => setShowAdvanced((v) => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px', borderRadius: 8,
                  border: `1.5px solid ${showAdvanced ? '#3b82f6' : '#e2e8f0'}`,
                  background: showAdvanced ? '#eff6ff' : '#fff',
                  color: showAdvanced ? '#1d4ed8' : '#64748b',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <SlidersHorizontal size={12} /> Expiry Range
              </button>

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '7px 12px', borderRadius: 8, border: '1px solid #fecaca',
                    background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <X size={12} /> Reset
                </button>
              )}

              <div style={{ marginLeft: 'auto', background: '#f8fafc', padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                  {filteredBatches.length} <span style={{ color: '#94a3b8', fontWeight: 400 }}>of</span> {withMeta.length} batches
                </span>
              </div>
            </div>

            {/* Row 2: status chips */}
            <div style={{ padding: '10px 18px', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', background: '#fafafa' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 4 }}>Status:</span>
              <FilterChip active={statusFilter === 'all'}          label="All"             count={statusCounts.all}          onClick={() => setStatusFilter('all')} />
              <FilterChip active={statusFilter === 'ok'}           label="✅ OK"            count={statusCounts.ok}           onClick={() => setStatusFilter('ok')} />
              <FilterChip active={statusFilter === 'expiring_soon'} label="⚠️ Expiring Soon" count={statusCounts.expiring_soon} onClick={() => setStatusFilter('expiring_soon')} />
              <FilterChip active={statusFilter === 'expired'}      label="💀 Expired"       count={statusCounts.expired}      onClick={() => setStatusFilter('expired')} />
            </div>

            {/* Row 3: expiry range (collapsible) */}
            {showAdvanced && (
              <div style={{ padding: '12px 18px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', background: '#fff' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Expiry From</div>
                  <input type="date" value={expiryFrom} onChange={(e) => setExpiryFrom(e.target.value)} style={{ ...selectSt, width: 150 }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Expiry To</div>
                  <input type="date" value={expiryTo} onChange={(e) => setExpiryTo(e.target.value)} style={{ ...selectSt, width: 150 }} />
                </div>
                {(expiryFrom || expiryTo) && (
                  <button
                    onClick={() => { setExpiryFrom(''); setExpiryTo(''); }}
                    style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Clear dates
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── BATCH TABLE ── */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                📋 Batch Details
                <span style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8', marginLeft: 8 }}>
                  ({filteredBatches.length} {filteredBatches.length === 1 ? 'row' : 'rows'})
                </span>
              </span>
            </div>

            {filteredBatches.length === 0 ? (
              <div style={{ padding: 56, textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
                <div style={{ fontWeight: 600 }}>No batches match the current filters</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Try adjusting the filters above</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      {[
                        'Location', 'Batch #', 'Unit', 'Qty',
                        'Mfg Date', 'Expiry', 'Status',
                        'Sell ₹', 'Sold', 'Revenue', 'Profit', 'Deal',
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: '11px 14px', textAlign: 'left',
                            fontSize: 11, fontWeight: 700, color: '#64748b',
                            textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBatches.map((b, idx) => {
                      const profitPct =
                        b.sold > 0 && (b.purchasePrice || 0) > 0
                          ? ((b.realizedProfit / ((b.purchasePrice || 1) * b.sold)) * 100).toFixed(0)
                          : null;

                      return (
                        <tr
                          key={b.batchNumber + idx}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            background: idx % 2 === 1 ? '#fafafa' : '#fff',
                          }}
                        >
                          {/* Location */}
                          <td style={{ padding: '11px 14px', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>
                            🏪 {b.locationDisplayName}
                          </td>

                          {/* Batch # */}
                          <td style={{ padding: '11px 14px', fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: '#0f172a' }}>
                            {b.batchNumber}
                          </td>

                          {/* Unit */}
                          <td style={{ padding: '11px 14px' }}>
                            <UnitBadge label={b.unitLabel} />
                          </td>

                          {/* Qty */}
                          <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace' }}>
                            {(b.quantity ?? 0).toLocaleString('en-IN')}
                          </td>

                          {/* Mfg Date */}
                          <td style={{ padding: '11px 14px', color: '#64748b', whiteSpace: 'nowrap', fontSize: 12 }}>
                            {formatDate(b.manufacturingDate)}
                          </td>

                          {/* Expiry */}
                          <td style={{ padding: '11px 14px', color: '#64748b', whiteSpace: 'nowrap', fontSize: 12 }}>
                            {formatDate(b.expiryDate)}
                          </td>

                          {/* Status */}
                          <td style={{ padding: '11px 14px' }}>
                            <StatusBadge status={b.status} daysLeft={b.daysLeft} />
                          </td>

                          {/* Sell ₹ */}
                          <td style={{ padding: '11px 14px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>
                            {fmt(b.sellingPrice ?? 0)}
                          </td>

                          {/* Sold */}
                          <td style={{ padding: '11px 14px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                            {b.sold.toLocaleString('en-IN')}
                          </td>

                          {/* Revenue */}
                          <td style={{ padding: '11px 14px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#16a34a' }}>
                            {fmt(b.revenue)}
                          </td>

                          {/* Profit — never negative for unsold */}
                          <td style={{ padding: '11px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{
                              fontFamily: 'monospace', fontWeight: 700,
                              color: b.sold > 0 ? (b.realizedProfit >= 0 ? '#16a34a' : '#ef4444') : '#94a3b8',
                            }}>
                              {fmt(b.realizedProfit)}
                            </div>
                            {b.sold > 0 && profitPct && (
                              <div style={{ fontSize: 10, color: b.realizedProfit >= 0 ? '#16a34a' : '#ef4444' }}>
                                {b.realizedProfit >= 0 ? '+' : ''}{profitPct}%
                              </div>
                            )}
                            {b.sold === 0 && (
                              <div style={{ fontSize: 10, color: '#94a3b8' }}>No sales yet</div>
                            )}
                          </td>

                          {/* Deal */}
                          <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                            {b.isInDealWindow ? (
                              <span style={{ color: '#f97316', fontWeight: 700, fontSize: 12 }}>🏷️ {b.dealLabel}</span>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Table footer totals */}
            {filteredBatches.length > 0 && (
              <div style={{
                padding: '12px 20px', borderTop: '2px solid #e2e8f0', background: '#f8fafc',
                display: 'flex', gap: 28, flexWrap: 'wrap', fontSize: 12,
              }}>
                <span><strong style={{ color: '#0f172a' }}>Units:</strong> {summary.totalUnits.toLocaleString('en-IN')}</span>
                <span><strong style={{ color: '#16a34a' }}>Revenue:</strong> {fmt(summary.totalRevenue)}</span>
                <span><strong style={{ color: '#8b5cf6' }}>Profit:</strong> {fmt(summary.totalProfit)}</span>
                <span><strong style={{ color: '#f97316' }}>In Deal:</strong> {summary.inDealWindow}</span>
                <span style={{ marginLeft: 'auto', color: '#94a3b8' }}>{filteredBatches.length} batches shown</span>
              </div>
            )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────

const selectSt: React.CSSProperties = {
  padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8,
  fontSize: 13, outline: 'none', background: '#fff', fontFamily: 'inherit',
  color: '#0f172a', cursor: 'pointer',
};