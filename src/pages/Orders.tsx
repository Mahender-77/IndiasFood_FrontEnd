import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowRight, Clock, CheckCircle2, Truck, XCircle, AlertCircle, MapPin, Phone, RefreshCw, Navigation, Eye } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
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
  const [trackingDialog, setTrackingDialog] = useState<Order | null>(null);

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

  // Track order status
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
    return !order.isDelivered && order.status !== 'cancelled' && order.status !== 'out_for_delivery';
  };

  const canTrackOrder = (order: Order) => {
    return order.uengage?.taskId && !order.isDelivered && order.status !== 'cancelled';
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
              <Button onClick={() => window.location.reload()} variant="outline" size="lg">
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

              return (
                <div
                  key={order._id}
                  className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Header Section */}
                  <div className="bg-muted/30 px-4 sm:px-6 py-4 border-b border-border">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      {/* Order Info */}
                      <div className="flex items-center gap-3">
                        <div className="hidden sm:flex w-12 h-12 rounded-full bg-primary/10 items-center justify-center flex-shrink-0">
                          <Package className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-foreground">
                              Order #{order._id.slice(-8).toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground">
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
                      <div className="flex flex-wrap items-center gap-2">
                        <div className={cn(
                          'inline-flex items-center gap-2 px-4 py-2 rounded-full border',
                          status.bgColor,
                          status.borderColor
                        )}>
                          <StatusIcon className={cn('h-4 w-4', status.color)} />
                          <span className={cn('text-sm font-semibold', status.color)}>
                            {status.label}
                          </span>
                        </div>
                        
                        {/* U-Engage Status Badge */}
                        {uengageStatus && uengageStatusMap[uengageStatus] && (
                          <Badge variant="outline" className="text-xs">
                            {uengageStatusMap[uengageStatus].label}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* U-Engage Status Info */}
                  {order.uengage?.message && (
                    <div className="px-4 sm:px-6 py-3 bg-blue-50 border-b border-blue-100">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">
                            {order.uengage.message}
                          </p>
                          {uengageStatus && uengageStatusMap[uengageStatus] && (
                            <p className="text-xs text-blue-700 mt-0.5">
                              {uengageStatusMap[uengageStatus].description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Order Items */}
                  <div className="px-4 sm:px-6 py-5 space-y-4">
                    {order.orderItems.map((item, index) => (
                      <div
                        key={`${item.product}-${index}`}
                        className="flex items-center gap-4 pb-4 border-b border-border last:border-0 last:pb-0"
                      >
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={item.image || '/images/placeholder.png'}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground mb-1 line-clamp-2">
                            {item.name}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Quantity: {item.qty}</span>
                            <span>•</span>
                            <span>₹{item.price} each</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-lg text-foreground">
                            ₹{item.price * item.qty}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Delivery Address Section */}
                  {order.shippingAddress && (
                    <div className="px-4 sm:px-6 py-4 bg-muted/20 border-t border-border">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Delivery Address
                          </p>
                          <p className="text-sm text-foreground font-medium">
                            {order.shippingAddress.fullName}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.postalCode}
                          </p>
                          <div className="flex flex-wrap gap-3 mt-2">
                            {order.shippingAddress.phone && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Phone className="h-3.5 w-3.5" />
                                <span>{order.shippingAddress.phone}</span>
                              </div>
                            )}
                            {order.distance && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5" />
                                <span>{order.distance} km away</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rider Details - Show when tracking data available */}
                  {tracking && (
                    <div className="px-4 sm:px-6 py-4 bg-green-50 border-t border-green-200">
                      <div className="flex items-start gap-3">
                        <Truck className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-green-900 mb-2">
                            Delivery Partner: {tracking.partner_name}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            {tracking.rider_name && (
                              <div className="flex items-center gap-2 text-green-800">
                                <span className="font-medium">Rider:</span>
                                <span>{tracking.rider_name}</span>
                              </div>
                            )}
                            {tracking.rider_contact && (
                              <div className="flex items-center gap-2 text-green-800">
                                <Phone className="h-4 w-4" />
                                <span>{tracking.rider_contact}</span>
                              </div>
                            )}
                          </div>
                          {tracking.tracking_url && (
                            <a 
                              href={tracking.tracking_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 mt-3 text-sm text-green-700 hover:text-green-800 font-medium"
                            >
                              <Navigation className="h-4 w-4" />
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
                    <div className="px-4 sm:px-6 py-4 bg-red-50 border-t border-red-200">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-red-900 mb-1">
                            Order Cancelled
                          </p>
                          <p className="text-sm text-red-700">
                            {order.cancelReason}
                          </p>
                          {order.cancelledAt && (
                            <p className="text-xs text-red-600 mt-1">
                              Cancelled on {new Date(order.cancelledAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer Section */}
                  <div className="px-4 sm:px-6 py-4 bg-muted/30 border-t border-border">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      {/* Order Summary & ETA */}
                      <div className="w-full sm:w-auto">
                        {/* Price Breakdown */}
                        <div className="space-y-1 mb-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-medium">₹{order.orderItems.reduce((total, item) => total + (item.price * item.qty), 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
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
                          {order.taxPrice > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Tax</span>
                              <span className="font-medium">₹{order.taxPrice.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-1 border-t border-border">
                            <span className="font-semibold">Total</span>
                            <span className="font-display text-lg sm:text-xl font-bold text-primary">₹{order.totalPrice.toFixed(2)}</span>
                          </div>
                        </div>

                        {order.eta && !order.isDelivered && order.status !== 'cancelled' && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            ETA: {new Date(order.eta).toLocaleString()}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        {/* Track Order Button */}
                        {canTrackOrder(order) && (
                          <Button
                            variant="outline"
                            size="default"
                            onClick={() => trackOrder(order._id)}
                            disabled={isTracking.has(order._id)}
                            className="flex-1 sm:flex-initial"
                          >
                            {isTracking.has(order._id) ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Tracking...
                              </>
                            ) : (
                              <>
                                <Navigation className="h-4 w-4 mr-2" />
                                Track Order
                              </>
                            )}
                          </Button>
                        )}

                        {/* View Details Button */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="default"
                              onClick={() => setTrackingDialog(order)}
                              className="flex-1 sm:flex-initial"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Order Details</DialogTitle>
                              <DialogDescription>
                                Order #{order._id.slice(-8).toUpperCase()}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              {/* Status Timeline */}
                              <div className="bg-muted/50 rounded-lg p-4">
                                <h4 className="font-semibold mb-3">Order Status</h4>
                                <div className="space-y-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">Order Placed</p>
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(order.createdAt).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                  {order.isPaid && (
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">Payment Confirmed</p>
                                        <p className="text-xs text-muted-foreground">
                                          {order.paidAt ? new Date(order.paidAt).toLocaleString() : 'Paid'}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                  {order.isDelivered && (
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">Delivered</p>
                                        <p className="text-xs text-muted-foreground">
                                          {order.deliveredAt ? new Date(order.deliveredAt).toLocaleString() : 'Delivered'}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* U-Engage Info */}
                              {order.uengage?.taskId && (
                                <div className="bg-blue-50 rounded-lg p-4">
                                  <h4 className="font-semibold mb-2 text-blue-900">Delivery Tracking</h4>
                                  <div className="space-y-1 text-sm">
                                    <p className="text-blue-800">
                                      <span className="font-medium">Task ID:</span> {order.uengage.taskId}
                                    </p>
                                    {order.uengage.statusCode && (
                                      <p className="text-blue-800">
                                        <span className="font-medium">Status:</span> {uengageStatusMap[order.uengage.statusCode]?.label || order.uengage.statusCode}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>

                        {/* Cancel Button */}
                        {canCancelOrder(order) && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="default"
                                className="flex-1 sm:flex-initial"
                                onClick={() => setSelectedOrder(order)}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
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
                                        Your order will be cancelled immediately and the delivery will be stopped if already assigned.
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