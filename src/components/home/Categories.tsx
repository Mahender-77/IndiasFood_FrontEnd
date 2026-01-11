import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Category } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button'; // Import Button for retry
import { Package } from 'lucide-react'; // Import for empty state icon

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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-2xl" />
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
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="text-primary font-medium text-sm uppercase tracking-wider">
            Browse By
          </span>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mt-2">
            {/* Sweet */}
             Categories
          </h2>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <Link
              key={category._id}
              to={`/products?category=${category.name}`}
              className="group animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative bg-card rounded-2xl p-4 sm:p-6 text-center shadow-card card-hover overflow-hidden">
                {/* Image */}
                <div className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl overflow-hidden mb-3 sm:mb-4 transition-transform duration-300 group-hover:scale-110`}>
                  <img 
                    src={category.imageUrl || '/images/placeholder.png'} 
                    alt={category.name} 
                    className="w-full h-full object-cover" 
                  /> 
                </div>
                
                {/* Content */}
                <h3 className="font-display text-base sm:text-lg font-semibold text-foreground mb-0.5 sm:mb-1">
                  {category.name}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {/* category.description || 'Explore delicious treats' */}
                  Explore delicious treats
                </p>

                {/* Hover Arrow */}
                <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 opacity-0 translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground text-base sm:text-lg">→</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
