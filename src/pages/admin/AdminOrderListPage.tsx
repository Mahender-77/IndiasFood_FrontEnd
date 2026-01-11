import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Order, User } from '@/types';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom'; // Add this import
import { ArrowLeft, Loader2 } from 'lucide-react'; // Add this import
import { Skeleton } from '@/components/ui/skeleton';

export const AdminOrderListPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryPersons, setDeliveryPersons] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState<string>('');
  const [eta, setEta] = useState('');
  const [isAssigning, setIsAssigning] = useState(false); // New state for assign loading
  const { toast } = useToast();

  const fetchOrdersAndDeliveryPersons = async () => {
    setLoading(true);
    setError(null);
    try {
      const ordersResponse = await api.get('/admin/orders');
      setOrders(ordersResponse.data);

      const deliveryPersonsResponse = await api.get('/admin/delivery-persons');
      setDeliveryPersons(deliveryPersonsResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch data');
      toast({
        title: 'Error',
        description: 'Failed to fetch orders or delivery persons.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersAndDeliveryPersons();
  }, []);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status });
      setOrders(orders.map(order => order._id === orderId ? { ...order, isPaid: status === 'paid' } : order));
      toast({
        title: 'Order Status Updated',
        description: `Order ${orderId} status updated to ${status}.`,
      });
      fetchOrdersAndDeliveryPersons(); // Refresh data
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to update order status.',
        variant: 'destructive',
      });
    }
  };

  const updateOrderDelivery = async (orderId: string, isDelivered: boolean) => {
    try {
      await api.put(`/admin/orders/${orderId}/delivery`, { isDelivered });
      setOrders(orders.map(order => order._id === orderId ? { ...order, isDelivered: isDelivered, deliveredAt: isDelivered ? new Date().toISOString() : undefined } : order));
      toast({
        title: 'Order Delivery Updated',
        description: `Order ${orderId} delivery status updated.`,
      });
      fetchOrdersAndDeliveryPersons(); // Refresh data
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to update order delivery status.',
        variant: 'destructive',
      });
    }
  };

  const handleAssignDelivery = async () => {
    if (!selectedOrder || !selectedDeliveryPerson || !eta) {
      toast({
        title: 'Error',
        description: 'Please select a delivery person and set an ETA.',
        variant: 'destructive',
      });
      return;
    }

    setIsAssigning(true); // Set loading state for assignment
    try {
      await api.put(`/admin/orders/${selectedOrder._id}/assign-delivery`, {
        deliveryPersonId: selectedDeliveryPerson,
        eta,
      });
      toast({
        title: 'Delivery Assigned',
        description: `Order ${selectedOrder._id} assigned to delivery person. ETA: ${eta}`,
      });
      // Close dialog and refresh orders
      setSelectedOrder(null);
      setSelectedDeliveryPerson('');
      setEta('');
      fetchOrdersAndDeliveryPersons();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to assign delivery person.',
        variant: 'destructive',
      });
    } finally {
      setIsAssigning(false); // Reset loading state
    }
  };

  if (loading) {
    return (
      <Layout>
        <section className="section-padding bg-background">
          <div className="container-custom">
            <Skeleton className="h-10 w-64 mb-8" />
            <Skeleton className="h-60 w-full rounded-md" />
          </div>
        </section>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <section className="section-padding bg-background">
          <div className="container-custom text-center py-16">
            <h1 className="font-display text-2xl font-bold text-foreground mb-4">Error</h1>
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="section-padding bg-background pt-0">
      <div className="bg-cream py-4">
        <div className="container-custom">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
        <div className="container-custom pt-10">
         

          <h1 className="font-display text-3xl font-bold mb-8">Manage Orders</h1>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>USER</TableHead>
                  <TableHead>DATE</TableHead>
                  <TableHead>TOTAL</TableHead>
                  <TableHead>PAID</TableHead>
                  <TableHead>DELIVERED</TableHead>
                  <TableHead>DELIVERY PERSON</TableHead>
                  <TableHead>ETA</TableHead>
                  <TableHead>ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                      No orders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell className="font-medium">{order._id}</TableCell>
                      <TableCell>{(order.user as User)?.username || 'N/A'}</TableCell>
                      <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>₹{order.totalPrice}</TableCell>
                      <TableCell>
                        {order.isPaid ? (
                          <Badge variant="default">Paid</Badge>
                        ) : (
                          <Badge variant="destructive">Not Paid</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {order.isDelivered ? (
                          <Badge variant="default">Delivered</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {(order.deliveryPerson as User)?.username || 'Unassigned'}
                      </TableCell>
                      <TableCell>{order.eta || 'N/A'}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateOrderStatus(order._id, order.isPaid ? 'unpaid' : 'paid')}
                          className="mr-2"
                          disabled={isAssigning || loading}
                        >
                          {order.isPaid ? 'Mark Unpaid' : 'Mark Paid'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateOrderDelivery(order._id, !order.isDelivered)}
                          className="mr-2"
                          disabled={isAssigning || loading}
                        >
                          {order.isDelivered ? 'Mark Undelivered' : 'Mark Delivered'}
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)} disabled={isAssigning || loading}>
                              Assign Delivery
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Assign Delivery Person to Order {selectedOrder?._id}</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="deliveryPerson" className="text-right">
                                  Delivery Person
                                </Label>
                                <Select onValueChange={setSelectedDeliveryPerson} value={selectedDeliveryPerson} disabled={isAssigning || loading}>
                                  <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a delivery person" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {deliveryPersons.map(person => (
                                      <SelectItem key={person._id} value={person._id}>
                                        {person.username}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="eta" className="text-right">
                                  ETA
                                </Label>
                                <Input id="eta" value={eta} onChange={(e) => setEta(e.target.value)} className="col-span-3" placeholder="e.g., 30 mins, 1 hour" disabled={isAssigning || loading} />
                              </div>
                            </div>
                            <Button onClick={handleAssignDelivery} disabled={isAssigning || loading}>
                              {isAssigning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Assign'}
                            </Button>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>
    </Layout>
  );
};
