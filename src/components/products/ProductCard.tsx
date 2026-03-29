import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';
import { Product } from '@/types';
import { Heart, Loader2, Minus, Plus, ShoppingCart } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  /** When true (e.g. Deal of the Day page), show deal pricing only if product is in deal period. */
  isDealView?: boolean;
}

export function ProductCard({ product, isDealView = false }: ProductCardProps) {
  const { addToCart, updateCartItemQuantity, removeFromCart, getCartItemQuantity, toggleWishlist, isInWishlist, cartLoading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const inWishlist = isInWishlist(product._id);
  const [isAdding, setIsAdding] = useState(false);

  const showDeal = isDealView && !!product.isInDealPeriod;

  const hasVariants = product.variants && product.variants.length > 0;

  /** Maps list position → inventory `variantIndex` (Deal of the Day may return a subset of variants). */
  const resolveVariantIndex = (arrayIndex: number) =>
    hasVariants && product.variants?.[arrayIndex]
      ? product.variants[arrayIndex].variantIndex ?? arrayIndex
      : arrayIndex;

  const getVariantQty = (loc: typeof product.inventory[0], vi: number) =>
    loc.batches?.length
      ? loc.batches
          .filter(b => {
            if (b.variantIndex !== vi) return false;
            if (!b.expiryDate) return true;
            return new Date(b.expiryDate as any).getTime() >= Date.now();
          })
          .reduce((s, b) => s + (b.quantity || 0), 0)
      : (loc.stock?.find(s => s.variantIndex === vi)?.quantity || 0);

  const initialVariantIndex = useMemo(() => {
    if (hasVariants && product.variants && product.inventory?.length > 0) {
      for (let i = 0; i < product.variants.length; i++) {
        const vi = product.variants[i].variantIndex ?? i;
        const stock = product.inventory.reduce((t, loc) => t + getVariantQty(loc, vi), 0);
        if (stock > 0) return i;
      }
    }
    return 0;
  }, [hasVariants, product.variants, product.inventory]);

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(initialVariantIndex);

  const cartQuantity = getCartItemQuantity(
    product._id,
    hasVariants ? resolveVariantIndex(selectedVariantIndex) : 0,
    showDeal
  );

  const { totalStock, selectedVariantStock } = useMemo(() => {
    if (!product.inventory || product.inventory.length === 0) {
      return { totalStock: 0, selectedVariantStock: 0 };
    }

    const totalFromLoc = (loc: typeof product.inventory[0]) =>
      loc.batches?.length
        ? loc.batches
            .filter(b => {
              if (!b.expiryDate) return true;
              return new Date(b.expiryDate as any).getTime() >= Date.now();
            })
            .reduce((s, b) => s + (b.quantity || 0), 0)
        : (loc.stock?.reduce((s, st) => s + (st.quantity || 0), 0) || 0);

    if (hasVariants) {
      const variantStock = product.inventory.reduce(
        (t, loc) => t + getVariantQty(loc, resolveVariantIndex(selectedVariantIndex)),
        0
      );
      const allStock = product.inventory.reduce((t, loc) => t + totalFromLoc(loc), 0);
      return { totalStock: allStock, selectedVariantStock: variantStock };
    }

    const stock = product.inventory.reduce((t, loc) => t + totalFromLoc(loc), 0);
    return { totalStock: stock, selectedVariantStock: stock };
  }, [product.inventory, product.variants, hasVariants, selectedVariantIndex]);

  const selectedVariant = hasVariants ? product.variants![selectedVariantIndex] : null;

  /**
   * Gets the best deal discount % for a specific variant index
   * by scanning batch-level dealDiscountPercent for that variant's non-expired batches.
   * Falls back to product-level dealDiscountPercent if no batch-level value found.
   */
  const getVariantDealDiscount = (variantIndex: number): number | null => {
    if (!showDeal) return null;

    const now = Date.now();
    let bestDiscount: number | null = null;

    if (product.inventory?.length) {
      for (const loc of product.inventory) {
        if (!loc.batches?.length) continue;
        for (const batch of loc.batches) {
          if (batch.variantIndex !== variantIndex) continue;
          if (batch.expiryDate && new Date(batch.expiryDate as any).getTime() < now) continue;
          if (batch.dealDiscountPercent != null) {
            if (bestDiscount === null || batch.dealDiscountPercent > bestDiscount) {
              bestDiscount = batch.dealDiscountPercent;
            }
          }
        }
      }
    }

    // Fall back to product-level discount
    if (bestDiscount === null && product.dealDiscountPercent != null) {
      bestDiscount = product.dealDiscountPercent;
    }

    return bestDiscount;
  };

  const currentPrice = useMemo(() => {
    const baseOriginal = hasVariants && selectedVariant
      ? selectedVariant.originalPrice
      : (product.originalPrice || 0);

    const baseOffer = hasVariants && selectedVariant
      ? selectedVariant.offerPrice
      : product.offerPrice;

    const baseDisplay = baseOriginal;

    // Get deal discount specific to the selected variant's batches
    const resolvedVi = hasVariants ? resolveVariantIndex(selectedVariantIndex) : 0;
    const serverDealPct = hasVariants && selectedVariant?.dealDiscountPercent;
    const variantDealDiscount =
      serverDealPct != null ? serverDealPct : getVariantDealDiscount(resolvedVi);

    if (showDeal && variantDealDiscount != null) {
      const dealPrice =
        hasVariants && selectedVariant?.dealPrice != null
          ? selectedVariant.dealPrice
          : Math.round(baseDisplay * (1 - variantDealDiscount / 100) * 100) / 100;
      return {
        originalPrice: baseOriginal,
        offerPrice: dealPrice,
        hasOffer: true,
        savings: Math.round((baseDisplay - dealPrice) * 100) / 100,
        displayPrice: dealPrice,
        dealDiscountPercent: variantDealDiscount,
      };
    }

    if (hasVariants && selectedVariant) {
      return {
        originalPrice: selectedVariant.originalPrice,
        offerPrice: selectedVariant.offerPrice,
        hasOffer: !!(selectedVariant.offerPrice && selectedVariant.offerPrice < selectedVariant.originalPrice),
        savings: selectedVariant.offerPrice ? selectedVariant.originalPrice - selectedVariant.offerPrice : 0,
        displayPrice: selectedVariant.offerPrice || selectedVariant.originalPrice,
        dealDiscountPercent: null,
      };
    }

    return {
      originalPrice: product.originalPrice || 0,
      offerPrice: product.offerPrice,
      hasOffer: !!(product.offerPrice && product.offerPrice < (product.originalPrice || 0)),
      savings: product.offerPrice ? (product.originalPrice || 0) - product.offerPrice : 0,
      displayPrice: product.offerPrice || product.originalPrice || 0,
      dealDiscountPercent: null,
    };
  }, [
    hasVariants,
    selectedVariant,
    selectedVariantIndex,
    product.originalPrice,
    product.offerPrice,
    showDeal,
    product.dealDiscountPercent,
    product.inventory,
    product.variants,
  ]);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please login to add items to cart', {
        description: 'You need to be logged in to add products to your cart',
        duration: 3000,
      });
      return;
    }

    setIsAdding(true);
    try {
      const variantIdx = hasVariants ? resolveVariantIndex(selectedVariantIndex) : 0;
      await addToCart(product._id, 1, variantIdx, {
        price: currentPrice.displayPrice,
        originalPrice: currentPrice.originalPrice,
        isDealApplied: showDeal && currentPrice.dealDiscountPercent != null,
        dealDiscountPercent: currentPrice.dealDiscountPercent,
        isDealItem: showDeal,
      });

      const variantInfo = hasVariants && selectedVariant ? ` (${selectedVariant.value})` : '';

      toast.success(
        <div className="flex items-center justify-between w-full gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-white">Added to cart!</div>
            <div className="text-xs text-white/90 mt-0.5 truncate">
              "{product.name}{variantInfo}"
            </div>
          </div>
          <button
            onClick={() => {
              navigate('/cart');
              toast.dismiss();
            }}
            className="text-sm font-semibold text-white underline hover:text-white/90 transition-colors whitespace-nowrap flex-shrink-0"
          >
            View Cart
          </button>
        </div>,
        { duration: 4000, position: 'bottom-center' }
      );
    } catch (error) {
      toast.error('Failed to add to cart', { description: 'Please try again', duration: 2000 });
    } finally {
      setIsAdding(false);
    }
  };

  const handleIncreaseQuantity = async () => {
    if (!user) {
      toast.error('Please login to modify cart items', { duration: 3000 });
      return;
    }
    const maxStock = hasVariants ? selectedVariantStock : totalStock;
    if (cartQuantity < maxStock) {
      await updateCartItemQuantity(
        product._id,
        cartQuantity + 1,
        hasVariants ? resolveVariantIndex(selectedVariantIndex) : 0,
        showDeal
      );
    } else {
      toast.warning('Maximum stock reached', { description: `Only ${maxStock} items available`, duration: 2000 });
    }
  };

  const handleDecreaseQuantity = async () => {
    if (!user) {
      toast.error('Please login to modify cart items', { duration: 3000 });
      return;
    }
    const variantIdx = hasVariants ? resolveVariantIndex(selectedVariantIndex) : 0;
    if (cartQuantity > 1) {
      await updateCartItemQuantity(product._id, cartQuantity - 1, variantIdx, showDeal);
    } else {
      await removeFromCart(product._id, variantIdx, showDeal);
      toast.info(`"${product.name}" removed from cart`, { duration: 2000 });
    }
  };

  const handleVariantChange = (value: string) => {
    setSelectedVariantIndex(parseInt(value, 10));
  };

  const isOutOfStock = hasVariants ? selectedVariantStock === 0 : totalStock === 0;
  const isEntirelyOutOfStock = totalStock === 0;

  return (
    <div className={cn(
      "group relative bg-card rounded-2xl overflow-hidden shadow-card w-full h-full flex flex-col",
      isEntirelyOutOfStock ? "opacity-70 pointer-events-none cursor-not-allowed" : "card-hover"
    )}>
      {isEntirelyOutOfStock && (
        <div className="absolute inset-0 bg-red-500/10 z-10 flex items-center justify-center">
          <div className="bg-red-500 text-white px-6 py-2 rounded-full text-sm font-semibold transform rotate-12 shadow-lg">
            Out of Stock
          </div>
        </div>
      )}

      {/* Image container */}
      <div className="relative w-full aspect-square overflow-hidden bg-gray-100">
        {isEntirelyOutOfStock ? (
          <img
            src={product.images?.length > 0 ? product.images[0] : '/assets/placeholder.svg'}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Link to={`/product/${product._id}`}>
            <img
              src={product.images?.length > 0 ? product.images[0] : '/assets/placeholder.svg'}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </Link>
        )}

        {!isEntirelyOutOfStock && (
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleWishlist(product._id);
            }}
            className={cn(
              "absolute top-3 right-3 p-2 rounded-full transition-all duration-300",
              inWishlist
                ? "bg-secondary text-secondary-foreground"
                : "bg-background/80 text-foreground hover:bg-background"
            )}
            disabled={cartLoading}
          >
            <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} />
          </button>
        )}

        {/* Deal badge — reflects the selected variant's discount, not a fixed product-level value */}
        {showDeal && currentPrice.dealDiscountPercent != null && (
          <div className="absolute top-3 left-3">
            <span className="bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">
              {currentPrice.dealDiscountPercent}% OFF
            </span>
          </div>
        )}

        {/* Variants badge — only when no active deal */}
        {hasVariants && !isEntirelyOutOfStock && !showDeal && (
          <div className="absolute top-3 left-3 bg-orange-600 text-white px-2 py-1 rounded-full text-xs font-medium">
            {product.variants!.length} Options
          </div>
        )}
      </div>

      <div className="p-3 flex-1 flex flex-col">
        <Link to={`/product/${product._id}`}>
          <h3 className="product-name font-display text-[13px] leading-tight font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors line-clamp-2 min-h-[2.2rem] flex items-center">
            {product.name}
          </h3>
        </Link>

        {/* Variant selector — each option shows its own deal-adjusted price */}
        {hasVariants && product.variants && product.variants.length > 1 && !isEntirelyOutOfStock && (
          <div className="mb-2">
            <Select value={selectedVariantIndex.toString()} onValueChange={handleVariantChange}>
              <SelectTrigger className="h-8 text-[11px] w-full bg-white border border-gray-200 hover:border-gray-300 transition-colors rounded-lg shadow-sm">
                <div className="flex items-center justify-between w-full">
                  <span className="text-gray-600 font-medium">
                    {selectedVariant?.value || 'Select'}
                  </span>
                  <span className="text-gray-900 font-semibold">
                    ₹{currentPrice.displayPrice}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                {product.variants.map((variant, index) => {
                  const vi = variant.variantIndex ?? index;
                  const now = Date.now();
                  const variantStock = product.inventory?.reduce((total, location) => {
                    const qty = location.batches?.length
                      ? location.batches
                          .filter((b: any) =>
                            b.variantIndex === vi &&
                            (!b.expiryDate || new Date(b.expiryDate).getTime() >= now)
                          )
                          .reduce((s: number, b: any) => s + (b.quantity || 0), 0)
                      : (location.stock?.find((s: any) => s.variantIndex === vi)?.quantity || 0);
                    return total + qty;
                  }, 0) || 0;

                  const variantDiscount =
                    variant.dealDiscountPercent ?? getVariantDealDiscount(vi);
                  const variantBase = variant.originalPrice;
                  const variantDisplayPrice =
                    showDeal && variantDiscount != null
                      ? variant.dealPrice ??
                        Math.round(variantBase * (1 - variantDiscount / 100) * 100) / 100
                      : variantBase;

                  return (
                    <SelectItem
                      key={index}
                      value={index.toString()}
                      disabled={variantStock === 0}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full gap-2 text-[11px] sm:text-sm">
                        <span className="font-medium text-gray-900 truncate">{variant.value}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-900 font-semibold">₹{variantDisplayPrice}</span>
                          {showDeal && variantDiscount != null && (
                            <span className="text-red-500 text-[10px] font-bold">{variantDiscount}% OFF</span>
                          )}
                          {variantStock === 0 && (
                            <span className="text-red-500 text-[10px] font-medium">(Out)</span>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}

        {hasVariants && product.variants && product.variants.length === 1 && !isEntirelyOutOfStock && (
          <div className="mb-2 text-[11px] bg-gray-50 px-2 py-1 rounded-md inline-block border border-gray-100">
            <span className="font-medium text-gray-700">{product.variants[0].value}</span>
          </div>
        )}

        <div className="flex-1" />

        {/* Stock Warning */}
        <div className="mb-1.5 min-h-[14px]">
          {hasVariants && !isEntirelyOutOfStock && (
            <>
              {selectedVariantStock === 0 ? (
                <span className="text-[10px] text-red-600 font-semibold">Out of stock for this size</span>
              ) : selectedVariantStock <= 5 ? (
                <span className="text-[10px] text-orange-600 font-semibold">Only {selectedVariantStock} left!</span>
              ) : null}
            </>
          )}
        </div>

        {/* Price */}
        <div className="text-sm font-semibold mb-2 flex flex-wrap items-center gap-1.5">
          {currentPrice.hasOffer ? (
            <>
              <span className="text-green-600 font-bold text-[15px]">₹{currentPrice.displayPrice}</span>
              <span className="text-gray-400 line-through text-[11px] font-normal">₹{currentPrice.originalPrice}</span>
              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold">
                SAVE ₹{currentPrice.savings}
              </span>
            </>
          ) : (
            <span className="text-gray-900 font-bold text-[15px]">₹{currentPrice.originalPrice}</span>
          )}
        </div>

        <div className="space-y-1.5">
          {!isOutOfStock && (
            <>
              {cartQuantity > 0 ? (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDecreaseQuantity}
                    disabled={cartLoading}
                    className="h-8 w-8 p-0 rounded-lg border-gray-300"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-sm font-bold min-w-[2.5rem] text-center">{cartQuantity}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleIncreaseQuantity}
                    disabled={cartQuantity >= (hasVariants ? selectedVariantStock : totalStock) || cartLoading}
                    className="h-8 w-8 p-0 rounded-lg border-gray-300"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="cart"
                  disabled={isAdding}
                  onClick={handleAddToCart}
                  className="w-full gap-1.5 h-8 text-[11px] font-semibold rounded-lg hover:text-white bg-orange-600"
                >
                  {isAdding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShoppingCart className="h-3.5 w-3.5" />}
                  {isAdding ? 'Adding...' : 'Add to Cart'}
                </Button>
              )}
            </>
          )}

          {isOutOfStock && (
            <Button size="sm" variant="secondary" disabled className="w-full gap-1 h-8 text-[11px] font-semibold rounded-lg">
              {hasVariants ? 'Select Another Size' : 'Out of Stock'}
            </Button>
          )}

          <Link to={`/product/${product._id}`} className="block">
            <Button
              size="sm"
              variant="outline"
              className="w-full h-8 text-[11px] text-orange-600 hover:text-white font-semibold border-gray-300 hover:bg-orange-600 rounded-lg"
            >
              View Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}