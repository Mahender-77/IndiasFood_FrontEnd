export type StatusFilter = 'all' | 'deal' | 'expired' | 'low_stock';

export interface AnalyticsFilters {
  search: string;
  status: StatusFilter;
  fromDate: string;
  toDate: string;
}

export interface SummaryMetrics {
  totalStock: number;
  totalSold: number;
  totalGiveAwayUnits: number;
  totalGiveAwayValue: number;
  totalExpired: number;
  totalRevenue: number;
  totalDeliveryCharges: number;
  totalDealSales: number;
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  avgOrderValue: number;
  avgDeliveryFeePerOrder: number;
  deliveryOrdersCount: number;
  netEarnings: number;
}

export interface ProductDrillRow {
  productId: string;
  name: string;
  stock: number;
  sold: number;
  giveAway: number;
  expired: number;
  revenue: number;
  giveAwayValue: number;
  dealUnits: number;
  hasDeal: boolean;
  hasExpired: boolean;
  isLowStock: boolean;
}

