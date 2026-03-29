import type { ProductInventory } from '@/types';

/** Get stock quantity for a variant at a location (supports batches and legacy stock) */
export function getVariantStockAtLocation(loc: ProductInventory, variantIndex: number): number {
  if (loc.batches?.length) {
    return loc.batches
      .filter(b => b.variantIndex === variantIndex)
      .reduce((s, b) => s + (b.quantity || 0), 0);
  }
  const st = loc.stock?.find(s => s.variantIndex === variantIndex);
  return st ? (st.quantity || 0) : 0;
}

/** Get total stock at a location (all variants) */
export function getTotalStockAtLocation(loc: ProductInventory): number {
  if (loc.batches?.length) {
    return loc.batches.reduce((s, b) => s + (b.quantity || 0), 0);
  }
  return loc.stock?.reduce((s, st) => s + (st.quantity || 0), 0) || 0;
}
