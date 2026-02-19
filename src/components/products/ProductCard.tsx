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
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, updateCartItemQuantity, removeFromCart, getCartItemQuantity, toggleWishlist, isInWishlist, cartLoading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const inWishlist = isInWishlist(product._id);
  const [isAdding, setIsAdding] = useState(false);
  
  const hasVariants = product.variants && product.variants.length > 0;

  const initialVariantIndex = useMemo(() => {
    if (hasVariants && product.variants && product.inventory && product.inventory.length > 0) {
      for (let i = 0; i < product.variants.length; i++) {
        const variantStock = product.inventory.reduce((total, location) => {
          const stockItem = location.stock.find(s => s.variantIndex === i);
          return total + (stockItem?.quantity || 0);
        }, 0);
        if (variantStock > 0) {
          return i;
        }
      }
    }
    return 0;
  }, [hasVariants, product.variants, product.inventory]);

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(initialVariantIndex);

  // Get cart quantity - this will reactively update when cart changes
  const cartQuantity = getCartItemQuantity(
    product._id,
    hasVariants ? selectedVariantIndex : 0
  );

  const { totalStock, selectedVariantStock } = useMemo(() => {
    if (!product.inventory || product.inventory.length === 0) {
      return { totalStock: 0, selectedVariantStock: 0 };
    }

    if (hasVariants) {
      const variantStock = product.inventory.reduce((total, location) => {
        const stockItem = location.stock.find(s => s.variantIndex === selectedVariantIndex);
        return total + (stockItem?.quantity || 0);
      }, 0);
      
      const allStock = product.inventory.reduce((total, location) => {
        return total + location.stock.reduce((locTotal, stockItem) => locTotal + (stockItem.quantity || 0), 0);
      }, 0);
      
      return { totalStock: allStock, selectedVariantStock: variantStock };
    } else {
      const stock = product.inventory.reduce((total, location) => {
        return total + location.stock.reduce((locTotal, stockItem) => locTotal + (stockItem.quantity || 0), 0);
      }, 0);
      return { totalStock: stock, selectedVariantStock: stock };
    }
  }, [product.inventory, hasVariants, selectedVariantIndex]);

  const selectedVariant = hasVariants ? product.variants![selectedVariantIndex] : null;
  
  const currentPrice = useMemo(() => {
    if (hasVariants && selectedVariant) {
      return {
        originalPrice: selectedVariant.originalPrice,
        offerPrice: selectedVariant.offerPrice,
        hasOffer: selectedVariant.offerPrice && selectedVariant.offerPrice < selectedVariant.originalPrice,
        savings: selectedVariant.offerPrice 
          ? selectedVariant.originalPrice - selectedVariant.offerPrice 
          : 0,
        displayPrice: selectedVariant.offerPrice || selectedVariant.originalPrice
      };
    } else {
      return {
        originalPrice: product.originalPrice || 0,
        offerPrice: product.offerPrice,
        hasOffer: product.offerPrice && product.offerPrice < (product.originalPrice || 0),
        savings: product.offerPrice 
          ? (product.originalPrice || 0) - product.offerPrice 
          : 0,
        displayPrice: product.offerPrice || product.originalPrice || 0
      };
    }
  }, [hasVariants, selectedVariant, product.originalPrice, product.offerPrice]);

  const handleAddToCart = async () => {
    // Check if user is logged in
    if (!user) {
      toast.error('Please login to add items to cart', {
        description: 'You need to be logged in to add products to your cart',
        duration: 3000,
      });
      return;
    }

    setIsAdding(true);
    try {
      const variantIdx = hasVariants ? selectedVariantIndex : 0;
      await addToCart(product._id, 1, variantIdx);

      const variantInfo = hasVariants && selectedVariant ? ` (${selectedVariant.value})` : '';
      
      // Custom toast with View Cart action
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
        {
          duration: 4000,
          position: 'bottom-center',
        }
      );
    } catch (error) {
      toast.error('Failed to add to cart', {
        description: 'Please try again',
        duration: 2000,
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleIncreaseQuantity = async () => {
    // Check if user is logged in
    if (!user) {
      toast.error('Please login to modify cart items', {
        description: 'You need to be logged in to modify items in your cart',
        duration: 3000,
      });
      return;
    }

    const maxStock = hasVariants ? selectedVariantStock : totalStock;

    if (cartQuantity < maxStock) {
      await updateCartItemQuantity(
        product._id,
        cartQuantity + 1,
        hasVariants ? selectedVariantIndex : 0
      );
    } else {
      toast.warning('Maximum stock reached', {
        description: `Only ${maxStock} items available`,
        duration: 2000,
      });
    }
  };

  const handleDecreaseQuantity = async () => {
    // Check if user is logged in
    if (!user) {
      toast.error('Please login to modify cart items', {
        description: 'You need to be logged in to modify items in your cart',
        duration: 3000,
      });
      return;
    }

    const variantIdx = hasVariants ? selectedVariantIndex : 0;

    if (cartQuantity > 1) {
      await updateCartItemQuantity(
        product._id,
        cartQuantity - 1,
        variantIdx
      );
    } else {
      await removeFromCart(product._id, variantIdx);
      toast.info(`"${product.name}" removed from cart`, {
        duration: 2000,
      });
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

      <div className="block relative aspect-square overflow-hidden flex-shrink-0">
        {isEntirelyOutOfStock ? (
          <img
            src={product.images && product.images.length > 0 ? product.images[0] : '/assets/placeholder.svg'}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Link to={`/product/${product._id}`}>
            <img
              src={product.images && product.images.length > 0 ? product.images[0] : '/assets/placeholder.svg'}
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

        {hasVariants && !isEntirelyOutOfStock && (
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

        {/* <p className="text-muted-foreground text-[11px] leading-snug mb-2 line-clamp-2">
          {product.description}
        </p> */}

        {hasVariants && product.variants && product.variants.length > 1 && !isEntirelyOutOfStock && (
          <div className="mb-2">
            <Select
              value={selectedVariantIndex.toString()}
              onValueChange={handleVariantChange}
            >
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
                  const variantStock = product.inventory?.reduce((total, location) => {
                    const stockItem = location.stock.find(s => s.variantIndex === index);
                    return total + (stockItem?.quantity || 0);
                  }, 0) || 0;
                  
                  return (
                    <SelectItem 
  key={index} 
  value={index.toString()}
  disabled={variantStock === 0}
  className="cursor-pointer"
>
  <div className="
    flex items-center justify-between w-full
    gap-2
    text-[11px] sm:text-sm
  ">
    <span className="font-medium text-gray-900 truncate">
      {variant.value}
    </span>

    <div className="flex items-center gap-1.5">
      <span className="text-gray-900 font-semibold">
        ₹{variant.offerPrice || variant.originalPrice}
      </span>

      {variantStock === 0 && (
        <span className="text-red-500 text-[10px] font-medium">
          (Out)
        </span>
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

        {/* Spacer to push price and buttons to bottom */}
        <div className="flex-1"></div>

        {/* Stock Warning - Fixed height to maintain consistency across all cards */}
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

        {/* Price - Fixed position above buttons */}
        <div className="text-sm font-semibold mb-2 flex flex-wrap items-center gap-1.5">
          {currentPrice.hasOffer ? (
            <>
              <span className="text-green-600 font-bold text-[15px]">₹{currentPrice.offerPrice}</span>
              <span className="text-gray-400 line-through text-[11px] font-normal">₹{currentPrice.originalPrice}</span>
              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold">
                SAVE ₹{currentPrice.savings}
              </span>
            </>
          ) : (
            <span className="text-gray-900 font-bold text-[15px]">₹{currentPrice.originalPrice}</span>
          )}
        </div>

{/* 
        {product.shelfLife && (
          <div className="text-[10px] text-gray-500 mb-2">{product.shelfLife} {product.shelfLife === 1 ? 'day' : 'days'}</div>
        )} */}

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

                  <span className="text-sm font-bold min-w-[2.5rem] text-center">
                    {cartQuantity}
                  </span>

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
                  {isAdding ? "Adding..." : "Add to Cart"}
                </Button>
              )}
            </>
          )}
          
          {isOutOfStock && (
            <Button
              size="sm"
              variant="secondary"
              disabled
              className="w-full gap-1 h-8 text-[11px] font-semibold rounded-lg"
            >
              {hasVariants ? "Select Another Size" : "Out of Stock"}
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