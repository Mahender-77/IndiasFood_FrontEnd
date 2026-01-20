import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Navigation, Check } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/context/CartContext';
import { Product } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface StoreLocation {
  name: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
}


const Checkout = () => {
  const navigate = useNavigate();
  const { state, cartTotal, clearCart } = useCart();
  const { toast } = useToast();

  const [addressMethod, setAddressMethod] = useState<'current' | 'manual'>('manual');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [isAddressConfirmed, setIsAddressConfirmed] = useState(false);

  const [storeLocations, setStoreLocations] = useState<StoreLocation[]>([]);
  const [loadingStores, setLoadingStores] = useState(false);

  const [deliveryResult, setDeliveryResult] = useState<any>(null);
  const [deliverySettings, setDeliverySettings] = useState({
    pricePerKm: 0,
    baseCharge: 0,
    freeDeliveryThreshold: 0
  });
  

  

  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    locationName: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const placeOrder = async () => {
    if (!deliveryResult) {
      toast({
        title: 'Error',
        description: 'Please confirm address first',
        variant: 'destructive'
      });
      return;
    }
  
    try {
      const payload = {
        orderItems: state.items.map(item => {
          const product = item.product as Product;
  
          let price =
            product.variants?.[item.selectedVariantIndex ?? 0]?.offerPrice ??
            product.offerPrice ??
            product.originalPrice;
  
          return {
            product: product._id,
            name: product.name,
            image: product.images?.[0],
            qty: item.qty,
            price,
            selectedVariantIndex: item.selectedVariantIndex ?? 0
          };
        }),
  
        shippingAddress: {
          fullName: address.fullName,
          phone: address.phone,
          address: address.address,
          city: address.city,
          postalCode: address.postalCode,
          country: "India",          // REQUIRED ✔
          latitude: address.latitude,
          longitude: address.longitude
        },
  
        paymentMethod: "Cash On Delivery", // REQUIRED ✔
  
        taxPrice: 0,
  
        shippingPrice: deliveryResult.charge,
  
        distance: deliveryResult.totalKm,
  
        nearestStore: deliveryResult.stores[0], // store name ✔
  
        totalPrice: cartTotal + deliveryResult.charge
      };
  
      await api.post('/user/checkout', payload);
  
      toast({
        title: 'Order placed successfully',
        description: 'Redirecting to your orders...'
      });
  
      // Clear cart (context method)
      clearCart();
  
      navigate('/orders');
  
    } catch (error: any) {
      toast({
        title: 'Order failed',
        description: error.response?.data?.message || 'Something went wrong',
        variant: 'destructive'
      });
    }
  };
  

  const fetchDeliverySettings = async () => {
    try {
      const res = await api.get('/user/delivery-settings');
  
      setDeliverySettings({
        pricePerKm: res.data.pricePerKm,
        baseCharge: res.data.baseCharge,
        freeDeliveryThreshold: res.data.freeDeliveryThreshold
      });
  
      setStoreLocations(res.data.storeLocations);
  
    
  
    } catch (error) {
      console.error("Failed to fetch delivery settings");
    }
  };
  
  useEffect(() => {
    fetchDeliverySettings();
  }, []);
  
  /* ---------------- HELPERS ---------------- */

  const reverseGeocode = async (lat: number, lng: number) => {
    const res = await api.get('/user/reverse-geocode', {
      params: { lat, lon: lng }
    });
    return res.data;
  };

  const geocodeAddress = async () => {
    const query = `${address.address}, ${address.city}, ${address.postalCode}`;

    try {
      const res = await api.get('/user/geocode', {
        params: { q: query }
      });

      return {
        latitude: res.data.latitude,
        longitude: res.data.longitude
      };
    } catch (error: any) {
      toast({
        title: 'Address not found, Please enter the correct address',
        variant: 'destructive'
      });
      return null;
    }
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371; // KM
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
  
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };
  
  const consoleCartStoreMapping = (
    userLat: number,
    userLng: number,
    locationName: string
  ) => {

  
    state.items.forEach(item => {
      const product = item.product as Product;
  
      product.inventory.forEach(inv => {
        const store = storeLocations.find(
          s => s.name.toLowerCase() === inv.location.toLowerCase()
        );
  
        if (!store) {
          return;
        }
  
        const distance = calculateDistance(
          userLat,
          userLng,
          store.latitude,
          store.longitude
        );
      });
    });
  };
  
  
  /* ---------------- ACTIONS ---------------- */

  const getCurrentLocation = () => {
    setGettingLocation(true);
  
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const addr = await reverseGeocode(latitude, longitude);
  
        const finalAddress = { ...address, ...addr };
        setAddress(finalAddress);
        setIsAddressConfirmed(true);
  
        toast({
          title: 'Location detected',
          description: `${addr.city} - ${addr.postalCode}`
        });
  
        // 🔹 Distance logs
        consoleCartStoreMapping(
          latitude,
          longitude,
          addr.locationName
        );
  
        // 🔥 DELIVERY CHARGE LOGIC
        const result = calculateDeliveryCharge(
          latitude,
          longitude
        );
  
        if (result) {
        
          setDeliveryResult(result);
        }
  
        setGettingLocation(false);
      },
      () => {
        toast({
          title: 'Location error',
          description: 'Please allow location access',
          variant: 'destructive'
        });
        setGettingLocation(false);
      }
    );
  };
  
  
  
  const confirmAddress = async () => {
    let finalAddress = address;
  
    if (addressMethod === 'manual') {
      const geo = await geocodeAddress();
      if (!geo) return;
  
      finalAddress = { ...address, ...geo };
    }
  
    setAddress(finalAddress);
    setIsAddressConfirmed(true);
  
    // 🔥 DELIVERY CHARGE
    const result = calculateDeliveryCharge(
      finalAddress.latitude!,
      finalAddress.longitude!
    );
  
    if (result) {
     
      setDeliveryResult(result);
    }
  
    toast({
      title: 'Address confirmed',
      description: `Delivery fee: ₹${result?.charge}`
    });
  };
  
  
  
  const calculateDeliveryCharge = (
    userLat: number,
    userLng: number
  ) => {
  
    const sortedStores = storeLocations
      .filter(s => s.isActive)
      .map(store => {
        const d = calculateDistance(
          userLat,
          userLng,
          store.latitude,
          store.longitude
        );
        return { ...store, distance: d };
      })
      .sort((a, b) => a.distance - b.distance);
  
    const nearestStore = sortedStores[0];
    const secondStore = sortedStores[1];
  
    // console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    // console.log("📍 USER LOCATION");
    // console.log(`Lat: ${userLat}`);
    // console.log(`Lng: ${userLng}`);
    // console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
    // console.log(`🏬 NEAREST STORE: ${nearestStore.name}`);
    // console.log(`Distance: ${nearestStore.distance.toFixed(2)} KM`);
  
    const productsInNearest: string[] = [];
    const missingProducts: string[] = [];
  
    state.items.forEach(item => {
      const product = item.product as Product;
  
      const found = product.inventory.some(
        inv =>
          inv.location.toLowerCase() ===
          nearestStore.name.toLowerCase()
      );
  
      if (found) {
        productsInNearest.push(product.name);
      } else {
        missingProducts.push(product.name);
      }
    });
  
    // console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    // console.log("📦 PRODUCT DISTRIBUTION");
    // console.log("From nearest store:", productsInNearest);
    // console.log("Missing products:", missingProducts);
  
    /* ---------- SINGLE STORE ---------- */
    if (missingProducts.length === 0) {
  
      const km = nearestStore.distance;
  
      const charge =
        deliverySettings.baseCharge +
        km * deliverySettings.pricePerKm;
  
      // console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      // console.log("🚚 DELIVERY TYPE: SINGLE STORE");
      // console.log(`Base Charge: ₹${deliverySettings.baseCharge}`);
      // console.log(`KM: ${km.toFixed(2)}`);
      // console.log(`Price/KM: ₹${deliverySettings.pricePerKm}`);
      // console.log(`TOTAL DELIVERY CHARGE: ₹${charge.toFixed(2)}`);
      // console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
      return {
        stores: [nearestStore.name],
        totalKm: km,
        charge
      };
    }
  
    /* ---------- MULTI STORE ---------- */
    const ok = window.confirm(
      "Some items are from another store. Extra charges apply. Continue?"
    );
  
    if (!ok) return null;
  
    // console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    // console.log("🚚 DELIVERY TYPE: MULTI STORE");
  
    // console.log(`Store 1: ${nearestStore.name}`);
    // console.log(`Products: ${productsInNearest.join(", ")}`);
    // console.log(`Distance: ${nearestStore.distance.toFixed(2)} KM`);
  
    const leg2 = calculateDistance(
      nearestStore.latitude,
      nearestStore.longitude,
      secondStore.latitude,
      secondStore.longitude
    );
  
    // console.log(`Store 2: ${secondStore.name}`);
    // console.log(`Products: ${missingProducts.join(", ")}`);
    // console.log(`Distance from store 1: ${leg2.toFixed(2)} KM`);
  
    const totalKm =
      nearestStore.distance + leg2;
  
    const charge =
      deliverySettings.baseCharge +
      totalKm * deliverySettings.pricePerKm;
  
    // console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    // console.log("💰 FINAL CALCULATION");
    // console.log(`Base Charge: ₹${deliverySettings.baseCharge}`);
    // console.log(`Total KM: ${totalKm.toFixed(2)}`);
    // console.log(`Price/KM: ₹${deliverySettings.pricePerKm}`);
    // console.log(`FINAL DELIVERY CHARGE: ₹${charge.toFixed(2)}`);
    // console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
    return {
      stores: [nearestStore.name, secondStore.name],
      totalKm,
      charge
    };
  };
  
  
  

  /* ---------------- UI ---------------- */

  if (state.items.length === 0) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h1 className="text-xl font-bold">Your cart is empty</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>

      {/* HEADER */}
      <div className="bg-white py-3 sm:py-4 border-b">
        <div className="container-custom px-4">
          <Link to="/cart" className="flex items-center gap-2 text-sm">
            <ArrowLeft className="h-4 w-4" /> Back to Cart
          </Link>
        </div>
      </div>

      <section className="section-padding bg-gray-50 py-4 sm:py-6">
        <div className="container-custom max-w-5xl mx-auto px-4">

          <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Checkout</h1>

          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">

            {/* LEFT */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">

              <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-5 shadow-sm">

                <h2 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">Delivery Address</h2>

                {/* TABS */}
                <div className="flex flex-col sm:flex-row gap-2 mb-4 sm:mb-5">
                  <Button
                    type="button"
                    variant={addressMethod === 'current' ? 'default' : 'outline'}
                    onClick={() => setAddressMethod('current')}
                    className="flex-1 h-10 sm:h-auto text-sm"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Current Location
                  </Button>

                  <Button
                    type="button"
                    variant={addressMethod === 'manual' ? 'default' : 'outline'}
                    onClick={() => setAddressMethod('manual')}
                    className="flex-1 h-10 sm:h-auto text-sm"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Enter Address
                  </Button>
                </div>

                {/* CURRENT LOCATION */}
                {addressMethod === 'current' && (
                  <Button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={gettingLocation}
                    className="w-full h-11 sm:h-12 text-sm sm:text-base"
                  >
                    {gettingLocation ? 'Fetching location...' : 'Use my current location'}
                  </Button>
                )}

                {/* MANUAL FORM */}
                {addressMethod === 'manual' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label className="text-sm">Full Name</Label>
                        <Input
                          value={address.fullName}
                          onChange={(e) => setAddress({...address, fullName: e.target.value})}
                          className="h-10 sm:h-auto text-sm sm:text-base"
                        />
                      </div>

                      <div>
                        <Label className="text-sm">Phone</Label>
                        <Input
                          value={address.phone}
                          onChange={(e) => setAddress({...address, phone: e.target.value})}
                          className="h-10 sm:h-auto text-sm sm:text-base"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <Label className="text-sm">Address</Label>
                        <Input
                          value={address.address}
                          onChange={(e) => setAddress({...address, address: e.target.value})}
                          className="h-10 sm:h-auto text-sm sm:text-base"
                        />
                      </div>

                      <div>
                        <Label className="text-sm">City</Label>
                        <Input
                          value={address.city}
                          onChange={(e) => setAddress({...address, city: e.target.value})}
                          className="h-10 sm:h-auto text-sm sm:text-base"
                        />
                      </div>

                      <div>
                        <Label className="text-sm">PIN Code</Label>
                        <Input
                          value={address.postalCode}
                          onChange={(e) => setAddress({...address, postalCode: e.target.value})}
                          className="h-10 sm:h-auto text-sm sm:text-base"
                        />
                      </div>
                    </div>

                    {/* CONFIRM BUTTON */}
                    <Button
                      onClick={confirmAddress}
                      className="w-full mt-4 sm:mt-6 h-11 sm:h-12 text-sm sm:text-base"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Confirm Address
                    </Button>
                  </>
                )}

              </div>
            </div>

            {/* RIGHT */}
            <div>
              <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-5 shadow-sm lg:sticky lg:top-24">

                <h2 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">Order Summary</h2>

                <div className="space-y-3 sm:space-y-4 mb-3 sm:mb-4 max-h-64 sm:max-h-80 overflow-y-auto">
                  {state.items.map(item => {
                    const product = item.product as Product;
                    let price = product.offerPrice ?? product.originalPrice ?? 0;

                    if (product.variants?.[item.selectedVariantIndex ?? 0]) {
                      const v = product.variants[item.selectedVariantIndex!];
                      price = v.offerPrice ?? v.originalPrice;
                    }

                    return (
                      <div key={product._id} className="flex gap-2 sm:gap-3">
                        <img
                          src={product.images?.[0]}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover flex-shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium truncate">{product.name}</p>
                          <p className="text-xs text-gray-500">Qty: {item.qty}</p>
                        </div>

                        <p className="font-semibold text-xs sm:text-sm flex-shrink-0">
                          ₹{(price * item.qty).toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {deliveryResult && (
                  <div className="border-t pt-3 sm:pt-4 space-y-2 sm:space-y-3 text-xs sm:text-sm">

                    <div className="flex justify-between">
                      <span>Delivery Distance</span>
                      <span className="font-medium">{deliveryResult.totalKm.toFixed(2)} KM</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Delivery Charges</span>
                      <span className="font-semibold text-green-600">
                        ₹{deliveryResult.charge.toFixed(2)}
                      </span>
                    </div>

                    <div className="bg-gray-50 p-2 sm:p-3 rounded-lg text-xs text-gray-600">
                      {deliveryResult.stores.length > 1
                        ? "Some items are delivered from multiple nearby stores. Additional charges applied based on distance."
                        : "Your order will be delivered from the nearest store."}
                    </div>

                  </div>
                )}

                <div className="border-t pt-3 sm:pt-4 space-y-2 sm:space-y-3">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span>Subtotal</span>
                    <span className="font-semibold">₹{cartTotal}</span>
                  </div>

                  {deliveryResult && (
                    <>
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span>Delivery Charges</span>
                        <span className="font-semibold">
                          ₹{deliveryResult.charge.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm sm:text-base font-bold">
                        <span>Total Payable</span>
                        <span>
                          ₹{(cartTotal + deliveryResult.charge).toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* PLACE ORDER */}
                <Button
                  disabled={!isAddressConfirmed}
                  className="w-full mt-4 sm:mt-6 h-11 sm:h-12 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  onClick={placeOrder}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Place Order
                </Button>

              </div>
            </div>

          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Checkout;