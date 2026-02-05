import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Package, Clock, Phone, User, Info, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface OrderItem {
  product: {
    name: string;
  };
  qty: number;
}

interface Order {
  _id: string;
  user: {
    username: string;
    email: string;
    phone?: string;
  };
  shippingAddress: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  orderItems: OrderItem[];
  totalPrice: number;
  isDelivered: boolean;
  deliveredAt?: string;
  status: string;
  createdAt: string;
}

const DeliveryDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignedOrders, setAssignedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignedOrders = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/delivery/orders`);
      setAssignedOrders(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch orders');
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to fetch orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedOrders();
  }, []);

  const handleMarkAsDelivered = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to mark this order as delivered?')) {
      return;
    }
    try {
      await api.put(`/delivery/orders/${orderId}/deliver`);
      toast({
        title: 'Order Delivered',
        description: `Order ${orderId.substring(0, 8)} has been marked as delivered.`, 
      });
      fetchAssignedOrders(); // Refresh orders
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to mark order as delivered',
        variant: 'destructive',
      });
    }
  };
  return (
    <Layout>
      <section className="section-padding bg-cream min-h-[calc(100vh-200px)]">
        <div className="container-custom">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-8">
            Delivery Dashboard
          </h1>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-xl" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <h1 className="font-display text-2xl font-bold mb-4">Error</h1>
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Try Again
              </Button>
            </div>
          ) : assignedOrders.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg mb-4">
                No assigned orders at the moment.
              </p>
              <Button onClick={fetchAssignedOrders} variant="outline">
                Refresh Orders
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignedOrders.map((order) => (
                <Card key={order._id} className="shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-semibold">Order #{order._id.substring(0, 8)}</CardTitle>
                    <Badge variant={order.status === 'pending' ? 'secondary' : 'default'}>
                      {order.status}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <User className="h-4 w-4 mr-2" />
                      Customer: {order.user.username}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 mr-2" />
                      Contact: {order.user.phone || 'N/A'}
                    </div>
                    <div className="flex items-start text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2 mt-1" />
                      Delivery Address: {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.postalCode}, {order.shippingAddress.country}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Package className="h-4 w-4 mr-2" />
                      Items: {order.orderItems.map(item => `${item.product.name} (x${item.qty})`).join(', ')}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-2" />
                      Placed On: {new Date(order.createdAt).toLocaleString()}
                    </div>
                    <div className="flex items-center text-sm font-semibold text-foreground">
                      Total: ₹{order.totalPrice.toFixed(2)}
                    </div>

                    {!order.isDelivered ? (
                      <Button className="w-full" onClick={() => handleMarkAsDelivered(order._id)} disabled={loading}>
                        Mark as Delivered
                      </Button>
                    ) : (
                      <Button className="w-full" variant="outline" disabled>
                        Delivered {order.deliveredAt ? new Date(order.deliveredAt).toLocaleString() : ''}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default DeliveryDashboard;


