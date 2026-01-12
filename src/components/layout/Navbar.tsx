import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Heart, User, Menu, X, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { cartCount, state } = useCart();
  const { user, logout, isAdmin, isDelivery } = useAuth(); // Destructure isAdmin and isDelivery

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Sweets' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  const [searchTerm, setSearchTerm] = useState(''); // New state for search term

  const handleLogout = () => {
    logout();
    navigate('/auth');
    setIsMenuOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
      setIsSearchOpen(false); // Close mobile search after searching
      setSearchTerm(''); // Clear search term after navigation
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="container-custom">
        <div className="flex h-14 md:h-16 lg:h-20 items-center justify-between gap-2 sm:gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/IndiasFood-.png" alt="India's Food Logo" className="h-10 md:h-12 lg:h-14 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === link.href
                    ? "bg-saffron-light text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname.startsWith('/admin')
                    ? "bg-saffron-light text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                Admin
              </Link>
            )}
            {isDelivery && (
              <Link
                to="/delivery"
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname.startsWith('/delivery')
                    ? "bg-saffron-light text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                Delivery Dashboard
              </Link>
            )}
            {user && (
              <Link
                to="/orders"
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === '/orders'
                    ? "bg-saffron-light text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                Orders
              </Link>
            )}
            {user && (
              <Link
                to="/profile"
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === '/profile'
                    ? "bg-saffron-light text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                Profile
              </Link>
            )}
          </nav>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-sm">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for sweets..."
                className="pl-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Mobile Search Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Wishlist */}
            <Link to="/wishlist">
              <Button variant="ghost" size="icon" className="relative h-8 w-8">
                <Heart className="h-4 w-4" />
                {state.wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-secondary text-secondary-foreground text-xxs sm:text-xs flex items-center justify-center font-medium">
                    {state.wishlist.length}
                  </span>
                )}
              </Button>
            </Link>

            {/* Cart */}
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative h-8 w-8">
                <ShoppingCart className="h-4 w-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary text-primary-foreground text-xxs sm:text-xs flex items-center justify-center font-medium">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* User Account / Profile / Logout */}
            {user ? (
              <div className="relative group ">
                <Button variant="ghost" className="flex items-center gap-1 sm:gap-2 h-8 px-2">
                  <User className="h-4 w-4" />
                  <span className="hidden md:inline-block text-sm">{user.username} {isAdmin && '(Admin)'} {isDelivery && '(Delivery)'}</span>
                </Button>
                <div className="absolute right-0 top-full w-36 sm:w-48 rounded-md shadow-lg bg-card ring-1 ring-black ring-opacity-5 focus:outline-none invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 border ">
                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="block px-3 py-2 text-sm text-foreground hover:bg-muted"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="block px-3 py-2 text-sm text-foreground hover:bg-muted"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    {isDelivery && (
                      <Link
                        to="/delivery"
                        className="block px-3 py-2 text-sm text-foreground hover:bg-muted"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Delivery Dashboard
                      </Link>
                    )}
                    <Link
                      to="/orders"
                      className="block px-3 py-2 text-sm text-foreground hover:bg-muted"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Orders
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-destructive hover:bg-muted"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <User className="h-4 w-4" />
                </Button>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        {isSearchOpen && (
          <form onSubmit={handleSearch} className="container-custom lg:hidden pb-3 animate-slide-up">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for sweets..."
                className="pl-10 bg-muted/50 border-0"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </form>
        )}

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="container-custom md:hidden pb-3 animate-slide-up">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    location.pathname === link.href
                      ? "bg-saffron-light text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    location.pathname.startsWith('/admin')
                      ? "bg-saffron-light text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  Admin
                </Link>
              )}
              {isDelivery && (
                <Link
                  to="/delivery"
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    location.pathname.startsWith('/delivery')
                      ? "bg-saffron-light text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  Delivery
                </Link>
              )}
              {user && (
                <Link
                  to="/orders"
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    location.pathname === '/orders'
                      ? "bg-saffron-light text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  Orders
                </Link>
              )}
              {user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      location.pathname === '/profile'
                        ? "bg-saffron-light text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors text-destructive hover:bg-muted"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    location.pathname === '/auth'
                      ? "bg-saffron-light text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  Sign In
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
