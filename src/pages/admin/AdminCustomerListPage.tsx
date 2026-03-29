import { useEffect, useState, useMemo, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User, GiveAway } from '@/types';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { Eye, ArrowLeft, Filter, Gift, Loader2, Pencil, Plus, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

const defaultGiveAwayForm = () => ({
  title: '',
  isActive: true,
  minOrderAmountEnabled: true,
  minOrderAmount: 1000,
  minOrdersInDayEnabled: false,
  minOrdersInDay: 2,
});

type GiveAwayFormState = ReturnType<typeof defaultGiveAwayForm>;

function formFromGiveAway(g: GiveAway): GiveAwayFormState {
  const minOrder = g.conditions?.find((c) => c.type === 'minOrderAmount');
  const minOrders = g.conditions?.find((c) => c.type === 'minOrdersInDay');
  return {
    title: g.title,
    isActive: g.isActive,
    minOrderAmountEnabled: !!(minOrder && minOrder.isEnabled !== false),
    minOrderAmount: minOrder?.value ?? 1000,
    minOrdersInDayEnabled: !!(minOrders && minOrders.isEnabled !== false),
    minOrdersInDay: minOrders?.value ?? 2,
  };
}

function buildConditionsFromForm(form: GiveAwayFormState) {
  const conditions: { type: string; value: number; isEnabled: boolean }[] = [];
  if (form.minOrderAmountEnabled) {
    conditions.push({ type: 'minOrderAmount', value: Number(form.minOrderAmount) || 0, isEnabled: true });
  }
  if (form.minOrdersInDayEnabled) {
    conditions.push({ type: 'minOrdersInDay', value: Number(form.minOrdersInDay) || 0, isEnabled: true });
  }
  return conditions;
}

const AdminCustomerListPage = () => {
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newsletterFilter, setNewsletterFilter] = useState<string>('all');
  const { toast } = useToast();

  const [giveAways, setGiveAways] = useState<GiveAway[]>([]);
  const [loadingGiveAways, setLoadingGiveAways] = useState(false);
  const [giveAwayModalOpen, setGiveAwayModalOpen] = useState(false);
  const [editingGiveAway, setEditingGiveAway] = useState<GiveAway | null>(null);
  const [giveAwayForm, setGiveAwayForm] = useState(defaultGiveAwayForm);
  const [savingGiveAway, setSavingGiveAway] = useState(false);

  const fetchGiveAways = useCallback(async () => {
    setLoadingGiveAways(true);
    try {
      const resp = await api.get('/admin/giveaways');
      const list = Array.isArray(resp.data) ? resp.data : [];
      setGiveAways(list);
    } catch {
      setGiveAways([]);
    } finally {
      setLoadingGiveAways(false);
    }
  }, []);

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
    fetchGiveAways();
  }, [toast, fetchGiveAways]);

  const openCreateGiveAway = () => {
    setEditingGiveAway(null);
    setGiveAwayForm(defaultGiveAwayForm());
    setGiveAwayModalOpen(true);
  };

  const openEditGiveAway = (g: GiveAway) => {
    setEditingGiveAway(g);
    setGiveAwayForm(formFromGiveAway(g));
    setGiveAwayModalOpen(true);
  };

  const handleSaveGiveAway = async () => {
    if (!giveAwayForm.title.trim()) {
      toast({ title: 'Validation', description: 'Please enter a giveaway title.', variant: 'destructive' });
      return;
    }
    const conditions = buildConditionsFromForm(giveAwayForm);
    setSavingGiveAway(true);
    try {
      if (editingGiveAway) {
        await api.put(`/admin/giveaways/${editingGiveAway._id}`, {
          title: giveAwayForm.title.trim(),
          isActive: giveAwayForm.isActive,
          conditions,
        });
        toast({ title: 'Saved', description: 'Giveaway rule updated.' });
      } else {
        console.log('handleSaveGiveAway', giveAwayForm);
        await api.post('/admin/giveaways', {
          title: giveAwayForm.title.trim(),
          isActive: giveAwayForm.isActive,
          conditions,
        });
        toast({ title: 'Created', description: 'Giveaway rule created.' });
      }
      setGiveAwayModalOpen(false);
      setEditingGiveAway(null);
      setGiveAwayForm(defaultGiveAwayForm());
      await fetchGiveAways();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to save giveaway.',
        variant: 'destructive',
      });
    } finally {
      setSavingGiveAway(false);
    }
  };

  const toggleGiveAwayActive = async (id: string, isActive: boolean) => {
    try {
      await api.put(`/admin/giveaways/${id}`, { isActive });
      setGiveAways((prev) => prev.map((g) => (g._id === id ? { ...g, isActive } : g)));
      toast({ title: 'Updated', description: `Rule ${isActive ? 'activated' : 'deactivated'}.` });
    } catch {
      toast({ title: 'Error', description: 'Failed to update giveaway.', variant: 'destructive' });
    }
  };

  // Filter customers based on newsletter subscription
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      if (newsletterFilter === 'all') return true;
      if (newsletterFilter === 'subscribed') return customer.newsletterSubscribed === true;
      if (newsletterFilter === 'not-subscribed') return !customer.newsletterSubscribed;
      return true;
    });
  }, [customers, newsletterFilter]);

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

          {/* Giveaway rules — above customer list */}
          <Card className="mb-8 border border-border/80 shadow-sm">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between space-y-0 pb-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="rounded-lg bg-orange-500/10 p-2 shrink-0">
                  <Gift className="h-5 w-5 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-lg">Giveaway rules</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Order thresholds and daily order rules. Apply giveaways to eligible orders from the orders page.
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 sm:pt-0">
              <Button className="bg-orange-500 hover:bg-orange-600 gap-2 w-full sm:w-auto" onClick={openCreateGiveAway}>
                <Plus className="h-4 w-4" />
                Create giveaway
              </Button>
              <Dialog open={giveAwayModalOpen} onOpenChange={(open) => { setGiveAwayModalOpen(open); if (!open) { setEditingGiveAway(null); setGiveAwayForm(defaultGiveAwayForm()); } }}>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{editingGiveAway ? 'Edit giveaway rule' : 'Create giveaway rule'}</DialogTitle>
                    <DialogDescription>
                      Set conditions here. Products and quantities are chosen when applying a giveaway to an order.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={giveAwayForm.title}
                        onChange={(e) => setGiveAwayForm((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Summer Sweet Sampler"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 border rounded-md p-3">
                      <div className="space-y-1">
                        <Label>Order amount above (₹)</Label>
                        <p className="text-xs text-muted-foreground">Customer is eligible if order total meets threshold</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Switch
                          checked={giveAwayForm.minOrderAmountEnabled}
                          onCheckedChange={(v) => setGiveAwayForm((prev) => ({ ...prev, minOrderAmountEnabled: v }))}
                        />
                        <Input
                          type="number"
                          min="0"
                          className="w-28"
                          disabled={!giveAwayForm.minOrderAmountEnabled}
                          value={giveAwayForm.minOrderAmount}
                          onChange={(e) => setGiveAwayForm((prev) => ({ ...prev, minOrderAmount: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 border rounded-md p-3">
                      <div className="space-y-1">
                        <Label>Daily customer (orders per day)</Label>
                        <p className="text-xs text-muted-foreground">Eligible if they place N orders today</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Switch
                          checked={giveAwayForm.minOrdersInDayEnabled}
                          onCheckedChange={(v) => setGiveAwayForm((prev) => ({ ...prev, minOrdersInDayEnabled: v }))}
                        />
                        <Input
                          type="number"
                          min="0"
                          className="w-28"
                          disabled={!giveAwayForm.minOrdersInDayEnabled}
                          value={giveAwayForm.minOrdersInDay}
                          onChange={(e) => setGiveAwayForm((prev) => ({ ...prev, minOrdersInDay: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Switch checked={giveAwayForm.isActive} onCheckedChange={(v) => setGiveAwayForm((prev) => ({ ...prev, isActive: v }))} />
                        <span className="text-sm font-medium">Active</span>
                      </div>
                      <Button onClick={handleSaveGiveAway} disabled={savingGiveAway} className="gap-2">
                        {savingGiveAway ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            {editingGiveAway ? 'Save changes' : 'Save rule'}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loadingGiveAways ? (
                <div className="text-sm text-muted-foreground flex items-center gap-2 py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading rules...
                </div>
              ) : giveAways.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No giveaway rules yet. Create one to get started.</p>
              ) : (
                <div className="space-y-3">
                  {giveAways.map((g) => (
                    <div
                      key={g._id}
                      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border rounded-lg p-4 bg-muted/30"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate">{g.title}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {g.conditions?.map((c, ci) => (
                            <span key={ci} className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-medium">
                              {c.type === 'minOrderAmount' ? `Spend ₹${c.value}+` : `${c.value}+ orders/day`}
                            </span>
                          ))}
                          {g.isActive ? (
                            <Badge className="bg-green-600 text-xs">Active</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Off
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Switch checked={g.isActive} onCheckedChange={(v) => toggleGiveAwayActive(g._id, v)} />
                        <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => openEditGiveAway(g)}>
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Filters */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter by Newsletter:</span>
            </div>
            <Select value={newsletterFilter} onValueChange={setNewsletterFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Newsletter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                <SelectItem value="subscribed">Subscribed</SelectItem>
                <SelectItem value="not-subscribed">Not Subscribed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>NAME</TableHead>
                  <TableHead>EMAIL</TableHead>
                  <TableHead>PHONE</TableHead>
                  <TableHead>NEWSLETTER</TableHead>
                  <TableHead>TOTAL ORDERS</TableHead>
                  <TableHead>ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No customers found matching the filter criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer._id}>
                      <TableCell className="font-medium">{customer._id}</TableCell>
                      <TableCell>{customer.username}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.phone || 'N/A'}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            customer.newsletterSubscribed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {customer.newsletterSubscribed ? 'Subscribed' : 'Not Subscribed'}
                        </span>
                      </TableCell>
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
