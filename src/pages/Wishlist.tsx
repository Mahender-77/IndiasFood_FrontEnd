import { Link } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/products/ProductCard';
import { useCart } from '@/contexts/CartContext';
import { Product } from '@/types';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Layout } from '@/components/layout/Layout';

const Wishlist = () => {
  const { state } = useCart();
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWishlistProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        // state.wishlist contains product IDs, fetch full product objects
        const fetchedProducts: Product[] = [];
        for (const productId of state.wishlist) {
          const { data } = await api.get(`/products/${productId}`);
          fetchedProducts.push(data.product);
        }
        setWishlistProducts(fetchedProducts);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch wishlist products');
      } finally {
        setLoading(false);
      }
    };

    fetchWishlistProducts();
  }, [state.wishlist]);

  if (loading) {
    return (
      <Layout>
        <section className="section-padding bg-background">
          <div className="container-custom">
            <Skeleton className="h-10 w-48 mb-8" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-72 w-full" />
              ))}
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <section className="section-padding bg-background">
          <div className="container-custom">
            <div className="max-w-md mx-auto text-center py-16">
              <h1 className="font-display text-2xl font-bold text-foreground mb-4">Error</h1>
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
                Try Again
              </Button>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (wishlistProducts.length === 0) {
    return (
      <Layout>
        <section className="section-padding bg-background">
          <div className="container-custom">
            <div className="max-w-md mx-auto text-center py-16">
              <div className="w-24 h-24 mx-auto rounded-full bg-muted flex items-center justify-center mb-6">
                <Heart className="h-12 w-12 text-muted-foreground" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                Your Wishlist is Empty
              </h1>
              <p className="text-muted-foreground mb-6">
                Save your favorite sweets here by clicking the heart icon on any product.
              </p>
              <Link to="/products">
                <Button size="lg" variant="hero" className="gap-2">
                  Explore Sweets
                  <ArrowRight className="h-5 w-5" />
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
      <section className="section-padding bg-background">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                Your Wishlist
              </h1>
              <p className="text-muted-foreground mt-1">
                {wishlistProducts.length} items saved
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Wishlist;