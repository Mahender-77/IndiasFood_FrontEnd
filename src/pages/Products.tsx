import { useState, useEffect, useCallback } from 'react';
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
import { Product, Category } from '@/types';
import api from '@/lib/api'; // Changed from axios to api instance
import { Skeleton } from '@/components/ui/skeleton';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]); // State for dynamic categories

  const keywordParam = searchParams.get('keyword') || '';
  const categoryParam = searchParams.get('category') || '';
  const pageNumberParam = Number(searchParams.get('pageNumber')) || 1;

  const [search, setSearch] = useState(keywordParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'all');
  const [sortBy, setSortBy] = useState('featured');

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setSearchParams({ keyword: search, category: selectedCategory, pageNumber: '1', sortBy: value });
  };

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/products/categories');
        console.log("categories", data);
        setCategories([{ _id: 'all', name: 'All Categories', isActive: true, createdAt: '', updatedAt: '' }, ...data]);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get(`/products?keyword=${search}&category=${selectedCategory === 'all' ? '' : selectedCategory}&pageNumber=${pageNumberParam}&sortBy=${sortBy}`);
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
  }, [search, selectedCategory, pageNumberParam, sortBy]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setSearchParams({ keyword: e.target.value, category: selectedCategory, pageNumber: '1', sortBy: sortBy });
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value); // Set selectedCategory to the actual value from the Select component
    setSearchParams({ keyword: search, category: value, pageNumber: '1', sortBy: sortBy });
  };

  const handlePageChange = (newPage: number) => {
    navigate(`/products?keyword=${search}&category=${selectedCategory}&pageNumber=${newPage}&sortBy=${sortBy}`);
  };

  // Remove hardcoded subcategories, now using 'categories' state
  const sortOptions = [
    { value: 'featured', label: 'Featured' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'name', label: 'Name: A to Z' },
  ];

  return (
    <Layout>
      {/* Header */}
      <section className="bg-cream py-12">
        <div className="container-custom">
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            Our Sweets Collection
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mt-2">
            Discover our range of authentic Indian sweets, made fresh daily
          </p>
        </div>
      </section>

      <section className="section-padding bg-background pt-10">
        <div className="container-custom">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-8">
            {/* Search */}
            <div className="flex-1">
              <Input
                type="search"
                placeholder="Search sweets..."
                value={search}
                onChange={handleSearchChange}
                className="w-full"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={selectedCategory} onValueChange={handleCategoryChange} disabled={loading}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  {loading ? <Skeleton className="w-full h-6" /> : <SelectValue placeholder="Category" />}
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat._id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

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
          </div>

          {/* Results Count */}
          {loading ? (
            <Skeleton className="w-48 h-5 mb-6" />
          ) : (
            <p className="text-muted-foreground mb-6">
              Showing {products.length} products
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
              <p className="text-muted-foreground text-lg mb-4">
                No products found matching your criteria.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('all');
                  setSearchParams({});
                }}
              >
                Clear Filters
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

export default Products;
