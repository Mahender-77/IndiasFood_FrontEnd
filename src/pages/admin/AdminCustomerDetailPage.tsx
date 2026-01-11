import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { User, Order, Address, OrderItem } from '@/types';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface CustomerDetailUser extends User {
  orderHistory: Order[];
}

const AdminCustomerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<CustomerDetailUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCustomer = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get(`/admin/customers/${id}`);
        setCustomer(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch customer details');
        toast({
          title: 'Error',
          description: 'Failed to fetch customer details.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [id, toast]);

  if (loading) {
    return (
      <Layout>
        <section className="section-padding bg-background">
          <div className="container-custom">
            <Skeleton className="h-10 w-64 mb-8" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
            <Skeleton className="h-8 w-48 mb-6" />
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
            <Link to="/admin/customers">
              <Button variant="outline">
                Back to Customers
              </Button>
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  if (!customer) {
    return (
      <Layout>
        <section className="section-padding bg-background">
          <div className="container-custom text-center py-16">
            <h1 className="font-display text-2xl font-bold mb-4">Customer Not Found</h1>
            <p className="text-muted-foreground mb-4">The customer you are looking for does not exist.</p>
            <Link to="/admin/customers">
              <Button variant="outline">
                Back to Customers
              </Button>
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      

      <section className="section-padding bg-background pt-0">
      <div className="bg-cream py-4">
        <div className="container-custom ">
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
          <h1 className="font-display text-3xl font-bold mb-8">Customer Details: {customer.username}</h1>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Username:</strong> {customer.username}</p>
                <p><strong>Email:</strong> {customer.email}</p>
                <p><strong>Role:</strong> {customer.role}</p>
              </CardContent>
            </Card>

            {customer.addresses && customer.addresses.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Addresses</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {customer.addresses.map((addr: Address, index: number) => (
                    <div key={index} className="border-b pb-2 last:border-b-0">
                      <p>{addr.address}</p>
                      <p>{addr.city}, {addr.postalCode}</p>
                      <p>{addr.country}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Addresses</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">No addresses found.</p>
                </CardContent>
              </Card>
            )}
          </div>

          <h2 className="font-display text-2xl font-bold mb-6">Order History</h2>
          {customer.orderHistory && customer.orderHistory.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ORDER ID</TableHead>
                    <TableHead>DATE</TableHead>
                    <TableHead>TOTAL</TableHead>
                    <TableHead>PAID</TableHead>
                    <TableHead>DELIVERED</TableHead>
                    <TableHead>ITEMS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.orderHistory.map((order: Order) => (
                    <TableRow key={order._id}>
                      <TableCell>{order._id}</TableCell>
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
                        {order.orderItems.map((item: OrderItem) => item.name).join(', ')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground">No orders found for this customer.</p>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default AdminCustomerDetailPage;
