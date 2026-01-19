import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Product } from '@/types';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { SEO } from '@/components/seo/SEO';
import { Sparkles, Search } from 'lucide-react';

const NewArrivals = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const keywordParam = searchParams.get('keyword') || '';
  const urlSearchTerm = searchParams.get('search') || '';
  const pageNumberParam = Number(searchParams.get('pageNumber')) || 1;

  const [search, setSearch] = useState(urlSearchTerm || keywordParam);
  const [sortBy, setSortBy] = useState('featured');

  const handleSortChange = (value: string) => {
    setSortBy(value);
    const params: Record<string, string> = { pageNumber: '1', sortBy: value };
    if (search) params.search = search;
    setSearchParams(params);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        params.append('pageNumber', String(pageNumberParam));
        params.append('sortBy', sortBy);

        const { data } = await api.get(`/products/new-arrivals?${params.toString()}`);
        setProducts(data.products);
        setPage(data.page);
        setPages(data.pages);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch new arrivals');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [search, pageNumberParam, sortBy, urlSearchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    const params: Record<string, string> = { pageNumber: '1', sortBy: sortBy };
    if (e.target.value) params.search = e.target.value;
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('pageNumber', String(newPage));
    params.append('sortBy', sortBy);
    navigate(`/new-arrivals?${params.toString()}`);
  };

  const sortOptions = [
    { value: 'featured', label: 'Newest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'name', label: 'Name: A to Z' },
  ];

  return (
    <Layout>
      <SEO
        title="New Arrivals - Fresh Indian Sweets & Snacks"
        description="Discover our latest additions! Freshly added authentic Indian sweets and snacks. Be the first to try our newest creations."
        keywords="new arrivals, fresh sweets, latest products, new Indian sweets, fresh additions, new snacks"
      />

      {/* Header */}
      <section className="bg-gradient-to-r from-green-50 to-emerald-50 py-10">
        <div className="container-custom">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 rounded-full">
              <Sparkles className="h-6 w-6 text-green-700" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
              New Arrivals
            </h1>
          </div>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">
            Be the first to discover our latest additions! Fresh sweets and snacks 
            added to our collection, made with the same authentic recipes you love.
          </p>
        </div>
      </section>

      <section className="section-padding bg-background pt-8">
        <div className="container-custom">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-8">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search new arrivals..."
                value={search}
                onChange={handleSearchChange}
                className="w-full pl-10"
              />
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={handleSortChange} disabled={loading}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results Count */}
          {loading ? (
            <Skeleton className="w-48 h-5 mb-6" />
          ) : (
            <p className="text-muted-foreground mb-6">
              Showing {products.length} new arrivals
            </p>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-72 w-full" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
              <Sparkles className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg mb-4">
                No new arrivals found matching your criteria.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearch('');
                  setSearchParams({});
                }}
              >
                Clear Search
              </Button>
            </div>
          )}

          {pages > 1 && !loading && (
            <div className="flex justify-center mt-8 space-x-2">
              {[...Array(pages).keys()].map((x) => (
                <Button
                  key={x + 1}
                  variant={x + 1 === page ? 'default' : 'outline'}
                  onClick={() => handlePageChange(x + 1)}
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

export default NewArrivals;

