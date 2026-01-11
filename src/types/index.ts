export interface User {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  token: string;
  isDelivery: boolean;
  deliveryProfile?: {
    vehicleType: string;
    licenseNumber: string;
    areas: string[];
    documents: string[];
    status: 'pending' | 'approved' | 'rejected';
  };
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  weight?: string;
  shelfLife?: string;
  countInStock: number;
  images: string[];
  videoUrl?: string;
  category: Category;
  isActive?: boolean;
  reviews: any[]; // You might want to define a more specific type for reviews
  rating: number;
  numReviews: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
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
}

export interface ShippingAddress {
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface OrderItem {
  name: string;
  qty: number;
  image: string;
  price: number;
  product: string; // Product ID
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
  status: 'Pending' | 'Assigned' | 'Out for Delivery' | 'Delivered' | 'Cancelled'; // Order status
}
