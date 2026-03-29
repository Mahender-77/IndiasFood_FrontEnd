import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { SEO } from '@/components/seo/SEO';
import { Flame, ArrowLeft } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

type DealSortBy = 'expiry' | 'price-low' | 'price-high' | 'name';

const DealOfTheDay = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const pageNumberParam = Number(searchParams.get('pageNumber')) || 1;
  const sortByParam = (searchParams.get('sortBy') as DealSortBy) || 'expiry';

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.append('pageNumber', String(pageNumberParam));
        params.append('pageSize', '12');
        if (sortByParam && sortByParam !== 'expiry') {
          params.append('sortBy', sortByParam === 'price-low' ? 'price-low' : sortByParam === 'price-high' ? 'price-high' : 'name');
        }

        const { data } = await api.get(`/products/deal-of-the-day?${params.toString()}`);
        setProducts(data.products || []);
        setPage(data.page || 1);
        setPages(data.pages || 1);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch deal of the day products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [pageNumberParam, sortByParam]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    params.set('pageNumber', String(newPage));
    if (sortByParam && sortByParam !== 'expiry') params.set('sortBy', sortByParam);
    navigate(`/deal-of-the-day?${params.toString()}`);
  };

  return (
    <Layout>
      <SEO
        title="Deal of the Day - Limited Time Offers | India's Food"
        description="Grab amazing deals on products expiring soon! Limited time offers on fresh Indian sweets and snacks. Don't miss out on these exclusive deals."
        keywords="deal of the day, limited time offers, expiring products, special deals, discount products, urgent deals"
      />

      {/* Header */}
      <section className="bg-gradient-to-r from-red-50 to-orange-50 pt-2">
        <div className="container-custom">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 -ml-2 mt-0 lg:hidden"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-100 rounded-full">
              <Flame className="h-6 w-6 text-red-700" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
               Deal of the Day
            </h1>
          </div>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">
            Products expiring soon with exclusive discounts! Each batch can have its own trigger (e.g. 2 or 3 days before expiry) 
            and offer percentage. When a batch enters its deal window, the product appears here with the best discount available. 
            Grab these deals before they&apos;re gone.
          </p>
        </div>
      </section>

      <section className="section-padding bg-background pt-8">
        <div className="container-custom">
          {/* Sort + Results Count */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            {loading ? (
              <Skeleton className="w-48 h-5" />
            ) : (
              <p className="text-muted-foreground">
                Showing {products.length} {products.length === 1 ? 'deal' : 'deals'}
              </p>
            )}
            <div className="flex items-center gap-2">
              <Label htmlFor="deal-sort" className="text-sm text-muted-foreground whitespace-nowrap">
                Sort by
              </Label>
              <Select
                value={sortByParam}
                onValueChange={(value) => {
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    next.set('sortBy', value);
                    next.delete('pageNumber');
                    return next;
                  });
                }}
              >
                <SelectTrigger id="deal-sort" className="w-[180px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expiry">Expires soonest</SelectItem>
                  <SelectItem value="price-low">Price: Low to high</SelectItem>
                  <SelectItem value="price-high">Price: High to low</SelectItem>
                  <SelectItem value="name">Name A–Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
           <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-80 w-full rounded-2xl" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-500 text-lg mb-4">Error: {error}</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Try Again
              </Button>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {products.map((product, index) => {
                const variantsToShow = product.dealVariants || product.variants;
                return (
                  <div
                    key={product._id}
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <ProductCard product={{ ...product, variants: variantsToShow }} isDealView />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <Flame className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg mb-4">
                No deals available at the moment. Check back soon for new offers!
              </p>
            </div>
          )}

          {pages > 1 && !loading && (
            <div className="flex justify-center mt-8 space-x-2 flex-wrap gap-2">
              {[...Array(pages).keys()].map((x) => (
                <Button
                  key={x + 1}
                  variant={x + 1 === page ? 'default' : 'outline'}
                  onClick={() => handlePageChange(x + 1)}
                  className="min-w-[40px]"
                >
                  {x + 1}
                </Button>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default DealOfTheDay;
