import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Category } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get('/products/categories');
        setCategories(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <section className="section-padding bg-muted/50">
        <div className="container-custom">
          <div className="text-center mb-10">
            <Skeleton className="h-6 w-32 mx-auto" />
            <Skeleton className="h-10 w-64 mx-auto mt-2" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="section-padding bg-muted/50">
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

  if (categories.length === 0) {
    return (
      <section className="section-padding bg-muted/50">
        <div className="container-custom text-center py-16">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">
            No Categories Found
          </h2>
          <p className="text-muted-foreground mb-4">
            It looks like there are no product categories available at the moment.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Refresh Page
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="section-padding bg-muted/50">
      <div className="container-custom px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <span className="text-primary font-medium text-sm uppercase tracking-wider">
            Browse By
          </span>
          <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mt-2">
            Categories
          </h2>
        </div>

        {/* Categories Grid - 2 columns on mobile, 3 on tablet, 4 on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Dynamic categories from DB */}
          {categories.map((category, index) => (
            <Link
              key={category._id}
              to={`/products?category=${category.name}`}
              className="group animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative bg-card rounded-2xl shadow-card card-hover overflow-hidden">
                {/* Full width image */}
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={category.imageUrl || '/images/placeholder.png'}
                    alt={`${category.name} - Indian sweets category`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>

                {/* Content overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-3 sm:p-4 lg:p-6">
                  <h3 className="font-display text-sm sm:text-base lg:text-xl font-bold text-white mb-1 line-clamp-2">
                    {category.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/90 line-clamp-2 hidden sm:block">
                    Explore delicious treats
                  </p>
                  <div className="mt-2 sm:mt-3 opacity-0 transform translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                    <span className="inline-flex items-center gap-2 text-white font-medium text-xs sm:text-sm">
                      Shop Now
                      <span className="text-base sm:text-lg">→</span>
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {/* Static GI Tag Category */}
          <Link
            to="/gi-tag-products"
            className="group animate-slide-up"
            style={{ animationDelay: `${categories.length * 100}ms` }}
          >
            <div className="relative bg-card rounded-2xl shadow-card card-hover overflow-hidden">
              <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500">
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="text-4xl sm:text-6xl mb-2">🏛️</div>
                    <div className="text-xl sm:text-2xl font-bold">GI</div>
                  </div>
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-3 sm:p-4 lg:p-6">
                <h3 className="font-display text-sm sm:text-base lg:text-xl font-bold text-white mb-1 line-clamp-2">
                  GI Tag Products
                </h3>
                <p className="text-xs sm:text-sm text-white/90 line-clamp-2 hidden sm:block">
                  Authentic traditional sweets
                </p>
                <div className="mt-2 sm:mt-3 opacity-0 transform translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                  <span className="inline-flex items-center gap-2 text-white font-medium text-xs sm:text-sm">
                    Explore GI
                    <span className="text-base sm:text-lg">→</span>
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* Static New Arrivals Category */}
          <Link
            to="/new-arrivals"
            className="group animate-slide-up"
            style={{ animationDelay: `${(categories.length + 1) * 100}ms` }}
          >
            <div className="relative bg-card rounded-2xl shadow-card card-hover overflow-hidden">
              <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-green-400 via-emerald-400 to-teal-500">
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="text-4xl sm:text-6xl mb-2">✨</div>
                    <div className="text-xl sm:text-2xl font-bold">NEW</div>
                  </div>
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-3 sm:p-4 lg:p-6">
                <h3 className="font-display text-sm sm:text-base lg:text-xl font-bold text-white mb-1 line-clamp-2">
                  New Arrivals
                </h3>
                <p className="text-xs sm:text-sm text-white/90 line-clamp-2 hidden sm:block">
                  Latest additions
                </p>
                <div className="mt-2 sm:mt-3 opacity-0 transform translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                  <span className="inline-flex items-center gap-2 text-white font-medium text-xs sm:text-sm">
                    Explore New
                    <span className="text-base sm:text-lg">→</span>
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* Static Gifting Category */}
          <Link
            to="/gifting"
            className="group animate-slide-up"
            style={{ animationDelay: `${(categories.length + 2) * 100}ms` }}
          >
            <div className="relative bg-card rounded-2xl shadow-card card-hover overflow-hidden">
              <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-pink-400 via-red-400 to-purple-500">
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="text-4xl sm:text-6xl mb-2">🎁</div>
                    <div className="text-xl sm:text-2xl font-bold">GIFT</div>
                  </div>
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-3 sm:p-4 lg:p-6">
                <h3 className="font-display text-sm sm:text-base lg:text-xl font-bold text-white mb-1 line-clamp-2">
                  Perfect Gifting
                </h3>
                <p className="text-xs sm:text-sm text-white/90 line-clamp-2 hidden sm:block">
                  Special occasions
                </p>
                <div className="mt-2 sm:mt-3 opacity-0 transform translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                  <span className="inline-flex items-center gap-2 text-white font-medium text-xs sm:text-sm">
                    Gift Now
                    <span className="text-base sm:text-lg">→</span>
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* Static Bulk Order Category */}
          <Link
            to="/bulk-order"
            className="group animate-slide-up"
            style={{ animationDelay: `${(categories.length + 3) * 100}ms` }}
          >
            <div className="relative bg-card rounded-2xl shadow-card card-hover overflow-hidden">
              <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600">
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="text-4xl sm:text-6xl mb-2">📦</div>
                    <div className="text-xl sm:text-2xl font-bold">BULK</div>
                  </div>
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-3 sm:p-4 lg:p-6">
                <h3 className="font-display text-sm sm:text-base lg:text-xl font-bold text-white mb-1 line-clamp-2">
                  Bulk Orders
                </h3>
                <p className="text-xs sm:text-sm text-white/90 line-clamp-2 hidden sm:block">
                  Special pricing for large quantities
                </p>
                <div className="mt-2 sm:mt-3 opacity-0 transform translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                  <span className="inline-flex items-center gap-2 text-white font-medium text-xs sm:text-sm">
                    Order Bulk
                    <span className="text-base sm:text-lg">→</span>
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}