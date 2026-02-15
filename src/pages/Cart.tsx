import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCart } from '@/contexts/CartContext';
import { Product } from '@/types';
import { SEO } from '@/components/seo/SEO';
import { toast } from 'sonner';
import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const Cart = () => {
  const { state, updateQuantity, removeFromCart, updateCartItemVariant, cartLoading } = useCart();
  const { user } = useAuth(); // Get user from AuthContext
  const navigate = useNavigate(); // Initialize useNavigate

  const handleCheckoutClick = () => {
    if (!user) {
      // If user is not logged in, redirect to login page with a "from" state
      navigate('/auth', { state: { from: '/cart' } });
    } else {
      // If user is logged in, proceed to checkout
      navigate('/checkout');
    }
  };

  const getVariantStock = (product: Product, variantIndex?: number) => {
    if (!product.inventory || product.inventory.length === 0) return 0;

    if (product.variants && product.variants.length > 0 && variantIndex !== undefined) {
      return product.inventory.reduce((total, location) => {
        const stockItem = location.stock.find(s => s.variantIndex === variantIndex);
        return total + (stockItem?.quantity || 0);
      }, 0);
    }

    return product.inventory.reduce((total, location) => {
      return total + location.stock.reduce((locationTotal, stockItem) => {
        return locationTotal + (stockItem.quantity || 0);
      }, 0);
    }, 0);
  };

  const getPricingInfo = (product: Product, variantIndex?: number) => {
    if (product.variants && product.variants.length > 0 && variantIndex !== undefined) {
      const variant = product.variants[variantIndex];
      if (variant) {
        return {
          originalPrice: variant.originalPrice,
          offerPrice: variant.offerPrice,
          effectivePrice: variant.offerPrice && variant.offerPrice < variant.originalPrice 
            ? variant.offerPrice 
            : variant.originalPrice,
          hasOffer: variant.offerPrice && variant.offerPrice < variant.originalPrice,
          variantLabel: variant.value
        };
      }
    }

    const originalPrice = product.originalPrice || 0;
    const offerPrice = product.offerPrice;
    return {
      originalPrice,
      offerPrice,
      effectivePrice: offerPrice && offerPrice < originalPrice ? offerPrice : originalPrice,
      hasOffer: offerPrice && offerPrice < originalPrice,
      variantLabel: null
    };
  };

  const handleQuantityIncrease = async (product: Product, currentQty: number, variantIndex?: number) => {
    const availableStock = getVariantStock(product, variantIndex);
    
    if (currentQty >= availableStock) {
      toast.warning('Maximum stock reached', {
        description: `Only ${availableStock} items available in stock`,
        duration: 2000,
      });
      return;
    }
    
    await updateQuantity(product._id, currentQty + 1, variantIndex);
  };

  const handleQuantityDecrease = async (productId: string, currentQty: number, variantIndex?: number) => {
    if (currentQty <= 1) return;
    await updateQuantity(productId, currentQty - 1, variantIndex);
  };

  const handleRemoveItem = async (productId: string, variantIndex?: number) => {
    await removeFromCart(productId, variantIndex ?? 0);
    toast.info('Item removed from cart', { duration: 2000 });
  };

  const handleVariantChange = async (productId: string, currentVariantIndex: number, currentQty: number, newVariantIndex: number, product: Product) => {
    const newVariantStock = getVariantStock(product, newVariantIndex);
    
    if (newVariantStock === 0) {
      toast.error('Selected variant is out of stock', {
        description: 'Please choose another variant',
        duration: 2000,
      });
      return;
    }

    try {
      const adjustedQty = currentQty > newVariantStock ? newVariantStock : currentQty;
      
      await updateCartItemVariant(productId, currentVariantIndex, newVariantIndex);
      
      if (currentQty > newVariantStock) {
        toast.warning('Quantity adjusted', {
          description: `Only ${newVariantStock} items available for this variant`,
          duration: 2000,
        });
      } else {
        toast.success('Variant updated', {
          description: 'Price updated for new variant',
          duration: 1500,
        });
      }
    } catch (error) {
      toast.error('Failed to update variant', {
        description: 'Please try again',
        duration: 2000,
      });
    }
  };

  // Calculate cart total and savings using useMemo (only for in-stock items)
  const { cartTotal, totalSavings, availableItemsCount } = useMemo(() => {
    let total = 0;
    let savings = 0;
    let availableCount = 0;

    state.items.forEach((item) => {
      const product = item.product as Product;
      if (!product) return;

      const hasVariants = product.variants && product.variants.length > 0;
      const variantIndex = item.selectedVariantIndex !== undefined ? item.selectedVariantIndex : 0;
      const availableStock = getVariantStock(product, hasVariants ? variantIndex : undefined);

      // Only include items that have stock available
      if (availableStock > 0) {
        const pricing = getPricingInfo(product, hasVariants ? variantIndex : undefined);

        const itemTotal = pricing.effectivePrice * item.qty;
        total += itemTotal;

        if (pricing.hasOffer) {
          savings += (pricing.originalPrice - pricing.effectivePrice) * item.qty;
        }

        availableCount += 1;
      }
    });

    return { cartTotal: total, totalSavings: savings, availableItemsCount: availableCount };
  }, [state.items]);

  if (state.items.length === 0) {
    return (
      <Layout>
        <SEO
          title="Shopping Cart - India's Food"
          description="Your shopping cart is empty."
          keywords="shopping cart, empty cart"
        />
        <section className="section-padding bg-cream">
          <div className="container-custom">
            <div className="max-w-md mx-auto text-center py-16">
              <div className="w-24 h-24 mx-auto rounded-full bg-muted flex items-center justify-center mb-6">
                <ShoppingBag className="h-12 w-12 text-muted-foreground" />
              </div>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-2">
                Your Cart is Empty
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mb-6">
                Looks like you haven't added any sweets yet. Explore our delicious collection!
              </p>
              <Link to="/products">
                <Button size="lg" variant="hero" className="gap-2">
                  Browse 
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO
        title="Shopping Cart - India's Food"
        description={`Your cart has ${availableItemsCount} items. Total: ₹${cartTotal}.`}
        keywords="shopping cart, checkout"
      />
      <section className="section-padding bg-cream pt-6 sm:pt-8 lg:pt-10">
        <div className="container-custom px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 sm:mb-6 lg:mb-8">
            Your Cart ({availableItemsCount} {availableItemsCount === 1 ? 'item' : 'items'})
          </h1>

          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 ">
            <div className="lg:col-span-2 space-y-4">
              {state.items.map((item) => {
                const product = item.product as Product;
                if (!product) return null;

                const hasVariants = product.variants && product.variants.length > 0;
                const variantIndex = item.selectedVariantIndex !== undefined ? item.selectedVariantIndex : 0;
                const pricing = getPricingInfo(product, hasVariants ? variantIndex : undefined);
                const availableStock = getVariantStock(product, hasVariants ? variantIndex : undefined);
                const itemTotal = pricing.effectivePrice * item.qty;
                const savings = pricing.hasOffer ? (pricing.originalPrice - pricing.effectivePrice) * item.qty : 0;
                const itemKey = `${product._id}-${variantIndex}`;

                return (
                  <div
                    key={itemKey}
                    className="flex flex-col sm:flex-row gap-4 p-4 sm:p-5 bg-cream rounded-xl shadow-card border"
                  >
                    <Link
                      to={`/product/${product._id}`}
                      className="w-full sm:w-24 md:w-28 h-auto aspect-square rounded-lg overflow-hidden shrink-0"
                    >
                      <img
                        src={product.images && product.images.length > 0 ? product.images[0] : '/images/placeholder.png'}
                        alt={product.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                      />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link to={`/product/${product._id}`}>
                        <h3 className="font-display font-semibold text-base sm:text-lg text-foreground hover:text-primary transition-colors mb-2">
                          {product.name}
                        </h3>
                      </Link>

                      {hasVariants && product.variants && product.variants.length > 1 && (
                        <div className="mb-3">
                          <Select
                            value={variantIndex.toString()}
                            onValueChange={(value) => handleVariantChange(product._id, variantIndex, item.qty, parseInt(value, 10), product)}
                            disabled={cartLoading}
                          >
                            <SelectTrigger className="w-full sm:w-[200px] h-9 text-sm bg-white border border-gray-200 hover:border-gray-300 transition-colors rounded-lg">
                              <div className="flex items-center justify-between w-full gap-2">
                                <span className="text-gray-700 font-medium text-xs">
                                  {product.variants[variantIndex]?.value || 'Select'}
                                </span>
                                <span className="text-gray-900 font-semibold text-xs">
                                  ₹{pricing.effectivePrice}
                                </span>
                              </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-lg">
                              {product.variants.map((variant, index) => {
                                const varStock = getVariantStock(product, index);
                                
                                return (
                                  <SelectItem 
                                    key={index} 
                                    value={index.toString()}
                                    disabled={varStock === 0}
                                    className="cursor-pointer"
                                  >
                                    <div className="flex items-center justify-between w-full gap-3">
                                      <span className="font-medium text-gray-900 text-sm">{variant.value}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-900 font-semibold text-sm">
                                          ₹{variant.offerPrice || variant.originalPrice}
                                        </span>
                                        {varStock === 0 && (
                                          <span className="text-red-500 text-xs font-medium">(Out)</span>
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

                      {hasVariants && product.variants && product.variants.length === 1 && (
                        <div className="mb-3 text-xs bg-gray-50 px-2.5 py-1.5 rounded-md inline-block border border-gray-100">
                          <span className="font-medium text-gray-700">{product.variants[0].value}</span>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {product.isGITagged && (
                          <span className="inline-block px-2 py-1 bg-saffron-light text-primary text-xs rounded-full">
                            GI Tagged
                          </span>
                        )}
                        {product.isNewArrival && (
                          <span className="inline-block px-2 py-1 bg-pistachio text-white text-xs rounded-full">
                            New Arrival
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-primary text-lg">
                            ₹{pricing.effectivePrice}
                          </span>
                          {pricing.hasOffer && (
                            <>
                              <span className="text-sm text-muted-foreground line-through">
                                ₹{pricing.originalPrice}
                              </span>
                              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold">
                                SAVE ₹{pricing.originalPrice - pricing.effectivePrice}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.qty} × ₹{pricing.effectivePrice} = <span className="font-semibold text-foreground">₹{itemTotal}</span>
                        </div>
                      </div>

                      <div className="mb-3">
                        {availableStock > 0 ? (
                          availableStock <= 5 ? (
                            <span className="text-xs text-orange-600 font-semibold">
                              Only {availableStock} left in stock!
                            </span>
                          ) : (
                            <span className="text-xs text-green-600 font-medium">
                              In stock ({availableStock} available)
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-red-600 font-semibold">Out of stock</span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 sm:hidden">
                        <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-background"
                            onClick={() => handleQuantityDecrease(product._id, item.qty, hasVariants ? variantIndex : undefined)}
                            disabled={cartLoading || item.qty <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-semibold text-sm">
                            {item.qty}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-background"
                            onClick={() => handleQuantityIncrease(product, item.qty, hasVariants ? variantIndex : undefined)}
                            disabled={cartLoading || item.qty >= availableStock}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        <button
                          onClick={() => handleRemoveItem(product._id, hasVariants ? variantIndex : undefined)}
                          className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-destructive/10"
                          disabled={cartLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        <div className="ml-auto">
                          <div className="font-semibold text-primary text-base">
                            ₹{itemTotal}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="hidden sm:flex flex-col items-end justify-between gap-3">
                      <button
                        onClick={() => handleRemoveItem(product._id, hasVariants ? variantIndex : undefined)}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-destructive/10"
                        disabled={cartLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-background"
                          onClick={() => handleQuantityDecrease(product._id, item.qty, hasVariants ? variantIndex : undefined)}
                          disabled={cartLoading || item.qty <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-semibold text-sm">
                          {item.qty}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-background"
                          onClick={() => handleQuantityIncrease(product, item.qty, hasVariants ? variantIndex : undefined)}
                          disabled={cartLoading || item.qty >= availableStock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="text-right">
                        <div className="font-semibold text-primary text-base">
                          ₹{itemTotal}
                        </div>
                        {savings > 0 && (
                          <div className="text-xs text-green-600 font-medium mt-0.5">
                            Saved ₹{savings}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-cream rounded-xl shadow-card p-5 sm:p-6 sticky top-24">
                <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                  Order Summary
                </h2>

                <div className="space-y-3 mb-4 pb-4 border-b border-border">
                  {state.items
                    .filter((item) => {
                      const product = item.product as Product;
                      if (!product) return false;

                      const hasVariants = product.variants && product.variants.length > 0;
                      const variantIndex = item.selectedVariantIndex !== undefined ? item.selectedVariantIndex : 0;
                      const availableStock = getVariantStock(product, hasVariants ? variantIndex : undefined);

                      return availableStock > 0;
                    })
                    .map((item) => {
                      const product = item.product as Product;
                      if (!product) return null;

                      const hasVariants = product.variants && product.variants.length > 0;
                      const variantIndex = item.selectedVariantIndex !== undefined ? item.selectedVariantIndex : 0;
                      const pricing = getPricingInfo(product, hasVariants ? variantIndex : undefined);
                      const itemTotal = pricing.effectivePrice * item.qty;

                      let displayName = product.name;
                      if (hasVariants && pricing.variantLabel) {
                        displayName = `${product.name} (${pricing.variantLabel})`;
                      }

                      const itemKey = `${product._id}-${variantIndex}`;

                      return (
                        <div key={itemKey} className="flex justify-between items-start gap-2 text-sm">
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-foreground font-medium">
                              {displayName}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.qty} × ₹{pricing.effectivePrice}
                            </p>
                          </div>
                          <span className="font-semibold text-foreground whitespace-nowrap">
                            ₹{itemTotal}
                          </span>
                        </div>
                      );
                    })}
                </div>

                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold text-base">Subtotal</span>
                  <span className="font-display text-2xl font-bold text-primary">
                    ₹{cartTotal}
                  </span>
                </div>

                {totalSavings > 0 && (
                  <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-green-700 font-medium">Total Savings</span>
                      <span className="text-green-700 font-bold text-base">
                        ₹{totalSavings}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-3 mt-6">
                    <Button 
                      size="lg" 
                      variant="hero" 
                      className="w-full gap-2 hover:text-white bg-orange-600"
                      onClick={handleCheckoutClick} // Use the new handler
                      disabled={cartLoading || availableItemsCount === 0}
                    >
                      Proceed to Checkout
                      <ArrowRight className="h-5 w-5" />
                    </Button>

                  <Link to="/products" className="block">
                    <Button variant="outline" className="w-full">
                      Continue Shopping
                    </Button>
                  </Link>
                </div>

                <div className="mt-6 pt-4 border-t border-border space-y-2">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span>📦</span>
                    <span>Quality products delivered fresh</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span>✓</span>
                    <span>Secure checkout guaranteed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Cart;