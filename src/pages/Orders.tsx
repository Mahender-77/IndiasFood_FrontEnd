import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowRight, Clock, CheckCircle2, Truck, XCircle, AlertCircle, MapPin, Phone, RefreshCw, Navigation, Eye, Store, ShoppingBag } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Order } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';

// U-Engage tracking data interface
interface TrackingData {
  taskId: string;
  vendor_order_id: string;
  partner_name: string;
  rider_name: string;
  rider_contact: string;
  latitude: string;
  longitude: string;
  tracking_url: string;
  rto_reason?: string;
}

const getOrderStatus = (order: Order) => {
  if (order.status === 'cancelled') return 'cancelled';
  if (order.isDelivered) return 'delivered';
  if (order.status === 'out_for_delivery') return 'out_for_delivery';
  if (order.isPaid || order.status === 'confirmed') return 'confirmed';
  return 'placed';
};

const statusConfig = {
  placed: {
    label: 'Order Placed',
    icon: Clock,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    description: 'Your order has been received'
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle2,
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    description: 'Order confirmed and being prepared'
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    icon: Truck,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'Rider is on the way'
  },
  delivered: {
    label: 'Delivered',
    icon: CheckCircle2,
    color: 'text-pistachio',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    description: 'Successfully delivered'
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    description: 'Order has been cancelled'
  },
};

// U-Engage status mapping
const uengageStatusMap: Record<string, { label: string; description: string }> = {
  ACCEPTED: { label: 'Accepted', description: 'Order accepted by delivery partner' },
  ALLOTTED: { label: 'Rider Assigned', description: 'Rider has been allotted to pick up your order' },
  ARRIVED: { label: 'Rider Arrived', description: 'Rider has reached the pickup location' },
  DISPATCHED: { label: 'Dispatched', description: 'Order picked up and on the way' },
  ARRIVED_CUSTOMER_DOORSTEP: { label: 'Nearby', description: 'Rider has reached your doorstep' },
  DELIVERED: { label: 'Delivered', description: 'Order delivered successfully' },
  CANCELLED: { label: 'Cancelled', description: 'Delivery task cancelled' },
  RTO_INIT: { label: 'Return Initiated', description: 'Return to origin initiated' },
  RTO_COMPLETE: { label: 'Returned', description: 'Order returned to store' },
  SEARCHING_FOR_NEW_RIDER: { label: 'Finding Rider', description: 'Searching for a delivery rider' },
};

