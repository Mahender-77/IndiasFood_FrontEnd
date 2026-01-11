import { Link } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { Product } from '@/types';

const Cart = () => {
  const { state, updateQuantity, removeFromCart, cartTotal, cartLoading, cartError } = useCart();
  const deliveryFee = cartTotal >= 500 ? 0 : 50;
  const total = cartTotal + deliveryFee;

  if (state.items.length === 0) {
    return (
      <Layout>
        <section className="section-padding bg-background ">
          <div className="container-custom">
            <div className="max-w-md mx-auto text-center py-16">
              <div className="w-24 h-24 mx-auto rounded-full bg-muted flex items-center justify-center mb-6">
                <ShoppingBag className="h-12 w-12 text-muted-foreground" />
              </div>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-2">
                Your Cart is Empty
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mb-6">
                Looks like you haven't added any sweets yet. Explore our delicious collection!
              </p>
              <Link to="/products">
                <Button size="lg" variant="hero" className="gap-2">
                  Browse Sweets
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
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
      <section className="section-padding bg-background pt-10 ">
        <div className="container-custom">
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-8">
            Your Cart
          </h1>

          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              {cartLoading && <p className="text-center py-4">Updating cart...</p>}
              {cartError && <p className="text-red-500 text-center py-4">Error: {cartError}</p>}

              {state.items.map((item) => {
                const product = item.product as Product; // Cast once
                if (!product) return null; // Null check

                return (
                  <div
                    key={product._id}
                    className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 bg-card rounded-xl shadow-card"
                  >
                    {/* Image */}
                    <Link
                      to={`/product/${product._id}`}
                      className="w-full h-auto aspect-square sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg overflow-hidden shrink-0 mx-auto sm:mx-0"
                    >
                      <img
                        src={product.images && product.images.length > 0 ? product.images[0] : '/images/placeholder.png'} // Use first image from array or a placeholder
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <Link to={`/product/${product._id}`}>
                        <h3 className="font-display font-semibold text-base sm:text-lg text-foreground truncate hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      {/* Conditionally display weight */}
                      { product.weight && (
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {product.weight}
                        </p>
                      )}
                      <p className="font-semibold text-primary mt-1 text-base sm:text-lg">
                        ₹{product.price}
                      </p>
                    </div>

                    {/* Quantity & Remove */}
                    <div className="flex items-center sm:flex-col justify-between sm:justify-start gap-2 mt-2 sm:mt-0">
                      <button
                        onClick={() => removeFromCart(product._id)}
                        className="p-1 sm:p-2 text-muted-foreground hover:text-destructive transition-colors"
                        disabled={cartLoading}
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>

                      <div className="flex items-center gap-1 sm:gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8"
                          onClick={() =>
                            updateQuantity(product._id, item.qty - 1)
                          }
                          disabled={cartLoading || item.qty <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-7 sm:w-8 text-center font-medium">
                          {item.qty}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8"
                          onClick={() =>
                            updateQuantity(product._id, item.qty + 1)
                          }
                          disabled={cartLoading || product.countInStock === 0 || item.qty >= product.countInStock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl shadow-card p-4 sm:p-6 sticky top-24">
                <h2 className="font-display text-lg sm:text-xl font-semibold text-foreground mb-4">
                  Order Summary
                </h2>

                <div className="space-y-3 text-sm">
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
                  {deliveryFee > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Add ₹{500 - cartTotal} more for free delivery
                    </p>
                  )}
                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="font-display text-lg sm:text-xl font-bold text-primary">
                        ₹{total}
                      </span>
                    </div>
                  </div>
                </div>

                <Link to="/checkout" className="block mt-4 sm:mt-6">
                  <Button size="lg" variant="hero" className="w-full gap-2">
                    Proceed to Checkout
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </Link>

                <Link to="/products" className="block mt-2 sm:mt-3">
                  <Button variant="ghost" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Cart;
