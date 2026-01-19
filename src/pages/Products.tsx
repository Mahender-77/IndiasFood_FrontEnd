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
import { SEO } from '@/components/seo/SEO';

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
  const urlSearchTerm = searchParams.get('search') || ''; // Get search term from Navbar
  const categoryParam = searchParams.get('category') || '';
  const pageNumberParam = Number(searchParams.get('pageNumber')) || 1;

  const [search, setSearch] = useState(urlSearchTerm || keywordParam); // Prioritize Navbar search
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'all'); // 'all' = show all products
  const [sortBy, setSortBy] = useState('featured');

  const handleSortChange = (value: string) => {
    setSortBy(value);
    const params: Record<string, string> = { pageNumber: '1', sortBy: value };
    if (search) params.search = search;
    if (selectedCategory && selectedCategory !== 'all') params.category = selectedCategory;
    setSearchParams(params);
  };

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/products/categories');
        // Add "All Categories" option with 'all' as value (to show all products)
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
        // Build query params - only include non-empty values
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        // Send category to backend - 'all' means show all products
        if (selectedCategory && selectedCategory !== 'all') {
          params.append('category', selectedCategory);
        }
        params.append('pageNumber', String(pageNumberParam));
        params.append('sortBy', sortBy);

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
  }, [search, selectedCategory, pageNumberParam, sortBy, urlSearchTerm]); // Added urlSearchTerm to dependencies

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    const params: Record<string, string> = { pageNumber: '1', sortBy: sortBy };
    if (e.target.value) params.search = e.target.value;
    if (selectedCategory && selectedCategory !== 'all') params.category = selectedCategory;
    setSearchParams(params);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    const params: Record<string, string> = { pageNumber: '1', sortBy: sortBy };
    if (search) params.search = search;
    // Only add category to URL if it's not 'all'
    if (value && value !== 'all') params.category = value;
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
    params.append('pageNumber', String(newPage));
    params.append('sortBy', sortBy);
    navigate(`/products?${params.toString()}`);
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
      <SEO
        title="Indian Sweets Collection - Gulab Jamun, Kaju Katli & More"
        description="Browse our complete collection of authentic Indian sweets. Gulab Jamun, Kaju Katli, Motichoor Ladoo, Mysore Pak, traditional recipes, fresh ingredients, fast delivery."
        keywords="Indian sweets collection, Gulab Jamun, Kaju Katli, Motichoor Ladoo, Mysore Pak, Pista Barfi, Badam Halwa, Soan Papdi, Indian mithai, traditional sweets"
      />

      {/* Header */}
      <section className="bg-cream py-8 sm:py-12">
        <div className="container-custom">
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            Our Sweets Collection
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mt-2">
            Discover our range of authentic Indian sweets, made fresh daily
          </p>
        </div>
      </section>

      <section className="section-padding bg-background pt-6 sm:pt-10">
        <div className="container-custom">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row gap-2.5 sm:gap-3 md:gap-4 mb-6 sm:mb-8">
            {/* Search */}
            <div className="flex-1">
              <Input
                type="search"
                placeholder="Search sweets..."
                value={search}
                onChange={handleSearchChange}
                className="w-full h-9 sm:h-10 text-sm"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
              <Select value={selectedCategory} onValueChange={handleCategoryChange} disabled={loading}>
                <SelectTrigger className="w-full sm:w-[160px] md:w-[180px] h-9 sm:h-10 text-sm">
                  {loading ? (
                    <Skeleton className="w-full h-6" />
                  ) : (
                    <SelectValue placeholder="All Categories" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat._id || 'all-key'} value={cat._id === 'all' ? 'all' : cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={handleSortChange} disabled={loading}>
                <SelectTrigger className="w-full sm:w-[160px] md:w-[180px] h-9 sm:h-10 text-sm">
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
            <Skeleton className="w-48 h-5 mb-4 sm:mb-6" />
          ) : (
            <p className="text-muted-foreground text-sm mb-4 sm:mb-6">
              Showing {products.length} products
            </p>
          )}

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-72 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 sm:py-16">
              <p className="text-red-500 text-base sm:text-lg mb-4">Error: {error}</p>
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
            <div className="text-center py-12 sm:py-16">
              <p className="text-muted-foreground text-base sm:text-lg mb-4">
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
            <div className="flex justify-center mt-6 sm:mt-8 flex-wrap gap-2">
              {[...Array(pages).keys()].map((x) => (
                <Button
                  key={x + 1}
                  variant={x + 1 === page ? 'default' : 'outline'}
                  onClick={() => handlePageChange(x + 1)}
                  size="sm"
                  className="min-w-[2.5rem]"
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