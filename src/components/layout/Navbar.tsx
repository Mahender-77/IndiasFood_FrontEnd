import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Heart,LogIn, User,Menu, X, LogOut, ChevronDown, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface Category {
  _id: string;
  name: string;
  isActive?: boolean;
  subcategories?: Array<{
    _id?: string;
    name: string;
    isActive?: boolean;
  }>;
}

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isMobileProductsOpen, setIsMobileProductsOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { cartCount, state } = useCart();
  const { user, logout, isAdmin, isDelivery } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);

  // Fetch categories from backend
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

  // Dynamic product categories from backend
  const productCategories = Array.isArray(categories) ? categories.map(cat => ({
    name: cat.name,
    href: `/products?category=${encodeURIComponent(cat.name)}`
  })) : [];

  const mainNavLinks = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Products', hasDropdown: true },
    { href: '/gi-tag-products', label: 'GI Tag Products' },
    { href: '/new-arrivals', label: 'New Arrivals' },
    // { href: '/orders', label: 'Orders' },
   
    { href: '/gifting', label: 'Gifting' },
    { href: '/bulk-orders', label: 'Bulk Orders' },
    { href: '/about', label: 'About Us' },
    { href: '/help', label: 'Help' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/auth');
    setIsMenuOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
      setIsSearchOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      {/* Desktop Navigation - Two Layer Design */}
      <div className="hidden lg:block">
        {/* First Layer - Logo, Search Bar, Icons */}
        <div className="bg-cream ">
          <div className="container mx-auto px-10">
            <div className="flex h-22 items-center justify-around  ">
              <div className="flex items-center justify-center " >
                  {/* Logo */}
              <Link to="/" className="flex items-center shrink-0">
                <img
                  src="/IndiasFood.png"
                  alt="India's Food"
                  className="h-24 w-auto"
                />
              </Link>
              <div>
              <h1 className="text-3xl whitespace-nowrap logo-animated-text">
  India's Food
</h1>

              </div>

              {/* Home Icon and Text */}
              {/* <Link to="/" className="flex items-center gap-3 ml-6 group">
                <div className="flex items-center justify-center w-10 h-10 bg-orange-50 rounded-full group-hover:bg-orange-100 transition-colors">
                  <Home className="h-5 w-5 text-orange-600" />
                </div>
                <span className="text-lg font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                  Home
                </span>
              </Link> */}
              </div>
            

              {/* Large Search Bar */}
              <div className="flex-1 max-w-3xl mx-8">
                <form onSubmit={handleSearch} className="w-full">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="search"
                      placeholder="Search for favourite food"
                      className="w-full h-12 pl-12 pr-4 text-base bg-gray-50 border border-gray-300 rounded-lg focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </form>
              </div>

              {/* Right Icons */}
              <div className="flex items-center gap-6 shrink-0">

{user ? (
  <>
    {/* Wishlist */}
    <Link to="/wishlist" className="flex flex-col items-center gap-1 group">
      <div className="relative">
        <Heart className="h-6 w-6 text-gray-700 group-hover:text-orange-600 transition-colors" />
        {state.wishlist.length > 0 && (
          <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
            {state.wishlist.length}
          </span>
        )}
      </div>
      <span className="text-xs text-gray-600 group-hover:text-orange-600">
        Wishlist
      </span>
    </Link>

    {/* Cart */}
    <Link to="/cart" className="flex flex-col items-center gap-1 group">
      <div className="relative">
        <ShoppingCart className="h-6 w-6 text-gray-700 group-hover:text-orange-600 transition-colors" />
        {cartCount > 0 && (
          <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-semibold">
            {cartCount}
          </span>
        )}
      </div>
      <span className="text-xs text-gray-600 group-hover:text-orange-600">
        Cart
      </span>
    </Link>

    {/* Profile Dropdown */}
    <div className="relative group z-50">
      <div className="flex flex-col items-center gap-1 cursor-pointer">
        <User className="h-6 w-6 text-gray-700 group-hover:text-orange-600 transition-colors" />
        <span className="text-xs text-gray-600 group-hover:text-orange-600">
          Profile
        </span>
      </div>

      <div className="absolute right-0 top-full mt-2 w-48 rounded-md shadow-lg bg-background ring-1 ring-black ring-opacity-5 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-50">
        <div className="py-1">
          <div className="px-4 py-2 text-sm text-gray-700 border-b">
            <div className="font-medium">{user.username}</div>
            {isAdmin && <div className="text-xs text-orange-600">Admin</div>}
            {isDelivery && <div className="text-xs text-blue-600">Delivery</div>}
          </div>

          <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            My Profile
          </Link>

          <Link to="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            My Orders
          </Link>

          {isAdmin && (
            <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              Admin Dashboard
            </Link>
          )}

          {isDelivery && (
            <Link to="/delivery" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              Delivery Dashboard
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  </>
) : (
  /* Show Login Button ONLY if not on /auth */
  !location.pathname.startsWith("/auth") && (
    <Link to="/auth">
      <Button
        className="bg-orange-600 hover:bg-orange-700 text-white h-9 px-4 rounded-full text-sm font-semibold flex items-center gap-2 shadow-sm transition-all active:scale-95"
      >
        <LogIn className="h-4 w-4" />
        Login
      </Button>
    </Link>
  )
)}

</div>


            </div>
          </div>
        </div>

        {/* Second Layer - Navigation Links with Orange Background */}
        <div className="bg-orange-600">
          <div className="container mx-auto px-6">
            <nav className="flex items-center justify-center h-12">
              <ul className="flex items-center gap-16">
                {mainNavLinks.map((link) => (
                  <li key={link.href} className="relative group">
                    {link.hasDropdown ? (
                      <>
                        <button
                          className="flex items-center text-white font-medium text-md hover:text-orange-100 transition-colors "
                          onMouseEnter={() => setIsProductsOpen(true)}
                          onMouseLeave={() => setIsProductsOpen(false)}
                        >
                          {link.label}
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        {isProductsOpen && (
                          <div
                            className="absolute left-0 top-full mt-0 w-56 bg-white rounded-b-md shadow-lg ring-1 ring-black ring-opacity-5 z-50"
                            onMouseEnter={() => setIsProductsOpen(true)}
                            onMouseLeave={() => setIsProductsOpen(false)}
                          >
                            <div className="py-2">
                              {productCategories.map((category) => (
                                <Link
                                  key={category.href}
                                  to={category.href}
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                                >
                                  {category.name}
                                </Link>
                              ))}
                              <Link
                                to="/products"
                                className="block px-4 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50 border-t"
                              >
                                View All Products
                              </Link>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <Link
                        to={link.href}
                        className={cn(
                          "text-white font-medium text-md hover:text-orange-100 transition-colors ",
                          location.pathname === link.href && "text-orange-100"
                        )}
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </div>

     
     {/* Mobile Navigation - Single Layer */}
     <div className="lg:hidden bg-background">
        <div className="container mx-auto px-2">
          <div className="flex h-18 items-center justify-between">
            {/* Logo and Text Group */}
            <div className="flex items-center shrink-0">
              <Link to="/" className="shrink-0">
                <img 
                  src="/IndiasFood.png" 
                  alt="India's Food" 
                  className="h-14 w-auto" 
                />
              </Link>

              {/* India's Food Text with fade animation */}
              <div 
                className={cn(
                  "transition-all duration-300 ease-in-out",
                  isSearchOpen ? "w-0 opacity-0 overflow-hidden" : "opacity-100"
                )}
              >
                <span className="text-lg font-bold logo-animated-text whitespace-nowrap">
                  India's Food
                </span>
              </div>
            </div>

            {/* Search Bar with slide-in animation */}
            <div 
              className={cn(
                "transition-all duration-300 ease-in-out overflow-hidden",
                isSearchOpen ? "flex-1 opacity-100 mx-2" : "w-0 opacity-0"
              )}
            >
          {/* <form onSubmit={handleSearch}> */}
  <div
      onSubmit={handleSearch}
   className="relative w-full h-9 bg-gray-50 rounded-lg border border-gray-200 flex items-center overflow-hidden"
  >
    <Search className="absolute left-1.5 h-4 w-4 text-gray-400 pointer-events-none" />

    <Input
            type="search"
            placeholder="Search..."
            className="w-full h-full pl-6 pr-10 text-sm bg-transparent border-0 outline-none ring-0 shadow-none focus:outline-none focus:ring-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none text-gray-700 placeholder:text-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch(e);
              }
            }}
            autoFocus={isSearchOpen}
          />

<Button
            variant="ghost"
            size="icon"
            className="absolute right-1 h-7 w-7 flex items-center justify-center rounded-md hover:bg-gray-200 transition-colors"
            type="button"
            onClick={() => {
              setIsSearchOpen(false);
              setSearchTerm('');
            }}
          >
            <X className="h-4 w-4 text-gray-500" />
          </Button>
  </div>
{/* </form> */}

            </div>

 <div className="flex items-center gap-1 shrink-0">

  {user ? (
    <>
      {/* Search Icon */}
      {!isSearchOpen && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6"  
          onClick={() => setIsSearchOpen(true)}
        >
          <Search className="h-5 w-5 text-gray-700" />
        </Button>
      )}

      {/* Wishlist */}
      <Link to="/wishlist">
        <Button variant="ghost" size="icon" className="relative h-6 w-6">
          <Heart className="h-6 w-4" />
          {state.wishlist.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
              {state.wishlist.length}
            </span>
          )}
        </Button>
      </Link>

      {/* Cart */}
      <Link to="/cart">
        <Button variant="ghost" size="icon" className="relative h-6 w-6">
          <ShoppingCart className="h-6 w-4" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-semibold">
              {cartCount}
            </span>
          )}
        </Button>
      </Link>

      {/* Profile */}
      <Link to="/profile">
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <User className="h-6 w-4" />
        </Button>
      </Link>

      {/* Menu */}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
    </>
  ) : (
    <>
      {location.pathname === "/auth" ? (
        /* ON LOGIN PAGE → SHOW HOME ICON */
        <Link to="/">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
          >
            <Home className="h-7 w-7 text-orange-600" />
          </Button>
        </Link>
      ) : (
        /* NOT ON LOGIN PAGE → SHOW SMALL LOGIN BUTTON */
        <Link to="/auth">
          <Button
            className="bg-orange-600 hover:bg-orange-700 text-white h-6 px-2 rounded text-[10px] font-medium flex items-center gap-1 shadow-sm"
          >
            <LogIn className="h-1 w-1" />
            Login
          </Button>
        </Link>
      )}
    </>
  )}

</div>



          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="border-t bg-backgound shadow-lg animate-slide-down">
            <nav className="container mx-auto">
              <div className="flex flex-col">
                {/* Home Link - First in menu */}
                <Link
                  to="/"
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    location.pathname === "/" ? "bg-orange-50 text-orange-600" : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Home className="w-4 h-4" />
                  Home
                </Link>

                {/* Products with Dropdown */}
                <div>
                  <button
                    onClick={() => setIsMobileProductsOpen(!isMobileProductsOpen)}
                    className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Products
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform",
                      isMobileProductsOpen && "rotate-180"
                    )} />
                  </button>
                  {isMobileProductsOpen && (
                    <div className="ml-4 mt-1 space-y-1">
                      {productCategories.map((category) => (
                        <Link
                          key={category.href}
                          to={category.href}
                          onClick={() => setIsMenuOpen(false)}
                          className="block px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
                        >
                          {category.name}
                        </Link>
                      ))}
                      <Link
                        to="/products"
                        onClick={() => setIsMenuOpen(false)}
                        className="block px-4 py-2 rounded-lg text-sm font-medium text-orange-600 hover:bg-orange-50"
                      >
                        View All Products
                      </Link>
                    </div>
                  )}
                </div>

                {/* Other Nav Links */}
                {mainNavLinks.filter(link => !link.hasDropdown && link.href !== '/').map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      location.pathname === link.href
                        ? "bg-orange-50 text-orange-600"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}

                {/* User-specific Links */}
                {user && (
                  <>
                    <div className="border-t my-2"></div>
                    <Link
                      to="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      My Profile
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setIsMenuOpen(false)}
                      className="px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      My Orders
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsMenuOpen(false)}
                        className="px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    {isDelivery && (
                      <Link
                        to="/delivery"
                        onClick={() => setIsMenuOpen(false)}
                        className="px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Delivery Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}