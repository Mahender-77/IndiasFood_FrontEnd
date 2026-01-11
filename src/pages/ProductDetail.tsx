import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, ShoppingCart, Minus, Plus, ArrowLeft } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/products/ProductCard';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"; // Import Carousel components
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import api from '@/lib/api'; // Use the configured axios instance
import { Product } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data.product);
        setSimilarProducts(data.similarProducts);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="container-custom section-padding">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 xl:gap-12">
            {/* Image/Video Skeletons */}
            <div>
              <Skeleton className="aspect-square w-full sm:max-w-md lg:max-w-lg mx-auto rounded-2xl mb-4" />
              <Skeleton className="aspect-video w-full sm:max-w-md lg:max-w-lg mx-auto rounded-2xl mt-6" />
              <Skeleton className="h-48 w-full rounded-xl mt-8" />
            </div>

            {/* Details Skeletons */}
            <div className="space-y-4 sm:space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-24 w-full" />
              <div className="flex items-center gap-3 sm:gap-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
              <div className="flex gap-2 sm:gap-3">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-10" />
              </div>
            </div>
          </div>

          {/* Similar Products Skeleton */}
          <div className="mt-12 sm:mt-16">
            <Skeleton className="h-8 w-64 mb-4 sm:mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-72 w-full" />
              ))}
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
            <Button variant="outline" className="mt-4">Back to Products</Button>
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
            <Button variant="outline">Back to Products</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const inWishlist = isInWishlist(product._id);

  const handleAddToCart = async () => {
    await addToCart(product._id, quantity);
    toast({
      title: 'Item added to cart',
      description: `${quantity} x ${product.name} added to your cart.`,
    });
    setQuantity(1);
  };

  const handleToggleWishlist = async () => {
    await toggleWishlist(product._id);
    toast({
      title: inWishlist ? 'Removed from Wishlist' : 'Added to Wishlist',
      description: `${product.name} has been ${inWishlist ? 'removed from' : 'added to'} your wishlist.`,
    });
  };

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="bg-muted/50 py-4">
        <div className="container-custom">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>
        </div>
      </div>

      <section className="section-padding bg-background">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 xl:gap-12">
            {/* Images & Video Carousel */}
            <div className="space-y-4">
              {product.images && product.images.length > 0 ? (
                <Carousel className="w-full sm:max-w-md lg:max-w-lg mx-auto">
                  <CarouselContent>
                    {product.images.map((img, index) => (
                      <CarouselItem key={index}>
                        <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
                          <img
                            src={img}
                            alt={`${product.name} image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              ) : (
                <div className="aspect-square rounded-2xl overflow-hidden bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">No Image</span>
                </div>
              )}

              {product.videoUrl && (
                <div className="aspect-video w-full sm:max-w-md lg:max-w-lg mx-auto rounded-2xl overflow-hidden bg-muted mt-6">
                  <iframe
                    width="100%"
                    height="100%"
                    src={product.videoUrl.replace("watch?v=", "embed/")}
                    title="Product Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-6 rounded-xl mb-8">
                <div><span className="font-semibold">Weight:</span> {product.weight || 'N/A'}</div>
                <div><span className="font-semibold">Price:</span> ₹{product.price}</div>
                <div><span className="font-semibold">Stock:</span> {product.countInStock}</div>
                <div><span className="font-semibold">Shelf Life:</span> {product.shelfLife || 'N/A'}</div>
                <div><span className="font-semibold">Category:</span> {(product.category as any)?.name}</div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-4 sm:space-y-6">
              {/* Sold Out Badge */}
              {product.countInStock === 0 && (
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-destructive text-destructive-foreground text-xs font-semibold rounded-full">
                    Sold Out
                  </span>
                </div>
              )}

              {/* Title & Price */}
              <div>
                <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                  {product.name}
                </h1>
              <p className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-primary mt-2">
                ₹{product.price}
              </p>
              </div>

              {/* Description */}
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {product.description}
              </p>

              {/* Quantity & Actions */}
              <div className="space-y-3 sm:space-y-4">
                {/* Quantity Selector */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="text-sm font-medium">Quantity:</span>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 sm:h-8 sm:w-8"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <span className="w-10 text-center font-semibold">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 sm:h-8 sm:w-8"
                      onClick={() => setQuantity(quantity + 1)}
                      disabled={product.countInStock === 0 || quantity >= product.countInStock}
                    >
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 sm:gap-3">
                  <Button
                    size="md"
                    variant="hero"
                    className="flex-1 gap-2"
                    onClick={handleAddToCart}
                    disabled={product.countInStock === 0}
                  >
                    <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                    Add to Cart
                  </Button>
                  <Button
                    size="md"
                    variant={inWishlist ? 'secondary' : 'outline'}
                    onClick={handleToggleWishlist}
                  >
                    <Heart className={cn('h-4 w-4 sm:h-5 sm:w-5', inWishlist && 'fill-current')} />
                  </Button>
                </div>
              </div>

              {/* Stock Status */}
              {product.countInStock > 0 && product.countInStock <= 10 && (
                <p className="text-sm text-destructive">
                  Only {product.countInStock} left in stock!
                </p>
              )}
            </div>
          </div>

          {/* Similar Products */}
          {similarProducts.length > 0 && (
            <div className="mt-12 sm:mt-16">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">
                Similar Sweets
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {similarProducts.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default ProductDetail;
