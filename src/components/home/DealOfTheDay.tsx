import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Product } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/products/ProductCard';

export function DealOfTheDay() {
  const navigate = useNavigate();
  const [deals, setDeals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch products expiring in 2 days or less
        const { data } = await api.get('/products/deal-of-the-day?pageSize=10');

        // Get products from response
        const dealProducts = Array.isArray(data.products)
          ? data.products
          : [];

        setDeals(dealProducts);
      } catch (err: any) {
        console.error("Fetch deals error:", err);
        setError(err.response?.data?.message || 'Failed to fetch deals');
        setDeals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  if (loading) {
    return (
      <section className="section-padding bg-gradient-to-r from-red-50 to-orange-50">
        <div className="container-custom">
          <div className="mb-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-64 mt-2" />
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

  if (error || deals.length === 0) {
    return (
      <section className="section-padding bg-gradient-to-r from-red-50 to-orange-50">
        <div className="container-custom text-center py-16">
          <div className="text-6xl mb-4">🔥</div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">
            Deal of the Day
          </h2>
          <p className="text-muted-foreground mb-4">
            {error ? 'Unable to load deals at the moment.' : 'No special deals available today.'}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="section-padding bg-gradient-to-r from-red-50 to-orange-50">
      <div className="container-custom px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Go Back</span>
            </Button>
          </div>
          <span className="text-red-600 font-medium text-sm uppercase tracking-wider">
            Limited Time
          </span>
          <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mt-2 flex items-center gap-3">
            🔥 Deal of the Day
            <Badge variant="destructive" className="text-xs">
              {deals.length} Deals
            </Badge>
          </h2>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {deals.map((product, index) => (
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