const Orders = () => {
  const { token } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [trackingData, setTrackingData] = useState<Record<string, TrackingData>>({});
  const [isTracking, setIsTracking] = useState<Set<string>>(new Set());
  const [trackingDialogId, setTrackingDialogId] = useState<string | null>(null);


  const fetchOrders = async () => {
    try {
      const { data } = await api.get(`/user/orders`);

      if (Array.isArray(data)) {
        setOrders(data);
      } else {
        console.error("Orders API returned:", data);
        setOrders([]);
      }

    } catch (err) {
      console.error(err);
      setOrders([]);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchOrders();
  }, [token]);

  const trackingDialogOrder = orders.find(
    (o) => o._id === trackingDialogId
  );

  // Polling for active delivery orders only
  useEffect(() => {
    const activeOrderIds = orders
      .filter(order =>
        (order.status === 'out_for_delivery' || order.status === 'confirmed') &&
        !order.isDelivered &&
        order.uengage?.taskId &&
        order.deliveryMode === 'delivery' // Only poll delivery orders
      )
      .map(order => order._id);

    if (activeOrderIds.length > 0) {
      const interval = setInterval(() => {
        activeOrderIds.forEach(orderId => trackOrder(orderId));
      }, 30000); // Poll every 30 seconds

      return () => clearInterval(interval);
    }
  }, [orders]);

  console.log("orders", orders);

  // Track order status (only for delivery orders)
  const trackOrder = async (orderId: string) => {
    setIsTracking(prev => new Set(prev).add(orderId));
    
    try {
      const { data } = await api.get(`/user/orders/${orderId}/track`);
      
      if (data.tracking) {
        setTrackingData(prev => ({
          ...prev,
          [orderId]: data.tracking
        }));
        
        toast({
          title: 'Tracking Updated',
          description: `Status: ${uengageStatusMap[data.status]?.label || data.status}`,
        });
      }
      
      // Refresh orders to get updated status
      await fetchOrders();
      
    } catch (err: any) {
      toast({
        title: 'Tracking Error',
        description: err.response?.data?.message || 'Failed to fetch tracking data',
        variant: 'destructive',
      });
    } finally {
      setIsTracking(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder || !cancelReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for cancellation',
        variant: 'destructive',
      });
      return;
    }

    setIsCancelling(true);
    try {
      await api.put(
        `/user/orders/${selectedOrder._id}/cancel`,
        { reason: cancelReason }
      );

      toast({
        title: 'Order Cancelled',
        description: 'Your order has been cancelled successfully.',
      });

      await fetchOrders();
      setSelectedOrder(null);
      setCancelReason('');
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to cancel order',
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const canCancelOrder = (order: Order) => {
    // Cannot cancel if already delivered or cancelled
    if (order.isDelivered || order.status === 'cancelled') {
      return false;
    }
    
    // For DELIVERY orders: cannot cancel if out for delivery
    if (order.deliveryMode === 'delivery' && order.status === 'out_for_delivery') {
      return false;
    }
    
    // For PICKUP orders: can cancel anytime before delivery/pickup
    // For DELIVERY orders: can cancel if not yet out for delivery
    return true;
  };

  const canTrackOrder = (order: Order) => {
    return order.deliveryMode === 'delivery' && order.uengage?.taskId && !order.isDelivered && order.status !== 'cancelled';
  };

  const isPickupOrder = (order: Order) => {
    return order.deliveryMode === 'pickup';
  };

  if (loading) {
    return (
      <Layout>
        <section className="section-padding bg-background">
          <div className="container-custom max-w-5xl">
            <Skeleton className="h-10 w-48 mb-8" />
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <section className="section-padding bg-background">
          <div className="container-custom max-w-5xl">
            <div className="max-w-md mx-auto text-center py-16">
              <div className="w-20 h-20 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-4">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">Error Loading Orders</h1>
              <p className="text-red-600 mb-6">{error}</p>
              <Button onClick={() => fetchOrders()} variant="outline" size="lg">
                Try Again
              </Button>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (orders.length === 0) {
    return (
      <Layout>
        <section className="section-padding bg-background">
          <div className="container-custom max-w-5xl">
            <div className="max-w-md mx-auto text-center py-16">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-6">
                <Package className="h-12 w-12 text-primary" />
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
                No Orders Yet
              </h1>
              <p className="text-muted-foreground mb-8">
                Start exploring our collection of authentic Indian sweets
              </p>
              <Link to="/products">
                <Button size="lg" variant="hero" className="gap-2">
                  Browse Products
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="section-padding bg-background pt-10">
        <div className="container-custom max-w-5xl">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2">
              Your Orders
            </h1>
            <p className="text-muted-foreground">
              Track and manage your orders
            </p>
          </div>

          {/* Orders List */}
          <div className="space-y-6">
            {Array.isArray(orders) && orders.map((order) => {
              const currentStatus = getOrderStatus(order);
              const status = statusConfig[currentStatus as keyof typeof statusConfig];
              const StatusIcon = status.icon;
              const tracking = trackingData[order._id];
              const uengageStatus = order.uengage?.statusCode;
              const isPickup = isPickupOrder(order);

              return (
                <div
                  key={order._id}
                  className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Header Section */}
                  <div className="bg-muted/30 px-4 sm:px-6 py-3 border-b border-border">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      {/* Order Info */}
                      <div className="flex items-center gap-2">
                        <div className="hidden sm:flex w-10 h-10 rounded-full bg-primary/10 items-center justify-center flex-shrink-0">
                          {isPickup ? (
                            <ShoppingBag className="h-5 w-5 text-primary" />
                          ) : (
                            <Truck className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm text-foreground">
                              Order #{order._id.slice(-8).toUpperCase()}
                            </span>
                            <Badge 
                              variant={isPickup ? "secondary" : "default"} 
                              className={cn(
                                "text-[10px] capitalize",
                                isPickup ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-blue-100 text-blue-700 border-blue-200"
                              )}
                            >
                              {isPickup ? "🏪 Pickup" : "🚚 Delivery"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <div className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border',
                          status.bgColor,
                          status.borderColor
                        )}>
                          <StatusIcon className={cn('h-3.5 w-3.5', status.color)} />
                          <span className={cn('text-xs font-semibold', status.color)}>
                            {status.label === 'Order Placed' ? 'Placed' : status.label}
                          </span>
                        </div>
                        
                        {/* U-Engage Status Badge for Delivery Orders Only */}
                        {!isPickup && order.uengage?.statusCode && uengageStatusMap[uengageStatus] && (
                          <Badge variant="outline" className="text-[10px]">
                            {uengageStatusMap[uengageStatus].label}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* U-Engage Status Info - Only for Delivery */}
                  {!isPickup && order.uengage?.message && (
                    <div className="px-4 sm:px-6 py-2 bg-blue-50 border-b border-blue-100">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                        <p className="text-xs text-blue-900 line-clamp-1">
                          <span className="font-medium">{uengageStatusMap[uengageStatus]?.label || order.uengage.statusCode}:</span> {order.uengage.message}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Order Items */}
                  <div className="px-4 sm:px-6 py-4 space-y-3">
                    {order.orderItems.map((item, index) => (
                      <div
                        key={`${item.product}-${index}`}
                        className="flex items-center gap-3 pb-3 border-b border-border last:border-0 last:pb-0"
                      >
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={item.image || '/images/placeholder.png'}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-foreground mb-0.5 line-clamp-2">
                            {item.name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span>Qty: {item.qty}</span>
                            <span>•</span>
                            <span>₹{item.price.toFixed(2)} each</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-base text-foreground">
                            ₹{(item.price * item.qty).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Store/Delivery Address Section */}
                  {order.shippingAddress && (
                    <div className={cn(
                      "px-4 sm:px-6 py-3 border-t border-border",
                      isPickup ? "bg-purple-50/50" : "bg-muted/20"
                    )}>
                      <div className="flex items-start gap-2">
                        {isPickup ? (
                          <Store className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="text-xs font-medium text-muted-foreground mb-0.5">
                            {isPickup ? '🏪 Pickup From Store' : '📍 Delivery Address'}
                          </p>
                          {isPickup ? (
                            <>
                              <p className="text-sm text-foreground font-medium">
                                {order.shippingAddress.city || 'Store Location'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Please collect your order from the selected store
                              </p>
                              {order.shippingAddress.phone && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                  <Phone className="h-3 w-3" />
                                  <span>{order.shippingAddress.phone}</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <p className="text-sm text-foreground font-medium line-clamp-1">
                                {order.shippingAddress.fullName}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.postalCode}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-1.5">
                                {order.shippingAddress.phone && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    <span>{order.shippingAddress.phone}</span>
                                  </div>
                                )}
                                {order.distance && (order.shippingAddress.latitude && order.shippingAddress.longitude) && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    <span>{order.distance} km away</span>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rider Details - Show only for delivery orders when tracking data available */}
                  {!isPickup && tracking && (
                    <div className="px-4 sm:px-6 py-3 bg-green-50 border-t border-green-200">
                      <div className="flex items-start gap-2">
                        <Truck className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-green-900 mb-1">
                            Delivery Partner: {tracking.partner_name}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                            {tracking.rider_name && (
                              <div className="flex items-center gap-1.5 text-green-800">
                                <span className="font-medium">Rider:</span>
                                <span>{tracking.rider_name}</span>
                              </div>
                            )}
                            {tracking.rider_contact && (
                              <div className="flex items-center gap-1.5 text-green-800">
                                <Phone className="h-3 w-3" />
                                <span>{tracking.rider_contact}</span>
                              </div>
                            )}
                          </div>
                          {tracking.tracking_url && (
                            <a 
                              href={tracking.tracking_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 mt-2 text-xs text-green-700 hover:text-green-800 font-medium"
                            >
                              <Navigation className="h-3.5 w-3.5" />
                              Track on Map
                              <ArrowRight className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cancellation Reason */}
                  {order.cancelReason && (
                    <div className="px-4 sm:px-6 py-3 bg-red-50 border-t border-red-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-red-900 mb-0.5">
                            Order Cancelled
                          </p>
                          <p className="text-xs text-red-700 line-clamp-2">
                            {order.cancelReason}
                          </p>
                          {order.cancelledAt && (
                            <p className="text-[10px] text-red-600 mt-1">
                              Cancelled on {new Date(order.cancelledAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer Section */}
                  <div className="px-4 sm:px-6 py-3 bg-muted/30 border-t border-border">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      {/* Order Summary & ETA */}
                      <div className="w-full sm:w-auto">
                        {/* Price Breakdown */}
                        <div className="space-y-1 mb-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-medium">₹{order.orderItems.reduce((total, item) => total + (item.price * item.qty), 0).toFixed(2)}</span>
                          </div>
                          {!isPickup && (
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">
                                Delivery {order.distance ? `(${order.distance} km)` : ''}
                              </span>
                              <span className="font-medium">
                                {order.shippingPrice === 0 ? (
                                  <span className="text-green-600">FREE</span>
                                ) : (
                                  `₹${order.shippingPrice.toFixed(2)}`
                                )}
                              </span>
                            </div>
                          )}
                          {order.taxPrice > 0 && (
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Tax</span>
                              <span className="font-medium">₹{order.taxPrice.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-1 border-t border-border">
                            <span className="font-semibold text-sm">Total</span>
                            <span className="font-display text-base sm:text-lg font-bold text-primary">₹{order.totalPrice.toFixed(2)}</span>
                          </div>
                        </div>

                        {order.eta && !order.isDelivered && order.status !== 'cancelled' && (
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            ETA: {new Date(order.eta).toLocaleString()}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                        {/* Track Order Button - Only for delivery orders */}
                        {canTrackOrder(order) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => trackOrder(order._id)}
                            disabled={isTracking.has(order._id)}
                            className="flex-1 sm:flex-initial text-xs h-8"
                          >
                            {isTracking.has(order._id) ? (
                              <>
                                <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                Tracking...
                              </>
                            ) : (
                              <>
                                <Navigation className="h-3.5 w-3.5 mr-1.5" />
                                Track Order
                              </>
                            )}
                          </Button>
                        )}

                       {/* View Details Button */}
<Dialog
  open={trackingDialogId === order._id}
  onOpenChange={(open) => {
    if (!open) setTrackingDialogId(null);
  }}
>
  <DialogTrigger asChild>
    <Button
      variant="outline"
      size="sm"
      onClick={() => setTrackingDialogId(order._id)}
      className="flex-1 sm:flex-initial text-xs h-8"
    >
      <Eye className="h-3.5 w-3.5 mr-1.5" />
      Details
    </Button>
  </DialogTrigger>

  <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="text-lg">Order Details</DialogTitle>
      <DialogDescription className="text-xs">
        Order #{trackingDialogOrder?._id?.slice(-8).toUpperCase()}
      </DialogDescription>
    </DialogHeader>

    {trackingDialogOrder && (
      <div className="space-y-3 py-2">

        {/* Order Type */}
        <div className="bg-muted/50 rounded-lg p-3">
          <h4 className="font-semibold text-sm mb-2">Order Type</h4>
          <Badge
            variant={trackingDialogOrder.deliveryMode === 'pickup' ? "secondary" : "default"}
            className={cn(
              "text-xs",
              trackingDialogOrder.deliveryMode === 'pickup'
                ? "bg-purple-100 text-purple-700"
                : "bg-blue-100 text-blue-700"
            )}
          >
            {trackingDialogOrder.deliveryMode === 'pickup'
              ? "🏪 Store Pickup"
              : "🚚 Home Delivery"}
          </Badge>
        </div>

        {/* Status Timeline */}
        <div className="bg-muted/50 rounded-lg p-3">
          <h4 className="font-semibold text-sm mb-2">Order Status</h4>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Order Placed</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(trackingDialogOrder.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {trackingDialogOrder.isPaid && (
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Payment Confirmed</p>
                </div>
              </div>
            )}

            {trackingDialogOrder.status === 'cancelled' && (
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="h-3.5 w-3.5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-700">
                    Order Cancelled
                  </p>
                  {trackingDialogOrder.cancelReason && (
                    <p className="text-xs text-red-600">
                      {trackingDialogOrder.cancelReason}
                    </p>
                  )}
                </div>
              </div>
            )}

            {trackingDialogOrder.isDelivered && (
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {trackingDialogOrder.deliveryMode === 'pickup'
                      ? 'Picked Up'
                      : 'Delivered'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* U-Engage Info (Delivery Only) */}
        {trackingDialogOrder.deliveryMode === 'delivery' &&
          trackingDialogOrder.uengage?.taskId && (
            <div className="bg-blue-50 rounded-lg p-3">
              <h4 className="font-semibold text-sm text-blue-900 mb-1">
                Delivery Tracking
              </h4>
              <p className="text-xs text-blue-800">
                Task ID: {trackingDialogOrder.uengage.taskId}
              </p>
            </div>
          )}
      </div>
    )}
  </DialogContent>
</Dialog>


                        {/* Cancel Button */}
                        {canCancelOrder(order) && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="flex-1 sm:flex-initial text-xs h-8"
                                onClick={() => setSelectedOrder(order)}
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                Cancel Order
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                              <DialogHeader>
                                <DialogTitle className="text-xl">Cancel Order</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="reason" className="text-sm font-medium">
                                    Reason for Cancellation *
                                  </Label>
                                  <Textarea
                                    id="reason"
                                    placeholder="Please tell us why you want to cancel this order..."
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    rows={4}
                                    className="resize-none"
                                  />
                                </div>
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                  <div className="flex gap-3">
                                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                      <p className="text-sm text-yellow-800 font-medium mb-1">
                                        This action cannot be undone
                                      </p>
                                      <p className="text-xs text-yellow-700">
                                        Your order will be cancelled immediately{!isPickup && ' and the delivery will be stopped if already assigned'}.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedOrder(null);
                                    setCancelReason('');
                                  }}
                                  className="w-full sm:w-auto"
                                  size="lg"
                                >
                                  Keep Order
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  onClick={handleCancelOrder}
                                  disabled={isCancelling || !cancelReason.trim()}
                                  className="w-full sm:w-auto"
                                  size="lg"
                                >
                                  {isCancelling ? (
                                    <>
                                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                      Cancelling...
                                    </>
                                  ) : (
                                    'Confirm Cancellation'
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Orders;