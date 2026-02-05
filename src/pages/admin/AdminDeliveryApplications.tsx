import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, ArrowLeft, Package } from 'lucide-react';

interface DeliveryApplication {
  _id: string;
  username: string;
  email: string;
  phone?: string;
  deliveryProfile: {
    vehicleType: string;
    licenseNumber: string;
    areas: string[];
    documents: string[]; // URLs to cloudinary images
    status: 'pending' | 'approved';
  };
}

export function AdminDeliveryApplications() {
  const { token } = useAuth();
  const [applications, setApplications] = useState<DeliveryApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [viewingDocs, setViewingDocs] = useState<string[]>([]);
  const [isViewDocsModalOpen, setIsViewDocsModalOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false); // New state for approve loading

  const fetchApplications = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };
      const { data } = await api.get('/delivery/applications', config);
      setApplications(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch applications');
      toast({
        title: "Error",
        description: err.response?.data?.message || 'Failed to fetch applications',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [token]);

  const handleApprove = async (id: string) => {
    if (!token) return;
    setIsApproving(true); // Set loading state for approval
    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };
      await api.put(`/delivery/${id}/approve`, {}, config);
      toast({
        title: "Success",
        description: "Delivery application approved successfully!",
      });
      fetchApplications(); // Refresh the list
    } catch (err: any) {
      console.error('Failed to approve application:', err);
      toast({
        title: "Error",
        description: err.response?.data?.message || 'Failed to approve application',
        variant: "destructive",
      });
    } finally {
      setIsApproving(false); // Reset loading state
    }
  };

  const handleViewDocs = (documents: string[]) => {
    setViewingDocs(documents);
    setIsViewDocsModalOpen(true);
  };

  if (loading) {
    return (
      <Layout>
        <section className="section-padding bg-cream min-h-[calc(100vh-200px)]">
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
        <section className="section-padding bg-cream min-h-[calc(100vh-200px)] text-center py-16">
          <h1 className="font-display text-2xl font-bold mb-4">Error</h1>
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="section-padding bg-cream min-h-[calc(100vh-200px)]">
        <div className="container-custom">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-8">
            Delivery Applications
          </h1>

          {applications.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Areas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app._id}>
                      <TableCell className="font-medium">{app.username}</TableCell>
                      <TableCell>{app.email}</TableCell>
                      <TableCell>{app.deliveryProfile.vehicleType}</TableCell>
                      <TableCell>{app.deliveryProfile.licenseNumber}</TableCell>
                      <TableCell>{app.deliveryProfile.areas.join(', ')}</TableCell>
                      <TableCell>
                        <Badge variant={app.deliveryProfile.status === 'pending' ? 'secondary' : 'default'}>
                          {app.deliveryProfile.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => handleViewDocs(app.deliveryProfile.documents)} className="mr-2" disabled={isApproving || loading}>
                          View Docs
                        </Button>
                        {app.deliveryProfile.status === 'pending' && (
                          <Button size="sm" onClick={() => handleApprove(app._id)} disabled={isApproving || loading}>
                            {isApproving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-16">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">
                No pending delivery applications.
              </p>
            </div>
          )}
        </div>
      </section>

      <Dialog open={isViewDocsModalOpen} onOpenChange={setIsViewDocsModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Documents for {applications.find(app => app.deliveryProfile.documents === viewingDocs)?.username}</DialogTitle>
            <DialogDescription>
              Review the uploaded documents for this delivery partner application.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {viewingDocs.length > 0 ? (
              viewingDocs.map((doc, index) => (
                <div key={index} className="border rounded-md overflow-hidden">
                  <a href={doc} target="_blank" rel="noopener noreferrer">
                    <img src={doc} alt={`Document ${index + 1}`} className="w-full h-auto object-cover" />
                  </a>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No documents uploaded.</p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

