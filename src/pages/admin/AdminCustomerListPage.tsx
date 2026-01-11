import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User } from '@/types';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { Eye, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const AdminCustomerListPage = () => {
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get('/admin/customers');
        setCustomers(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch customers');
        toast({
          title: 'Error',
          description: 'Failed to fetch customers.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, [toast]);

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
        
          <h1 className="font-display text-3xl font-bold mb-8">Manage Customers</h1>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>NAME</TableHead>
                  <TableHead>EMAIL</TableHead>
                  <TableHead>TOTAL ORDERS</TableHead>
                  <TableHead>ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No customers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow key={customer._id}>
                      <TableCell className="font-medium">{customer._id}</TableCell>
                      <TableCell>{customer.username}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{(customer as any).totalOrders}</TableCell>
                      <TableCell>
                        <Link to={`/admin/customers/${customer._id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" /> View Details
                          </Button>
                        </Link>
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

export default AdminCustomerListPage;

