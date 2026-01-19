import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowRight, Clock, CheckCircle2, Truck, XCircle, AlertCircle, MapPin, Phone } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Order } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';

const getOrderStatus = (order: Order) => {
  if (order.status === 'cancelled') return 'cancelled';
  if (order.isDelivered) return 'delivered';
  if (order.status === 'out_for_delivery') return 'out_for_delivery';
  if (order.isPaid) return 'confirmed';
  return 'placed';
};

const statusConfig = {
  placed: {
    label: 'Order Placed',
    icon: Clock,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle2,
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    icon: Truck,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  delivered: {
    label: 'Delivered',
    icon: CheckCircle2,
    color: 'text-pistachio',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
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
    }
  };
  
  useEffect(() => {
    fetchOrders();
  }, [token]);

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
                      <div className={cn(
                        'inline-flex items-center gap-2 px-4 py-2 rounded-full border w-fit',
                        status.bgColor,
                        status.borderColor
                      )}>
                        <StatusIcon className={cn('h-4 w-4', status.color)} />
                        <span className={cn('text-sm font-semibold', status.color)}>
                          {status.label}
                        </span>
                      </div>
                    </div>
                  </div>

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
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer Section */}
                  <div className="px-4 sm:px-6 py-4 bg-muted/30 border-t border-border">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      {/* Order Summary & ETA */}
                      <div>
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

                      {/* Cancel Button */}
                      {canCancelOrder(order) && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="default"
                              className="w-full sm:w-auto"
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
                                  <p className="text-sm text-yellow-800">
                                    This action cannot be undone. Your order will be cancelled immediately.
                                  </p>
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
                                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
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