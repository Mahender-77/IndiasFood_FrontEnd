import { CartItem, Product } from '@/types';

/** True for deal-priced lines; supports legacy rows that only set `isDealApplied`. */
export function isCartLineDeal(item: CartItem): boolean {
  if (item.isDealItem === true) return true;
  if (item.isDealItem === false) return false;
  return item.isDealApplied === true;
}

/** Fallback when cart item has no locked snapshot (e.g. legacy cart rows). */
export const getFallbackPricing = (product: Product, selectedVariantIndex: number = 0) => {
  if (product.variants && product.variants.length > 0) {
    const variant = product.variants[selectedVariantIndex];
    if (variant) {
      const fallbackPrice =
        variant.offerPrice && variant.offerPrice < variant.originalPrice
          ? variant.offerPrice
          : variant.originalPrice;
      return {
        price: fallbackPrice,
        originalPrice: variant.originalPrice,
        isDealApplied: false,
        dealDiscountPercent: null as number | null,
      };
    }
  }
  const baseOriginal = product.originalPrice || 0;
  const fallbackPrice =
    product.offerPrice && product.offerPrice < baseOriginal
      ? product.offerPrice
      : baseOriginal;
  return {
    price: fallbackPrice,
    originalPrice: baseOriginal,
    isDealApplied: false,
    dealDiscountPercent: null as number | null,
  };
};

/** Unit price for one cart line — snapshot wins; fallback only for legacy rows. */
export function getCartLineUnitPrice(item: CartItem): number {
  if (typeof item.price === 'number' && Number.isFinite(item.price)) {
    return item.price;
  }
  const product = item.product as Product;
  if (!product) return 0;
  const fallback = getFallbackPricing(product, item.selectedVariantIndex ?? 0);
  return Number(fallback.price) || 0;
}

/** Payload fields for persisting cart line pricing on the server. */
export function getCartLinePricingPayload(item: CartItem | undefined): {
  price?: number;
  originalPrice?: number;
  isDealApplied?: boolean;
  dealDiscountPercent?: number;
  isDealItem?: boolean;
} {
  if (!item) return {};
  const out: {
    price?: number;
    originalPrice?: number;
    isDealApplied?: boolean;
    dealDiscountPercent?: number;
    isDealItem?: boolean;
  } = {};
  if (typeof item.price === 'number' && Number.isFinite(item.price)) {
    out.price = item.price;
  }
  if (typeof item.originalPrice === 'number' && Number.isFinite(item.originalPrice)) {
    out.originalPrice = item.originalPrice;
  }
  if (item.isDealApplied !== undefined) {
    out.isDealApplied = item.isDealApplied;
  }
  if (item.dealDiscountPercent != null && Number.isFinite(Number(item.dealDiscountPercent))) {
    out.dealDiscountPercent = Number(item.dealDiscountPercent);
  }
  out.isDealItem = isCartLineDeal(item);
  return out;
}

/** Backfill legacy localStorage rows missing a price snapshot. */
export function normalizeLegacyCartItems(items: CartItem[]): CartItem[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    if (item.isDealItem && typeof item.price === 'number' && Number.isFinite(item.price)) {
      return item;
    }
    if (typeof item.price === 'number' && Number.isFinite(item.price)) {
      return item;
    }
    const product = item.product as Product | null;
    if (!product || !product._id) return item;
    const fp = getFallbackPricing(product, item.selectedVariantIndex ?? 0);
    return {
      ...item,
      price: fp.price,
      originalPrice: item.originalPrice ?? fp.originalPrice,
      isDealApplied: item.isDealApplied ?? fp.isDealApplied,
      dealDiscountPercent: item.dealDiscountPercent ?? fp.dealDiscountPercent,
    };
  });
}
