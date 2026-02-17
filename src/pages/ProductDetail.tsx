import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, ShoppingCart, Minus, Plus, ArrowLeft, Package, Tag, Scale, Clock, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/products/ProductCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { Product } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { SEO } from '@/components/seo/SEO';
import { toast } from 'sonner';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { 
    addToCart, 
    updateCartItemQuantity, 
    removeFromCart, 
    getCartItemQuantity, 
    toggleWishlist, 
    isInWishlist, 
    cartLoading 
  } = useCart();

  // State for selected variant
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  // Check if product has variants
  const hasVariants = product?.variants && product.variants.length > 0;

  // Get selected variant
  const selectedVariant = hasVariants ? product!.variants![selectedVariantIndex] : null;

  // Get cart quantity for current product and variant
  const cartQuantity = product ? getCartItemQuantity(
    product._id,
    hasVariants ? selectedVariantIndex : 0
  ) : 0;

  // Calculate stock based on variant or total
  const stockInfo = useMemo(() => {
    if (!product?.inventory || product.inventory.length === 0) {
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
  }, [product?.inventory, hasVariants, selectedVariantIndex]);

  const availableStock = hasVariants ? stockInfo.selectedVariantStock : stockInfo.totalStock;
  const isOutOfStock = availableStock === 0;
  const isEntirelyOutOfStock = stockInfo.totalStock === 0;

  // Get current pricing based on variant or direct pricing
  const currentPrice = useMemo(() => {
    if (!product) {
      return { originalPrice: 0, offerPrice: undefined, hasOffer: false, savings: 0, displayPrice: 0 };
    }

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
  }, [product, hasVariants, selectedVariant]);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data.product);
        setSimilarProducts(data.similarProducts);
        setSelectedVariantIndex(0);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleVariantChange = (value: string) => {
    setSelectedVariantIndex(parseInt(value, 10));
  };

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      await addToCart(product._id, 1, hasVariants ? selectedVariantIndex : 0);
      const variantInfo = hasVariants && selectedVariant ? ` (${selectedVariant.value})` : '';
      toast.success('Added to cart', {
        description: `${product.name}${variantInfo} added to your cart.`,
        duration: 2000,
      });
    } catch (error) {
      toast.error('Failed to add to cart', {
        description: 'Please try again',
        duration: 2000,
      });
    }
  };

  const handleIncreaseQuantity = async () => {
    if (!product) return;

    if (cartQuantity < availableStock) {
      await updateCartItemQuantity(
        product._id,
        cartQuantity + 1,
        hasVariants ? selectedVariantIndex : 0
      );
    } else {
      toast.warning('Maximum stock reached', {
        description: `Only ${availableStock} items available`,
        duration: 2000,
      });
    }
  };

  const handleDecreaseQuantity = async () => {
    if (!product) return;

    const variantIdx = hasVariants ? selectedVariantIndex : 0;

    if (cartQuantity > 1) {
      await updateCartItemQuantity(product._id, cartQuantity - 1, variantIdx);
    } else {
      await removeFromCart(product._id, variantIdx);
      toast.info(`"${product.name}" removed from cart`, {
        duration: 2000,
      });
    }
  };

  const handleToggleWishlist = async () => {
    if (!product) return;
    await toggleWishlist(product._id);
    toast.success(
      isInWishlist(product._id) ? 'Removed from Wishlist' : 'Added to Wishlist',
      {
        description: `${product.name} has been ${isInWishlist(product._id) ? 'removed from' : 'added to'} your wishlist.`,
      }
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="container-custom section-padding">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
            <div>
              <Skeleton className="aspect-square w-full max-w-[420px] rounded-2xl" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container-custom section-padding text-center">
          <h1 className="font-display text-2xl font-bold mb-4">Error</h1>
          <p className="text-red-500">{error}</p>
          <Link to="/products">
            <Button variant="outline" className="mt-4">Continue Shopping</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container-custom section-padding text-center">
          <h1 className="font-display text-2xl font-bold mb-4">Product Not Found</h1>
          <Link to="/products">
            <Button variant="outline">Continue Shopping</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const inWishlist = isInWishlist(product._id);

  return (
    <Layout>
      {product && (
        <SEO
          title={`${product.name} - Authentic Indian Sweet`}
          description={`${product.name} - ${product.description}. Fresh, authentic Indian sweet made with traditional recipes. Available in multiple weights. Fast delivery. ₹${currentPrice.displayPrice}.`}
          keywords={`${product.name}, Indian sweet, ${product.category?.name}, authentic recipe, fresh ingredients, traditional sweets, Indian mithai`}
          image={product.images?.[0] || '/IndiasFood.png'}
          type="product"
        />
      )}

      {/* Breadcrumb */}
      <div className="bg-muted/50 py-3 border">
        <div className="container-custom px-4 sm:px-6">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </Link>
        </div>
      </div>

      <section className="bg-cream py-6 sm:py-8">
        <div className="container-custom px-4 sm:px-6 lg:px-8">
          {/* Product Main Section */}
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 mb-12 sm:mb-16 items-start">
            {/* Left - Product Image */}
            <div className="flex justify-center lg:justify-start lg:sticky lg:top-24">
              <div className="w-full max-w-[320px] sm:max-w-[380px] lg:max-w-[420px]">
                {product.images && product.images.length > 0 ? (
                  <div className="relative group">
                    <Carousel className="w-full">
                      <CarouselContent>
                        {product.images.map((img, index) => (
                          <CarouselItem key={index}>
                            <div className="aspect-square rounded-2xl overflow-hidden bg-muted shadow-lg relative">
                              <img
                                src={img}
                                alt={`${product.name} - View ${index + 1} of ${product.images.length}`}
                                className="w-full h-full object-cover"
                              />
                              {/* Image Counter Badge */}
                              <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2.5 py-1 rounded-full text-xs font-medium">
                                {index + 1} / {product.images.length}
                              </div>
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      {product.images.length > 1 && (
                        <>
                          <CarouselPrevious className="left-3 h-10 w-10 bg-white/90 hover:bg-white border-2 border-gray-200 shadow-lg transition-all opacity-0 group-hover:opacity-100" />
                          <CarouselNext className="right-3 h-10 w-10 bg-white/90 hover:bg-white border-2 border-gray-200 shadow-lg transition-all opacity-0 group-hover:opacity-100" />
                        </>
                      )}
                    </Carousel>
                    
                    {/* Thumbnail Navigation - Desktop Only */}
                    {product.images.length > 1 && product.images.length <= 5 && (
                      <div className="hidden sm:flex gap-2 mt-3 justify-center">
                        {product.images.map((img, index) => (
                          <button
                            key={index}
                            className="w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-primary transition-all opacity-70 hover:opacity-100"
                            onClick={() => {
                              const carousel = document.querySelector('[data-carousel-item]');
                              // This is a simple way; ideally use carousel API if available
                            }}
                          >
                            <img
                              src={img}
                              alt={`Thumbnail ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Swipe Indicator for Mobile */}
                    {product.images.length > 1 && (
                      <div className="sm:hidden mt-3 text-center">
                        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                          <span>👈</span>
                          Swipe to see more photos
                          <span>👉</span>
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-square rounded-2xl overflow-hidden bg-muted flex items-center justify-center shadow-lg">
                    <span className="text-muted-foreground">No Image Available</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right - Product Details */}
            <div className="space-y-3">
              {/* Product Name & Tags */}
              <div>
                <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-2">
                  {product.name}
                </h1>
                <div className="flex flex-wrap gap-1.5">
                  {product.category && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                      <Tag className="h-3 w-3" />
                      {typeof product.category === 'string' ? product.category : (product.category as any).name}
                    </span>
                  )}
                  {product.isGITagged && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                      <Package className="h-3 w-3" />
                      GI Tagged
                    </span>
                  )}
                  {product.isNewArrival && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      ✨ New
                    </span>
                  )}
                  {hasVariants && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                      <Scale className="h-3 w-3" />
                      {product.variants!.length} Sizes
                    </span>
                  )}
                  {isEntirelyOutOfStock && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                      Out of Stock
                    </span>
                  )}
                </div>
              </div>

              {/* Variant Selector */}
              {hasVariants && product.variants && product.variants.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-600">Select Size:</label>
                  <Select
                    value={selectedVariantIndex.toString()}
                    onValueChange={handleVariantChange}
                  >
                    <SelectTrigger className="w-full sm:w-72 h-10 text-sm bg-white border border-gray-200 hover:border-primary/50 transition-colors">
                      <div className="flex items-center justify-between w-full pr-2">
                        <span className="font-semibold text-gray-900">
                          {selectedVariant?.value || 'Select'}
                        </span>
                        <span className="text-primary font-bold">
                          ₹{currentPrice.displayPrice}
                        </span>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="w-full sm:w-72">
                      {product.variants.map((variant, index) => {
                        const variantStock = product.inventory?.reduce((total, location) => {
                          const stockItem = location.stock.find(s => s.variantIndex === index);
                          return total + (stockItem?.quantity || 0);
                        }, 0) || 0;

                        const variantPrice = variant.offerPrice || variant.originalPrice;
                        const hasDiscount = variant.offerPrice && variant.offerPrice < variant.originalPrice;

                        return (
                          <SelectItem
                            key={index}
                            value={index.toString()}
                            disabled={variantStock === 0}
                            className="cursor-pointer py-2"
                          >
                            <div className="flex items-center justify-between w-full gap-3">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{variant.value}</span>
                                {variantStock === 0 && (
                                  <span className="text-red-500 text-xs font-medium">(Out)</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                {hasDiscount && (
                                  <span className="text-gray-400 line-through text-xs">
                                    ₹{variant.originalPrice}
                                  </span>
                                )}
                                <span className={cn(
                                  "font-bold text-sm",
                                  hasDiscount ? "text-green-600" : "text-gray-900"
                                )}>
                                  ₹{variantPrice}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Price Display */}
              <div className="flex items-baseline gap-2 flex-wrap">
                {currentPrice.hasOffer ? (
                  <>
                    <span className="font-display text-2xl sm:text-3xl font-bold text-green-600">
                      ₹{currentPrice.offerPrice}
                    </span>
                    <span className="text-lg text-muted-foreground line-through">
                      ₹{currentPrice.originalPrice}
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                      Save ₹{currentPrice.savings}
                    </span>
                  </>
                ) : (
                  <span className="font-display text-2xl sm:text-3xl font-bold text-primary">
                    ₹{currentPrice.originalPrice}
                  </span>
                )}
                {hasVariants && selectedVariant && (
                  <span className="text-base text-muted-foreground">/ {selectedVariant.value}</span>
                )}
              </div>

              {/* Description */}
              {product.description && (
  <div className="relative">
    <p
      className={cn(
        "text-muted-foreground text-sm leading-relaxed",
        !showFullDescription && "line-clamp-2 pr-16"
      )}
    >
      {product.description}
    </p>

    {/* Read more / Read less */}
    {product.description.length > 120 && (
      <button
        onClick={() => setShowFullDescription(prev => !prev)}
        className={cn(
          "absolute bottom-0 right-0 text-xs font-bold text-primary hover:underline",
          showFullDescription && "static mt-1"
        )}
      >
        {showFullDescription ? "Read less" : "Read more"}
      </button>
    )}
  </div>
)}


              {/* Product Details Grid */}
              <div className="grid grid-cols-2 gap-2 bg-muted/30 p-3 rounded-lg">
                {(hasVariants && selectedVariant) || product.weight ? (
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Weight</p>
                      <p className="font-semibold text-xs">
                        {hasVariants && selectedVariant ? selectedVariant.value : product.weight}
                      </p>
                    </div>
                  </div>
                ) : null}

                {product.shelfLife && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Shelf Life</p>
                      <p className="font-semibold text-xs">{product.shelfLife}</p>
                    </div>
                  </div>
                )}

                {product.category && (
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Category</p>
                      <p className="font-semibold text-xs">
                        {typeof product.category === 'string' ? product.category : (product.category as any).name}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Status</p>
                    <p className={cn(
                      "font-semibold text-xs",
                      isOutOfStock ? "text-red-600" : "text-green-600"
                    )}>
                      {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {!isOutOfStock && (
                <div className="space-y-3">
                  {cartQuantity > 0 ? (
                    // Show quantity controls when item is in cart
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-3 bg-muted/50 rounded-lg p-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 hover:bg-background"
                          onClick={handleDecreaseQuantity}
                          disabled={cartLoading}
                        >
                          <Minus className="h-5 w-5" />
                        </Button>
                        <span className="w-12 text-center font-bold text-lg">{cartQuantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 hover:bg-background"
                          onClick={handleIncreaseQuantity}
                          disabled={cartQuantity >= availableStock || cartLoading}
                        >
                          <Plus className="h-5 w-5" />
                        </Button>
                      </div>
                      <div className="text-center text-sm text-muted-foreground">
                        {cartQuantity} item{cartQuantity > 1 ? 's' : ''} in cart
                      </div>
                    </div>
                  ) : (
                    // Show Add to Cart button when item is not in cart
                    <div className="flex gap-2">
                      <Button
                        size="lg"
                        variant="hero"
                        className="flex-1 gap-2 h-11 text-sm font-semibold hover:text-white bg-orange-600"
                        onClick={handleAddToCart}
                        disabled={cartLoading}
                      >
                        {cartLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ShoppingCart className="h-4 w-4" />
                        )}
                        Add to Cart
                        {hasVariants && selectedVariant && (
                          <span className="text-xs opacity-80">({selectedVariant.value})</span>
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant={inWishlist ? 'secondary' : 'outline'}
                        className="h-11 w-12 shrink-0"
                        onClick={handleToggleWishlist}
                        disabled={cartLoading}
                      >
                        <Heart className={cn('h-5 w-5', inWishlist && 'fill-current')} />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Out of Stock Message */}
              {isOutOfStock && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 font-medium text-sm text-center">
                    {hasVariants && selectedVariant
                      ? `${selectedVariant.value} is out of stock. Try another size.`
                      : 'Currently out of stock'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Similar Products */}
          {similarProducts.length > 0 && (
            <div className="mb-12 sm:mb-16">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-4">
                Similar Products
              </h2>
              <div className="relative">
                {/* Mobile: Show 2 products at a time with scroll */}
                <div className="grid grid-cols-2 gap-3 sm:hidden overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory">
                  {similarProducts.map((p) => (
                    <div
                      key={p._id}
                      className="snap-start min-w-0"
                    >
                      <ProductCard product={p} />
                    </div>
                  ))}
                </div>

                {/* Tablet and Desktop: Horizontal scroll */}
                <div className="hidden sm:flex gap-4 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory hide-scrollbar">
                  {similarProducts.map((p) => (
                    <div
                      key={p._id}
                      className="flex-none w-[280px] md:w-[300px] snap-start"
                    >
                      <ProductCard product={p} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* YouTube Video */}
          {product.videoUrl && (
            <div className="w-full">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-4">
                Product Video
              </h2>
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-muted shadow-lg">
                <iframe
                  width="100%"
                  height="100%"
                  src={product.videoUrl.replace("watch?v=", "embed/")}
                  title="Product Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
            </div>
          )}
        </div>
      </section>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </Layout>
  );
};

export default ProductDetail;