import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Product, Category } from '@/types';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { SEO } from '@/components/seo/SEO';
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Subcategory {
  _id: string;
  name: string;
  isActive: boolean;
}

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  const keywordParam = searchParams.get('keyword') || '';
  const urlSearchTerm = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || '';
  const subcategoriesParam = searchParams.get('subcategories') || '';
  const pageNumberParam = Number(searchParams.get('pageNumber')) || 1;

  const [search, setSearch] = useState(urlSearchTerm || keywordParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'all');
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(
    subcategoriesParam ? subcategoriesParam.split(',').filter(Boolean) : []
  );
  const [sortBy, setSortBy] = useState('featured');
  const [isSubcategoryOpen, setIsSubcategoryOpen] = useState(true);
  const [isMobileSubcategoryOpen, setIsMobileSubcategoryOpen] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/products/categories');
        setCategories(data);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch subcategories when category changes
  useEffect(() => {
    const fetchSubcategories = async () => {
      try {
        let endpoint = '/products/all-subcategories';
        if (selectedCategory && selectedCategory !== 'all') {
          endpoint = `/products/subcategories/${selectedCategory}`;
        }
        const { data } = await api.get(endpoint);
        setSubcategories(data);
      } catch (err) {
        console.error('Failed to fetch subcategories:', err);
        setSubcategories([]);
      }
    };
    fetchSubcategories();
  }, [selectedCategory]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (selectedCategory && selectedCategory !== 'all') {
          params.append('category', selectedCategory);
        }
        if (selectedSubcategories.length > 0) {
          params.append('subcategories', selectedSubcategories.join(','));
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
  }, [search, selectedCategory, selectedSubcategories, pageNumberParam, sortBy, urlSearchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    updateURLParams({ search: e.target.value, pageNumber: '1' });
  };

  const handleCategoryChange = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setSelectedSubcategories([]);
    updateURLParams({ 
      category: categoryName !== 'all' ? categoryName : undefined, 
      subcategories: undefined,
      pageNumber: '1' 
    });
  };

  const handleSubcategoryToggle = (subcategoryName: string) => {
    const newSelected = selectedSubcategories.includes(subcategoryName)
      ? selectedSubcategories.filter(s => s !== subcategoryName)
      : [...selectedSubcategories, subcategoryName];
    
    setSelectedSubcategories(newSelected);
    updateURLParams({ 
      subcategories: newSelected.length > 0 ? newSelected.join(',') : undefined,
      pageNumber: '1' 
    });
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    updateURLParams({ sortBy: value, pageNumber: '1' });
  };

  const handlePageChange = (newPage: number) => {
    updateURLParams({ pageNumber: String(newPage) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateURLParams = (updates: Record<string, string | undefined>) => {
    const params: Record<string, string> = {};
    
    if (search && !('search' in updates)) params.search = search;
    if (selectedCategory !== 'all' && !('category' in updates)) params.category = selectedCategory;
    if (selectedSubcategories.length > 0 && !('subcategories' in updates)) {
      params.subcategories = selectedSubcategories.join(',');
    }
    params.sortBy = sortBy;
    params.pageNumber = String(pageNumberParam);

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        params[key] = value;
      } else {
        delete params[key];
      }
    });

    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedSubcategories([]);
    setSearchParams({});
  };

  const sortOptions = [
    { value: 'featured', label: 'Featured' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'name', label: 'Name: A to Z' },
  ];

  // Desktop Filter Sidebar
  const FilterSidebar = () => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-6">
        <SlidersHorizontal className="h-5 w-5 text-gray-700" />
        <h3 className="font-semibold text-lg text-gray-900">Filter By:</h3>
      </div>

      {/* Subcategory Dropdown */}
      <div className="mb-6">
        <button
          onClick={() => setIsSubcategoryOpen(!isSubcategoryOpen)}
          className="flex items-center justify-between w-full py-3 text-left font-medium text-gray-900"
        >
          <span className="text-base">Sub Category</span>
          {isSubcategoryOpen ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>

        {isSubcategoryOpen && (
          <div className="mt-3 space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
            {subcategories.map((subcategory) => {
             
              return (
              <label
                key={subcategory._id || subcategory.name}
                className="flex items-center space-x-3 cursor-pointer group"
              >
                <Checkbox
                  checked={selectedSubcategories.includes(subcategory.name)}
                  onCheckedChange={() => handleSubcategoryToggle(subcategory.name)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">
                  {subcategory.name}
                </span>
              </label>
              );
            })}
            {subcategories.length === 0 && (
              <p className="text-sm text-gray-500 italic">No subcategories available</p>
            )}
          </div>
        )}
      </div>

      <div className="h-px bg-gray-200 my-6" />

      {/* Category Buttons */}
      <div className="space-y-3">
        {categories.map((category) => (
          <button
            key={category._id}
            onClick={() => handleCategoryChange(category.name)}
            className={cn(
              "w-full px-5 py-3.5 rounded-xl text-left font-medium transition-all duration-200",
              selectedCategory === category.name
                ? "bg-purple-100 text-purple-700 border-2 border-purple-300 shadow-sm"
                : "bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-200 hover:bg-purple-50"
            )}
          >
            {category.name}
          </button>
        ))}
      </div>

      {(selectedCategory !== 'all' || selectedSubcategories.length > 0 || search) && (
        <Button variant="outline" className="w-full mt-6" onClick={clearFilters}>
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <Layout>
      <SEO
        title="Indian Sweets Collection - Gulab Jamun, Kaju Katli & More"
        description="Browse our complete collection of authentic Indian sweets. Gulab Jamun, Kaju Katli, Motichoor Ladoo, Mysore Pak, traditional recipes, fresh ingredients, fast delivery."
        keywords="Indian sweets collection, Gulab Jamun, Kaju Katli, Motichoor Ladoo, Mysore Pak, Pista Barfi, Badam Halwa, Soan Papdi, Indian mithai, traditional sweets"
      />

      {/* Header */}
      <section className="bg-gradient-to-b from-purple-50 to-white py-2 sm:py-6 ">
        <div className="container-custom">
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            Our Collections
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 mt-2">
            Discover our range of authentic Indian sweets, made fresh daily
          </p>
        </div>
      </section>

      <section className="section-padding bg-gray-50 pt-6 sm:pt-10">
        <div className="w-full max-w-[90%] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile Filters */}
          <div className="lg:hidden mb-3 space-y-2">
            {/* Search Bar */}
            <Input
              type="search"
              placeholder="Search sweets..."
              value={search}
              onChange={handleSearchChange}
              className="w-full"
            />

            {/* Mobile Subcategory Dropdown */}
            <div className="bg-white rounded-lg border border-gray-200">
              <button
                onClick={() => setIsMobileSubcategoryOpen(!isMobileSubcategoryOpen)}
                className="flex items-center justify-between w-full px-3 py-2.5 text-left"
              >
                <span className="text-sm font-medium text-gray-900">
                  Sub Category {selectedSubcategories.length > 0 && `(${selectedSubcategories.length})`}
                </span>
                {isMobileSubcategoryOpen ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </button>

              {isMobileSubcategoryOpen && (
                <div className="px-3 pb-2 space-y-1.5 max-h-40 overflow-y-auto border-t border-gray-100">
                  {subcategories.map((subcategory) => {
              
                    return (
                      <label
                        key={subcategory._id || subcategory.name}
                        className="flex items-center space-x-2 cursor-pointer py-1"
                      >
                        <Checkbox
                          checked={selectedSubcategories.includes(subcategory.name)}
                          onCheckedChange={() => handleSubcategoryToggle(subcategory.name)}
                          className="h-3.5 w-3.5"
                        />
                        <span className="text-xs text-gray-700">{subcategory.name}</span>
                      </label>
                    );
                  })}
                  {subcategories.length === 0 && (
                    <p className="text-xs text-gray-500 italic py-1.5">No subcategories available</p>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Sort Dropdown */}
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-sm">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Mobile Category Scroll */}
            <div className="flex gap-1.5 overflow-x-auto pb-1.5 hide-scrollbar">
              <button
                onClick={() => handleCategoryChange('all')}
                className={cn(
                  "px-3 py-1.5 rounded-full whitespace-nowrap text-xs font-medium transition-all",
                  selectedCategory === 'all'
                    ? "bg-purple-500 text-white"
                    : "bg-white text-gray-700 border border-gray-200"
                )}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category._id}
                  onClick={() => handleCategoryChange(category.name)}
                  className={cn(
                    "px-3 py-1.5 rounded-full whitespace-nowrap text-xs font-medium transition-all",
                    selectedCategory === category.name
                      ? "bg-purple-500 text-white"
                      : "bg-white text-gray-700 border border-gray-200"
                  )}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="lg:grid lg:grid-cols-[220px,1fr] lg:gap-6">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <FilterSidebar />
              </div>
            </aside>

            {/* Products Section */}
            <div>
              {/* Desktop Toolbar */}
              <div className="hidden lg:flex gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    type="search"
                    placeholder="Search sweets..."
                    value={search}
                    onChange={handleSearchChange}
                    className="w-full"
                  />
                </div>
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-[200px]">
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

              {/* Active Filters Display */}
              {(selectedSubcategories.length > 0 || selectedCategory !== 'all') && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {selectedCategory !== 'all' && (
                    <div className="flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                      <span>{selectedCategory}</span>
                      <button onClick={() => handleCategoryChange('all')}>
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {selectedSubcategories.map((sub) => (
                    <div key={sub} className="flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                      <span>{sub}</span>
                      <button onClick={() => handleSubcategoryToggle(sub)}>
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Products Grid - 4 columns on large screens for wider cards */}
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                  {[...Array(10)].map((_, i) => (
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
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
                <div className="text-center py-16 bg-white rounded-2xl">
                  <div className="text-6xl mb-4">🔍</div>
                  <p className="text-gray-600 text-lg mb-4">
                    No products found matching your criteria.
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              )}

              {/* Pagination */}
              {pages > 1 && !loading && (
                <div className="flex justify-center mt-8 flex-wrap gap-2">
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
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Products;