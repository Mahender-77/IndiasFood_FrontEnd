import { Layout } from '@/components/layout/Layout';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, PlusCircle, FileText, Users, Tags, TrendingUp, Truck } from 'lucide-react';
import ExportButton from '@/components/admin/ExportButton';
import api from '@/lib/api';
import { useState, useEffect } from 'react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalCustomers: 0,
    activeDeliveryPersons: 0,
    revenueToday: 0,
  });

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

  return (
    <Layout>
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

            <Link to="/admin/products/new">
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
            </Link>

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

            {/* Export Section */}
            <Card className="col-span-full mt-6 sm:mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                  <FileText className="h-4 w-4" /> Data Exports
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <ExportButton
                  dataFetcher={() => api.get('/admin/export/orders').then(res => res.data)}
                  fileName="orders_export"
                  label="Export Orders"
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
                  label="Export Sales Data"
                />
              </CardContent>
            </Card>

          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AdminDashboard;

