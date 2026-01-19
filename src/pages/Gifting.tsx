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
import { Gift, Search, Heart, Package } from 'lucide-react';

const Gifting = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const urlSearchTerm = searchParams.get('search') || '';
  const pageNumberParam = Number(searchParams.get('pageNumber')) || 1;

  const [search, setSearch] = useState(urlSearchTerm);
  const [sortBy, setSortBy] = useState('featured');

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        params.append('pageNumber', String(pageNumberParam));
        params.append('sortBy', sortBy);

        // Fetch all products - you can filter for gifting-specific products if needed
        const { data } = await api.get(`/products?${params.toString()}`);
        setProducts(data.products);
        setPage(data.page);
        setPages(data.pages);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [search, pageNumberParam, sortBy]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    const params: Record<string, string> = { pageNumber: '1' };
    if (e.target.value) params.search = e.target.value;
    setSearchParams(params);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('pageNumber', String(newPage));
    navigate(`/gifting?${params.toString()}`);
  };

  const sortOptions = [
    { value: 'featured', label: 'Featured' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'name', label: 'Name: A to Z' },
  ];

  const giftFeatures = [
    { icon: Gift, title: 'Beautiful Packaging', desc: 'Premium gift boxes included' },
    { icon: Heart, title: 'Personalized Message', desc: 'Add your special note' },
    { icon: Package, title: 'Safe Delivery', desc: 'Carefully packed for transport' },
  ];

  return (
    <Layout>
      <SEO
        title="Gifting - Premium Sweet Gift Boxes | India's Food"
        description="Find the perfect gift for any occasion. Premium Indian sweet gift boxes for festivals, weddings, corporate events, and celebrations."
        keywords="sweet gift boxes, Indian sweets gifts, festival gifts, wedding sweets, corporate gifting, Diwali gifts"
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-pink-50 to-rose-50 py-12">
        <div className="container-custom">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-pink-100 rounded-full mb-4">
              <Gift className="h-8 w-8 text-pink-600" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3">
              Sweet Gifting
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Make every occasion special with our premium Indian sweet gift boxes. 
              Perfect for festivals, weddings, and celebrations.
            </p>
          </div>

          {/* Features */}
          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {giftFeatures.map((feature, index) => (
              <div key={index} className="bg-white p-4 rounded-xl shadow-sm text-center">
                <feature.icon className="h-6 w-6 text-pink-500 mx-auto mb-2" />
                <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                <p className="text-xs text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-background pt-8">
        <div className="container-custom">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search gift items..."
                value={search}
                onChange={handleSearchChange}
                className="w-full pl-10"
              />
            </div>

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

          {/* Results */}
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
              <Gift className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">
                No gift items found matching your criteria.
              </p>
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

export default Gifting;

