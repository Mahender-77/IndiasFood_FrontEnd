import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/products/ProductCard';
import api from '@/lib/api';
import { Product } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Package } from 'lucide-react'; // Import for empty state icon

export function FeaturedProducts() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch a limited number of products, e.g., 6, and filter by category if needed
        const { data } = await api.get('/products?pageSize=6'); // Fetch a limited number of products (e.g., 6) from all categories
        setFeaturedProducts(data.products);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch featured products');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  if (loading) {
    return (
      <section className="section-padding bg-background">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-64 mt-2" />
              <Skeleton className="h-5 w-96 mt-2" />
            </div>
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-72 w-full" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="section-padding bg-background">
        <div className="container-custom text-center py-16">
          <h2 className="font-display text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      </section>
    );
  }

  if (featuredProducts.length === 0) {
    return (
      <section className="section-padding bg-background">
        <div className="container-custom text-center py-16">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">
            No Featured Products Found
          </h2>
          <p className="text-muted-foreground mb-4">
            It looks like there are no featured products available at the moment.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Refresh Page
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="section-padding bg-background">
      <div className="container-custom">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-primary font-medium text-sm uppercase tracking-wider">
              Our Specialties
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mt-2">
              Featured Sweets
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mt-2 max-w-lg">
              Handpicked favorites loved by thousands. Made fresh daily with premium ingredients.
            </p>
          </div>
          <Link to="/products">
            <Button variant="outline" className="gap-2 group shrink-0">
              View All
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {featuredProducts.map((product, index) => (
            <div
              key={product._id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
