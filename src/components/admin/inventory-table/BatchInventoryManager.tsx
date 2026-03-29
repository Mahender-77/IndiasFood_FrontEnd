/*
 * BatchInventoryManager - Batch-based inventory for product creation
 * Matches Edit Product batch-creation style: form-inline (blue-50) + batch table.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, X, Package } from 'lucide-react';
import { ProductBatch, ProductVariant } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StoreLocation {
  storeId: string;
  name: string;
  displayName: string;
}

export interface BatchEntry extends ProductBatch {
  _tempId?: string;
}

export interface LocationBatchEntry {
  storeId: string;
  locationName: string;
  displayName: string;
  batches: BatchEntry[];
}

interface BatchInventoryManagerProps {
  inventoryData: LocationBatchEntry[];
  locations: StoreLocation[];
  variantIndex?: number;
  /** When provided, shows per-variant Add Batch inline on each location card */
  variants?: ProductVariant[];
  selectedVariantIndex?: number;
  onVariantChange?: (index: number) => void;
  onAddLocation: (storeId: string) => void;
  onRemoveLocation: (storeId: string) => void;
  onAddBatch: (storeId: string, batch: BatchEntry) => void;
  onUpdateBatch: (storeId: string, batchTempId: string, batch: Partial<BatchEntry>) => void;
  onRemoveBatch: (storeId: string, batchTempId: string) => void;
  /** Default cost/purchase (or batch whole price fallback). With variants: variant cost; without: optional batch whole price fallback. */
  defaultPurchasePrice?: number;
  /** Default selling/offer price per unit. */
  defaultSellingPrice?: number;
  /** Product-level original/MRP - for display in Original ₹ when product has no variants. */
  defaultOriginalPrice?: number;
}

