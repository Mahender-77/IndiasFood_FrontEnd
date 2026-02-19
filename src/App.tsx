import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
// import { DeliveryRegisterPage } from "./pages/DeliveryRegisterPage";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import AdminDashboard from "./pages/AdminDashboard";
import { AdminOrderListPage } from "./pages/admin/AdminOrderListPage";
import {AdminProductEditPage} from "./pages/admin/AdminProductEditPage";
import AdminCustomerListPage from "./pages/admin/AdminCustomerListPage";
import AdminCustomerDetailPage from "./pages/admin/AdminCustomerDetailPage";
import AdminCategoriesPage from "./pages/admin/AdminCategories";
import { AdminDeliveryApplications } from "./pages/admin/AdminDeliveryApplications";
import AdminInventory from "./pages/admin/AdminInventory";
import DeliveryProtectedRoute from "./components/DeliveryProtectedRoute";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import NotFound from "./pages/NotFound";
// New Pages
import GITagProducts from "./pages/GITagProducts";
import NewArrivals from "./pages/NewArrivals";
import DealOfTheDay from "./pages/DealOfTheDay";
import About from "./pages/About";
import Gifting from "./pages/Gifting";
import BulkOrders from "./pages/BulkOrders";
import Help from "./pages/Help";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { CartProvider } from "./contexts/CartContext";


const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CartProvider>
          <Toaster />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/auth" element={<Auth />} />
            {/* <Route path="/delivery/register" element={<DeliveryRegisterPage />} /> */}
            {/* New Public Pages */}
            <Route path="/gi-tag-products" element={<GITagProducts />} />
            <Route path="/new-arrivals" element={<NewArrivals />} />
            <Route path="/deal-of-the-day" element={<DealOfTheDay />} />
            <Route path="/about" element={<About />} />
            <Route path="/gifting" element={<Gifting />} />
            <Route path="/bulk-orders" element={<BulkOrders />} />
            <Route path="/help" element={<Help />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminProtectedRoute>
                  <AdminDashboard />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <AdminProtectedRoute>
                  <AdminOrderListPage />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/customers"
              element={
                <AdminProtectedRoute>
                  <AdminCustomerListPage />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/customers/:id"
              element={
                <AdminProtectedRoute>
                  <AdminCustomerDetailPage />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <AdminProtectedRoute>
                  <AdminCategoriesPage />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/products/:id/edit"
              element={
                <AdminProtectedRoute>
                  <AdminProductEditPage />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/delivery-applications"
              element={
                <AdminProtectedRoute>
                  <AdminDeliveryApplications />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/inventory"
              element={
                <AdminProtectedRoute>
                  <AdminInventory />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/delivery"
              element={
                <DeliveryProtectedRoute>
                  <DeliveryDashboard />
                </DeliveryProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </CartProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
