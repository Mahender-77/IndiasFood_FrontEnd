import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Edit2, MapPin, Phone, User } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/context/CartContext';
import { Product } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import LeafletMap from '@/components/maps/LeafletMap';
import OlaMap from '@/components/maps/OlaMap';

/* ---------------- TYPES ---------------- */

interface StoreLocation {
  name: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
}

/* ---------------- COMPONENT ---------------- */

const Checkout = () => {
  const navigate = useNavigate();
  const { state, cartTotal, clearCart } = useCart();
  const { toast } = useToast();

  const [storeLocations, setStoreLocations] = useState<StoreLocation[]>([]);
  const [deliveryResult, setDeliveryResult] = useState<any>(null);
  const [isAddressSaved, setIsAddressSaved] = useState(false);

  const [deliverySettings, setDeliverySettings] = useState({
    pricePerKm: 0,
    baseCharge: 0,
    freeDeliveryThreshold: 0
  });

  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postalCode: '',
    country: 'India',
    latitude: null as number | null,
    longitude: null as number | null,
    locationName: ''
  });

  // Check if all fields are filled
  const isFormComplete =
    address.fullName.trim() !== '' &&
    address.phone.trim() !== '' &&
    address.latitude !== null &&
    address.longitude !== null &&
    address.addressLine1.trim() !== '' &&
    address.city.trim() !== '';

  /* ---------------- API HELPERS ---------------- */

  const fetchDeliverySettings = async () => {
    try {
      const res = await api.get('/user/delivery-settings');
      setDeliverySettings(res.data);
      setStoreLocations(res.data.storeLocations);
    } catch (error) {
      console.error('Failed to fetch delivery settings:', error);
    }
  };

  useEffect(() => {
    fetchDeliverySettings();
  }, []);

  /* ---------------- DISTANCE LOGIC ---------------- */

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;

    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const calculateDeliveryCharge = (userLat: number, userLng: number) => {
    const sortedStores = storeLocations
      .filter(s => s.isActive)
      .map(store => ({
        ...store,
        distance: calculateDistance(
          userLat,
          userLng,
          store.latitude,
          store.longitude
        )
      }))
      .sort((a, b) => a.distance - b.distance);

    if (sortedStores.length === 0) {
      return null;
    }

    const nearestStore = sortedStores[0];
    const km = nearestStore.distance;

    const charge =
      deliverySettings.baseCharge +
      km * deliverySettings.pricePerKm;

    return {
      stores: [nearestStore.name],
      totalKm: km,
      charge
    };
  };

  /* ---------------- MAP SELECTION HANDLER ---------------- */

  const handleMapSelect = (lat: number, lng: number, addressText: string) => {
    // Extract the first part of the address for Address Line 1
    const firstPart = addressText.split(',')[0]?.trim() || addressText;

    setAddress(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      city: 'Bangalore', // You can extract this from addressText if needed
      postalCode: '', // You can extract this from addressText if needed
      locationName: addressText,
      addressLine1: firstPart // Auto-fill Address Line 1 with first part of address
    }));

    // Clear previous delivery calculation when location changes
    setDeliveryResult(null);
  };

  /* ---------------- SAVE ADDRESS ---------------- */

  const handleSaveAddress = () => {
    if (!isFormComplete) {
      toast({
        title: 'Incomplete form',
        description: 'Please fill all required fields',
        variant: 'destructive'
      });
      return;
    }

    // Calculate delivery charges when saving address
    if (address.latitude !== null && address.longitude !== null) {
      const result = calculateDeliveryCharge(address.latitude, address.longitude);
      if (result) {
        setDeliveryResult(result);
        setIsAddressSaved(true);
        
        toast({
          title: 'Address saved',
          description: `Delivery: ₹${result.charge.toFixed(2)} (${result.totalKm.toFixed(2)} km)`
        });
      } else {
        toast({
          title: 'No delivery available',
          description: 'No active stores found in your area',
          variant: 'destructive'
        });
      }
    }
  };

  /* ---------------- EDIT ADDRESS ---------------- */

  const handleEditAddress = () => {
    setIsAddressSaved(false);
    setDeliveryResult(null); // Clear delivery result when editing
  };

  /* ---------------- PLACE ORDER ---------------- */

  const placeOrder = async () => {
    if (!deliveryResult) {
      toast({
        title: 'Please save your delivery address',
        variant: 'destructive'
      });
      return;
    }

    try {
      await api.post('/user/checkout', {
        orderItems: state.items.map(item => {
          const product = item.product as Product;
          const price =
            product.offerPrice ??
            product.originalPrice ??
            0;

          return {
            product: product._id,
            name: product.name,
            image: product.images?.[0],
            qty: item.qty,
            price
          };
        }),

        shippingAddress: {
          fullName: address.fullName,
          phone: address.phone,
          address: `${address.addressLine1}${address.addressLine2 ? ', ' + address.addressLine2 : ''}`,
          city: address.city,
          postalCode: address.postalCode,
          country: 'India',
          latitude: address.latitude,
          longitude: address.longitude
        },

        paymentMethod: 'Cash On Delivery',
        shippingPrice: deliveryResult.charge,
        distance: deliveryResult.totalKm,
        nearestStore: deliveryResult.stores[0],
        totalPrice: cartTotal + deliveryResult.charge
      });

      clearCart();
      
      toast({
        title: 'Order placed successfully!',
        description: 'Redirecting to orders...'
      });

      setTimeout(() => {
        navigate('/orders');
      }, 1000);

    } catch (error) {
      toast({
        title: 'Failed to place order',
        description: 'Please try again',
        variant: 'destructive'
      });
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <Layout>
      {/* Header */}
      <div className="bg-white py-3 border-b sticky top-0 z-40">
        <div className="container-custom px-4">
          <Link to="/cart" className="flex items-center gap-2 text-sm hover:text-gray-600">
            <ArrowLeft className="h-4 w-4" /> Back to Cart
          </Link>
        </div>
      </div>

      <section className="bg-gray-50 py-4 sm:py-6 min-h-screen">
        <div className="container-custom max-w-6xl mx-auto px-4">

          <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Checkout</h1>

          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">

            {/* LEFT - ADDRESS SECTION */}
            <div className="lg:col-span-2">

              {!isAddressSaved ? (
                /* ADDRESS FORM */
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
                  <h2 className="font-semibold text-base sm:text-lg mb-4">Delivery Address</h2>

                  <div className="space-y-4">
                    
                    {/* STEP 1: NAME & PHONE */}
                    <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label className="text-sm font-medium">Full Name *</Label>
                        <Input
                          placeholder="Enter your full name"
                          value={address.fullName}
                          onChange={e => setAddress({ ...address, fullName: e.target.value })}
                          className="mt-1.5"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Phone Number *</Label>
                        <Input
                          placeholder="Enter phone number"
                          value={address.phone}
                          onChange={e => setAddress({ ...address, phone: e.target.value })}
                          className="mt-1.5"
                        />
                      </div>
                    </div>

                    {/* STEP 2: MAP */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Select Location on Map *</Label>
                      <OlaMap 
                        onSelectLocation={handleMapSelect}
                        isLocked={false}
                      />
                    </div>

                    {/* STEP 3: ADDRESS LINES */}
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Address Line 1 *</Label>
                        <Input
                          placeholder="House No, Building Name, Street"
                          value={address.addressLine1}
                          onChange={e => setAddress({ ...address, addressLine1: e.target.value })}
                          className="mt-1.5"
                        />
                        <p className="text-xs text-gray-500 mt-1">Auto-filled from map. You can edit if needed.</p>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Address Line 2 (Optional)</Label>
                        <Input
                          placeholder="Landmark, Area"
                          value={address.addressLine2}
                          onChange={e => setAddress({ ...address, addressLine2: e.target.value })}
                          className="mt-1.5"
                        />
                      </div>
                    </div>

                    {/* STEP 4: CITY, POSTAL, COUNTRY */}
                    <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label className="text-sm font-medium">City *</Label>
                        <Input 
                          value={address.city} 
                          onChange={e => setAddress({ ...address, city: e.target.value })}
                          placeholder="Enter city"
                          className="mt-1.5" 
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Postal Code</Label>
                        <Input 
                          value={address.postalCode} 
                          onChange={e => setAddress({ ...address, postalCode: e.target.value })}
                          placeholder="Enter postal code"
                          className="mt-1.5" 
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <Label className="text-sm font-medium">Country</Label>
                        <Input 
                          value={address.country} 
                          disabled 
                          className="mt-1.5 bg-gray-50 cursor-not-allowed" 
                        />
                      </div>
                    </div>

                    {/* SAVE BUTTON */}
                    <Button
                      onClick={handleSaveAddress}
                      disabled={!isFormComplete}
                      className="w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Save Address & Calculate Delivery
                    </Button>

                    {!isFormComplete && (
                      <p className="text-xs text-center text-gray-500 mt-2">
                        Please fill all required fields and select location on map
                      </p>
                    )}
                  </div>
                </div>

              ) : (
                /* SAVED ADDRESS CARD */
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <h2 className="font-semibold text-base sm:text-lg">Delivery Address</h2>
                    <button
                      onClick={handleEditAddress}
                      className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Name & Phone */}
                    <div className="flex items-start gap-3 pb-3 border-b">
                      <div className="bg-blue-50 p-2 rounded-lg">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{address.fullName}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-1">
                          <Phone className="h-3.5 w-3.5" />
                          {address.phone}
                        </p>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-3">
                      <div className="bg-green-50 p-2 rounded-lg">
                        <MapPin className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 leading-relaxed">
                          {address.addressLine1}
                          {address.addressLine2 && `, ${address.addressLine2}`}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {address.city}, {address.postalCode}
                        </p>
                        <p className="text-sm text-gray-600">
                          {address.country}
                        </p>
                      </div>
                    </div>

                    {/* Location Name */}
                    {address.locationName && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Selected Location:</p>
                        <p className="text-xs text-gray-700 line-clamp-2">{address.locationName}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT - ORDER SUMMARY */}
            <div className="lg:sticky lg:top-24 h-fit">
              <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm">

                <h2 className="font-semibold text-base sm:text-lg mb-4">Order Summary</h2>

                {/* CART ITEMS */}
                <div className="space-y-3 mb-4 max-h-60 sm:max-h-80 overflow-y-auto">
                  {state.items.map(item => {
                    const product = item.product as Product;
                    let price =
                      product.variants?.[item.selectedVariantIndex ?? 0]?.offerPrice ??
                      product.offerPrice ??
                      product.originalPrice ??
                      0;

                    return (
                      <div key={product._id} className="flex gap-3">
                        <img
                          src={product.images?.[0]}
                          alt={product.name}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium truncate">{product.name}</p>
                          <p className="text-xs text-gray-500">Qty: {item.qty}</p>
                        </div>
                        <p className="text-xs sm:text-sm font-semibold">
                          ₹{(price * item.qty).toFixed(2)}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* DELIVERY INFO */}
                {deliveryResult && (
                  <div className="border-t pt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Distance</span>
                      <span className="font-medium">{deliveryResult.totalKm.toFixed(2)} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Charges</span>
                      <span className="font-semibold text-green-600">
                        ₹{deliveryResult.charge.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Nearest Store</span>
                      <span>{deliveryResult.stores[0]}</span>
                    </div>
                  </div>
                )}

                {/* TOTAL */}
                <div className="border-t pt-3 mt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">₹{cartTotal.toFixed(2)}</span>
                  </div>
                  {deliveryResult && (
                    <div className="flex justify-between text-base sm:text-lg font-bold">
                      <span>Total Payable</span>
                      <span className="text-green-600">
                        ₹{(cartTotal + deliveryResult.charge).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* PLACE ORDER */}
                <Button
                  disabled={!isAddressSaved}
                  className="w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  onClick={placeOrder}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Place Order (COD)
                </Button>

                {!isAddressSaved && (
                  <p className="text-xs text-center text-orange-500 mt-2">
                    Please save your delivery address first
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Checkout;