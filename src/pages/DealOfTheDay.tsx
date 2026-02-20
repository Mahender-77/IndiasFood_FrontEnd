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

const DealOfTheDay = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const pageNumberParam = Number(searchParams.get('pageNumber')) || 1;

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.append('pageNumber', String(pageNumberParam));
        params.append('pageSize', '12');

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
  }, [pageNumberParam]);

  const handlePageChange = (newPage: number) => {
    navigate(`/deal-of-the-day?pageNumber=${newPage}`);
  };

  return (
    <Layout>
      <SEO
        title="Deal of the Day - Limited Time Offers | India's Food"
        description="Grab amazing deals on products expiring soon! Limited time offers on fresh Indian sweets and snacks. Don't miss out on these exclusive deals."
        keywords="deal of the day, limited time offers, expiring products, special deals, discount products, urgent deals"
      />

      {/* Header */}
      <section className="bg-gradient-to-r from-red-50 to-orange-50 py-10">
        <div className="container-custom">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-100 rounded-full">
              <Flame className="h-6 w-6 text-red-700" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
              🔥 Deal of the Day
            </h1>
          </div>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">
            Limited time offers! Products expiring in 2 days or less. Grab these exclusive deals 
            before they're gone. Fresh products at unbeatable prices.
          </p>
        </div>
      </section>

      <section className="section-padding bg-background pt-8">
        <div className="container-custom">
          {/* Results Count */}
          {loading ? (
            <Skeleton className="w-48 h-5 mb-6" />
          ) : (
            <p className="text-muted-foreground mb-6">
              Showing {products.length} {products.length === 1 ? 'deal' : 'deals'}
            </p>
          )}

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
              {products.map((product, index) => (
                <div
                  key={product._id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
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
