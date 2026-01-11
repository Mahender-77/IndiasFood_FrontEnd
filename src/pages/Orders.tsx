import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowRight, Clock, CheckCircle2, Truck, XCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Order } from '@/types';
import axios from 'axios';
import { Skeleton } from '@/components/ui/skeleton';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const getOrderStatus = (order: Order) => {
  if (order.isDelivered) return 'delivered';
  if (order.isPaid) return 'confirmed';
  // You might want to add more sophisticated logic here based on your backend order status flow
  return 'placed';
};

const statusConfig = {
  placed: {
    label: 'Order Placed',
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    icon: Truck,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  delivered: {
    label: 'Delivered',
    icon: CheckCircle2,
    color: 'text-pistachio',
    bgColor: 'bg-green-100',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
};

const Orders = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
        const { data } = await axios.get(`${API_BASE_URL}/user/orders`, config);
        setOrders(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token]);

  if (loading) {
    return (
      <Layout>
        <section className="section-padding bg-background">
          <div className="container-custom">
            <Skeleton className="h-10 w-48 mb-8" />
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-xl" />
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
          <div className="container-custom">
            <div className="max-w-md mx-auto text-center py-16">
              <h1 className="font-display text-2xl font-bold text-foreground mb-4">Error</h1>
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} variant="outline">
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
          <div className="container-custom">
            <div className="max-w-md mx-auto text-center py-16">
              <div className="w-24 h-24 mx-auto rounded-full bg-muted flex items-center justify-center mb-6">
                <Package className="h-12 w-12 text-muted-foreground" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                No Orders Yet
              </h1>
              <p className="text-muted-foreground mb-6">
                Once you place an order, it will appear here.
              </p>
              <Link to="/products">
                <Button size="lg" variant="hero" className="gap-2">
                  Start Shopping
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
      <section className="section-padding bg-background">
        <div className="container-custom">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-8">
            Your Orders
          </h1>

          <div className="space-y-6">
            {orders.map((order) => {
              const currentStatus = getOrderStatus(order);
              const status = statusConfig[currentStatus as keyof typeof statusConfig];
              const StatusIcon = status.icon;

              return (
                <div
                  key={order._id}
                  className="bg-card rounded-xl shadow-card overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted/50 border-b border-border">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Order #{order._id}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Placed on {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full', status.bgColor)}>
                      <StatusIcon className={cn('h-4 w-4', status.color)} />
                      <span className={cn('text-sm font-medium', status.color)}>
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="p-4 space-y-3">
                    {order.orderItems.map((item, index) => (
                      <div
                        key={item.product}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.qty}
                          </p>
                        </div>
                        <p className="font-medium">₹{item.price}</p>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-t border-border">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Expected Delivery
                      </p>
                      <p className="font-medium">
                        {order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        }) : 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="font-display text-xl font-bold text-primary">
                        ₹{order.totalPrice}
                      </p>
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
};;

export default Orders;
