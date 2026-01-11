import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, CreditCard, Truck, Check } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Product } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const Checkout = () => {
  const navigate = useNavigate();
  const { state, cartTotal, clearCart, fetchCartAndWishlist } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isLoading, setIsLoading] = useState(false);

  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
  });

  const deliveryFee = cartTotal >= 500 ? 0 : 50;
  const total = cartTotal + deliveryFee;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!user) { // Only check for user, token is handled by interceptor
      toast({
        title: 'Error',
        description: 'Please log in to place an order.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    if (state.items.length === 0) {
      toast({
        title: 'Error',
        description: 'Your cart is empty.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    try {
      const orderItems = state.items.map(item => ({
        name: (item.product as Product).name,
        qty: item.qty,
        image: (item.product as Product).images && (item.product as Product).images.length > 0 ? (item.product as Product).images[0] : '/images/placeholder.png',
        price: (item.product as Product).price,
        product: (item.product as Product)._id,
      }));

      const { data } = await api.post(
        '/user/checkout',
        {
          orderItems,
          shippingAddress: {
            address: address.address,
            city: address.city,
            postalCode: address.postalCode,
            country: address.country,
          },
          paymentMethod,
          taxPrice: 0, // Assuming tax is 0 for simplicity, update if needed
          shippingPrice: deliveryFee,
          totalPrice: total,
        }
      );

      toast({
        title: 'Order Placed Successfully!',
        description: `Your order #${data._id} has been placed. You will receive a confirmation shortly.`,
      });

      await clearCart(); // Clear cart in frontend context and backend
      await fetchCartAndWishlist(); // Re-fetch cart and wishlist after clearing
      navigate('/orders');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Something went wrong while placing your order.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (state.items.length === 0) {
    return (
      <Layout>
        <section className="section-padding bg-background">
          <div className="container-custom">
            <div className="max-w-md mx-auto text-center py-16">
              <h1 className="font-display text-2xl font-bold text-foreground mb-4">
                Your cart is empty
              </h1>
              <Link to="/products">
                <Button size="lg" variant="hero">
                  Browse Sweets
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="bg-cream py-4">
        <div className="container-custom">
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </Link>
        </div>
      </div>

      <section className="section-padding bg-background pt-10">
        <div className="container-custom">
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-8">
            Checkout
          </h1>

          <form onSubmit={handlePlaceOrder}>
            <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Left Column - Forms */}
              <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                {/* Delivery Address */}
                <div className="bg-card rounded-xl shadow-card p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-saffron-light flex items-center justify-center">
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <h2 className="font-display text-lg sm:text-xl font-semibold">
                      Delivery Address
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        placeholder="Enter your name"
                        value={address.fullName}
                        onChange={(e) =>
                          setAddress({ ...address, fullName: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={address.phone}
                        onChange={(e) =>
                          setAddress({ ...address, phone: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Address Line 1</Label>
                      <Input
                        id="address"
                        placeholder="House/Flat No., Building Name, Street, Landmark"
                        value={address.address}
                        onChange={(e) =>
                          setAddress({ ...address, address: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="City"
                        value={address.city}
                        onChange={(e) =>
                          setAddress({ ...address, city: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        placeholder="560001"
                        value={address.postalCode}
                        onChange={(e) =>
                          setAddress({ ...address, postalCode: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        placeholder="Country"
                        value={address.country}
                        onChange={(e) =>
                          setAddress({ ...address, country: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="bg-card rounded-xl shadow-card p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-saffron-light flex items-center justify-center">
                      <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <h2 className="font-display text-lg sm:text-xl font-semibold">
                      Payment Method
                    </h2>
                  </div>

                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                    className="space-y-3"
                  >
                    <label
                      className={cn(
                        'flex items-center gap-3 p-3 sm:gap-4 sm:p-4 rounded-xl border-2 cursor-pointer transition-colors',
                        paymentMethod === 'cod'
                          ? 'border-primary bg-saffron-light'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <RadioGroupItem value="cod" id="cod" />
                      <div className="flex-1">
                        <p className="font-medium text-sm sm:text-base">Cash on Delivery</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Pay when you receive your order
                        </p>
                      </div>
                      <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    </label>

                    <label
                      className={cn(
                        'flex items-center gap-3 p-3 sm:gap-4 sm:p-4 rounded-xl border-2 cursor-pointer transition-colors',
                        paymentMethod === 'online'
                          ? 'border-primary bg-saffron-light'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <RadioGroupItem value="online" id="online" />
                      <div className="flex-1">
                        <p className="font-medium text-sm sm:text-base">Pay Online</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Credit/Debit Card, UPI, Net Banking
                        </p>
                      </div>
                      <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    </label>
                  </RadioGroup>
                </div>
              </div>

              {/* Right Column - Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-card rounded-xl shadow-card p-4 sm:p-6 sticky top-24">
                  <h2 className="font-display text-lg sm:text-xl font-semibold text-foreground mb-4">
                    Order Summary
                  </h2>

                  {/* Items */}
                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                    {state.items.map((item) => {
                      const product = item.product as Product;
                      if (!product) return null; // Null check for product

                      return (
                        <div
                          key={product._id}
                          className="flex items-start gap-3 py-2 border-b last:border-b-0 border-border/50"
                        >
                          <img
                            src={product.images && product.images.length > 0 ? product.images[0] : '/images/placeholder.png'}
                            alt={product.name}
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0 flex flex-col justify-between h-12 sm:h-14">
                            <p className="text-xs sm:text-sm font-medium text-foreground leading-tight line-clamp-2">
                              {product.name}
                            </p>
                            <p className="text-xxs sm:text-xs text-muted-foreground">
                              Qty: {item.qty}
                            </p>
                          </div>
                          <p className="text-xs sm:text-sm font-semibold text-foreground flex-shrink-0">
                            ₹{product.price * item.qty}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-border pt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">₹{cartTotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivery</span>
                      <span className="font-medium">
                        {deliveryFee === 0 ? (
                          <span className="text-pistachio">FREE</span>
                        ) : (
                          `₹${deliveryFee}`
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border">
                      <span className="font-semibold">Total</span>
                      <span className="font-display text-lg sm:text-xl font-bold text-primary">
                        ₹{total}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="md"
                    variant="hero"
                    className="w-full mt-4 sm:mt-6 gap-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      'Processing...'
                    ) : (
                      <>
                        <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                        Place Order
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>
    </Layout>
  );
};

export default Checkout;
