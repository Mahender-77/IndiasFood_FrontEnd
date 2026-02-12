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
import { ArrowLeft, Loader2, Eye, AlertCircle, Settings, Save, Plus, Trash2, Package, MapPin, Filter, X, CheckCircle2 } from 'lucide-react';
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
  const [deliveryModeFilter, setDeliveryModeFilter] = useState<'all' | 'delivery' | 'pickup'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'delivered' | 'cancelled'>('all');

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelDeliveryMode, setCancelDeliveryMode] = useState<'delivery' | 'pickup'>('delivery');
  


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
   
      setOrders(
        ordersResponse.data.sort(
          (a: Order, b: Order) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        )
      );
      
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

  const uniqueLocations = deliverySettings.storeLocations
    .filter(store => store.isActive && store.name && store.name.trim() !== '')
    .map(store => store.name)
    .sort();

  const getResponsibleStore = (order: Order) => {
    const shippingCity = order.shippingAddress?.city;
    if (!shippingCity) return 'N/A';

    const matchingStore = deliverySettings.storeLocations.find(
      store => store.isActive && store.name.toLowerCase() === shippingCity.toLowerCase()
    );

    if (matchingStore) return matchingStore.name;

    const firstActiveStore = deliverySettings.storeLocations.find(store => store.isActive);
    return firstActiveStore ? firstActiveStore.name : 'N/A';
  };

  const filteredOrders = orders.filter(order => {
    const isPickupOrder = order.shippingAddress?.fullName === 'Pickup Customer' || order.shippingAddress?.address.includes('Pickup Store');

    const matchesLocation = locationFilter === 'all' || getResponsibleStore(order) === locationFilter;
    const matchesDeliveryMode =
      deliveryModeFilter === 'all' ||
      (deliveryModeFilter === 'delivery' && !isPickupOrder) ||
      (deliveryModeFilter === 'pickup' && isPickupOrder);
    
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'pending' && !order.isDelivered && order.status !== 'cancelled') ||
      (statusFilter === 'delivered' && order.isDelivered) ||
      (statusFilter === 'cancelled' && order.status === 'cancelled');

    return matchesLocation && matchesDeliveryMode && matchesStatus;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);




  useEffect(() => {
    setCurrentPage(1);
  }, [orders.length, locationFilter, deliveryModeFilter, statusFilter]);

  const updateOrderStatus = async (
    orderId: string,
    status: string,
    deliveryMode: 'delivery' | 'pickup',
    reason?: string
  ) => {
    setUpdatingStatus(orderId);
  
    try {
      const response = await api.put(
        `/admin/orders/${orderId}/delivery-status`,
        { status, deliveryMode, reason }
      );
  
      const updatedOrder = response.data;
  
      // ✅ Update only that order locally (no full reload)
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === orderId ? updatedOrder : order
        )
      );
  
      toast({
        title: 'Order Status Updated',
        description: `Order status updated to ${status}.`,
      });
  
    } catch (err: any) {
      toast({
        title: 'Error',
        description:
          err.response?.data?.message || 'Failed to update order status.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(null);
    }
  };
  

  const handleSaveSettings = async () => {
    const activeStores = deliverySettings.storeLocations.filter(s => s.isActive);
    if (activeStores.length === 0) {
      toast({
        title: 'Error',
        description: 'At least one store location must be active.',
        variant: 'destructive',
      });
      return;
    }

    for (const store of deliverySettings.storeLocations) {
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
    if (order.status === 'cancelled') return <Badge variant="destructive" className="font-medium">Cancelled</Badge>;
    if (order.isDelivered) return <Badge className="bg-green-600 hover:bg-green-700 font-medium">Delivered</Badge>;
    if (order.status === 'out_for_delivery') return <Badge className="bg-blue-600 hover:bg-blue-700 font-medium">Out for Delivery</Badge>;
    if (order.isPaid) return <Badge className="bg-emerald-600 hover:bg-emerald-700 font-medium">Confirmed</Badge>;
    return <Badge variant="secondary" className="font-medium">Placed</Badge>;
  };
  console.log("orders", orders);
  const clearFilters = () => {
    setLocationFilter('all');
    setDeliveryModeFilter('all');
    setStatusFilter('all');
  };

  const hasActiveFilters = locationFilter !== 'all' || deliveryModeFilter !== 'all' || statusFilter !== 'all';

  if (loading) {
    return (
      <Layout>
        <section className="min-h-screen" style={{ backgroundColor: '#F9F5F1' }}>
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Skeleton className="h-12 w-80 mb-8" />
            <Skeleton className="h-[600px] w-full rounded-xl" />
          </div>
        </section>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <section className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9F5F1' }}>
          <Card className="max-w-md w-full shadow-lg">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
              <p className="text-red-600 mb-6">{error}</p>
              <Button onClick={() => window.location.reload()} className="w-full">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="min-h-screen" style={{ backgroundColor: '#F9F5F1' }}>
        {/* Header with Breadcrumb */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Page Header with Stats */}
          <div className="mb-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              {/* Left: Title */}
              <div className="flex-shrink-0">
                <h1 className="text-3xl font-bold text-gray-900 mb-1 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  Order Management
                </h1>
                <p className="text-gray-600 text-sm">View and manage all customer orders</p>
              </div>

              {/* Center: Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-1 lg:max-w-2xl">
                <Card className="shadow-sm hover:shadow-md transition-shadow border border-gray-200">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-600 truncate">Total</p>
                        <p className="text-lg font-bold text-gray-900">{filteredOrders.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm hover:shadow-md transition-shadow border border-gray-200">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Loader2 className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-600 truncate">Pending</p>
                        <p className="text-lg font-bold text-amber-600">
                          {filteredOrders.filter(o => !o.isDelivered && o.status !== 'cancelled').length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm hover:shadow-md transition-shadow border border-gray-200">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-600 truncate">Delivered</p>
                        <p className="text-lg font-bold text-green-600">
                          {filteredOrders.filter(o => o.isDelivered).length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm hover:shadow-md transition-shadow border border-gray-200">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-600 truncate">Stores</p>
                        <p className="text-lg font-bold text-purple-600">
                          {deliverySettings.storeLocations.filter(s => s.isActive).length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Settings Button */}
              <div className="flex-shrink-0">
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => setShowSettings(!showSettings)}
                  className="gap-2 shadow-sm hover:shadow-md transition-shadow border-gray-300 w-full lg:w-auto"
                >
                  <Settings className="h-4 w-4" />
                  Delivery Settings
                </Button>
              </div>
            </div>
          </div>

          {/* Delivery Settings Card */}
          {showSettings && (
            <Card className="mb-6 shadow-lg border-2 border-blue-100">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Settings className="h-5 w-5 text-blue-600" />
                      Delivery Configuration
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Configure delivery pricing, store locations, and operational rules
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-8 pt-6">
                {/* Pricing Rules */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-bold">₹</span>
                    </div>
                    <h3 className="font-semibold text-lg text-gray-900">Pricing Rules</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pricePerKm" className="text-sm font-medium">Price per Kilometer (₹)</Label>
                      <div className="relative">
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
                          className="pl-7 border-gray-300 focus:border-blue-500 transition-colors"
                        />
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="baseCharge" className="text-sm font-medium">Base Charge (₹)</Label>
                      <div className="relative">
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
                          className="pl-7 border-gray-300 focus:border-blue-500 transition-colors"
                        />
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="freeDeliveryThreshold" className="text-sm font-medium">Free Delivery Threshold (₹)</Label>
                      <div className="relative">
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
                          className="pl-7 border-gray-300 focus:border-blue-500 transition-colors"
                        />
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Store Locations */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-lg text-gray-900">Store Locations</h3>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={addStoreLocation}
                      className="gap-2 shadow-sm border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Add Store
                    </Button>
                  </div>

                  {deliverySettings.storeLocations.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center bg-gray-50">
                      <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                        <MapPin className="h-8 w-8 text-blue-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 text-lg mb-2">No Store Locations</h4>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Add at least one store location to enable delivery distance calculations and order management
                      </p>
                      <Button
                        type="button"
                        onClick={addStoreLocation}
                        size="lg"
                        className="gap-2 shadow-md bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Plus className="h-5 w-5" />
                        Add Your First Store
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {deliverySettings.storeLocations.map((store, index) => (
                        <Card key={index} className="shadow-sm border-2 hover:border-blue-200 transition-colors">
                          <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <Switch
                                  checked={store.isActive}
                                  onCheckedChange={(checked) =>
                                    updateStoreLocation(index, 'isActive', checked)
                                  }
                                  className="data-[state=checked]:bg-green-600"
                                />
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-semibold ${store.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                                    {store.isActive ? '● Active' : '○ Inactive'}
                                  </span>
                                  {!store.name && (
                                    <Badge variant="outline" className="text-xs text-amber-700 bg-amber-50 border-amber-200">
                                      Incomplete
                                    </Badge>
                                  )}
                                  {store.storeId && (
                                    <Badge variant="secondary" className="text-xs font-mono bg-gray-100">
                                      ID: {store.storeId.slice(-8)}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeStoreLocation(index)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                  Store Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  placeholder="e.g., Main Store - Hyderabad"
                                  value={store.name}
                                  onChange={(e) =>
                                    updateStoreLocation(index, 'name', e.target.value)
                                  }
                                  className="border-gray-300 focus:border-blue-500 transition-colors"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                  Contact Number <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  placeholder="9999999999"
                                  value={store.contact_number || ''}
                                  onChange={(e) =>
                                    updateStoreLocation(index, 'contact_number', e.target.value)
                                  }
                                  className="border-gray-300 focus:border-blue-500 transition-colors"
                                />
                              </div>

                              <div className="space-y-2 md:col-span-2">
                                <Label className="text-sm font-medium">
                                  Address <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  placeholder="Full store address"
                                  value={store.address || ''}
                                  onChange={(e) =>
                                    updateStoreLocation(index, 'address', e.target.value)
                                  }
                                  className="border-gray-300 focus:border-blue-500 transition-colors"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                  City <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  placeholder="Hyderabad"
                                  value={store.city || ''}
                                  onChange={(e) =>
                                    updateStoreLocation(index, 'city', e.target.value)
                                  }
                                  className="border-gray-300 focus:border-blue-500 transition-colors"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="text-sm font-medium">
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
                                  className="border-gray-300 focus:border-blue-500 transition-colors"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="text-sm font-medium">
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
                                  className="border-gray-300 focus:border-blue-500 transition-colors"
                                />
                              </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                              <p className="text-xs text-blue-800">
                                <strong>💡 Tip:</strong> Open{' '}
                                <a
                                  href="https://www.google.com/maps"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline font-medium hover:text-blue-900"
                                >
                                  Google Maps
                                </a>
                                , right-click on your store location, and copy the coordinates.
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Info Box */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5">
                  <p className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    How Delivery Pricing Works
                  </p>
                  <ul className="text-xs text-blue-800 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Orders ≥ ₹{deliverySettings.freeDeliveryThreshold} get <strong className="font-semibold">FREE delivery</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>System finds the <strong className="font-semibold">nearest active store</strong> to customer automatically</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Delivery charge = <strong className="font-semibold">Distance × ₹{deliverySettings.pricePerKm}/km</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>If distance unknown: Charge = <strong className="font-semibold">₹{deliverySettings.baseCharge}</strong> (base charge)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Store IDs are <strong className="font-semibold">auto-generated</strong> when you save</span>
                    </li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button
                    onClick={handleSaveSettings}
                    disabled={savingSettings || deliverySettings.storeLocations.length === 0}
                    size="lg"
                    className="gap-2 shadow-md"
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
                    size="lg"
                    onClick={() => setShowSettings(false)}
                    className="border-gray-300"
                  >
                    Close
                  </Button>

                  {deliverySettings.storeLocations.length === 0 && (
                    <div className="flex items-center gap-2 ml-auto">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <span className="text-sm text-amber-700 font-medium">
                        Add at least one store to save
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters Section */}
          <Card className="mb-6 shadow-sm bg-white">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-gray-500" />
                    <span className="font-medium text-gray-900">Filters</span>
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-2">
                        {(locationFilter !== 'all' ? 1 : 0) + (deliveryModeFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0)} active
                      </Badge>
                    )}
                  </div>

                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="gap-2 text-gray-600 hover:text-gray-900"
                    >
                      <X className="h-4 w-4" />
                      Clear All
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Location:</span>
                    <Select value={locationFilter} onValueChange={setLocationFilter}>
                      <SelectTrigger className="flex-1 border-gray-300">
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

                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Type:</span>
                    <Select value={deliveryModeFilter} onValueChange={(value) => setDeliveryModeFilter(value as 'all' | 'delivery' | 'pickup')}>
                      <SelectTrigger className="flex-1 border-gray-300">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Orders</SelectItem>
                        <SelectItem value="delivery">Delivery</SelectItem>
                        <SelectItem value="pickup">Pickup</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Status:</span>
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | 'pending' | 'delivered' | 'cancelled')}>
                      <SelectTrigger className="flex-1 border-gray-300">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium">
                      Showing {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Orders Table */}
          <Card className="shadow-lg border-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <TableHead className="font-semibold text-gray-900">Order ID</TableHead>
                    <TableHead className="font-semibold text-gray-900">Customer</TableHead>
                    <TableHead className="font-semibold text-gray-900">Date</TableHead>
                    <TableHead className="font-semibold text-gray-900">Products & Pricing</TableHead>
                    <TableHead className="font-semibold text-gray-900">Store</TableHead>
                    <TableHead className="font-semibold text-gray-900">Status</TableHead>
                    <TableHead className="font-semibold text-gray-900">Delivery Person</TableHead>
                    {/* <TableHead className="font-semibold text-gray-900">Distance</TableHead> */}
                    <TableHead className="font-semibold text-gray-900">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-32">
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                          <p className="text-gray-600 font-medium">No orders found</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {hasActiveFilters ? 'Try adjusting your filters' : 'Orders will appear here once customers place them'}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedOrders.map((order) => (
                      <TableRow key={order._id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-mono text-xs font-medium">
                        #{order?._id?.toString().slice(-8) || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-sm text-gray-900">
                              {(order.user as unknown as User)?.username || 'N/A'}
                            </p>
                            <Collapsible>
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 p-0 text-blue-600 hover:text-blue-700">
                                  <Eye className="h-3 w-3" />
                                  View Details
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="mt-2 space-y-1 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                <p className="mb-1">📧 {(order.user as unknown as User)?.email}</p>
                                {order.shippingAddress?.phone && (
                                  <p className="mb-1">📞 {order.shippingAddress.phone}</p>
                                )}
                                  {order.shippingAddress?.latitude && order.shippingAddress?.longitude && (
                                  <p className="mb-1">🗺️ Lat: {order.shippingAddress.latitude.toFixed(4)}, Lng: {order.shippingAddress.longitude.toFixed(4)}</p>
                                )}
                                {order.shippingAddress && (
                                  <div className="space-y-0.5 mt-1 mb-1">
                                    <p>📍 {order.shippingAddress.address}</p>
                                    {order.shippingAddress?.city && order.shippingAddress?.postalCode && (
                                      <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
                                    )}
                                  </div>
                                )}
                                {order.uengage?.statusCode && (
                                  <p className="mb-1">📦 U-Engage Status: {order.uengage.statusCode}</p>
                                )}
                                {order.uengage?.taskId && (
                                  <p className="mb-1">🆔 U-Engage Task ID: {order.uengage.taskId}</p>
                                )}
                                {order.uengage?.message && (
                                  <p className="mb-1">💬 U-Engage Message: {order.uengage.message}</p>
                                )}
                              </CollapsibleContent>
                            </Collapsible>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: '2-digit'
                          })}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="space-y-2 max-w-xs">
                            <div className="space-y-1">
                              {order.orderItems?.map((item, index) => (
                                <div key={index} className="flex justify-between items-start py-1 border-b border-gray-100 last:border-0">
                                  <div className="flex-1 min-w-0 pr-2">
                                    <span className="block font-medium text-gray-900 truncate" title={item.name}>
                                      {item.name}
                                    </span>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                                        ×{item.qty}
                                      </Badge>
                                      {item.selectedVariantIndex !== undefined && (
                                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                          {item.selectedVariantIndex ? `V${item.selectedVariantIndex + 1}` : 'Base'}
                                        </Badge>
                                      )}
                                      <span className="text-gray-500">₹{item.price}</span>
                                    </div>
                                  </div>
                                  <span className="font-semibold text-gray-900 text-sm whitespace-nowrap">
                                    ₹{(item.price * item.qty).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div className="border-t-2 border-gray-200 pt-2 mt-2 space-y-1.5">
                              <div className="flex justify-between text-xs text-gray-600">
                                <span>Subtotal:</span>
                                <span className="font-medium">₹{(order.totalPrice - order.shippingPrice - order.taxPrice).toFixed(2)}</span>
                              </div>
                              {order.shippingPrice > 0 && (
                                <div className="flex justify-between text-xs text-gray-600">
                                  <span>Delivery:</span>
                                  <span className="font-medium">₹{order.shippingPrice.toFixed(2)}</span>
                                </div>
                              )}
                              {order.taxPrice > 0 && (
                                <div className="flex justify-between text-xs text-gray-600">
                                  <span>Tax:</span>
                                  <span className="font-medium">₹{order.taxPrice.toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between font-bold text-sm text-gray-900 border-t pt-1.5">
                                <span>Total:</span>
                                <span className="text-blue-600">₹{order.totalPrice.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
  <div className="flex flex-col gap-2">
    {/* Store Name */}
    <Badge
      variant="outline"
      className="font-medium border-purple-200 text-purple-700 bg-purple-50"
    >
      🏬 {getResponsibleStore(order)}
    </Badge>

    {/* Delivery Mode */}
    {order.deliveryMode === 'delivery' ? (
      <Badge className="bg-blue-600 hover:bg-blue-700 text-xs w-fit">
        🚚 Delivery
      </Badge>
    ) : (
      <Badge className="bg-indigo-600 hover:bg-indigo-700 text-xs w-fit">
        🏪 Pickup
      </Badge>
    )}
  </div>
</TableCell>

                        <TableCell>
                          <div className="space-y-2">
                            {getStatusBadge(order)}
                            {order.cancelReason && (
                              <Collapsible>
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-red-600 hover:text-red-700 p-0">
                                    <AlertCircle className="h-3 w-3" />
                                    Reason
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-2">
                                  <p className="text-xs text-red-700 bg-red-50 p-2 rounded border border-red-200">
                                    {order.cancelReason}
                                  </p>
                                </CollapsibleContent>
                              </Collapsible>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>
                            <p className="font-medium text-gray-900">
                              {(order.deliveryPerson as unknown as User)?.username || (
                                <span className="text-gray-400 text-xs">Unassigned</span>
                              )}
                            </p>
                            {order.eta && (
                              <p className="text-xs text-gray-500 mt-1">
                                ETA: {new Date(order.eta).toLocaleString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        {/* <TableCell className="text-sm font-medium text-gray-900">
                          {order.distance ? `${order.distance} km` : <span className="text-gray-400">N/A</span>}
                        </TableCell> */}
                       <TableCell>
  <div className="flex flex-col gap-2 min-w-[140px]">
    {order.status !== 'cancelled' && !order.isDelivered && (
      <>
        <Select
          onValueChange={(value) => {
            if (value === 'cancelled') {
              setCancelOrderId(order._id);
              setCancelDeliveryMode(order.deliveryMode);
              setCancelReason('');
              setCancelDialogOpen(true);
            } else {
              updateOrderStatus(order._id, value, order.deliveryMode);
            }
          }}
          disabled={updatingStatus === order._id}
        >
          <SelectTrigger className="h-9 text-xs border-gray-300">
            <SelectValue placeholder="Update Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="confirmed">✓ Mark Confirmed</SelectItem>

            {order.deliveryMode !== 'pickup' && (
              <SelectItem value="out_for_delivery">
                🚚 Out for Delivery
              </SelectItem>
            )}

            <SelectItem value="delivered">
              ✅ Mark Delivered
            </SelectItem>

            <SelectItem value="cancelled">
              ❌ Cancel Order
            </SelectItem>
          </SelectContent>
        </Select>

        {order.deliveryMode !== 'pickup' && (
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs border-gray-300 hover:bg-blue-50 hover:border-blue-300"
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
              <Button onClick={handleAssignDelivery} disabled={isAssigning} className="w-full">
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
        )}
      </>
    )}

    {order.status === 'cancelled' && (
      <Badge variant="outline" className="text-xs text-red-600 bg-red-50 border-red-200">
        Cancelled
      </Badge>
    )}

    {order.isDelivered && (
      <Badge className="text-xs bg-green-600 hover:bg-green-700">
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

              <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Cancel Order</DialogTitle>
    </DialogHeader>

    <div className="space-y-4 py-2">
      <Label>Cancellation Reason</Label>
      <Input
        placeholder="Enter cancellation reason"
        value={cancelReason}
        onChange={(e) => setCancelReason(e.target.value)}
      />
    </div>

    <Button
      className="w-full"
      disabled={!cancelReason.trim()}
      onClick={() => {
        if (cancelOrderId) {
          updateOrderStatus(
            cancelOrderId,
            'cancelled',
            cancelDeliveryMode,
            cancelReason
          );
        }
        setCancelDialogOpen(false);
      }}
    >
      Confirm Cancel
    </Button>
  </DialogContent>
</Dialog>

            </div>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      const distance = Math.abs(page - currentPage);
                      return page === 1 || page === totalPages || distance <= 1;
                    })
                    .map((page, index, array) => {
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

              <div className="text-center text-sm text-gray-600 mt-3 font-medium">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} orders
                {hasActiveFilters && (
                  <span className="text-blue-600"> (filtered)</span>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};