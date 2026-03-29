import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import {
  getCartLinePricingPayload,
  getCartLineUnitPrice,
  getFallbackPricing,
  isCartLineDeal,
  normalizeLegacyCartItems,
} from '@/lib/cartPricing';
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
  | { type: 'UPDATE_ITEM_OPTIMISTIC'; payload: { productId: string; variantIndex: number; qty: number; isDealItem?: boolean } }
  | { type: 'REMOVE_ITEM_OPTIMISTIC'; payload: { productId: string; variantIndex: number; isDealItem?: boolean } }
  | { type: 'UPDATE_VARIANT_OPTIMISTIC'; payload: { productId: string; oldVariantIndex: number; newVariantIndex: number; qty: number; isDealItem?: boolean } };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_CART':
      return {
        ...state,
        items: Array.isArray(action.payload) ? action.payload : []
      };
    
    case 'UPDATE_ITEM_OPTIMISTIC': {
      const { productId, variantIndex, qty, isDealItem = false } = action.payload;
      const existingIndex = state.items.findIndex(item => {
        const product = item.product as Product;
        return (
          product?._id === productId &&
          item.selectedVariantIndex === variantIndex &&
          isCartLineDeal(item) === Boolean(isDealItem)
        );
      });

      if (existingIndex > -1) {
        const newItems = [...state.items];
        newItems[existingIndex] = { ...newItems[existingIndex], qty };
        return { ...state, items: newItems };
      }
      return state;
    }

    case 'REMOVE_ITEM_OPTIMISTIC': {
      const { productId, variantIndex, isDealItem = false } = action.payload;
      return {
        ...state,
        items: state.items.filter(item => {
          const product = item.product as Product;
          return !(
            product?._id === productId &&
            item.selectedVariantIndex === variantIndex &&
            isCartLineDeal(item) === Boolean(isDealItem)
          );
        })
      };
    }

    case 'UPDATE_VARIANT_OPTIMISTIC': {
      const { productId, oldVariantIndex, newVariantIndex, qty, isDealItem = false } = action.payload;
      return {
        ...state,
        items: state.items.map(item => {
          const product = item.product as Product;
          if (
            product?._id === productId &&
            item.selectedVariantIndex === oldVariantIndex &&
            isCartLineDeal(item) === Boolean(isDealItem)
          ) {
            return { ...item, selectedVariantIndex: newVariantIndex, qty, isDealItem: false };
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
  addToCart: (
    productId: string,
    quantity?: number,
    selectedVariantIndex?: number,
    pricing?: {
      price?: number;
      originalPrice?: number;
      isDealApplied?: boolean;
      dealDiscountPercent?: number | null;
      isDealItem?: boolean;
    }
  ) => Promise<void>;
  removeFromCart: (productId: string, selectedVariantIndex?: number, isDealItem?: boolean) => Promise<void>;
  updateQuantity: (productId: string, quantity: number, selectedVariantIndex?: number, isDealItem?: boolean) => Promise<void>;
  updateCartItemQuantity: (productId: string, quantity: number, selectedVariantIndex?: number, isDealItem?: boolean) => Promise<void>;
  updateCartItemVariant: (
    productId: string,
    currentVariantIndex: number,
    newVariantIndex: number,
    isDealItem?: boolean
  ) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  getCartItemQuantity: (productId: string, selectedVariantIndex?: number, isDealItem?: boolean) => number;
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

  const getItemProductId = (item: CartItem): string => {
    if (!item.product) return '';
    if (typeof item.product === 'string') return item.product;
    return (item.product as Product)._id || '';
  };

  const getItemKey = (productId: string, selectedVariantIndex: number = 0, dealLine: boolean = false) =>
    `${productId}-${selectedVariantIndex}-${dealLine ? 'deal' : 'std'}`;

  const mergePricingIntoCart = (
    incomingItems: CartItem[],
    previousItems: CartItem[],
    override?: {
      productId: string;
      selectedVariantIndex: number;
      pricing: {
        price?: number;
        originalPrice?: number;
        isDealApplied?: boolean;
        dealDiscountPercent?: number | null;
        isDealItem?: boolean;
      };
    }
  ): CartItem[] => {
    const previousByKey = new Map<string, CartItem>();
    for (const item of previousItems) {
      const pid = getItemProductId(item);
      if (!pid) continue;
      previousByKey.set(getItemKey(pid, item.selectedVariantIndex ?? 0, isCartLineDeal(item)), item);
    }

    const overrideKey = override
      ? getItemKey(
          override.productId,
          override.selectedVariantIndex,
          Boolean(override.pricing.isDealItem)
        )
      : null;

    return incomingItems.map((item) => {
      const pid = getItemProductId(item);
      const dealFlag = isCartLineDeal(item);
      const key = getItemKey(pid, item.selectedVariantIndex ?? 0, dealFlag);
      const prev = previousByKey.get(key);
      const merged: CartItem = { ...item };

      if (overrideKey && key === overrideKey) {
        merged.price = override.pricing.price;
        merged.originalPrice = override.pricing.originalPrice;
        merged.isDealApplied = override.pricing.isDealApplied;
        merged.dealDiscountPercent = override.pricing.dealDiscountPercent ?? null;
        merged.isDealItem = Boolean(override.pricing.isDealItem);
        return merged;
      }

      if (isCartLineDeal(merged) && typeof merged.price === 'number' && Number.isFinite(merged.price)) {
        merged.isDealItem = isCartLineDeal(merged);
        return merged;
      }
      if (typeof merged.price === 'number' && Number.isFinite(merged.price)) {
        merged.isDealItem = isCartLineDeal(merged);
        return merged;
      }
      if (prev && typeof prev.price === 'number' && Number.isFinite(prev.price)) {
        merged.price = prev.price;
        merged.originalPrice = prev.originalPrice;
        merged.isDealApplied = prev.isDealApplied;
        merged.dealDiscountPercent = prev.dealDiscountPercent ?? null;
        merged.isDealItem = prev.isDealItem;
      }
      merged.isDealItem = isCartLineDeal(merged);
      return merged;
    });
  };

  const fetchCartAndWishlist = useCallback(async () => {
    if (!user || !token) {
      const localCart = localStorage.getItem('cartItems');
      const localWishlist = localStorage.getItem('wishlistItems');
      
      if (localCart) {
        try {
          const parsedLocalCart = JSON.parse(localCart);
          const normalized = normalizeLegacyCartItems(
            Array.isArray(parsedLocalCart) ? parsedLocalCart : []
          );
          dispatch({ type: 'SET_CART', payload: normalized });
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
      const localCartRaw = localStorage.getItem('cartItems');
      let storedPricingBeforeMerge: CartItem[] = [];
      if (localCartRaw) {
        try {
          const parsed = JSON.parse(localCartRaw);
          storedPricingBeforeMerge = Array.isArray(parsed) ? parsed : [];
        } catch {
          /* ignore */
        }
      }

      let mergedCartData = [];
      
      if (localCartRaw) {
        const guestCartItems: CartItem[] = JSON.parse(localCartRaw);
        console.log('Detected guest cart items after login:', guestCartItems);
        if (guestCartItems.length > 0) {
          const itemsToMerge = guestCartItems.map((item) => ({
            productId: (item.product as Product)._id,
            qty: item.qty,
            selectedVariantIndex: item.selectedVariantIndex,
            isDealItem: item.isDealItem ?? false,
            ...getCartLinePricingPayload(item),
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

      let storedPricing: CartItem[] = storedPricingBeforeMerge;
      try {
        const raw = localStorage.getItem('cartItems');
        if (raw) {
          const parsed = JSON.parse(raw);
          storedPricing = Array.isArray(parsed) ? parsed : storedPricingBeforeMerge;
        }
      } catch {
        /* ignore */
      }

      const mergedCart = mergePricingIntoCart(
        Array.isArray(finalCartData) ? finalCartData : [],
        storedPricing
      );

      dispatch({ type: 'SET_CART', payload: mergedCart });
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
    try {
      localStorage.setItem('cartItems', JSON.stringify(state.items));
    } catch (e) {
      console.warn('Could not persist cart to localStorage', e);
    }
  }, [state.items]);

  useEffect(() => {
    if (!user && state.wishlist.length >= 0) {
      localStorage.setItem('wishlistItems', JSON.stringify(state.wishlist));
    }
  }, [state.wishlist, user]);

  const addToCart = async (
    productId: string,
    quantity: number = 1,
    selectedVariantIndex: number = 0,
    pricing?: {
      price?: number;
      originalPrice?: number;
      isDealApplied?: boolean;
      dealDiscountPercent?: number | null;
      isDealItem?: boolean;
    }
  ) => {
    const lineIsDeal = Boolean(pricing?.isDealItem);

    if (!user || !token) {
      const existingCartItems: CartItem[] = [...state.items];
      const existingItemIndex = existingCartItems.findIndex(item => {
        const product = item.product as Product;
        return (
          product &&
          product._id === productId &&
          item.selectedVariantIndex === selectedVariantIndex &&
          isCartLineDeal(item) === lineIsDeal
        );
      });

      if (existingItemIndex > -1) {
        existingCartItems[existingItemIndex].qty += quantity;
        if (pricing?.price != null) {
          existingCartItems[existingItemIndex] = {
            ...existingCartItems[existingItemIndex],
            price: pricing.price,
            originalPrice: pricing.originalPrice,
            isDealApplied: pricing.isDealApplied,
            dealDiscountPercent: pricing.dealDiscountPercent ?? null,
            isDealItem: lineIsDeal,
          };
        }
      } else {
        try {
          const { data: productData } = await api.get(`/products/${productId}`);
          console.log('Fetched productData for guest cart:', productData);
          const productPayload = (productData?.product ?? productData) as Product;
          const fallbackPricing = getFallbackPricing(productPayload, selectedVariantIndex);
          existingCartItems.push({
            product: productPayload,
            qty: quantity,
            selectedVariantIndex,
            price: pricing?.price ?? fallbackPricing.price,
            originalPrice: pricing?.originalPrice ?? fallbackPricing.originalPrice,
            isDealApplied: pricing?.isDealApplied ?? fallbackPricing.isDealApplied,
            dealDiscountPercent: pricing?.dealDiscountPercent ?? fallbackPricing.dealDiscountPercent,
            isDealItem: lineIsDeal,
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
      return (
        product?._id === productId &&
        item.selectedVariantIndex === selectedVariantIndex &&
        isCartLineDeal(item) === lineIsDeal
      );
    });

    if (existingItem) {
      dispatch({
        type: 'UPDATE_ITEM_OPTIMISTIC',
        payload: {
          productId,
          variantIndex: selectedVariantIndex,
          isDealItem: lineIsDeal,
          qty: existingItem.qty + quantity,
        },
      });
    }

    const cartPostBody: Record<string, unknown> = {
      productId,
      qty: quantity,
      selectedVariantIndex,
      isDealItem: lineIsDeal,
    };
    if (pricing) {
      if (pricing.price != null) cartPostBody.price = pricing.price;
      if (pricing.originalPrice != null) cartPostBody.originalPrice = pricing.originalPrice;
      if (pricing.isDealApplied !== undefined) cartPostBody.isDealApplied = pricing.isDealApplied;
      if (pricing.dealDiscountPercent != null) cartPostBody.dealDiscountPercent = pricing.dealDiscountPercent;
    }

    try {
      const { data } = await api.post('/user/cart', cartPostBody);
      const payload = mergePricingIntoCart(
        Array.isArray(data) ? data : [],
        state.items,
        pricing
          ? {
              productId,
              selectedVariantIndex,
              pricing: { ...pricing, isDealItem: lineIsDeal },
            }
          : undefined
      );
      dispatch({ type: 'SET_CART', payload: payload });
    } catch (error: any) {
      console.error('Failed to add to cart', error);
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to add to cart' });
      await fetchCartAndWishlist(); // Revert on error
    }
  };

  const removeFromCart = async (productId: string, selectedVariantIndex: number = 0, isDealItem: boolean = false) => {
    if (!user || !token) {
      const updatedCartItems = state.items.filter(item => {
        const product = item.product as Product;
        return !(
          product &&
          product._id === productId &&
          item.selectedVariantIndex === selectedVariantIndex &&
          isCartLineDeal(item) === Boolean(isDealItem)
        );
      });
      dispatch({ type: 'SET_CART', payload: updatedCartItems });
      return;
    }

    // Optimistic update
    dispatch({
      type: 'REMOVE_ITEM_OPTIMISTIC',
      payload: { productId, variantIndex: selectedVariantIndex, isDealItem },
    });

    try {
      const { data } = await api.post('/user/cart', {
        productId,
        qty: 0,
        selectedVariantIndex,
        isDealItem,
      });
      dispatch({
        type: 'SET_CART',
        payload: mergePricingIntoCart(Array.isArray(data) ? data : [], state.items),
      });
    } catch (error: any) {
      console.error('Failed to remove from cart', error);
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to remove from cart' });
      await fetchCartAndWishlist(); // Revert on error
    }
  };

  const updateQuantity = async (
    productId: string,
    quantity: number,
    selectedVariantIndex: number = 0,
    isDealItem: boolean = false
  ) => {
    if (quantity <= 0) {
      await removeFromCart(productId, selectedVariantIndex, isDealItem);
      return;
    }

    if (!user || !token) {
      const updatedCartItems = state.items.map(item => {
        const product = item.product as Product;
        if (
          product &&
          product._id === productId &&
          item.selectedVariantIndex === selectedVariantIndex &&
          isCartLineDeal(item) === Boolean(isDealItem)
        ) {
          return { ...item, qty: quantity };
        }
        return item;
      });
      dispatch({ type: 'SET_CART', payload: updatedCartItems });
      return;
    }

    const line = state.items.find(item => {
      const product = item.product as Product;
      return (
        product?._id === productId &&
        item.selectedVariantIndex === selectedVariantIndex &&
        isCartLineDeal(item) === Boolean(isDealItem)
      );
    });

    // Optimistic update
    dispatch({
      type: 'UPDATE_ITEM_OPTIMISTIC',
      payload: { productId, variantIndex: selectedVariantIndex, isDealItem, qty: quantity },
    });

    try {
      const { data } = await api.post('/user/cart', {
        productId,
        qty: quantity,
        selectedVariantIndex,
        isDealItem,
        ...getCartLinePricingPayload(line),
      });
      dispatch({
        type: 'SET_CART',
        payload: mergePricingIntoCart(Array.isArray(data) ? data : [], state.items),
      });
    } catch (error: any) {
      console.error('Failed to update quantity', error);
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to update quantity' });
      await fetchCartAndWishlist(); // Revert on error
    }
  };

  const updateCartItemVariant = async (
    productId: string,
    currentVariantIndex: number,
    newVariantIndex: number,
    isDealItem: boolean = false
  ) => {
    const currentItem = state.items.find(item => {
      const product = item.product as Product;
      return (
        product?._id === productId &&
        item.selectedVariantIndex === currentVariantIndex &&
        isCartLineDeal(item) === Boolean(isDealItem)
      );
    });

    if (!currentItem) return;

    if (!user || !token) {
      const updatedCartItems = state.items.map(item => {
        const product = item.product as Product;
        if (
          product &&
          product._id === productId &&
          item.selectedVariantIndex === currentVariantIndex &&
          isCartLineDeal(item) === Boolean(isDealItem)
        ) {
          const fp = getFallbackPricing(product, newVariantIndex);
          return {
            ...item,
            selectedVariantIndex: newVariantIndex,
            isDealItem: false,
            price: fp.price,
            originalPrice: fp.originalPrice,
            isDealApplied: fp.isDealApplied,
            dealDiscountPercent: fp.dealDiscountPercent,
          };
        }
        return item;
      });
      dispatch({ type: 'SET_CART', payload: updatedCartItems });
      return;
    }

    // Optimistic update
    dispatch({
      type: 'UPDATE_VARIANT_OPTIMISTIC',
      payload: {
        productId,
        oldVariantIndex: currentVariantIndex,
        newVariantIndex,
        qty: currentItem.qty,
        isDealItem,
      },
    });

    try {
      // Remove old variant
      await api.post('/user/cart', {
        productId,
        qty: 0,
        selectedVariantIndex: currentVariantIndex,
        isDealItem,
      });

      const productForVariant = currentItem.product as Product;
      const fallbackPricing = productForVariant
        ? getFallbackPricing(productForVariant, newVariantIndex)
        : { price: 0, originalPrice: 0, isDealApplied: false, dealDiscountPercent: null as number | null };

      // Add new variant as a standard catalog line (deal flag cleared after variant change)
      const { data } = await api.post('/user/cart', {
        productId,
        qty: currentItem.qty,
        selectedVariantIndex: newVariantIndex,
        isDealItem: false,
        price: fallbackPricing.price,
        originalPrice: fallbackPricing.originalPrice,
        isDealApplied: fallbackPricing.isDealApplied,
        dealDiscountPercent: fallbackPricing.dealDiscountPercent ?? undefined,
      });
      dispatch({
        type: 'SET_CART',
        payload: mergePricingIntoCart(
          Array.isArray(data) ? data : [],
          state.items,
          {
            productId,
            selectedVariantIndex: newVariantIndex,
            pricing: { ...fallbackPricing, isDealItem: false },
          }
        ),
      });
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
          await removeFromCart(product._id, item.selectedVariantIndex ?? 0, isCartLineDeal(item));
        }
      }
      dispatch({ type: 'SET_CART', payload: [] });
      try {
        localStorage.removeItem('cartItems');
      } catch {
        /* ignore */
      }
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

  const getCartItemQuantity = (productId: string, selectedVariantIndex: number = 0, isDealItem: boolean = false) => {
    const item = state.items.find(item => {
      const product = item.product as Product;
      return (
        product &&
        product._id === productId &&
        item.selectedVariantIndex === selectedVariantIndex &&
        isCartLineDeal(item) === Boolean(isDealItem)
      );
    });
    return item ? item.qty : 0;
  };

  const cartTotal = state.items.reduce((total, item) => {
    return total + getCartLineUnitPrice(item) * item.qty;
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