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
    newArrivalUntil: '' as string,
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
      newArrivalUntil: '',
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
      dealDiscountPercent: draftBatch.dealDiscountPercent,
      ...(draftBatch.newArrivalUntil
        ? { newArrivalUntil: draftBatch.newArrivalUntil }
        : {})
    });
    setAddingBatchForStoreId(null);
  };

  const formatDateShort = (d: string | Date) => {
    if (!d) return '—';
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
  };

  return (
    <div className="w-full min-w-0 space-y-3 border-t pt-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <Label className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
            <Package className="h-4 w-4 text-primary shrink-0" />
            Batch inventory
          </Label>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
            Add locations, then batches (qty, dates, optional deal &amp; new-arrival window).
          </p>
        </div>

        {availableLocations.length > 0 && (
          <Select onValueChange={onAddLocation}>
            <SelectTrigger className="w-full sm:w-40 h-8 text-xs">
              <SelectValue placeholder="+ Location" />
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
        <div className="bg-muted/40 border border-dashed rounded-lg p-4 text-center">
          <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-1.5 opacity-80" />
          <p className="text-xs font-medium text-muted-foreground">
            {availableLocations.length === 0 ? 'Select a store above, then add a location.' : 'Add a location to start batches.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
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
                className="w-full min-w-0 rounded-lg border border-gray-200/90 bg-gray-50/80 p-2.5 sm:p-3 shadow-sm"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold leading-tight truncate">{entry.displayName}</h4>
                      <p className="text-[10px] text-muted-foreground">Store</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {hasVariants && variantSummary.length > 0 ? (
                      variantSummary.map(({ variant, index, batchCount, qty }) => (
                        <Badge key={index} variant={batchCount > 0 ? 'default' : 'outline'} className="text-[10px] px-1.5 py-0 h-5 font-normal">
                          {variant.value}: {qty}u
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="secondary" className="text-[10px] h-5">
                        {totalQty} units
                      </Badge>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveLocation(entry.storeId)}
                      className="text-destructive hover:bg-destructive/10 h-7 w-7 p-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 w-full min-w-0">
                  <div className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200/80 bg-white px-2 py-1.5">
                    {hasVariants && onVariantChange ? (
                      <>
                        <Select
                          value={String(selectedVariantIndex)}
                          onValueChange={v => onVariantChange(Number(v))}
                        >
                          <SelectTrigger className="h-8 w-[min(100%,9rem)] text-xs bg-white">
                            <SelectValue placeholder="Variant" />
                          </SelectTrigger>
                          <SelectContent>
                            {variants.map((v, i) => (
                              <SelectItem key={i} value={String(i)} className="text-xs">
                                {v.value} · ₹{v.originalPrice}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          className="h-8 text-xs px-2.5"
                          onClick={() => openAddBatchForm(entry.storeId)}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" /> Batch
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => openAddBatchForm(entry.storeId)}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add batch
                      </Button>
                    )}
                  </div>

                  {addingBatchForStoreId === entry.storeId && (
                    <div className="space-y-2 rounded-md border border-blue-200/60 bg-blue-50/50 p-2.5">
                      <p className="text-[11px] font-medium text-blue-950">
                        New batch
                        {hasVariants && variants?.[effectiveVariantIndex]
                          ? ` · ${variants[effectiveVariantIndex].value}`
                          : ''}
                      </p>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                        <div className="col-span-1">
                          <Label className="text-[10px] text-muted-foreground">Qty *</Label>
                          <Input
                            type="number"
                            min="0"
                            className="h-8 text-xs"
                            value={draftBatch.quantity}
                            onChange={e => setDraftBatch(d => ({ ...d, quantity: Math.max(0, Number(e.target.value) || 0) }))}
                          />
                        </div>
                        <div className="col-span-1">
                          <Label className="text-[10px] text-muted-foreground">Whole ₹ (opt.)</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="—"
                            className="h-8 text-xs"
                            value={draftBatch.batchWholePrice ?? ''}
                            onChange={e => setDraftBatch(d => ({ ...d, batchWholePrice: e.target.value ? Number(e.target.value) : undefined }))}
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Mfg</Label>
                          <Input
                            type="date"
                            className="h-8 text-xs"
                            value={draftBatch.manufacturingDate}
                            onChange={e => setDraftBatch(d => ({ ...d, manufacturingDate: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Expiry</Label>
                          <Input
                            type="date"
                            className="h-8 text-xs"
                            value={draftBatch.expiryDate}
                            onChange={e => setDraftBatch(d => ({ ...d, expiryDate: e.target.value }))}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-[10px] text-muted-foreground">New arrival until (opt.)</Label>
                          <Input
                            type="date"
                            className="h-8 text-xs"
                            value={draftBatch.newArrivalUntil}
                            onChange={e => setDraftBatch(d => ({ ...d, newArrivalUntil: e.target.value }))}
                            title="Listed under New Arrivals through this date"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 border-t border-blue-200/40 pt-2">
                        <div>
                          <Label className="text-[10px] text-amber-900/80">Deal days (opt.)</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="—"
                            className="h-8 text-xs"
                            value={draftBatch.dealTriggerDays ?? ''}
                            onChange={e => setDraftBatch(d => ({ ...d, dealTriggerDays: e.target.value ? Number(e.target.value) : undefined }))}
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-amber-900/80">Deal % (opt.)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="—"
                            className="h-8 text-xs"
                            value={draftBatch.dealDiscountPercent ?? ''}
                            onChange={e => setDraftBatch(d => ({ ...d, dealDiscountPercent: e.target.value ? Number(e.target.value) : undefined }))}
                          />
                        </div>
                      </div>
                      <div className="flex gap-1.5 pt-0.5">
                        <Button
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => submitAddBatch(entry.storeId)}
                          disabled={draftBatch.quantity <= 0}
                        >
                          Add
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setAddingBatchForStoreId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {entry.batches.length === 0 && addingBatchForStoreId !== entry.storeId ? (
                    <p className="text-[11px] text-muted-foreground py-2 text-center rounded border border-dashed border-muted-foreground/25">
                      No batches yet — use <span className="font-medium">Add batch</span> above.
                    </p>
                  ) : entry.batches.length > 0 ? (
                    <div className="mt-1 border-t border-gray-200/80 pt-2">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5">
                        Batches
                      </p>
                      <div className="space-y-1.5">
                        {entry.batches.map((batch, idx) => {
                          const exp = typeof batch.expiryDate === 'string' ? new Date(batch.expiryDate) : batch.expiryDate;
                          const now = new Date();
                          const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                          const status =
                            daysLeft < 0
                              ? { label: 'Expired', cls: 'bg-red-100 text-red-800' }
                              : daysLeft <= 3
                                ? { label: 'Soon', cls: 'bg-amber-100 text-amber-800' }
                                : { label: 'OK', cls: 'bg-emerald-100 text-emerald-800' };
                          const variantLabel = hasVariants && variants?.[batch.variantIndex ?? 0]
                            ? variants[batch.variantIndex ?? 0].value
                            : 'Default';
                          const variantOriginal = hasVariants && variants?.[batch.variantIndex ?? 0]
                            ? variants[batch.variantIndex ?? 0].originalPrice
                            : (defaultOriginalPrice !== undefined ? defaultOriginalPrice : ((batch.purchasePrice ?? 0) > 0 ? batch.purchasePrice : defaultPurchasePrice));
                          const displaySelling = (batch.sellingPrice ?? 0) > 0 ? batch.sellingPrice : defaultSellingPrice;
                          const displayPurchase = (batch.batchWholePrice != null && batch.batchWholePrice >= 0)
                            ? batch.batchWholePrice
                            : (batch.purchasePrice ?? 0) > 0 ? batch.purchasePrice : defaultPurchasePrice;
                          return (
                            <div
                              key={batch._tempId || batch.batchNumber + idx}
                              className="rounded-md border border-gray-200/90 bg-white px-2.5 py-2 shadow-sm"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                                  <span className="text-xs font-semibold text-gray-900">{batch.batchNumber}</span>
                                  {hasVariants && (
                                    <span className="rounded bg-muted px-1.5 py-0 text-[10px] font-medium text-muted-foreground">
                                      {variantLabel}
                                    </span>
                                  )}
                                  <span className={`text-[10px] font-medium tabular-nums ${status.cls} rounded px-1.5 py-0`}>
                                    {status.label}
                                    {daysLeft >= 0 && daysLeft <= 30 && ` · ${daysLeft}d`}
                                  </span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 shrink-0 text-destructive hover:bg-destructive/10"
                                  onClick={() => onRemoveBatch(entry.storeId, batch._tempId || batch.batchNumber)}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] tabular-nums text-gray-700">
                                <span>
                                  <span className="text-muted-foreground">Qty </span>
                                  <span className="font-semibold">{batch.quantity ?? 0}</span>
                                </span>
                                <span title="Purchase / cost">Pur ₹{(displayPurchase ?? 0).toFixed(0)}</span>
                                <span title="MRP">Orig ₹{(variantOriginal ?? batch.purchasePrice ?? 0).toFixed(0)}</span>
                                <span className="font-medium text-emerald-700" title="Selling">
                                  Sell ₹{(displaySelling ?? 0).toFixed(0)}
                                </span>
                              </div>
                              <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                                Mfg {formatDateShort(batch.manufacturingDate)} · Exp {formatDateShort(batch.expiryDate)}
                                {batch.newArrivalUntil ? (
                                  <> · New {formatDateShort(batch.newArrivalUntil)}</>
                                ) : null}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-1.5 flex justify-between border-t border-gray-100 pt-1.5 text-[11px] text-muted-foreground">
                        <span>{entry.batches.length} batch{entry.batches.length !== 1 ? 'es' : ''}</span>
                        <span className="font-semibold text-foreground">Σ {totalQty} units</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}

          <div className="rounded-md border border-border/60 bg-muted/20 px-2.5 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5">Summary</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] text-muted-foreground">Locations</p>
                <p className="text-sm font-semibold tabular-nums">{inventoryData.length}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Batches</p>
                <p className="text-sm font-semibold tabular-nums">
                  {inventoryData.reduce((s, inv) => s + inv.batches.length, 0)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Units</p>
                <p className="text-sm font-semibold tabular-nums">
                  {inventoryData.reduce((s, inv) => s + inv.batches.reduce((b, a) => b + a.quantity, 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}