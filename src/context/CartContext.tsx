import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import api from '@/lib/api'; // Use the configured axios instance
import { CartItem, Product, User } from '@/types';
import { useAuth } from './AuthContext';

interface CartState {
  items: CartItem[];
  wishlist: string[];
  loading: boolean; // Add loading state
  error: string | null; // Add error state
}

type CartAction =
  | { type: 'SET_CART'; payload: CartItem[] }
  | { type: 'SET_WISHLIST'; payload: string[] }
  | { type: 'CLEAR_ALL' }
  | { type: 'SET_LOADING'; payload: boolean } // Action to set loading state
  | { type: 'SET_ERROR'; payload: string | null }; // Action to set error state

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_CART':
      return { ...state, items: action.payload };
    case 'SET_WISHLIST':
      return { ...state, wishlist: action.payload };
    case 'CLEAR_ALL':
      return { ...state, items: [], wishlist: [] };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

interface CartContextType {
  state: CartState;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  cartTotal: number;
  cartCount: number;
  fetchCartAndWishlist: () => Promise<void>;
  cartLoading: boolean; // Expose loading state
  cartError: string | null; // Expose error state
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: JSON.parse(localStorage.getItem('cartItems') || '[]'),
    wishlist: JSON.parse(localStorage.getItem('wishlistItems') || '[]'),
    loading: false,
    error: null,
  });
  const { user, token, loading: authLoading } = useAuth();

  // Effect to load cart and wishlist from backend on user login
  const fetchCartAndWishlist = useCallback(async () => {
    if (!user || !token) {
      localStorage.removeItem('cartItems');
      localStorage.removeItem('wishlistItems');
      dispatch({ type: 'CLEAR_ALL' });
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_ERROR', payload: null });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const { data: cartData } = await api.get('/user/cart');
      dispatch({ type: 'SET_CART', payload: cartData });

      const { data: wishlistData } = await api.get('/user/wishlist');
      dispatch({ type: 'SET_WISHLIST', payload: wishlistData.map((item: Product) => item._id) });
    } catch (error: any) {
      console.error('Failed to fetch cart or wishlist', error);
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to fetch cart/wishlist' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user, token]); // Removed authLoading from dependencies as it's handled by user/token

  useEffect(() => {
    if (!authLoading) {
      fetchCartAndWishlist();
    }
  }, [user, authLoading, fetchCartAndWishlist]);

  // Effect to save cart items to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(state.items));
  }, [state.items]);

  // Effect to save wishlist items to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('wishlistItems', JSON.stringify(state.wishlist));
  }, [state.wishlist]);

  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!user || !token) {
      // Fallback for guest users or if not logged in: manage in local storage only
      const existingCartItems: CartItem[] = JSON.parse(localStorage.getItem('cartItems') || '[]');
      const existingItemIndex = existingCartItems.findIndex(item => (item.product as string) === productId);

      if (existingItemIndex > -1) {
        existingCartItems[existingItemIndex].qty += quantity;
      } else {
        try {
          const { data: productData } = await api.get(`/products/${productId}`);
          existingCartItems.push({ product: productData, qty: quantity });
        } catch (error) {
          console.error('Failed to fetch product details for guest cart', error);
          return;
        }
      }
      dispatch({ type: 'SET_CART', payload: existingCartItems });
      return;
    }
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const { data } = await api.post('/user/cart', { productId, qty: quantity });
      dispatch({ type: 'SET_CART', payload: data });
    } catch (error: any) {
      console.error('Failed to add to cart', error);
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to add to cart' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!user || !token) {
      const existingCartItems: CartItem[] = JSON.parse(localStorage.getItem('cartItems') || '[]');
      const updatedCartItems = existingCartItems.filter(item => (item.product as Product)._id !== productId);
      dispatch({ type: 'SET_CART', payload: updatedCartItems });
      return;
    }
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const { data } = await api.post('/user/cart', { productId, qty: 0 });
      dispatch({ type: 'SET_CART', payload: data });
    } catch (error: any) {
      console.error('Failed to remove from cart', error);
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to remove from cart' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!user || !token) {
      if (quantity <= 0) {
        removeFromCart(productId);
        return;
      }
      const existingCartItems: CartItem[] = JSON.parse(localStorage.getItem('cartItems') || '[]');
      const existingItemIndex = existingCartItems.findIndex(item => (item.product as Product)._id === productId);

      if (existingItemIndex > -1) {
        existingCartItems[existingItemIndex].qty = quantity;
        dispatch({ type: 'SET_CART', payload: existingCartItems });
      }
      return;
    }
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const { data } = await api.post('/user/cart', { productId, qty: quantity });
      dispatch({ type: 'SET_CART', payload: data });
    } catch (error: any) {
      console.error('Failed to update quantity', error);
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to update quantity' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const clearCart = async () => {
    if (!user || !token) {
      localStorage.removeItem('cartItems');
      dispatch({ type: 'CLEAR_ALL' });
      return;
    }
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      // A dedicated clear cart endpoint would be more efficient here.
      // For now, we simulate by removing all items.
      for (const item of state.items) {
        await removeFromCart((item.product as Product)._id);
      }
      dispatch({ type: 'CLEAR_ALL' });
      await fetchCartAndWishlist(); // Re-fetch to ensure sync with an empty backend cart
    } catch (error: any) {
      console.error('Failed to clear cart', error);
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to clear cart' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const toggleWishlist = async (productId: string) => {
    if (!user || !token) {
      let existingWishlistItems: string[] = JSON.parse(localStorage.getItem('wishlistItems') || '[]');
      if (existingWishlistItems.includes(productId)) {
        existingWishlistItems = existingWishlistItems.filter(id => id !== productId);
      } else {
        existingWishlistItems.push(productId);
      }
      dispatch({ type: 'SET_WISHLIST', payload: existingWishlistItems });
      return;
    }
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const { data } = await api.post('/user/wishlist', { productId });
      dispatch({ type: 'SET_WISHLIST', payload: data });
    } catch (error: any) {
      console.error('Failed to toggle wishlist', error);
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to toggle wishlist' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const isInWishlist = (productId: string) => {
    return state.wishlist.includes(productId);
  };

  const cartTotal = state.items.reduce((total, item) => {
    const productPrice = (item.product as Product)?.price;
    return total + (productPrice !== undefined ? productPrice : 0) * item.qty;
  }, 0);

  const cartCount = state.items.reduce((count, item) => count + item.qty, 0);

  return (
    <CartContext.Provider
      value={{
        state,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleWishlist,
        isInWishlist,
        cartTotal,
        cartCount,
        fetchCartAndWishlist,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 


