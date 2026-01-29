import { Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import { Category } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';

// Simple cache object outside component to persist across re-renders
const categoriesCache = {
  data: null as Category[] | null,
  timestamp: null as number | null,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes in milliseconds
};

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDot, setActiveDot] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchCategories = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Check if we have valid cached data
      const now = Date.now();
      const isCacheValid = 
        categoriesCache.data && 
        categoriesCache.timestamp && 
        (now - categoriesCache.timestamp) < categoriesCache.CACHE_DURATION;

      // Use cached data if valid and not forcing refresh
      if (isCacheValid && !forceRefresh) {
        setCategories(categoriesCache.data!);
        setLoading(false);
        return;
      }

      // Fetch fresh data
      const { data } = await api.get('/products/categories');
      
      if (Array.isArray(data)) {
        // Update cache
        categoriesCache.data = data;
        categoriesCache.timestamp = Date.now();
        setCategories(data);
      } else {
        console.error("Unexpected categories response:", data);
        setCategories([]);
      }
    } catch (err: any) {
      console.error("Fetch categories error:", err);
      setError(err.response?.data?.message || 'Failed to fetch categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle scroll for dots indicator
  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const scrollLeft = container.scrollLeft;
        const totalWidth = container.scrollWidth;

        const totalItems = categories.length + 5;
        const itemWidth = totalWidth / totalItems;
        const currentIndex = Math.round(scrollLeft / itemWidth);

        setActiveDot(Math.min(currentIndex, totalItems - 1));
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [categories]);

  if (loading) {
    return (
      <section className="section-padding bg-muted/50 pt-10">
        <div className="container-custom">
          <div className="mb-10">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-64 mt-2" />
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="min-w-[280px] sm:min-w-[320px] aspect-[4/3] rounded-2xl flex-shrink-0" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="section-padding bg-muted/50 pt-10">
        <div className="container-custom text-center py-16">
          <h2 className="font-display text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => fetchCategories(true)} variant="outline">
            Try Again
          </Button>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return (
      <section className="section-padding bg-muted/50 pt-10">
        <div className="container-custom text-center py-16">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">
            No Categories Found
          </h2>
          <p className="text-muted-foreground mb-4">
            It looks like there are no product categories available at the moment.
          </p>
          <Button onClick={() => fetchCategories(true)} variant="outline">
            Refresh Page
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="section-padding bg-muted/50  pt-10 pb-6">
      <div className="container-custom  sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <span className="text-primary font-medium text-sm uppercase tracking-wider">
            Browse By
          </span>
          <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
            Categories
          </h2>
        </div>

        {/* Horizontal Scrolling Container */}
        <div className="relative -mx-4 sm:-mx-6 lg:-mx-8">
          <div
            ref={scrollContainerRef}
            className="overflow-x-auto scrollbar-hide px-4 sm:px-6 lg:px-8"
          >
            <div className="flex gap-4 sm:gap-6 pb-6">
              {/* Dynamic categories from DB */}
              {Array.isArray(categories) && categories.map((category, index) => (
                <Link
                  key={category._id}
                  to={`/products?category=${category.name}`}
                  className="group animate-slide-up flex-shrink-0"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative bg-card rounded-2xl shadow-card card-hover overflow-hidden w-[45vw] sm:w-[280px] md:w-[320px] lg:w-[360px]">
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={category.imageUrl || '/images/placeholder.png'}
                        alt={`${category.name} - Indian sweets category`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>

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

              {/* Deal of the Day Category */}
              <Link
                to="/products?featured=deal"
                className="group animate-slide-up flex-shrink-0"
                style={{ animationDelay: `${categories.length * 100}ms` }}
              >
                <div className="relative bg-card rounded-2xl shadow-card card-hover overflow-hidden w-[45vw] sm:w-[280px] md:w-[320px] lg:w-[360px]">
                  <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-red-400 via-pink-500 to-red-600">
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="text-4xl sm:text-6xl mb-2">🔥</div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-3 sm:p-4 lg:p-6">
                    <h3 className="font-display text-sm sm:text-base lg:text-xl font-bold text-white mb-1 line-clamp-2">
                      Deal of the Day
                    </h3>
                    <p className="text-xs sm:text-sm text-white/90 line-clamp-2 hidden sm:block">
                      Limited time offers on selected items
                    </p>
                    <div className="mt-2 sm:mt-3 opacity-0 transform translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                      <span className="inline-flex items-center gap-2 text-white font-medium text-xs sm:text-sm">
                        View Deals
                        <span className="text-base sm:text-lg">→</span>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Static GI Tag Category */}
              <Link
                to="/gi-tag-products"
                className="group animate-slide-up flex-shrink-0"
                style={{ animationDelay: `${(categories.length + 1) * 100}ms` }}
              >
                <div className="relative bg-card rounded-2xl shadow-card card-hover overflow-hidden w-[45vw] sm:w-[280px] md:w-[320px] lg:w-[360px]">
                  <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500">
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="text-4xl sm:text-6xl mb-2">🏛️</div>
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
                className="group animate-slide-up flex-shrink-0"
                style={{ animationDelay: `${(categories.length + 2) * 100}ms` }}
              >
                <div className="relative bg-card rounded-2xl shadow-card card-hover overflow-hidden w-[45vw] sm:w-[280px] md:w-[320px] lg:w-[360px]">
                  <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-green-400 via-emerald-400 to-teal-500">
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="text-4xl sm:text-6xl mb-2">✨</div>
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
                className="group animate-slide-up flex-shrink-0"
                style={{ animationDelay: `${(categories.length + 3) * 100}ms` }}
              >
                <div className="relative bg-card rounded-2xl shadow-card card-hover overflow-hidden w-[45vw] sm:w-[280px] md:w-[320px] lg:w-[360px]">
                  <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-pink-400 via-red-400 to-purple-500">
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="text-4xl sm:text-6xl mb-2">🎁</div>
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
                to="/bulk-orders"
                className="group animate-slide-up flex-shrink-0"
                style={{ animationDelay: `${(categories.length + 4) * 100}ms` }}
              >
                <div className="relative bg-card rounded-2xl shadow-card card-hover overflow-hidden w-[45vw] sm:w-[280px] md:w-[320px] lg:w-[360px]">
                  <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600">
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="text-4xl sm:text-6xl mb-2">📦</div>
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

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: categories.length + 5 }, (_, i) => (
              <button
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  activeDot === i
                    ? 'bg-orange-500 scale-125'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                onClick={() => {
                  if (scrollContainerRef.current) {
                    const container = scrollContainerRef.current;
                    const itemWidth = container.scrollWidth / (categories.length + 5);
                    container.scrollTo({
                      left: i * itemWidth,
                      behavior: 'smooth'
                    });
                  }
                }}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}