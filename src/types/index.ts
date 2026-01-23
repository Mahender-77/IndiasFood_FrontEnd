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
}

export interface ProductStock {
  variantIndex: number; // Links to variants array index
  quantity: number;
  lowStockThreshold: number;
}

export interface ProductInventory {
  location: string; // Location identifier (e.g., "hyderabad", "bangalore")
  stock: ProductStock[];
}

export interface Product {
  _id: string;
  name: string;
  description?: string;
  images: string[];
  videoUrl?: string;
  shelfLife?: string;

  // DUAL PRICING SYSTEM (keeping backward compatibility)
  originalPrice: number;
  offerPrice?: number;
  price?: number; // For backward compatibility

  // FLEXIBLE VARIANTS (Weight/Pieces/Box)
  variants?: ProductVariant[];

  // FLAGS for Frontend Sections
  isGITagged?: boolean;
  isNewArrival?: boolean;

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

export interface OrderItem {
  name: string;
  qty: number;
  image: string;
  price: number;
  product: string; // Product ID
  weight?: string; // Weight variation (e.g., "500g", "1kg")
}

export interface Order {
  _id: string;
  user: string; // User ID
  orderItems: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  paymentResult: {
    id: string;
    status: string;
    update_time: string;
    email_address: string;
  };
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
  isPaid: boolean;
  paidAt: string;
  isDelivered: boolean;
  deliveredAt: string;
  createdAt: string;
  deliveryPerson?: string; // Delivery person's ID
  eta?: Date; // Estimated time of arrival
  status: 'placed' | 'confirmed' | 'out_for_delivery' | 'delivered' | 'cancelled'; // Order status
  distance?: number; // Distance for delivery
  cancelReason?: string; // Reason for cancellation
  cancelledAt?: Date; // When order was cancelled
}
