import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { Product } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export function DealOfTheDay() {
  const [deals, setDeals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch products with discounts/offers
        const { data } = await api.get('/products?limit=10&sort=createdAt&order=desc');

        // Filter products that have discounts or special offers
        const dealProducts = Array.isArray(data.products)
          ? data.products.filter((product: Product) =>
              (product.offerPrice && product.offerPrice < product.originalPrice) ||
              (product.price && product.originalPrice && product.price < product.originalPrice)
            ).slice(0, 4) // Show max 4 deals
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
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="min-w-[280px] aspect-square rounded-2xl flex-shrink-0" />
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

        {/* Horizontal Scrolling Container */}
        <div className="relative -mx-4 sm:-mx-6 lg:-mx-8">
          <div className="overflow-x-auto scrollbar-hide px-4 sm:px-6 lg:px-8">
            <div className="flex gap-4 sm:gap-6 pb-4">
              {deals.map((product, index) => {
                const effectivePrice = product.offerPrice || product.price || product.originalPrice;
                const discountPercent = product.originalPrice && effectivePrice < product.originalPrice
                  ? Math.round(((product.originalPrice - effectivePrice) / product.originalPrice) * 100)
                  : 0;

                return (
                  <Link
                    key={product._id}
                    to={`/product/${product._id}`}
                    className="group animate-slide-up flex-shrink-0"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="relative bg-card rounded-2xl shadow-card card-hover overflow-hidden w-[45vw] sm:w-[280px] md:w-[320px] lg:w-[360px] aspect-square">
                      {/* Image */}
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={product.images?.[0] || '/images/placeholder.png'}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>

                      {/* Discount Badge */}
                      {discountPercent > 0 && (
                        <div className="absolute top-3 left-3">
                          <Badge variant="destructive" className="text-xs font-bold">
                            {discountPercent}% OFF
                          </Badge>
                        </div>
                      )}

                      {/* Content Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-3 sm:p-4 lg:p-6">
                        <h3 className="font-display text-sm sm:text-base lg:text-xl font-bold text-white mb-1 line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-white/90 line-clamp-2 hidden sm:block mb-2">
                          {product.description || 'Delicious treat'}
                        </p>

                        {/* Price */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg sm:text-xl font-bold text-white">
                            ₹{product.price}
                          </span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-sm text-white/70 line-through">
                              ₹{product.originalPrice}
                            </span>
                          )}
                        </div>

                        {/* CTA */}
                        <div className="opacity-0 transform translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                          <span className="inline-flex items-center gap-2 text-white font-medium text-xs sm:text-sm">
                            Grab Deal
                            <span className="text-base sm:text-lg">→</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