export function BatchInventoryManager({
  inventoryData,
  locations,
  variantIndex = 0,
  variants = [],
  selectedVariantIndex = 0,
  onVariantChange,
  onAddLocation,
  onRemoveLocation,
  onAddBatch,
  onUpdateBatch,
  onRemoveBatch,
  defaultPurchasePrice = 0,
  defaultSellingPrice = 0,
  defaultOriginalPrice
}: BatchInventoryManagerProps) {
  const hasVariants = variants && variants.length > 0 && !!onVariantChange;
  const availableLocations = locations.filter(
    loc => !inventoryData.some(inv => inv.storeId === loc.storeId)
  );

  const getDefaultExpiry = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  };

  const effectiveVariantIndex = hasVariants && onVariantChange ? selectedVariantIndex : variantIndex;

  /** When set, show add-batch form for this location (same style as Edit Product modal) */
  const [addingBatchForStoreId, setAddingBatchForStoreId] = useState<string | null>(null);
  const [draftBatch, setDraftBatch] = useState({
    quantity: 0,
    manufacturingDate: new Date().toISOString().slice(0, 10),
    expiryDate: getDefaultExpiry(),
    batchWholePrice: undefined as number | undefined,
    dealTriggerDays: undefined as number | undefined,
    dealDiscountPercent: undefined as number | undefined
  });

  const openAddBatchForm = (storeId: string) => {
    setAddingBatchForStoreId(storeId);
    setDraftBatch({
      quantity: 0,
      manufacturingDate: new Date().toISOString().slice(0, 10),
      expiryDate: getDefaultExpiry(),
      batchWholePrice: undefined,
      dealTriggerDays: undefined,
      dealDiscountPercent: undefined
    });
  };

  const submitAddBatch = (storeId: string) => {
    if (draftBatch.quantity <= 0) return;
    const entry = inventoryData.find(inv => inv.storeId === storeId);
    const batchCount = (entry?.batches?.length ?? 0) + 1;
    const batchNumber = `BATCH-${String(batchCount).padStart(3, '0')}`;
    const tempId = `batch-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const vIdx = effectiveVariantIndex;
    // Without variants: use batch whole price as purchase when provided, else product original; selling = product offer
    const defPurchase = hasVariants && variants?.[vIdx]
      ? variants[vIdx].originalPrice
      : (draftBatch.batchWholePrice != null && draftBatch.batchWholePrice >= 0 ? draftBatch.batchWholePrice : defaultPurchasePrice);
    const defSelling = hasVariants && variants?.[vIdx]
      ? (variants[vIdx].offerPrice ?? variants[vIdx].originalPrice)
      : defaultSellingPrice;
    onAddBatch(storeId, {
      batchNumber,
      quantity: draftBatch.quantity,
      manufacturingDate: draftBatch.manufacturingDate,
      expiryDate: draftBatch.expiryDate,
      purchasePrice: defPurchase,
      sellingPrice: defSelling,
      variantIndex: vIdx,
      _tempId: tempId,
      batchWholePrice: draftBatch.batchWholePrice,
      dealTriggerDays: draftBatch.dealTriggerDays,
      dealDiscountPercent: draftBatch.dealDiscountPercent
    });
    setAddingBatchForStoreId(null);
  };

  return (
    <div className="w-full min-w-0 space-y-4 border-t pt-6">
      {/* Header: full width */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Label className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Batch-wise Inventory Setup
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            Add locations and batches with manufacturing/expiry dates for proper inventory control
          </p>
        </div>

        {availableLocations.length > 0 && (
          <Select onValueChange={onAddLocation}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="+ Add Location" />
            </SelectTrigger>
            <SelectContent>
              {availableLocations.map(loc => (
                <SelectItem key={loc.storeId} value={loc.storeId}>
                  {loc.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {inventoryData.length === 0 ? (
        <div className="bg-muted/30 border-2 border-dashed rounded-lg p-8 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground font-medium">
            {availableLocations.length === 0 ? 'Select a store first to add locations' : 'No locations added yet'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {availableLocations.length === 0
              ? 'Choose a store in the section above, then add locations and batches'
              : 'Add at least one location and then add batches with quantity, dates, pricing, and optional Deal of the Day'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {inventoryData.map(entry => {
            const totalQty = entry.batches.reduce((sum, b) => sum + b.quantity, 0);
            const hasVariants = variants && variants.length > 0;
            const variantSummary = hasVariants
              ? variants.map((v, i) => {
                  const variantBatches = entry.batches.filter(b => (b.variantIndex ?? 0) === i);
                  const qty = variantBatches.reduce((s, b) => s + (b.quantity || 0), 0);
                  return { variant: v, index: i, batchCount: variantBatches.length, qty };
                })
              : [];

            return (
              <div
                key={entry.storeId}
                className="w-full min-w-0 border rounded-lg p-4 bg-gray-50"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex justify-center w-10 h-10 rounded-full bg-primary/10">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{entry.displayName}</h4>
                      <p className="text-xs text-muted-foreground">Location</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {hasVariants && variantSummary.length > 0 ? (
                      variantSummary.map(({ variant, index, batchCount, qty }) => (
                        <Badge key={index} variant={batchCount > 0 ? 'default' : 'outline'} className="text-xs">
                          {variant.value}: {batchCount} batch{batchCount !== 1 ? 'es' : ''} ({qty} units)
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="secondary">Total: {totalQty} units</Badge>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveLocation(entry.storeId)}
                      className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 w-full min-w-0">
                  {/* Add batch controls – clear single row */}
                  <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-100 rounded-lg border border-slate-200">
                    <span className="text-sm font-medium text-slate-700">Add new batch</span>
                    {hasVariants && onVariantChange ? (
                      <>
                        <span className="text-xs text-slate-500">for variant:</span>
                        <Select
                          value={String(selectedVariantIndex)}
                          onValueChange={v => onVariantChange(Number(v))}
                        >
                          <SelectTrigger className="w-[180px] h-9 text-sm bg-white">
                            <SelectValue placeholder="Select variant" />
                          </SelectTrigger>
                          <SelectContent>
                            {variants.map((v, i) => (
                              <SelectItem key={i} value={String(i)}>
                                {v.value} — Original ₹{v.originalPrice}
                                {v.offerPrice != null && v.offerPrice > 0 ? `, Sell ₹${v.offerPrice}` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="shrink-0 text-blue-600 hover:text-blue-700 border-blue-200 bg-white"
                          onClick={() => openAddBatchForm(entry.storeId)}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add batch
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 text-blue-600 hover:text-blue-700 border-blue-200 bg-white"
                        onClick={() => openAddBatchForm(entry.storeId)}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add batch
                      </Button>
                    )}
                  </div>

                  {/* Add-batch form – same style as Edit Product modal */}
                  {addingBatchForStoreId === entry.storeId && (
                    <div className="mt-4 pt-4 border-t space-y-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">
                        New batch for{' '}
                        {hasVariants && variants?.[effectiveVariantIndex]
                          ? variants[effectiveVariantIndex].value
                          : 'this product'}
                        {' '}(unit price taken from product/variant)
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        <div>
                          <Label className="text-xs">Qty *</Label>
                          <Input
                            type="number"
                            min="0"
                            value={draftBatch.quantity}
                            onChange={e => setDraftBatch(d => ({ ...d, quantity: Math.max(0, Number(e.target.value) || 0) }))}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Mfg Date</Label>
                          <Input
                            type="date"
                            value={draftBatch.manufacturingDate}
                            onChange={e => setDraftBatch(d => ({ ...d, manufacturingDate: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Expiry Date</Label>
                          <Input
                            type="date"
                            value={draftBatch.expiryDate}
                            onChange={e => setDraftBatch(d => ({ ...d, expiryDate: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Batch whole price (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Optional"
                            value={draftBatch.batchWholePrice ?? ''}
                            onChange={e => setDraftBatch(d => ({ ...d, batchWholePrice: e.target.value ? Number(e.target.value) : undefined }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-blue-200">
                        <Label className="text-xs font-semibold text-amber-800 col-span-full">Deal of the Day (optional)</Label>
                        <div>
                          <Label className="text-xs">Deal trigger days</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="e.g. 2"
                            value={draftBatch.dealTriggerDays ?? ''}
                            onChange={e => setDraftBatch(d => ({ ...d, dealTriggerDays: e.target.value ? Number(e.target.value) : undefined }))}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Discount %</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="e.g. 20"
                            value={draftBatch.dealDiscountPercent ?? ''}
                            onChange={e => setDraftBatch(d => ({ ...d, dealDiscountPercent: e.target.value ? Number(e.target.value) : undefined }))}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => submitAddBatch(entry.storeId)}
                          disabled={draftBatch.quantity <= 0}
                        >
                          Add Batch
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setAddingBatchForStoreId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Batch table – same style as Edit Product Batch-wise breakdown */}
                  {entry.batches.length === 0 && addingBatchForStoreId !== entry.storeId ? (
                    <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded">
                      No batches. Click &quot;Add batch&quot; to add inventory.
                    </p>
                  ) : entry.batches.length > 0 ? (
                    <div className="mt-4 pt-4 border-t">
                      <Label className="text-sm font-semibold text-gray-800 mb-3 block">
                        📋 Batch-wise Inventory Breakdown
                      </Label>
                      <div className="w-full overflow-x-auto rounded-lg border border-gray-200 bg-white">
                        <table className="w-full min-w-[800px] text-sm table-fixed">
                          <thead>
                            <tr className="bg-gray-100 border-b border-gray-200">
                              <th className="text-left py-2.5 px-3 font-semibold text-gray-700 w-[100px]">Batch #</th>
                              {hasVariants && (
                                <th className="text-left py-2.5 px-3 font-semibold text-gray-700 w-[100px]">Variant</th>
                              )}
                              <th className="text-right py-2.5 px-3 font-semibold text-gray-700 w-[60px]">Qty</th>
                              <th className="text-right py-2.5 px-3 font-semibold text-gray-700 whitespace-nowrap" title="Cost per unit (purchase)">
                                Purchase ₹
                              </th>
                              <th className="text-right py-2.5 px-3 font-semibold text-gray-700 whitespace-nowrap" title="Original/MRP per unit">
                                Original ₹
                              </th>
                              <th className="text-right py-2.5 px-3 font-semibold text-gray-700 whitespace-nowrap" title="Actual selling price per unit">
                                Selling ₹
                              </th>
                              <th className="text-left py-2.5 px-3 font-semibold text-gray-700 w-[90px]">Mfg Date</th>
                              <th className="text-left py-2.5 px-3 font-semibold text-gray-700 w-[90px]">Expiry</th>
                              <th className="text-left py-2.5 px-3 font-semibold text-gray-700 w-[100px]">Status</th>
                              <th className="text-left py-2.5 px-3 font-semibold text-gray-700 w-[44px]"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {entry.batches.map((batch, idx) => {
                              const exp = typeof batch.expiryDate === 'string' ? new Date(batch.expiryDate) : batch.expiryDate;
                              const now = new Date();
                              const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                              const status =
                                daysLeft < 0
                                  ? { label: 'Expired', cls: 'bg-red-100 text-red-800' }
                                  : daysLeft <= 3
                                    ? { label: 'Expiring Soon', cls: 'bg-amber-100 text-amber-800' }
                                    : { label: 'OK', cls: 'bg-green-100 text-green-800' };
                              const variantLabel = hasVariants && variants?.[batch.variantIndex ?? 0]
                                ? variants[batch.variantIndex ?? 0].value
                                : 'Default';
                              // Without variants: Original ₹ = product-level original (MRP) per unit; never show purchase/cost there
                              const variantOriginal = hasVariants && variants?.[batch.variantIndex ?? 0]
                                ? variants[batch.variantIndex ?? 0].originalPrice
                                : (defaultOriginalPrice !== undefined ? defaultOriginalPrice : ((batch.purchasePrice ?? 0) > 0 ? batch.purchasePrice : defaultPurchasePrice));
                              const displaySelling = (batch.sellingPrice ?? 0) > 0 ? batch.sellingPrice : defaultSellingPrice;
                              const displayPurchase = (batch.batchWholePrice != null && batch.batchWholePrice >= 0)
                                ? batch.batchWholePrice
                                : (batch.purchasePrice ?? 0) > 0 ? batch.purchasePrice : defaultPurchasePrice;
                              const formatDate = (d: string | Date) => {
                                if (!d) return '-';
                                const date = typeof d === 'string' ? new Date(d) : d;
                                return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                              };
                              return (
                                <tr
                                  key={batch._tempId || batch.batchNumber + idx}
                                  className={`border-b border-gray-100 last:border-0 ${idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}
                                >
                                  <td className="py-2.5 px-3 font-medium text-gray-900">{batch.batchNumber}</td>
                                  {hasVariants && (
                                    <td className="py-2.5 px-3 text-gray-700">{variantLabel}</td>
                                  )}
                                  <td className="py-2.5 px-3 text-right font-semibold">{batch.quantity ?? 0}</td>
                                  <td className="py-2.5 px-3 text-right text-gray-700" title="Cost / batch whole price per unit">
                                    ₹{(displayPurchase ?? 0).toFixed(2)}
                                  </td>
                                  <td className="py-2.5 px-3 text-right text-gray-600" title="Original/MRP per unit">
                                    ₹{(variantOriginal ?? batch.purchasePrice ?? 0).toFixed(2)}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-medium text-green-700" title="Actual selling price per unit">
                                    ₹{(displaySelling ?? 0).toFixed(2)}
                                  </td>
                                  <td className="py-2.5 px-3 text-gray-700">{formatDate(batch.manufacturingDate)}</td>
                                  <td className="py-2.5 px-3 text-gray-700">{formatDate(batch.expiryDate)}</td>
                                  <td className="py-2.5 px-3">
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.cls}`}>
                                      {status.label}
                                      {daysLeft >= 0 && daysLeft <= 30 && ` (${daysLeft}d)`}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                                      onClick={() => onRemoveBatch(entry.storeId, batch._tempId || batch.batchNumber)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-2 flex justify-between items-center text-sm">
                        <span className="text-gray-600">{entry.batches.length} batch{entry.batches.length !== 1 ? 'es' : ''}</span>
                        <span className="font-bold text-gray-900">Total: {totalQty} units</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}

          <div className="p-4 bg-muted/30 rounded-lg">
            <h5 className="font-semibold text-sm mb-2">Inventory Summary</h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Locations</p>
                <p className="font-bold">{inventoryData.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Batches</p>
                <p className="font-bold">
                  {inventoryData.reduce((s, inv) => s + inv.batches.length, 0)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Units</p>
                <p className="font-bold">
                  {inventoryData.reduce(
                    (s, inv) => s + inv.batches.reduce((b, a) => b + a.quantity, 0),
                    0
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}