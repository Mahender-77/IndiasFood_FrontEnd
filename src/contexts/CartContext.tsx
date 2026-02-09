import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { CartItem, Product } from '@/types';
import { useAuth } from './AuthContext';

interface CartState {
  items: CartItem[];
  wishlist: string[];
  loading: boolean;
  error: string | null;
}

type CartAction =
  | { type: 'SET_CART'; payload: CartItem[] }
  | { type: 'SET_WISHLIST'; payload: string[] }
  | { type: 'CLEAR_ALL' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_ITEM_OPTIMISTIC'; payload: { productId: string; variantIndex: number; qty: number } }
  | { type: 'REMOVE_ITEM_OPTIMISTIC'; payload: { productId: string; variantIndex: number } }
  | { type: 'UPDATE_VARIANT_OPTIMISTIC'; payload: { productId: string; oldVariantIndex: number; newVariantIndex: number; qty: number } };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_CART':
      return {
        ...state,
        items: Array.isArray(action.payload) ? action.payload : []
      };
    
    case 'UPDATE_ITEM_OPTIMISTIC': {
      const { productId, variantIndex, qty } = action.payload;
      const existingIndex = state.items.findIndex(item => {
        const product = item.product as Product;
        return product?._id === productId && item.selectedVariantIndex === variantIndex;
      });

      if (existingIndex > -1) {
        const newItems = [...state.items];
        newItems[existingIndex] = { ...newItems[existingIndex], qty };
        return { ...state, items: newItems };
      }
      return state;
    }

    case 'REMOVE_ITEM_OPTIMISTIC': {
      const { productId, variantIndex } = action.payload;
      return {
        ...state,
        items: state.items.filter(item => {
          const product = item.product as Product;
          return !(product?._id === productId && item.selectedVariantIndex === variantIndex);
        })
      };
    }

    case 'UPDATE_VARIANT_OPTIMISTIC': {
      const { productId, oldVariantIndex, newVariantIndex, qty } = action.payload;
      return {
        ...state,
        items: state.items.map(item => {
          const product = item.product as Product;
          if (product?._id === productId && item.selectedVariantIndex === oldVariantIndex) {
            return { ...item, selectedVariantIndex: newVariantIndex, qty };
          }
          return item;
        })
      };
    }

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
  addToCart: (productId: string, quantity?: number, selectedVariantIndex?: number) => Promise<void>;
  removeFromCart: (productId: string, selectedVariantIndex?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number, selectedVariantIndex?: number) => Promise<void>;
  updateCartItemQuantity: (productId: string, quantity: number, selectedVariantIndex?: number) => Promise<void>;
  updateCartItemVariant: (productId: string, currentVariantIndex: number, newVariantIndex: number) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  getCartItemQuantity: (productId: string, selectedVariantIndex?: number) => number;
  cartTotal: number;
  cartCount: number;
  fetchCartAndWishlist: () => Promise<void>;
  cartLoading: boolean;
  cartError: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    wishlist: [],
    loading: false,
    error: null,
  });
  const { user, token, loading: authLoading } = useAuth();

  const fetchCartAndWishlist = useCallback(async () => {
    if (!user || !token) {
      const localCart = localStorage.getItem('cartItems');
      const localWishlist = localStorage.getItem('wishlistItems');
      
      if (localCart) {
        try {
          const parsedLocalCart = JSON.parse(localCart);
          console.log('Parsed local cart from localStorage:', parsedLocalCart);
          dispatch({ type: 'SET_CART', payload: parsedLocalCart });
        } catch (e) {
          console.error('Failed to parse cart from localStorage:', e);
          localStorage.removeItem('cartItems');
        }
      }
      
      if (localWishlist) {
        try {
          dispatch({ type: 'SET_WISHLIST', payload: JSON.parse(localWishlist) });
        } catch (e) {
          console.error('Failed to parse wishlist from localStorage:', e);
          localStorage.removeItem('wishlistItems');
        }
      }
      
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      const localCart = localStorage.getItem('cartItems');
      let mergedCartData = [];
      
      if (localCart) {
        const guestCartItems: CartItem[] = JSON.parse(localCart);
        console.log('Detected guest cart items after login:', guestCartItems);
        if (guestCartItems.length > 0) {
          const itemsToMerge = guestCartItems.map(item => ({
            productId: (item.product as Product)._id,
            qty: item.qty,
            selectedVariantIndex: item.selectedVariantIndex
          }));
          console.log('Items to merge sent to API:', itemsToMerge);
          
          const { data } = await api.post('/user/cart/merge', { items: itemsToMerge });
          console.log('Response from merge API:', data);
          mergedCartData = data; // This will be the combined cart
          localStorage.removeItem('cartItems');
          console.log('Guest cart cleared from localStorage.');
        }
      }

      const { data: cartData } = await api.get('/user/cart');
      console.log('Fetched authenticated cart data:', cartData);
      // If there was a guest cart merged, use its result, otherwise use fetched cart
      const finalCartData = mergedCartData.length > 0 ? mergedCartData : cartData;
      console.log('Final cart data for dispatch:', finalCartData);

      const { data: wishlistData } = await api.get('/user/wishlist');

      dispatch({ type: 'SET_CART', payload: Array.isArray(finalCartData) ? finalCartData : [] });
      dispatch({ type: 'SET_WISHLIST', payload: Array.isArray(wishlistData) ? wishlistData.map((item: Product) => item._id) : [] });
    } catch (error: any) {
      console.error('Failed to fetch cart or wishlist', error);
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to fetch cart/wishlist' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user, token]);

  useEffect(() => {
    if (!authLoading) {
      fetchCartAndWishlist();
    }
  }, [user, authLoading, fetchCartAndWishlist]);

  useEffect(() => {
    if (!user && state.items.length >= 0) {
      localStorage.setItem('cartItems', JSON.stringify(state.items));
    }
  }, [state.items, user]);

  useEffect(() => {
    if (!user && state.wishlist.length >= 0) {
      localStorage.setItem('wishlistItems', JSON.stringify(state.wishlist));
    }
  }, [state.wishlist, user]);

  const addToCart = async (productId: string, quantity: number = 1, selectedVariantIndex: number = 0) => {
    if (!user || !token) {
      const existingCartItems: CartItem[] = [...state.items];
      const existingItemIndex = existingCartItems.findIndex(item => {
        const product = item.product as Product;
        return product && product._id === productId && item.selectedVariantIndex === selectedVariantIndex;
      });

      if (existingItemIndex > -1) {
        existingCartItems[existingItemIndex].qty += quantity;
      } else {
        try {
          const { data: productData } = await api.get(`/products/${productId}`);
          console.log('Fetched productData for guest cart:', productData);
          existingCartItems.push({
            product: productData,
            qty: quantity,
            selectedVariantIndex
          });
        } catch (error) {
          console.error('Failed to fetch product for guest cart', error);
          return;
        }
      }
      console.log('Guest cart items before setting:', existingCartItems);
      dispatch({ type: 'SET_CART', payload: existingCartItems });
      return;
    }

    // Optimistic update
    const existingItem = state.items.find(item => {
      const product = item.product as Product;
      return product?._id === productId && item.selectedVariantIndex === selectedVariantIndex;
    });

    if (existingItem) {
      dispatch({
        type: 'UPDATE_ITEM_OPTIMISTIC',
        payload: { productId, variantIndex: selectedVariantIndex, qty: existingItem.qty + quantity }
      });
    }
    
    try {
      const { data } = await api.post('/user/cart', {
        productId,
        qty: quantity,
        selectedVariantIndex
      });
      dispatch({ type: 'SET_CART', payload: data });
    } catch (error: any) {
      console.error('Failed to add to cart', error);
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to add to cart' });
      await fetchCartAndWishlist(); // Revert on error
    }
  };

  const removeFromCart = async (productId: string, selectedVariantIndex: number = 0) => {
    if (!user || !token) {
      const updatedCartItems = state.items.filter(item => {
        const product = item.product as Product;
        return !(product && product._id === productId && item.selectedVariantIndex === selectedVariantIndex);
      });
      dispatch({ type: 'SET_CART', payload: updatedCartItems });
      return;
    }

    // Optimistic update
    dispatch({ type: 'REMOVE_ITEM_OPTIMISTIC', payload: { productId, variantIndex: selectedVariantIndex } });
    
    try {
      const { data } = await api.post('/user/cart', { 
        productId, 
        qty: 0,
        selectedVariantIndex 
      });
      dispatch({ type: 'SET_CART', payload: data });
    } catch (error: any) {
      console.error('Failed to remove from cart', error);
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to remove from cart' });
      await fetchCartAndWishlist(); // Revert on error
    }
  };

  const updateQuantity = async (productId: string, quantity: number, selectedVariantIndex: number = 0) => {
    if (quantity <= 0) {
      await removeFromCart(productId, selectedVariantIndex);
      return;
    }

    if (!user || !token) {
      const updatedCartItems = state.items.map(item => {
        const product = item.product as Product;
        if (product && product._id === productId && item.selectedVariantIndex === selectedVariantIndex) {
          return { ...item, qty: quantity };
        }
        return item;
      });
      dispatch({ type: 'SET_CART', payload: updatedCartItems });
      return;
    }

    // Optimistic update
    dispatch({
      type: 'UPDATE_ITEM_OPTIMISTIC',
      payload: { productId, variantIndex: selectedVariantIndex, qty: quantity }
    });
    
    try {
      const { data } = await api.post('/user/cart', { 
        productId, 
        qty: quantity,
        selectedVariantIndex
      });
      dispatch({ type: 'SET_CART', payload: data });
    } catch (error: any) {
      console.error('Failed to update quantity', error);
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to update quantity' });
      await fetchCartAndWishlist(); // Revert on error
    }
  };

  const updateCartItemVariant = async (productId: string, currentVariantIndex: number, newVariantIndex: number) => {
    const currentItem = state.items.find(item => {
      const product = item.product as Product;
      return product?._id === productId && item.selectedVariantIndex === currentVariantIndex;
    });

    if (!currentItem) return;

    if (!user || !token) {
      const updatedCartItems = state.items.map(item => {
        const product = item.product as Product;
        if (product && product._id === productId && item.selectedVariantIndex === currentVariantIndex) {
          return { ...item, selectedVariantIndex: newVariantIndex };
        }
        return item;
      });
      dispatch({ type: 'SET_CART', payload: updatedCartItems });
      return;
    }

    // Optimistic update
    dispatch({
      type: 'UPDATE_VARIANT_OPTIMISTIC',
      payload: { productId, oldVariantIndex: currentVariantIndex, newVariantIndex, qty: currentItem.qty }
    });

    try {
      // Remove old variant
      await api.post('/user/cart', {
        productId,
        qty: 0,
        selectedVariantIndex: currentVariantIndex
      });

      // Add new variant
      const { data } = await api.post('/user/cart', {
        productId,
        qty: currentItem.qty,
        selectedVariantIndex: newVariantIndex
      });
      
      dispatch({ type: 'SET_CART', payload: data });
    } catch (error: any) {
      console.error('Failed to update variant', error);
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to update variant' });
      await fetchCartAndWishlist(); // Revert on error
    }
  };

  const clearCart = async () => {
    if (!user || !token) {
      localStorage.removeItem('cartItems');
      dispatch({ type: 'SET_CART', payload: [] });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      for (const item of state.items) {
        const product = item.product as Product;
        if (product) {
          await removeFromCart(product._id, item.selectedVariantIndex);
        }
      }
      dispatch({ type: 'SET_CART', payload: [] });
    } catch (error: any) {
      console.error('Failed to clear cart', error);
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to clear cart' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const toggleWishlist = async (productId: string) => {
    if (!user || !token) {
      let wishlist = [...state.wishlist];
      if (wishlist.includes(productId)) {
        wishlist = wishlist.filter(id => id !== productId);
      } else {
        wishlist.push(productId);
      }
      dispatch({ type: 'SET_WISHLIST', payload: wishlist });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
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

  const isInWishlist = (productId: string) => state.wishlist.includes(productId);

  const getCartItemQuantity = (productId: string, selectedVariantIndex: number = 0) => {
    const item = state.items.find(item => {
      const product = item.product as Product;
      return product && product._id === productId && item.selectedVariantIndex === selectedVariantIndex;
    });
    return item ? item.qty : 0;
  };

  const cartTotal = state.items.reduce((total, item) => {
    const product = item.product as Product;
    if (!product) return total;

    let price = 0;
    if (product.variants && product.variants.length > 0 && item.selectedVariantIndex !== undefined) {
      const variant = product.variants[item.selectedVariantIndex];
      if (variant) {
        price = variant.offerPrice && variant.offerPrice < variant.originalPrice
          ? variant.offerPrice
          : variant.originalPrice;
      }
    } else {
      price = product.offerPrice && product.offerPrice < (product.originalPrice || 0)
        ? product.offerPrice
        : (product.originalPrice || 0);
    }

    return total + (price * item.qty);
  }, 0);

  const cartCount = state.items.reduce((count, item) => count + item.qty, 0);
  const updateCartItemQuantity = updateQuantity;

  return (
    <CartContext.Provider
      value={{
        state,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateCartItemQuantity,
        updateCartItemVariant,
        clearCart,
        toggleWishlist,
        isInWishlist,
        getCartItemQuantity,
        cartTotal,
        cartCount,
        fetchCartAndWishlist,
        cartLoading: state.loading,
        cartError: state.error,
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