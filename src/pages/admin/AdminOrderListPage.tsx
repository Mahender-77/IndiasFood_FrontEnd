import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Order, User } from '@/types';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Eye, AlertCircle, Settings, Save, Plus, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

interface StoreLocation {
  storeId?: string;
  name: string;
  contact_number: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
}


export const AdminOrderListPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryPersons, setDeliveryPersons] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState<string>('');
  const [eta, setEta] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [deliverySettings, setDeliverySettings] = useState({
    pricePerKm: 10,
    baseCharge: 50,
    freeDeliveryThreshold: 500,
    storeLocations: [] as StoreLocation[]
  });
  const [locationFilter, setLocationFilter] = useState<string>('all');

  const itemsPerPage = 10;
  
  const { toast } = useToast();

  const fetchOrdersAndDeliveryPersons = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersResponse, deliveryPersonsResponse, settingsResponse] = await Promise.all([
        api.get('/admin/orders'),
        api.get('/admin/delivery-persons'),
        api.get('/admin/delivery-settings')
      ]);
   
      setOrders(ordersResponse.data);
      setDeliveryPersons(deliveryPersonsResponse.data);
 
      
      if (settingsResponse.data) {
        setDeliverySettings({
          pricePerKm: settingsResponse.data.pricePerKm,
          baseCharge: settingsResponse.data.baseCharge,
          freeDeliveryThreshold: settingsResponse.data.freeDeliveryThreshold,
          storeLocations: settingsResponse.data.storeLocations || []
        });
      }
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



  // Sort orders by latest first and paginate
  const sortedOrders = [...orders].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Get store locations for filter
  const uniqueLocations = deliverySettings.storeLocations
    .filter(store => store.isActive && store.name && store.name.trim() !== '')
    .map(store => store.name)
    .sort();

  // Function to get the responsible store for an order
  const getResponsibleStore = (order: Order) => {
    const shippingCity = order.shippingAddress?.city;
    if (!shippingCity) return 'N/A';

    // Find store with matching name/city
    const matchingStore = deliverySettings.storeLocations.find(
      store => store.isActive && store.name.toLowerCase() === shippingCity.toLowerCase()
    );

    if (matchingStore) return matchingStore.name;

    // Fallback: find first active store
    const firstActiveStore = deliverySettings.storeLocations.find(store => store.isActive);
    return firstActiveStore ? firstActiveStore.name : 'N/A';
  };

  // Filter orders by responsible store
  const filteredOrders = sortedOrders.filter(order => {
    if (locationFilter === 'all') return true;
    return getResponsibleStore(order) === locationFilter;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Reset to first page when orders change or location filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [orders.length, locationFilter]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    setUpdatingStatus(orderId);
    try {
      await api.put(`/admin/orders/${orderId}/delivery-status`, { status });
      toast({
        title: 'Order Status Updated',
        description: `Order status updated to ${status}.`,
      });
      fetchOrdersAndDeliveryPersons();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to update order status.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleSaveSettings = async () => {
    // Validate store locations
    const activeStores = deliverySettings.storeLocations.filter(s => s.isActive);
    if (activeStores.length === 0) {
      toast({
        title: 'Error',
        description: 'At least one store location must be active.',
        variant: 'destructive',
      });
      return;
    }

// ✅ CORRECTED VALIDATION - No storeId check!

for (const store of deliverySettings.storeLocations) {
  // ❌ REMOVED - Don't validate storeId anymore!
  // if (!store.storeId || !store.storeId.trim()) { ... }

  if (!store.name || !store.name.trim()) {
    toast({
      title: 'Error',
      description: 'Store name is required for all stores',
      variant: 'destructive'
    });
    return;
  }

  if (!store.contact_number || !store.contact_number.trim()) {
    toast({
      title: 'Error',
      description: 'Contact number is required for all stores',
      variant: 'destructive'
    });
    return;
  }

  if (!store.address || !store.address.trim()) {
    toast({
      title: 'Error',
      description: 'Address is required for all stores',
      variant: 'destructive'
    });
    return;
  }

  if (!store.city || !store.city.trim()) {
    toast({
      title: 'Error',
      description: 'City is required for all stores',
      variant: 'destructive'
    });
    return;
  }

  if (!store.latitude || store.latitude === 0) {
    toast({
      title: 'Error',
      description: 'Valid latitude is required for all stores',
      variant: 'destructive'
    });
    return;
  }

  if (!store.longitude || store.longitude === 0) {
    toast({
      title: 'Error',
      description: 'Valid longitude is required for all stores',
      variant: 'destructive'
    });
    return;
  }
}

    setSavingSettings(true);
    try {
      await api.put('/admin/delivery-settings', deliverySettings);
      toast({
        title: 'Settings Updated',
        description: 'Delivery settings have been updated successfully.',
      });
      setShowSettings(false);
      // Refresh the data to get updated settings
      await fetchOrdersAndDeliveryPersons();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update settings',
        variant: 'destructive',
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const addStoreLocation = () => {
    setDeliverySettings({
      ...deliverySettings,
      storeLocations: [
        ...deliverySettings.storeLocations,
        {
       
          name: '',
          contact_number: '',
          address: '',
          city: '',
          latitude: 0,
          longitude: 0,
          isActive: true
        }
      ]
    });
  };

  const removeStoreLocation = (index: number) => {
    const newLocations = deliverySettings.storeLocations.filter((_, i) => i !== index);
    setDeliverySettings({
      ...deliverySettings,
      storeLocations: newLocations
    });
  };

  const updateStoreLocation = (index: number, field: keyof StoreLocation, value: any) => {
    const newLocations = [...deliverySettings.storeLocations];
    newLocations[index] = {
      ...newLocations[index],
      [field]: value
    };
    setDeliverySettings({
      ...deliverySettings,
      storeLocations: newLocations
    });
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

    setIsAssigning(true);
    try {
      await api.put(`/admin/orders/${selectedOrder._id}/assign-delivery`, {
        deliveryPersonId: selectedDeliveryPerson,
        eta,
      });
      toast({
        title: 'Delivery Assigned',
        description: `Order assigned to delivery person. ETA: ${eta}`,
      });
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
      setIsAssigning(false);
    }
  };

  const getStatusBadge = (order: Order) => {
    if (order.status === 'cancelled') return <Badge variant="destructive">Cancelled</Badge>;
    if (order.isDelivered) return <Badge variant="default">Delivered</Badge>;
    if (order.status === 'out_for_delivery') return <Badge className="bg-blue-600">Out for Delivery</Badge>;
    if (order.isPaid) return <Badge className="bg-green-600">Confirmed</Badge>;
    return <Badge variant="secondary">Placed</Badge>;
  };

  if (loading) {
    return (
      <Layout>
        <section className="section-padding bg-background">
          <div className="container-custom">
            <Skeleton className="h-10 w-64 mb-8" />
            <Skeleton className="h-96 w-full rounded-md" />
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
      <section className="section-padding bg-background pt-0 ">
        <div className="bg-cream py-4 ">
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h1 className="font-display text-2xl sm:text-3xl font-bold">Manage Orders</h1>

            <div className="flex items-center gap-4">
              {/* Location Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Location:</span>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {uniqueLocations.map(location => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                Delivery Settings
              </Button>
            </div>
          </div>

          {/* Delivery Settings Card - Collapsible */}
          {showSettings && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Delivery Pricing Configuration</CardTitle>
                <CardDescription>
                  Set delivery charges, store locations, and pricing rules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Pricing Rules</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pricePerKm">Price per KM (₹)</Label>
                      <Input
                        id="pricePerKm"
                        type="number"
                        min="0"
                        step="0.01"
                        value={deliverySettings.pricePerKm}
                        onChange={(e) =>
                          setDeliverySettings({
                            ...deliverySettings,
                            pricePerKm: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="baseCharge">Base Charge (₹)</Label>
                      <Input
                        id="baseCharge"
                        type="number"
                        min="0"
                        step="0.01"
                        value={deliverySettings.baseCharge}
                        onChange={(e) =>
                          setDeliverySettings({
                            ...deliverySettings,
                            baseCharge: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="freeDeliveryThreshold">Free Delivery (₹)</Label>
                      <Input
                        id="freeDeliveryThreshold"
                        type="number"
                        min="0"
                        step="0.01"
                        value={deliverySettings.freeDeliveryThreshold}
                        onChange={(e) =>
                          setDeliverySettings({
                            ...deliverySettings,
                            freeDeliveryThreshold: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Store Locations</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addStoreLocation}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Store
                    </Button>
                  </div>

                  {deliverySettings.storeLocations.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <AlertCircle className="h-6 w-6 text-gray-400" />
                      </div>
                      <h4 className="font-medium text-gray-900 mb-1">No Store Locations Added</h4>
                      <p className="text-sm text-gray-500 mb-4">
                        Add at least one store location to enable delivery distance calculations
                      </p>
                      <Button
                        type="button"
                        onClick={addStoreLocation}
                        variant="default"
                        size="sm"
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Your First Store
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {deliverySettings.storeLocations.map((store, index) => (
                        <div key={index} className="p-4 border rounded-lg space-y-3 bg-white">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={store.isActive}
                                  onCheckedChange={(checked) =>
                                    updateStoreLocation(index, 'isActive', checked)
                                  }
                                />
                                <span className="text-sm font-medium">
                                  {store.isActive ? (
                                    <span className="text-green-600">● Active</span>
                                  ) : (
                                    <span className="text-gray-400">○ Inactive</span>
                                  )}
                                </span>
                              </div>
                              {!store.name && (
                                <Badge variant="outline" className="text-xs text-amber-600">
                                  Not Configured
                                </Badge>
                              )}
                              {store.storeId && (
                                <Badge variant="secondary" className="text-xs font-mono">
                                  ID: {store.storeId.slice(-8)}
                                </Badge>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeStoreLocation(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Store Name */}
                            <div className="space-y-2">
                              <Label className="text-xs">
                                Store Name <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                placeholder="e.g., Main Store - Hyderabad"
                                value={store.name}
                                onChange={(e) =>
                                  updateStoreLocation(index, 'name', e.target.value)
                                }
                              />
                            </div>

                            {/* Contact Number */}
                            <div className="space-y-2">
                              <Label className="text-xs">
                                Contact Number <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                placeholder="9999999999"
                                value={store.contact_number || ''}
                                onChange={(e) =>
                                  updateStoreLocation(index, 'contact_number', e.target.value)
                                }
                              />
                            </div>

                            {/* Address */}
                            <div className="space-y-2 md:col-span-2">
                              <Label className="text-xs">
                                Address <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                placeholder="Full store address"
                                value={store.address || ''}
                                onChange={(e) =>
                                  updateStoreLocation(index, 'address', e.target.value)
                                }
                              />
                            </div>

                            {/* City */}
                            <div className="space-y-2">
                              <Label className="text-xs">
                                City <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                placeholder="Hyderabad"
                                value={store.city || ''}
                                onChange={(e) =>
                                  updateStoreLocation(index, 'city', e.target.value)
                                }
                              />
                            </div>

                            {/* Latitude */}
                            <div className="space-y-2">
                              <Label className="text-xs">
                                Latitude <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                type="number"
                                step="0.000001"
                                placeholder="e.g., 17.385044"
                                value={store.latitude || ''}
                                onChange={(e) =>
                                  updateStoreLocation(index, 'latitude', parseFloat(e.target.value) || 0)
                                }
                              />
                            </div>

                            {/* Longitude */}
                            <div className="space-y-2">
                              <Label className="text-xs">
                                Longitude <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                type="number"
                                step="0.000001"
                                placeholder="e.g., 78.486671"
                                value={store.longitude || ''}
                                onChange={(e) =>
                                  updateStoreLocation(index, 'longitude', parseFloat(e.target.value) || 0)
                                }
                              />
                            </div>
                          </div>

                          <div className="bg-blue-50 border border-blue-200 rounded p-2">
                            <p className="text-xs text-blue-800">
                              💡 <strong>Tip:</strong> Open{' '}
                              <a
                                href="https://www.google.com/maps"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline font-medium"
                              >
                                Google Maps
                              </a>
                              , right-click on your store location, and copy the coordinates. Store ID is auto-generated.
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-900 font-medium mb-2">How Delivery Pricing Works:</p>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• Orders ≥ ₹{deliverySettings.freeDeliveryThreshold} get <strong>FREE delivery</strong></li>
                    <li>• System automatically finds the <strong>nearest active store</strong> to customer</li>
                    <li>• Delivery charge = <strong>Distance × ₹{deliverySettings.pricePerKm}/km</strong></li>
                    <li>• If distance unknown: Charge = <strong>₹{deliverySettings.baseCharge}</strong> (base charge)</li>
                    <li>• Store IDs are <strong>auto-generated</strong> when you save</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleSaveSettings}
                    disabled={savingSettings || deliverySettings.storeLocations.length === 0}
                    className="gap-2"
                  >
                    {savingSettings ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Settings
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowSettings(false)}
                  >
                    Close
                  </Button>

                  {deliverySettings.storeLocations.length === 0 && (
                    <div className="flex items-center gap-2 ml-auto">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <span className="text-sm text-amber-600">
                        Add at least one store to save
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Orders Table */}
          <div className="w-full rounded-md border overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[8%]">Order ID</TableHead>
                  <TableHead className="w-[10%]">Customer</TableHead>
                  <TableHead className="w-[8%]">Date</TableHead>
                  <TableHead className="w-[20%]">Products & Pricing</TableHead>
                  <TableHead className="w-[6%]">Store</TableHead>
                  <TableHead className="w-[8%]">Status</TableHead>
                  <TableHead className="w-[12%]">Delivery Person</TableHead>
                  <TableHead className="w-[6%]">Distance</TableHead>
                  <TableHead className="w-[22%]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                      {locationFilter === 'all' ? 'No orders found.' : `No orders found for ${locationFilter}.`}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedOrders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell className="font-mono text-xs">
                        #{order._id.slice(-8)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-sm">
                            {(order.user as unknown as User)?.username || 'N/A'}
                          </p>
                          <Collapsible>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 p-0">
                                <Eye className="h-3 w-3" />
                                View Details
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2 space-y-1">
                              <p className="text-xs text-muted-foreground">
                                📧 {(order.user as unknown as User)?.email}
                              </p>
                              {order.shippingAddress?.phone && (
                                <p className="text-xs text-muted-foreground">
                                  📞 {order.shippingAddress.phone}
                                </p>
                              )}
                              {order.shippingAddress && (
                                <p className="text-xs text-muted-foreground">
                                  📍 {order.shippingAddress.address}, {order.shippingAddress.city}
                                </p>
                              )}
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: '2-digit'
                        })}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="space-y-2">
                          {/* Product Items */}
                          <div className="space-y-1">
                            {order.orderItems.map((item, index) => (
                              <div key={index} className="flex justify-between items-start text-xs">
                                <div className="flex-1 min-w-0">
                                  <span className="truncate block" title={item.name}>
                                    {item.name}
                                  </span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs px-1 py-0">
                                      ×{item.qty}
                                    </Badge>
                                    {item.selectedVariantIndex !== undefined && (
                                      <Badge variant="secondary" className="text-xs px-1 py-0">
                                        {item.selectedVariantIndex ? `Variant ${item.selectedVariantIndex + 1}` : 'No Variant'}
                                      </Badge>
                                    )}
                                    <span className="text-muted-foreground">
                                      ₹{item.price} each
                                    </span>
                                  </div>
                                </div>
                                <span className="font-medium text-right ml-2">
                                  ₹{(item.price * item.qty).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Price Breakdown */}
                          <div className="border-t pt-2 mt-2 space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Subtotal:</span>
                              <span>₹{(order.totalPrice - order.shippingPrice - order.taxPrice).toFixed(2)}</span>
                            </div>
                            {order.shippingPrice > 0 && (
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Delivery:</span>
                                <span>₹{order.shippingPrice.toFixed(2)}</span>
                              </div>
                            )}
                            {order.taxPrice > 0 && (
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Tax:</span>
                                <span>₹{order.taxPrice.toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-semibold text-sm border-t pt-1">
                              <span>Total:</span>
                              <span>₹{order.totalPrice.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-xs font-medium">
                          {getResponsibleStore(order)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {getStatusBadge(order)}
                          {order.cancelReason && (
                            <div className="mt-2">
                              <Collapsible>
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 text-red-600 p-0">
                                    <AlertCircle className="h-3 w-3" />
                                    Cancel Reason
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-2">
                                  <p className="text-xs text-red-700 bg-red-50 p-2 rounded">
                                    {order.cancelReason}
                                  </p>
                                </CollapsibleContent>
                              </Collapsible>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {(order.deliveryPerson as unknown as User)?.username || (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                        {order.eta && (
                          <p className="text-xs text-muted-foreground mt-1">
                            ETA: {new Date(order.eta).toLocaleString()}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {order.distance ? `${order.distance} km` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          {order.status !== 'cancelled' && !order.isDelivered && (
                            <>
                              <Select
                                onValueChange={(value) => updateOrderStatus(order._id, value)}
                                disabled={updatingStatus === order._id}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Update Status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="confirmed">Mark Confirmed</SelectItem>
                                  <SelectItem value="out_for_delivery">Mark Out for Delivery</SelectItem>
                                  <SelectItem value="delivered">Mark Delivered</SelectItem>
                                </SelectContent>
                              </Select>

                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs"
                                    onClick={() => setSelectedOrder(order)}
                                    disabled={isAssigning}
                                  >
                                    Assign Delivery
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Assign Delivery Person</DialogTitle>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                      <Label>Delivery Person</Label>
                                      <Select
                                        onValueChange={setSelectedDeliveryPerson}
                                        value={selectedDeliveryPerson}
                                        disabled={isAssigning}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select" />
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
                                    <div className="space-y-2">
                                      <Label>ETA</Label>
                                      <Input
                                        value={eta}
                                        onChange={(e) => setEta(e.target.value)}
                                        placeholder="e.g., 30 mins, 1 hour"
                                        disabled={isAssigning}
                                      />
                                    </div>
                                  </div>
                                  <Button onClick={handleAssignDelivery} disabled={isAssigning}>
                                    {isAssigning ? (
                                      <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Assigning...
                                      </>
                                    ) : (
                                      'Assign'
                                    )}
                                  </Button>
                                </DialogContent>
                              </Dialog>
                            </>
                          )}
                          {order.status === 'cancelled' && (
                            <Badge variant="outline" className="text-xs">
                              Order Cancelled
                            </Badge>
                          )}
                          {order.isDelivered && (
                            <Badge variant="outline" className="text-xs bg-green-50">
                              ✓ Completed
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="w-[95%] mx-auto mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {/* Page Numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first page, last page, current page, and pages around current
                      const distance = Math.abs(page - currentPage);
                      return page === 1 || page === totalPages || distance <= 1;
                    })
                    .map((page, index, array) => {
                      // Add ellipsis where there are gaps
                      const prevPage = array[index - 1];
                      const showEllipsis = prevPage && page - prevPage > 1;

                      return (
                        <React.Fragment key={page}>
                          {showEllipsis && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        </React.Fragment>
                      );
                    })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>

              <div className="text-center text-sm text-muted-foreground mt-2">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} orders
                {locationFilter !== 'all' && ` (filtered by ${locationFilter})`}
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};