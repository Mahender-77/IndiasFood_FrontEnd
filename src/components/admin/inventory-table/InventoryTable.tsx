import { Product, Category } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Edit, Warehouse, Image as ImageIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface StoreLocation {
  storeId: string;
  name: string;
  displayName: string;
}

interface InventoryTableProps {
  products: Product[];
  categories: Category[];
  locations: StoreLocation[];
  onEditProduct: (product: Product) => void;
  getLocationStock: (product: Product, locationName: string) => number | null;
  onUpdateStock?: (productId: string, location: string, variantIndex: number, quantity: number) => void;
  updatingStocks?: Set<string>;
  onToggleMostSaled: (productId: string, isMostSaled: boolean) => void;
}

function getBatchStatus(product: Product): { label: string; color: string; bg: string; dot: string } {
  let minDaysLeft = Infinity;
  let hasExpired = false;

  product.inventory?.forEach(inv => {
    inv.batches?.forEach(b => {
      if (!b.expiryDate) return;
      const exp = new Date(b.expiryDate);
      const days = Math.ceil((exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (days < 0) hasExpired = true;
      else if (days < minDaysLeft) minDaysLeft = days;
    });
  });

  if (hasExpired) return { label: 'Expired', color: 'text-red-700', bg: 'bg-red-100', dot: 'bg-red-500' };
  if (minDaysLeft <= 7) return { label: 'Expiring Soon', color: 'text-amber-700', bg: 'bg-amber-100', dot: 'bg-amber-500' };

  // Check if any batch has deal discount active
  const hasDeal = product.inventory?.some(inv => inv.batches?.some(b => b.dealDiscountPercent && b.dealDiscountPercent > 0));
  if (hasDeal) return { label: 'Deal Active', color: 'text-blue-700', bg: 'bg-blue-100', dot: 'bg-blue-500' };

  if (!product.isActive) return { label: 'Inactive', color: 'text-gray-600', bg: 'bg-gray-100', dot: 'bg-gray-400' };
  return { label: 'Fresh', color: 'text-green-700', bg: 'bg-green-100', dot: 'bg-green-500' };
}

function getEarliestBatch(product: Product): { batchNumber: string; mfgDate: string; expiryDate: string } | null {
  let earliest: { batchNumber: string; mfgDate: string; expiryDate: string } | null = null;
  let earliestExp = Infinity;

  product.inventory?.forEach(inv => {
    inv.batches?.forEach(b => {
      if (!b.expiryDate) return;
      const exp = new Date(b.expiryDate).getTime();
      if (exp < earliestExp) {
        earliestExp = exp;
        earliest = {
          batchNumber: b.batchNumber || '—',
          mfgDate: b.manufacturingDate ? new Date(b.manufacturingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
          expiryDate: b.expiryDate ? new Date(b.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
        };
      }
    });
  });
  return earliest;
}

export function InventoryTable({
  products,
  categories,
  locations,
  onEditProduct,
  getLocationStock,
  onUpdateStock,
  updatingStocks = new Set(),
  onToggleMostSaled
}: InventoryTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [expandedVariantRows, setExpandedVariantRows] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const toggleRowExpanded = (productId: string) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(productId)) newSet.delete(productId);
    else newSet.add(productId);
    setExpandedRows(newSet);
  };

  const toggleVariantExpanded = (productId: string, variantIndex: number) => {
    const key = `${productId}::${variantIndex}`;
    const newSet = new Set(expandedVariantRows);
    if (newSet.has(key)) newSet.delete(key);
    else newSet.add(key);
    setExpandedVariantRows(newSet);
  };

  const formatBatchDate = (dateValue: string | Date | undefined | null) => {
    if (!dateValue) return '—';
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getExpiryMeta = (dateValue: string | Date | undefined | null) => {
    if (!dateValue) return { label: '—', bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400', isExpired: false };
    const exp = new Date(dateValue);
    if (Number.isNaN(exp.getTime())) return { label: '—', bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400', isExpired: false };

    const now = new Date();
    const expired = exp.getTime() < now.getTime();
    if (expired) {
      return { label: 'Expired', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', isExpired: true };
    }

    const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 7) {
      return { label: 'Expiring Soon', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', isExpired: false };
    }

    return { label: 'Fresh', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500', isExpired: false };
  };

  const getBatchesForVariant = (product: Product, variantIndex: number) => {
    // UI helper: flatten product.inventory batches for a specific variantIndex.
    // Keeps data structure intact; only restructures how it is rendered.
    const result: Array<{ location: string; batch: any }> = [];
    product.inventory?.forEach(inv => {
      inv.batches?.forEach(b => {
        if ((b?.variantIndex ?? 0) === variantIndex) {
          result.push({ location: inv.location, batch: b });
        }
      });
    });
    return result;
  };

  if (products.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Warehouse className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-700 font-semibold mb-1">No products found</p>
        <p className="text-sm text-gray-400">Products will appear here once added to the database</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Desktop Table ── */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm min-w-[1200px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap min-w-[240px]">Product Name</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap min-w-[160px]">Category</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap min-w-[160px]">Variant</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap min-w-[170px]">Batch ID</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap min-w-[180px]">Stock</th>
              {/* <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap min-w-[200px]">Mfg / Expiry</th> */}
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap min-w-[140px]">Status</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap min-w-[110px]">Most Sold</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap min-w-[110px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products.map((product, index) => {
              const categoryId = (product.category as any)?._id || product.category;
              const categoryName = categories.find(cat => cat._id === categoryId)?.name || 'Unknown';
              const status = getBatchStatus(product);
              const batch = getEarliestBatch(product);
              const totalStock = locations.reduce((sum, loc) => sum + (getLocationStock(product, loc.name) ?? 0), 0);
              const variantLabel = product.variants && product.variants.length > 0
                ? product.variants[0].value || `${product.variants.length} variants`
                : (product.originalPrice ? `₹${product.originalPrice}` : '—');

              const isProductExpanded = expandedRows.has(product._id);
              const productVariantEntries = (product.variants && product.variants.length > 0)
                ? product.variants.map((v, i) => ({ label: v.value || `Variant ${i + 1}`, variantIndex: i }))
                : [{ label: 'Default', variantIndex: 0 }];

              return (
                <>
                  <tr key={product._id || `product-${index}`} className="hover:bg-orange-50/30 transition-colors group">
                    {/* Product Name */}
                    <td className="px-5 py-3.5 align-top">
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => toggleRowExpanded(product._id)}
                          className="h-8 w-8 mt-0.5 flex items-center justify-center rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50/80 transition-colors"
                          aria-label={isProductExpanded ? 'Collapse product' : 'Expand product'}
                          title={isProductExpanded ? 'Collapse' : 'Expand'}
                        >
                          <ChevronDown className={`h-4 w-4 transition-transform ${isProductExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {product.images && product.images.length > 0 ? (
                          <img src={product.images[0]} alt={product.name} className="w-10 h-10 object-cover rounded-xl shadow-sm shrink-0" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 border border-gray-200">
                            <ImageIcon className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/inventory/${product._id}/analytics`, { state: { product, locations } })}
                            title={product.name}
                            className="font-semibold text-gray-900 text-sm hover:text-orange-600 transition-colors text-left leading-tight whitespace-nowrap truncate max-w-[260px]"
                          >
                            {product.name}
                          </button>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {product.isGITagged && <span className="text-[10px] bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded-full">🏷️ GI</span>}
                            {product.isNewArrival && <span className="text-[10px] bg-orange-100 text-orange-700 font-semibold px-1.5 py-0.5 rounded-full">✨ New</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5 align-top">
                      <span
                        title={categoryName}
                        className="text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg inline-block max-w-[150px] whitespace-nowrap truncate"
                      >
                        {categoryName}
                      </span>
                    </td>

                    {/* Variant */}
                    <td className="px-4 py-3.5 align-top">
                      <span
                        title={variantLabel}
                        className="text-sm font-medium text-gray-700 block whitespace-nowrap truncate max-w-[160px]"
                      >
                        {productVariantEntries.length > 0
                          ? productVariantEntries.length === 1
                            ? productVariantEntries[0].label
                            : `${productVariantEntries.length} variants`
                          : '—'}
                      </span>
                      {/* {productVariantEntries.length > 1 && (
                        <p className="text-xs text-gray-400 mt-0.5">Click to view</p>
                      )} */}
                    </td>

                    {/* Batch ID */}
                    <td className="px-4 py-3.5 align-top">
                      {batch ? (
                        <span
                          title={batch.batchNumber}
                          className="text-xs font-mono text-orange-600 bg-orange-50 px-2 py-1 rounded-md font-semibold whitespace-nowrap"
                        >
                          #{batch.batchNumber.slice(-8)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">No batch</span>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="px-2 py-3.5 align-top text-right max-w-[180px]">
                      <span className={`text-base font-bold ${totalStock === 0 ? 'text-red-500' : totalStock <= 10 ? 'text-amber-500' : 'text-gray-900'}`}>
                        {totalStock}
                      </span>
                      <div className="flex flex-col gap-0.5 mt-1">
                        {locations.map(loc => {
                          const s = getLocationStock(product, loc.name) ?? 0;
                          return (
                            <div key={loc.storeId} className="flex items-center gap-1 justify-end">
                              <span
                                title={loc.displayName}
                                className="text-[10px] text-gray-400 font-medium whitespace-nowrap max-w-[90px] truncate"
                              >
                                {loc.displayName}:
                              </span>
                              <span className={`text-[10px] font-bold ${s === 0 ? 'text-red-500' : 'text-green-600'}`}>{s}</span>
                            </div>
                          );
                        })}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3.5 align-top whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${status.bg} ${status.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.dot}`}></span>
                        {status.label}
                      </span>
                    </td>

                    {/* Most Sold */}
                    <td className="text-center px-4 py-3.5">
                      <Switch
                        checked={product.isMostSaled ?? false}
                        onCheckedChange={(checked) => onToggleMostSaled(product._id, checked)}
                        aria-label="Toggle Most Sold"
                      />
                    </td>

                    {/* Actions */}
                    <td className="text-center px-4 py-3.5 align-top">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEditProduct(product)}
                        className="h-8 w-8 p-0 hover:bg-orange-100 hover:text-orange-600 rounded-lg text-gray-500 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>

                  {isProductExpanded && (
                    <tr>
                      <td colSpan={8} className="px-5 py-4 bg-gray-50/70 border-t border-gray-100">
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Product</span>
                            <span className="text-sm font-semibold text-gray-900">{product.name}</span>
                            <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">{categoryName}</span>
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${status.bg} ${status.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.dot}`}></span>
                              {status.label}
                            </span>
                            <span className="text-xs text-gray-500">Total stock: <span className="font-semibold text-gray-900">{totalStock}</span></span>
                          </div>

                          <div className="space-y-3">
                            {productVariantEntries.map(({ label: variantValue, variantIndex }) => {
                              const variantKey = `${product._id}::${variantIndex}`;
                              const isVariantExpanded = expandedVariantRows.has(variantKey);
                              const batchItems = getBatchesForVariant(product, variantIndex);
                              const batchCount = batchItems.length;

                              const groupedByLocation = batchItems.reduce((acc, item) => {
                                const loc = item.location || 'Unknown location';
                                if (!acc[loc]) acc[loc] = [];
                                acc[loc].push(item.batch);
                                return acc;
                              }, {} as Record<string, any[]>);

                              return (
                                <div key={variantKey} className="rounded-xl border border-gray-100 bg-white overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() => toggleVariantExpanded(product._id, variantIndex)}
                                    className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                                  >
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-sm font-semibold text-gray-900 truncate">{variantValue}</span>
                                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                                          {batchCount} batch{batchCount === 1 ? '' : 'es'}
                                        </span>
                                      </div>
                                      {batchCount === 0 ? (
                                        <div className="text-xs text-gray-400 mt-1">No batch data for this variant.</div>
                                      ) : (
                                        <div className="text-xs text-gray-500 mt-1">
                                          Click to {isVariantExpanded ? 'hide' : 'show'} batch details.
                                        </div>
                                      )}
                                    </div>
                                    <ChevronDown className={`h-4 w-4 transition-transform ${isVariantExpanded ? 'rotate-180' : ''}`} />
                                  </button>

                                  {isVariantExpanded && (
                                    <div className="px-4 py-3 border-t border-gray-100">
                                      {batchCount === 0 ? (
                                        <div className="text-sm text-gray-500">No batches found.</div>
                                      ) : (
                                        <div className="space-y-3">
                                          {Object.entries(groupedByLocation).map(([locationName, batches]) => (
                                            <div key={locationName} className="space-y-2">
                                              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                                {locationName}
                                              </div>

                                              <div className="space-y-2">
                                                {batches.map((b: any, i: number) => {
                                                  const expiryMeta = getExpiryMeta(b?.expiryDate);
                                                  const idBg = expiryMeta.isExpired
                                                    ? 'bg-red-50 text-red-700'
                                                    : expiryMeta.label === 'Expiring Soon'
                                                      ? 'bg-amber-50 text-amber-700'
                                                      : 'bg-orange-50 text-orange-700';

                                                  return (
                                                    <div
                                                      key={`${locationName}-${b?.batchNumber ?? i}-${i}`}
                                                      className="bg-gray-50/40 border border-gray-100 rounded-lg px-3 py-2 flex items-start justify-between gap-3"
                                                    >
                                                      <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                          <span
                                                            title={b?.batchNumber}
                                                            className={`text-xs font-mono font-semibold px-2 py-1 rounded-md whitespace-nowrap ${idBg}`}
                                                          >
                                                            #{String(b?.batchNumber ?? '—')}
                                                          </span>
                                                          <span className="text-xs font-semibold text-gray-800 whitespace-nowrap">
                                                            Qty: {b?.quantity ?? 0}
                                                          </span>
                                                        </div>
                                                        <div className="mt-1 flex flex-wrap items-center gap-2">
                                                          <span className="text-xs text-gray-500 truncate">
                                                            MFG: {formatBatchDate(b?.manufacturingDate)}
                                                          </span>
                                                          <span
                                                            className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${expiryMeta.bg} ${expiryMeta.text}`}
                                                            title={`Expiry: ${formatBatchDate(b?.expiryDate)}`}
                                                          >
                                                            EXP: {formatBatchDate(b?.expiryDate)} ({expiryMeta.label})
                                                          </span>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Mobile Cards ── */}
      <div className="lg:hidden divide-y divide-gray-100">
        {products.map((product, index) => {
          const categoryId = (product.category as any)?._id || product.category;
          const categoryName = categories.find(cat => cat._id === categoryId)?.name || 'Unknown';
          const isExpanded = expandedRows.has(product._id);
          const status = getBatchStatus(product);
          const totalStock = locations.reduce((sum, loc) => sum + (getLocationStock(product, loc.name) ?? 0), 0);

          return (
            <div key={product._id || `mobile-product-${index}`}>
              <div className="p-4 space-y-3">
                <div className="flex gap-3">
                  {product.images && product.images.length > 0 ? (
                    <img src={product.images[0]} alt={product.name} className="w-14 h-14 object-cover rounded-xl shadow-sm shrink-0" />
                  ) : (
                    <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center border shrink-0">
                      <ImageIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <button type="button" onClick={() => navigate(`/admin/inventory/${product._id}/analytics`, { state: { product, locations } })} className="font-semibold text-sm text-gray-900 hover:text-orange-600 text-left block truncate w-full">
                      {product.name}
                    </button>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className="text-[10px] bg-gray-100 text-gray-600 font-medium px-2 py-0.5 rounded-full">{categoryName}</span>
                      {product.isGITagged && <span className="text-[10px] bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded-full">🏷️ GI</span>}
                      {product.isNewArrival && <span className="text-[10px] bg-orange-100 text-orange-700 font-semibold px-1.5 py-0.5 rounded-full">✨ New</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${status.bg} ${status.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
                      {status.label}
                    </span>
                    <span className={`text-sm font-bold ${totalStock === 0 ? 'text-red-500' : 'text-gray-900'}`}>{totalStock} units</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={product.isMostSaled ?? false} onCheckedChange={(checked) => onToggleMostSaled(product._id, checked)} aria-label="Toggle Most Sold" />
                    <Button size="sm" variant="ghost" onClick={() => onEditProduct(product)} className="h-8 w-8 p-0 hover:bg-orange-100 text-gray-500">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleRowExpanded(product._id)} className="h-8 w-8 p-0 text-gray-400">
                      <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </Button>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t bg-gray-50/70 p-4 space-y-3">
                  {(() => {
                    const productVariantEntries = (product.variants && product.variants.length > 0)
                      ? product.variants.map((v, idx) => ({ label: v.value || `Variant ${idx + 1}`, variantIndex: idx }))
                      : [{ label: 'Default', variantIndex: 0 }];

                    return (
                      <div className="space-y-3">
                        {productVariantEntries.map(({ label: variantValue, variantIndex }) => {
                          const variantKey = `${product._id}::${variantIndex}`;
                          const isVariantExpanded = expandedVariantRows.has(variantKey);
                          const batchItems = getBatchesForVariant(product, variantIndex);
                          const batchCount = batchItems.length;

                          const groupedByLocation = batchItems.reduce((acc, item) => {
                            const loc = item.location || 'Unknown location';
                            if (!acc[loc]) acc[loc] = [];
                            acc[loc].push(item.batch);
                            return acc;
                          }, {} as Record<string, any[]>);

                          return (
                            <div key={variantKey} className="rounded-xl border border-gray-100 bg-white overflow-hidden">
                              <button
                                type="button"
                                onClick={() => toggleVariantExpanded(product._id, variantIndex)}
                                className="w-full flex items-center justify-between gap-3 px-3 py-2 hover:bg-gray-50 transition-colors"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-sm font-semibold text-gray-900 truncate">{variantValue}</span>
                                    <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full whitespace-nowrap">
                                      {batchCount} batch{batchCount === 1 ? '' : 'es'}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {batchCount === 0 ? 'No batch data' : isVariantExpanded ? 'Hide batches' : 'Show batches'}
                                  </div>
                                </div>
                                <ChevronDown className={`h-4 w-4 transition-transform ${isVariantExpanded ? 'rotate-180' : ''}`} />
                              </button>

                              {isVariantExpanded && (
                                <div className="px-3 py-3 border-t border-gray-100 space-y-3">
                                  {batchCount === 0 ? (
                                    <div className="text-sm text-gray-500">No batches found.</div>
                                  ) : (
                                    Object.entries(groupedByLocation).map(([locationName, batches]) => (
                                      <div key={locationName} className="space-y-2">
                                        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                          {locationName}
                                        </div>
                                        <div className="space-y-2">
                                          {batches.map((b: any, i: number) => {
                                            const expiryMeta = getExpiryMeta(b?.expiryDate);
                                            const idBg = expiryMeta.isExpired
                                              ? 'bg-red-50 text-red-700'
                                              : expiryMeta.label === 'Expiring Soon'
                                                ? 'bg-amber-50 text-amber-700'
                                                : 'bg-orange-50 text-orange-700';

                                            return (
                                              <div
                                                key={`${locationName}-${b?.batchNumber ?? i}-${i}`}
                                                className="bg-gray-50/40 border border-gray-100 rounded-lg px-3 py-2"
                                              >
                                                <div className="flex flex-wrap items-center gap-2">
                                                  <span title={b?.batchNumber} className={`text-xs font-mono font-semibold px-2 py-1 rounded-md whitespace-nowrap ${idBg}`}>
                                                    #{String(b?.batchNumber ?? '—')}
                                                  </span>
                                                  <span className="text-xs font-semibold text-gray-800 whitespace-nowrap">
                                                    Qty: {b?.quantity ?? 0}
                                                  </span>
                                                </div>
                                                <div className="mt-1 space-y-1">
                                                  <div className="text-xs text-gray-500">
                                                    MFG: {formatBatchDate(b?.manufacturingDate)}
                                                  </div>
                                                  <div className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-2 ${expiryMeta.bg} ${expiryMeta.text}`}>
                                                    EXP: {formatBatchDate(b?.expiryDate)} ({expiryMeta.label})
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}