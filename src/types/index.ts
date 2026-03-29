export interface User {
  _id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  token: string;
  isDelivery: boolean;
  phone?: string;
  newsletterSubscribed?: boolean;
  deliveryProfile?: {
    vehicleType: string;
    licenseNumber: string;
    areas: string[];
    documents: string[];
    status: 'pending' | 'approved' | 'rejected';
  };
}

export interface ProductVariant {
  type: 'weight' | 'pieces' | 'box';
  value: string; // "500g", "12pcs", "small"
  originalPrice: number;
  offerPrice?: number;
  /** When false, this variant's batch quantity is excluded from total/available stock (not deleted). */
  isActive?: boolean;
  /** When API returns a subset of variants (e.g. Deal of the Day), maps this row to inventory `batch.variantIndex`. */
  variantIndex?: number;
  /** Server-computed deal line price for this variant (Deal of the Day). */
  dealPrice?: number;
  /** Server-computed deal discount % for this variant (Deal of the Day). */
  dealDiscountPercent?: number;
}

export interface ProductStock {
  variantIndex: number;
  quantity: number;
  lowStockThreshold: number;
}

/** Batch-based inventory for tracking stock per batch */
export interface ProductBatch {
  batchNumber: string;
  quantity: number;
  manufacturingDate: string | Date;
  expiryDate: string | Date;
  purchasePrice: number;
  sellingPrice: number;
  variantIndex: number;
  /** Total/cost value for the whole batch */
  batchWholePrice?: number;
  dealTriggerDays?: number;
  dealDiscountPercent?: number;
}

export interface ProductInventory {
  location: string;
  batches?: ProductBatch[];
  stock?: ProductStock[];
}

export interface Product {
  _id: string;
  name: string;
  description?: string;
  images: string[];
  videoUrl?: string;
  originLocation?: string; 

  // DUAL PRICING SYSTEM (keeping backward compatibility)
  originalPrice: number;
  offerPrice?: number;
  price?: number; // For backward compatibility

  // FLEXIBLE VARIANTS (Weight/Pieces/Box)
  variants?: ProductVariant[];

  /** Deal-of-the-day API only: variants currently in an active deal window (full `variants` unchanged). */
  dealVariants?: ProductVariant[];

  // FLAGS for Frontend Sections
  isGITagged?: boolean;
  isNewArrival?: boolean;
  isMostSaled?: boolean;

  /** Deal of the Day: when batch is (expiryDate - dealTriggerDays) away, auto-include with dealDiscountPercent */
  dealTriggerDays?: number;
  dealDiscountPercent?: number;

  /** Computed by API when product is in deal period (from batches in deal window) */
  dealPrice?: number;
  isInDealPeriod?: boolean;
  /** Nearest expiry in days among batches in deal window (for Deal of the Day) */
  nearestExpiryDays?: number;

  // LOCATION-BASED INVENTORY (Multi-branch)
  inventory?: ProductInventory[];

  // Legacy fields for backward compatibility
  weight?: string;
  countInStock?: number;

  category: Category;
  subcategory?: string; // Subcategory ID or name
  isActive?: boolean;
  reviews?: any[]; // You might want to define a more specific type for reviews
  rating?: number;
  numReviews?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubCategory {
  _id?: string;
  name: string;
  isActive?: boolean;
}

export interface Category {
  _id: string;
  name: string;
  isActive?: boolean;
  subcategories?: SubCategory[];
  image?: string; // Made optional as it's not coming from category model directly
  description: string;
  imageUrl?: string; // Add imageUrl from product
}

// New interface for categories with their products
export interface CategoryWithProducts extends Category {
  products: Product[];
}

export interface CartItem {
  product: Product | null; // Allow product to be null
  qty: number;
  selectedVariantIndex?: number; // For variant-based products, which variant was selected
  /** Price snapshot captured when item was added/updated in cart. */
  price?: number;
  /** Optional strike-through/original snapshot for UI savings display. */
  originalPrice?: number;
  /** Deal metadata snapshot (optional, analytics/display only). */
  isDealApplied?: boolean;
  dealDiscountPercent?: number | null;
  /** True when this line uses deal-of-the-day pricing; distinct from same variant at catalog price. */
  isDealItem?: boolean;
}

export interface ShippingAddress {
  fullName?: string;
  phone?: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

// Add this to your types file (e.g., src/types/index.ts or src/types/order.ts)

export interface Order {
  _id: string;
  user: string;
  orderItems: OrderItem[];
  /** Admin-applied deal / giveaway lines (price 0) */
  giveAwayItems?: OrderItem[];
  giveAwayId?: string;
  /** Fulfilment store name (inventory deduction) */
  storeName?: string;
  nearestStore?: string;
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  
  paymentResult?: {
    id: string;
    status: string;
    update_time: string;
    email_address: string;
  };
  
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
  
  distance?: number;
  nearestStore?: string;
  uengageDeliveryFee?: number; // Add this line
  
  // 🔥 ADD THIS FIELD
  uengage?: {
    taskId?: string;
    vendorOrderId?: string;
    statusCode?: string;
    message?: string;
  };
  
  isPaid: boolean;
  paidAt?: string;
  
  isDelivered: boolean;
  deliveredAt?: string;
  
  deliveryPerson?: string;
  eta?: string;
  
  status: 'placed' | 'confirmed' | 'out_for_delivery' | 'delivered' | 'cancelled';
  deliveryMode: 'delivery' | 'pickup';
  
  // 🔥 ADD THIS FIELD TOO
  cancelReason?: string;
  cancelledAt?: string;
  
  createdAt: string;
  updatedAt: string;
}

/** Which batch(es) fulfilled this line item (FIFO – for admin visibility). */
export interface BatchAllocation {
  batchNumber: string;
  quantity: number;
}

export interface OrderItem {
  name: string;
  qty: number;
  image: string;
  price: number;
  product: string;
  selectedVariantIndex?: number;
  /** Fulfilment batches (set at order creation). */
  batchAllocations?: BatchAllocation[];
}

export type GiveAwayConditionType =
  | 'minOrderAmount'
  | 'minOrdersInDay'
  | 'minLifetimeOrders'
  | 'minLifetimeSpent';

export interface GiveAwayCondition {
  type: GiveAwayConditionType;
  value: number;
  isEnabled: boolean;
}

export type GiveAwayRewardType =
  | 'free_shipping'
  | 'flat_discount'
  | 'percentage_discount'
  | 'free_item'
  | 'other';

export interface GiveAwayReward {
  type: GiveAwayRewardType;
  value?: number;
  label?: string;
  productId?: string;
}

export interface GiveAwaySelectedProduct {
  product: string;
  selectedVariantIndex?: number;
  qty: number;
}

export interface GiveAway {
  _id: string;
  title: string;
  description?: string;
  isActive: boolean;
  startAt?: string;
  endAt?: string;
  conditions: GiveAwayCondition[];
  selectedProducts?: GiveAwaySelectedProduct[];
  reward: GiveAwayReward;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingAddress {
  fullName?: string;
  phone?: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}
