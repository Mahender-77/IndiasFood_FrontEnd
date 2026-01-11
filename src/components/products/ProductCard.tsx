import { Link } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';
import { useState } from 'react'; // Import useState
import { Loader2 } from 'lucide-react'; // Import Loader2 icon

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, toggleWishlist, isInWishlist, cartLoading } = useCart();
  const inWishlist = isInWishlist(product._id);
  const [isAdding, setIsAdding] = useState(false); // Local loading state for Add to Cart

  const handleAddToCart = async () => {
    setIsAdding(true);
    await addToCart(product._id, 1);
    setIsAdding(false);
  };

  return (
    <div className="group relative bg-card rounded-2xl overflow-hidden shadow-card card-hover">
      {/* Image Container */}
      <Link to={`/product/${product._id}`} className="block relative aspect-square overflow-hidden">
        <img
          src={product.images && product.images.length > 0 ? product.images[0] : '/assets/placeholder.svg'}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Sold Out Badge */}
        {product.countInStock === 0 && (
          <div className="absolute top-3 left-3">
            <span className="px-3 py-1 bg-destructive text-destructive-foreground text-xs font-semibold rounded-full">
              Sold Out
            </span>
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product._id);
          }}
          className={cn(
            "absolute top-3 right-3 p-2 rounded-full transition-all duration-300",
            inWishlist
              ? "bg-secondary text-secondary-foreground"
              : "bg-background/80 text-foreground hover:bg-background"
          )}
          disabled={cartLoading} // Disable if any cart operation is in progress
        >
          <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} />
        </button>
      </Link>

      {/* Content */}
      <div className="p-3">
        <Link to={`/product/${product._id}`}>
          <h3 className="font-display text-base font-semibold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        
        <p className="text-muted-foreground text-xs mb-2 line-clamp-2">
          {product.description}
        </p>

        <div className="text-base font-semibold text-gray-900">
          ₹{product.price}
          {product.weight && ` / ${product.weight}`}
        </div>
        {product.shelfLife && <div className="text-xs text-gray-500">{product.shelfLife}</div>}
        <div className={`text-xs ${product.countInStock === 0 ? 'text-red-500' : 'text-green-600'}`}>
          {product.countInStock === 0 ? 'Out of Stock' : `${product.countInStock} left`}
        </div>

        <div className="flex items-center justify-between mt-2">
          
          <Button
            size="xs"
            variant="cart"
            disabled={product.countInStock === 0 || isAdding || cartLoading}
            onClick={handleAddToCart}
            className="gap-1 px-3"
          >
            {isAdding ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShoppingCart className="h-3 w-3" />}
            {isAdding ? "Adding..." : "Add"}
          </Button>
        </div>
      </div>
    </div>
  );
}
