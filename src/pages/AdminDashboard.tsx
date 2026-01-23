import { Layout } from '@/components/layout/Layout';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, PlusCircle, FileText, Users, Tags, TrendingUp, Truck, Warehouse, Download, Calendar } from 'lucide-react';
import ExportButton from '@/components/admin/ExportButton';
import api from '@/lib/api';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SEO } from '@/components/seo/SEO';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalCustomers: 0,
    activeDeliveryPersons: 0,
    revenueToday: 0,
  });

  // Time-based export state
  const [exportPeriod, setExportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [exporting, setExporting] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          ordersRes,
          customersRes,
          deliveryPersonsRes,
          revenueTodayRes,
        ] = await Promise.all([
          api.get('/admin/stats/orders-count'),
          api.get('/admin/stats/customers-count'),
          api.get('/admin/stats/delivery-persons-count'),
          api.get('/admin/stats/revenue-today'),
        ]);

        setStats({
          totalOrders: ordersRes.data.count,
          totalCustomers: customersRes.data.count,
          activeDeliveryPersons: deliveryPersonsRes.data.count,
          revenueToday: revenueTodayRes.data.totalRevenue,
        });
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
        // Optionally, show a toast error
      }
    };

    fetchStats();
  }, []);

  // Time-based export function
  const handleTimeBasedExport = async (type: 'orders' | 'sales', format: 'json' | 'csv') => {
    let queryParams = '';
    let filename = '';

    if (exportPeriod === 'daily') {
      if (!selectedDate) {
        toast({
          title: 'Error',
          description: 'Please select a date for daily export.',
          variant: 'destructive',
        });
        return;
      }
      queryParams = `?date=${selectedDate}`;
      filename = `${type}_daily_${selectedDate}`;
    } else if (exportPeriod === 'weekly') {
      if (!selectedWeek) {
        toast({
          title: 'Error',
          description: 'Please select a week for weekly export.',
          variant: 'destructive',
        });
        return;
      }
      queryParams = `?week=${selectedWeek}`;
      filename = `${type}_weekly_${selectedWeek}`;
    } else if (exportPeriod === 'monthly') {
      if (!selectedMonth) {
        toast({
          title: 'Error',
          description: 'Please select a month for monthly export.',
          variant: 'destructive',
        });
        return;
      }
      queryParams = `?month=${selectedMonth}`;
      filename = `${type}_monthly_${selectedMonth}`;
    }

    setExporting(`${type}-${format}`);

    try {
      const response = await api.get(`/admin/export/${type}/${exportPeriod}${queryParams}`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Export Successful',
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} ${exportPeriod} data exported successfully.`,
      });
    } catch (error: any) {
      toast({
        title: 'Export Failed',
        description: error.response?.data?.message || `Failed to export ${type} data.`,
        variant: 'destructive',
      });
    } finally {
      setExporting(null);
    }
  };

  return (
    <Layout>
      <SEO
        title="Admin Dashboard - India's Food"
        description="Admin dashboard for India's Food. Manage orders, customers, products, and delivery operations. Monitor revenue, track delivery personnel, and oversee business operations."
        keywords="admin dashboard, India's Food admin, order management, customer management, product management, delivery tracking, business analytics"
      />
      <section className="section-padding bg-cream min-h-[calc(100vh-150px)] sm:min-h-[calc(100vh-200px)]">
        <div className="container-custom">
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-6 sm:mb-8">
            Admin Dashboard
          </h1>

          {/* Stats Cards */}
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Total Orders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{stats.totalOrders}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{stats.totalCustomers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Active Delivery Persons</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{stats.activeDeliveryPersons}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Revenue Today</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">₹{stats.revenueToday.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Links */}
          <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-4">Quick Links</h2>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Link to="/admin/orders">
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Orders</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-xxs sm:text-xs text-muted-foreground">
                    View and manage customer orders
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/admin/customers">
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Customers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-xxs sm:text-xs text-muted-foreground">
                    View and manage registered customers
                  </p>
                </CardContent>
              </Card>
            </Link>

            {/* <Link to="/admin/products/new">
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Products</CardTitle>
                  <PlusCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-xxs sm:text-xs text-muted-foreground">
                    Add and manage sweets
                  </p>
                </CardContent>
              </Card>
            </Link> */}

            <Link to="/admin/categories">
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Categories</CardTitle>
                  <Tags className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-xxs sm:text-xs text-muted-foreground">
                    Manage product categories
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/admin/delivery-applications">
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Delivery Applications</CardTitle>
                  <Truck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-xxs sm:text-xs text-muted-foreground">
                    Review and approve delivery partner applications
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/admin/inventory">
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Inventory</CardTitle>
                  <Warehouse className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-xxs sm:text-xs text-muted-foreground">
                    Manage products, stock levels, and pricing across locations
                  </p>
                </CardContent>
              </Card>
            </Link>

            {/* Export Section */}
            <Card className="col-span-full mt-6 sm:mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                  <FileText className="h-4 w-4" /> Data Exports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Time-based Export Controls */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Time-based Exports</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Period Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="exportPeriod" className="text-xs text-gray-600">Period</Label>
                      <Select value={exportPeriod} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setExportPeriod(value)}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date Input Based on Period */}
                    {exportPeriod === 'daily' && (
                      <div className="space-y-2">
                        <Label htmlFor="exportDate" className="text-xs text-gray-600">Date</Label>
                        <Input
                          id="exportDate"
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="h-9"
                        />
                      </div>
                    )}

                    {exportPeriod === 'weekly' && (
                      <div className="space-y-2">
                        <Label htmlFor="exportWeek" className="text-xs text-gray-600">Week</Label>
                        <Input
                          id="exportWeek"
                          type="week"
                          value={selectedWeek}
                          onChange={(e) => setSelectedWeek(e.target.value)}
                          className="h-9"
                        />
                      </div>
                    )}

                    {exportPeriod === 'monthly' && (
                      <div className="space-y-2">
                        <Label htmlFor="exportMonth" className="text-xs text-gray-600">Month</Label>
                        <Input
                          id="exportMonth"
                          type="month"
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                          className="h-9"
                        />
                      </div>
                    )}

                    {/* Export Actions */}
                    <div className="flex gap-2 lg:col-span-1">
                      <Button
                        onClick={() => handleTimeBasedExport('orders', 'json')}
                        disabled={!!exporting}
                        size="sm"
                        className="flex-1 h-9 gap-1"
                      >
                        <Download className="h-3 w-3" />
                        Orders
                      </Button>
                      <Button
                        onClick={() => handleTimeBasedExport('sales', 'json')}
                        disabled={!!exporting}
                        size="sm"
                        variant="outline"
                        className="flex-1 h-9 gap-1"
                      >
                        <Download className="h-3 w-3" />
                        Sales
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Standard Export Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <ExportButton
                    dataFetcher={() => api.get('/admin/export/orders').then(res => res.data)}
                    fileName="orders_export"
                    label="Export All Orders"
                  />
                  <ExportButton
                    dataFetcher={() => api.get('/admin/export/customers').then(res => res.data)}
                    fileName="customers_export"
                    label="Export Customers"
                  />
                  <ExportButton
                    dataFetcher={() => api.get('/admin/export/products').then(res => res.data)}
                    fileName="products_export"
                    label="Export Products"
                  />
                  <ExportButton
                    dataFetcher={() => api.get('/admin/export/sales').then(res => res.data)}
                    fileName="sales_report"
                    label="Export All Sales Data"
                  />
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AdminDashboard;

