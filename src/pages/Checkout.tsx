import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Edit2, MapPin, Phone, User, Plus, Trash2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useCart } from '@/contexts/CartContext';
import { Product } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import LeafletMap from '@/components/maps/LeafletMap';

/* ---------------- TYPES ---------------- */

interface StoreLocation {
  name: string;
  contact_number: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
}

interface SavedAddress {
  _id?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
  locationName: string;
  isDefault?: boolean;
}

/* ---------------- COMPONENT ---------------- */

const Checkout = () => {
  const navigate = useNavigate();
  const { state, cartTotal, clearCart } = useCart();
  const { toast } = useToast();

  const [storeLocations, setStoreLocations] = useState<StoreLocation[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isAddressSaved, setIsAddressSaved] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string | null>(null);

  const [serviceabilityResult, setServiceabilityResult] = useState<any>(null);
  const [isServiceAvailable, setIsServiceAvailable] = useState<boolean>(false);

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Online' | ''>('');
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>('delivery');
  const [selectedPickupStore, setSelectedPickupStore] = useState<StoreLocation | null>(null);

  const [deliverySettings, setDeliverySettings] = useState({
    pricePerKm: 0,
    baseCharge: 0,
    gstPercentage: 0,
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

  // ✅ FIXED: Check if all required fields are filled (addressLine2 is optional)
  const isFormComplete =
    address.fullName?.trim() !== '' &&
    address.phone?.trim() !== '' &&
    address.latitude !== null &&
    address.longitude !== null &&
    address.addressLine1?.trim() !== '' &&
    address.city?.trim() !== '' &&
    address.locationName?.trim() !== '';

  /* ---------------- FREE DELIVERY CALCULATION ---------------- */

  // 🔥 NEW: Calculate if order qualifies for free delivery
  const qualifiesForFreeDelivery = 
    deliveryMode === 'delivery' && 
    cartTotal >= deliverySettings.freeDeliveryThreshold && 
    deliverySettings.freeDeliveryThreshold > 0;

  // 🔥 NEW: Get actual delivery charges (0 if free delivery applies)
  const actualDeliveryPrice = qualifiesForFreeDelivery 
    ? 0 
    : (serviceabilityResult?.payouts?.price ?? 0);
  
  const actualDeliveryTax = qualifiesForFreeDelivery 
    ? 0 
    : (serviceabilityResult?.payouts?.tax ?? 0);
  
  const actualDeliveryTotal = qualifiesForFreeDelivery 
    ? 0 
    : (serviceabilityResult?.payouts?.total ?? 0);

  // Original delivery charges from U-engage (for display purposes)
  const originalDeliveryPrice = serviceabilityResult?.payouts?.price ?? 0;
  const originalDeliveryTax = serviceabilityResult?.payouts?.tax ?? 0;
  const originalDeliveryTotal = serviceabilityResult?.payouts?.total ?? 0;


// GST %
const gstPercentage = deliverySettings?.gstPercentage || 0;

// GST amount on cart subtotal
const gstAmount = (cartTotal * gstPercentage) / 100;

// Delivery total (0 if not applicable)
const deliveryTotal =
  deliveryMode === 'delivery' && isServiceAvailable
    ? actualDeliveryTotal
    : 0;

// Final total including GST + Delivery
const finalTotal = cartTotal + gstAmount + deliveryTotal;



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



  const fetchSavedAddresses = async () => {
    try {
      const res = await api.get('/user/addresses');
      setSavedAddresses(res.data.addresses || []);
      
      if (res.data.addresses && res.data.addresses.length > 0) {
        setShowAddressForm(false);
        setIsAddressSaved(false);
      } else {
        setShowAddressForm(true);
        setIsAddressSaved(false);
      }
    } catch (error) {
      console.error('Failed to fetch saved addresses:', error);
      setShowAddressForm(true);
    }
  };

  useEffect(() => {
    fetchDeliverySettings();
    fetchSavedAddresses();
  }, []);

  /* ---------------- MAP SELECTION HANDLER ---------------- */

  const handleMapSelect = (
    lat: number, 
    lng: number, 
    addressText: string,
    city: string,
    postalCode: string
  ) => {
    const addressParts = addressText.split(',').map(part => part.trim());
    let fullAddressLine1 = '';

    for (const part of addressParts) {
      if (part === city || part === postalCode) {
        break;
      }
      if (fullAddressLine1) {
        fullAddressLine1 += ', ';
      }
      fullAddressLine1 += part;
    }

    if (!fullAddressLine1) {
      fullAddressLine1 = addressText;
    }

    console.log('Map selected:', { lat, lng, addressText, city, postalCode });

    setAddress(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      city: city || prev.city || 'Bangalore',
      postalCode: postalCode || prev.postalCode || '',
      addressLine1: fullAddressLine1
    }));

    setServiceabilityResult(null);
    setIsServiceAvailable(false);
  };

  /* ---------------- SAVED ADDRESS SELECTION ---------------- */

  const handleSelectSavedAddress = async (savedAddr: SavedAddress) => {
    setSelectedSavedAddressId(savedAddr._id || null);
    
    setAddress({
      fullName: savedAddr.fullName || '',
      phone: savedAddr.phone || '',
      addressLine1: savedAddr.addressLine1 || '',
      addressLine2: savedAddr.addressLine2 || '',
      city: savedAddr.city || '',
      postalCode: savedAddr.postalCode || '',
      country: savedAddr.country || 'India',
      latitude: savedAddr.latitude,
      longitude: savedAddr.longitude,
      locationName: savedAddr.locationName || ''
    });

    try {
      setIsSavingAddress(true);
      const serviceability = await checkServiceability(
        savedAddr.latitude,
        savedAddr.longitude
      );

      setServiceabilityResult(serviceability);
      const available = serviceability?.serviceability?.locationServiceAble === true;
      setIsServiceAvailable(available);
      setIsAddressSaved(true);

      toast({
        title: 'Address selected',
        description: available
          ? 'Delivery available for this location'
          : 'Delivery not available for this location',
        variant: available ? 'default' : 'destructive'
      });
    } catch (error) {
      toast({
        title: 'Service check failed',
        description: 'Unable to check delivery availability',
        variant: 'destructive'
      });
    } finally {
      setIsSavingAddress(false);
    }
  };

  /* ---------------- DELETE SAVED ADDRESS ---------------- */

  const handleDeleteAddress = async (addressId: string) => {
    try {
      await api.delete(`/user/addresses/${addressId}`);
      await fetchSavedAddresses();
      
      if (selectedSavedAddressId === addressId) {
        handleEditAddress();
      }

      toast({
        title: 'Address deleted',
        description: 'Address removed successfully'
      });
    } catch (error) {
      toast({
        title: 'Failed to delete',
        description: 'Could not delete address',
        variant: 'destructive'
      });
    }
  };

  /* ---------------- SAVE ADDRESS ---------------- */

  const checkServiceability = async (userLat: number, userLng: number) => {
    if (!storeLocations.length) {
      console.error('No store locations available');
      return;
    }
    const response = await api.post('/user/check-availability', {
      pickup: {
        latitude: storeLocations[0].latitude,
        longitude: storeLocations[0].longitude
      },
      drop: {
        latitude: userLat,
        longitude: userLng
      }
    });
    return response.data;
  };

  const handleSaveAddress = async () => {
    if (!isFormComplete) {
      toast({
        title: 'Incomplete form',
        description: 'Please fill all required fields',
        variant: 'destructive'
      });
      return;
    }
  
    try {
      setIsSavingAddress(true);
  
      const saveAddressRes = await api.post('/user/addresses', {
        fullName: address.fullName,
        phone: address.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        postalCode: address.postalCode,
        country: address.country,
        latitude: address.latitude,
        longitude: address.longitude,
        locationName: address.locationName
      });

      const newAddress = saveAddressRes.data.address;

      setSavedAddresses(prev => [...prev, newAddress]);
      setSelectedSavedAddressId(newAddress._id);
      
      const serviceability = await checkServiceability(
        newAddress.latitude,
        newAddress.longitude
      );
  
      setServiceabilityResult(serviceability);
  
      const available =
        serviceability?.serviceability?.locationServiceAble === true;
  
      setIsServiceAvailable(available);
      setIsAddressSaved(true);
      setShowAddressForm(false);
  
      toast({
        title: 'Address saved',
        description: available
          ? 'Delivery available for this location'
          : 'Delivery not available for this location',
        variant: available ? 'default' : 'destructive'
      });
  
    } catch (error) {
      console.error('Failed to save address or check serviceability:', error);
      toast({
        title: 'Failed to save address',
        description: 'Unable to save address or check delivery availability',
        variant: 'destructive'
      });
    } finally {
      setIsSavingAddress(false);
    }
  };

  /* ---------------- EDIT ADDRESS ---------------- */

  const handleEditAddress = () => {
    setIsAddressSaved(false);
    setServiceabilityResult(null);
    setIsServiceAvailable(false);
    setPaymentMethod('');
    setSelectedSavedAddressId(null);
  };

  /* ---------------- PLACE ORDER ---------------- */

  const placeOrder = async () => {
    if (deliveryMode === 'delivery' && (!isAddressSaved || !isServiceAvailable || !paymentMethod)) {
      toast({
        title: 'Cannot place order',
        description: !paymentMethod
          ? 'Please select a payment method'
          : 'Please save your delivery address',
        variant: 'destructive'
      });
      return;
    }
  
    if (deliveryMode === 'pickup' && (!selectedPickupStore || !paymentMethod)) {
      toast({
        title: 'Cannot place order',
        description: !selectedPickupStore
          ? 'Please select a pickup store'
          : 'Please select a payment method',
        variant: 'destructive'
      });
      return;
    }
  
    // 🔥 UPDATED: Use actual delivery charges (0 if free delivery applies)
    const deliveryPrice = deliveryMode === 'delivery' ? actualDeliveryPrice : 0;
    const deliveryTax = deliveryMode === 'delivery' ? actualDeliveryTax : 0;
    const deliveryTotal = deliveryMode === 'delivery' ? actualDeliveryTotal : 0;

    const shippingAddress = deliveryMode === 'delivery' ? {
      fullName: address.fullName,
      phone: address.phone,
      address: `${address.addressLine1}${address.addressLine2 ? ', ' + address.addressLine2 : ''}`,
      city: address.city,
      postalCode: address.postalCode,
      country: 'India',
      latitude: address.latitude,
      longitude: address.longitude
    } : {
      fullName: 'Pickup Customer',
      phone: selectedPickupStore?.contact_number || 'N/A',
      address: selectedPickupStore?.name || 'Pickup Store',
      city: selectedPickupStore?.name || 'Pickup City',
      postalCode: 'N/A',
      country: 'India',
      latitude: selectedPickupStore?.latitude || 0,
      longitude: selectedPickupStore?.longitude || 0,
    };
  
    try {
      await api.post('/user/checkout', {
        orderItems: state.items.map(item => ({
          product: item.product._id,
          qty: item.qty,
          selectedVariantIndex: item.selectedVariantIndex ?? null
        })),
      
        shippingAddress,
      
        paymentMethod:
          paymentMethod === 'COD'
            ? 'Cash On Delivery'
            : 'Online Payment',
      
        shippingPrice: deliveryMode === 'delivery' ? deliveryTotal : 0,
        taxPrice: gstAmount, // or actual tax if you want
      
        deliveryMode
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
      <div className="bg-cream py-3 border-b sticky top-0 z-40">
        <div className="container-custom px-4">
          <Link to="/cart" className="flex items-center gap-2 text-sm hover:text-background-600">
            <ArrowLeft className="h-4 w-4" /> Back to Cart
          </Link>
        </div>
      </div>

      <section className="bg-background-50 py-4 sm:py-6 min-h-screen">
        <div className="container-custom max-w-7xl mx-auto px-4">

          <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Checkout</h1>

         {/* MOBILE: Order Summary at Top */}
<div className="lg:hidden mb-3">
  <div className="bg-orange-100 rounded-lg p-3 shadow-sm">
    <h2 className="font-semibold text-sm mb-3">Order Summary</h2>

    {/* CART ITEMS */}
    <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
      {state.items.map(item => {
        const product = item.product as Product;
        let price =
          product.variants?.[item.selectedVariantIndex ?? 0]?.offerPrice ??
          product.offerPrice ??
          product.originalPrice ??
          0;

        return (
          <div key={product._id} className="flex gap-2 items-center bg-cream/50 rounded p-2">
            <img
              src={product.images?.[0]}
              alt={product.name}
              className="w-8 h-8 rounded object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium truncate">{product.name}</p>
              <p className="text-[10px] text-background-600">Qty: {item.qty}</p>
            </div>
            <p className="text-[11px] font-semibold">
              ₹{(price * item.qty).toFixed(2)}
            </p>
          </div>
        );
      })}
    </div>

    {/* PRICE BREAKDOWN */}
    <div className="border-t border-orange-200 pt-2 space-y-1 text-[11px]">

      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>₹{cartTotal.toFixed(2)}</span>
      </div>

      <div className="flex justify-between">
        <span>GST ({gstPercentage}%)</span>
        <span>₹{gstAmount.toFixed(2)}</span>
      </div>

      {deliveryMode === 'delivery' && isServiceAvailable && (
        qualifiesForFreeDelivery ? (
          <div className="bg-green-50 border border-green-200 rounded p-2 mt-1">
            <p className="text-green-700 font-semibold text-[10px]">
              🎉 Free Delivery Applied
            </p>
            <p className="text-green-600 text-[9px]">
              You saved ₹{originalDeliveryTotal.toFixed(2)}
            </p>
          </div>
        ) : (
          <div className="flex justify-between">
            <span>Delivery</span>
            <span>₹{deliveryTotal.toFixed(2)}</span>
          </div>
        )
      )}

      {/* FINAL TOTAL */}
      <div className="border-t border-orange-300 pt-2 flex justify-between font-bold text-sm">
        <span>Total Payable</span>
        <span className="text-orange-600">
          ₹{finalTotal.toFixed(2)}
        </span>
      </div>
    </div>
  </div>
</div>


          {/* MOBILE: Delivery/Pickup Selection (Smaller) */}
          <div className="lg:hidden mb-3">
            <div className="bg-cream p-2.5 rounded-lg shadow-sm">
              <div className="flex gap-2">
                <label
                  className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md border cursor-pointer transition-colors ${
                    deliveryMode === 'delivery'
                      ? 'border-orange-600 bg-orange-50 text-orange-800'
                      : 'border-background-300 bg-background-50 text-background-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryMode"
                    value="delivery"
                    checked={deliveryMode === 'delivery'}
                    onChange={() => setDeliveryMode('delivery')}
                    className="sr-only"
                  />
                  <span className="text-[11px] font-medium">Delivery</span>
                </label>
                <label
                  className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md border cursor-pointer transition-colors ${
                    deliveryMode === 'pickup'
                      ? 'border-orange-600 bg-orange-50 text-orange-800'
                      : 'border-background-300 bg-background-50 text-background-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryMode"
                    value="pickup"
                    checked={deliveryMode === 'pickup'}
                    onChange={() => setDeliveryMode('pickup')}
                    className="sr-only"
                  />
                  <span className="text-[11px] font-medium">Pickup</span>
                </label>
              </div>
            </div>
          </div>

          {/* MOBILE: Main Content Area */}
          <div className="lg:hidden space-y-3 mb-20">
            {deliveryMode === 'delivery' && (
              <>
                {/* Show all saved addresses if they exist and no address is selected */}
                {!isAddressSaved && savedAddresses.length > 0 && !showAddressForm && (
                  <div className="bg-cream p-3 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="font-semibold text-sm">Select Address</h2>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddressForm(true)}
                        className="flex items-center gap-1 text-xs h-7"
                      >
                        <Plus className="h-3 w-3" />
                        Add
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {savedAddresses.map((addr) => (
                        <div
                          key={addr._id}
                          className="border rounded-lg p-2.5 hover:border-green-500 transition-colors cursor-pointer group relative"
                          onClick={() => handleSelectSavedAddress(addr)}
                        >
                          <div className="flex items-start gap-2">
                            <div className="bg-blue-50 p-1.5 rounded-lg">
                              <MapPin className="h-3 w-3 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-xs text-background-900">{addr.locationName}</p>
                              <p className="text-[10px] text-background-600 mt-0.5">
                                {addr.addressLine1}
                                {addr.addressLine2 && `, ${addr.addressLine2}`}
                              </p>
                              <p className="text-[10px] text-background-600">
                                {addr.city}, {addr.postalCode}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAddress(addr._id!);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ADDRESS FORM - Mobile */}
                {!isAddressSaved && showAddressForm && (
                  <div className="bg-cream p-3 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="font-semibold text-sm">
                        {savedAddresses.length > 0 ? 'Add New Address' : 'Delivery Address'}
                      </h2>
                      {savedAddresses.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAddressForm(false)}
                          className="h-7 text-xs"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {/* NAME & PHONE */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs font-medium">Full Name *</Label>
                          <Input
                            placeholder="Enter name"
                            value={address.fullName}
                            onChange={e => setAddress({ ...address, fullName: e.target.value })}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium">Phone *</Label>
                          <Input
                            placeholder="Phone number"
                            value={address.phone}
                            onChange={e => setAddress({ ...address, phone: e.target.value })}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                      </div>

                      {/* MAP */}
                      {deliveryMode === 'delivery' && (
                        <div>
                          <Label className="text-xs font-medium mb-1.5 block">Location *</Label>
                          <LeafletMap
                            mapId="leaflet-map-mobile"
                            onSelectLocation={handleMapSelect}
                            isLocked={false}
                          />
                        </div>
                      )}

                      {/* ADDRESS LINES */}
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs font-medium">Address Line 1 *</Label>
                          <Input
                            placeholder="House No, Building, Street"
                            value={address.addressLine1}
                            onChange={e => setAddress({ ...address, addressLine1: e.target.value })}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium">Address Line 2 (Optional)</Label>
                          <Input
                            placeholder="Landmark, Area"
                            value={address.addressLine2}
                            onChange={e => setAddress({ ...address, addressLine2: e.target.value })}
                            className="mt-1 h-8 text-xs"
                          />
                        </div>
                      </div>

                      {/* CITY & POSTAL */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs font-medium">City *</Label>
                          <Input
                            value={address.city}
                            readOnly
                            className="mt-1 h-8 text-xs bg-background-50 cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium">Postal</Label>
                          <Input
                            value={address.postalCode}
                            readOnly
                            className="mt-1 h-8 text-xs bg-background-50 cursor-not-allowed"
                          />
                        </div>
                      </div>

                      {/* ADDRESS NAME */}
                      <div>
                        <Label className="text-xs font-medium">Address Name *</Label>
                        <Input
                          placeholder="e.g., Home, Work, Office"
                          value={address.locationName}
                          onChange={e => setAddress({ ...address, locationName: e.target.value })}
                          className="mt-1 h-8 text-xs"
                        />
                      </div>

                      {/* SAVE BUTTON */}
                      <Button
                        onClick={handleSaveAddress}
                        disabled={!isFormComplete || isSavingAddress}
                        className="w-full h-9 text-xs disabled:opacity-50"
                      >
                        {isSavingAddress ? 'Checking...' : 'Save Address'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* ADDRESS SAVED VIEW - Mobile */}
                {isAddressSaved && (
                  <div className="bg-cream p-3 rounded-lg shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <h2 className="font-semibold text-sm">Delivery Address</h2>
                      <button
                        onClick={handleEditAddress}
                        className="flex items-center gap-1 text-xs text-blue-600 font-medium"
                      >
                        <Edit2 className="h-3 w-3" />
                        Edit
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start gap-2 pb-2 border-b">
                        <div className="bg-blue-50 p-1.5 rounded-lg">
                          <User className="h-3 w-3 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-xs text-background-900">{address.fullName}</p>
                          <p className="text-[10px] text-background-600 flex items-center gap-1 mt-0.5">
                            <Phone className="h-2.5 w-2.5" />
                            {address.phone}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="bg-green-50 p-1.5 rounded-lg">
                          <MapPin className="h-3 w-3 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] text-background-900">
                            {address.addressLine1}
                            {address.addressLine2 && `, ${address.addressLine2}`}
                          </p>
                          <p className="text-[10px] text-background-600 mt-0.5">
                            {address.city}, {address.postalCode}
                          </p>
                        </div>
                      </div>

                      {serviceabilityResult && (
                        <div
                          className={`p-2 rounded-lg text-[10px] ${
                            isServiceAvailable
                              ? 'bg-green-50 text-green-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {isServiceAvailable ? '✅ Delivery Available' : '❌ Not Available'}
                        </div>
                      )}

                      {/* 🔥 NEW: Free Delivery Badge - Mobile */}
                      {qualifiesForFreeDelivery && isServiceAvailable && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                          <p className="text-green-700 font-semibold text-[10px]">
                            🎉 FREE Delivery Applied!
                          </p>
                          <p className="text-green-600 text-[9px] mt-0.5">
                            You saved ₹{originalDeliveryTotal.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* CHECK SERVICEABILITY BUTTON - Mobile */}
                    {isAddressSaved && (!serviceabilityResult || !isServiceAvailable) && address.latitude && address.longitude && (
                      <Button
                        onClick={async () => {
                          setIsSavingAddress(true);
                          try {
                            const serviceability = await checkServiceability(address.latitude!, address.longitude!);
                            setServiceabilityResult(serviceability);
                            setIsServiceAvailable(serviceability?.serviceability?.locationServiceAble === true);
                            toast({
                              title: 'Serviceability check complete',
                              description: serviceability?.serviceability?.locationServiceAble === true
                                ? 'Delivery available for this location'
                                : 'Delivery not available for this location',
                              variant: serviceability?.serviceability?.locationServiceAble === true ? 'default' : 'destructive'
                            });
                          } catch (error) {
                            toast({
                              title: 'Service check failed',
                              description: 'Unable to check delivery availability',
                              variant: 'destructive'
                            });
                          } finally {
                            setIsSavingAddress(false);
                          }
                        }}
                        disabled={isSavingAddress}
                        className="w-full h-8 text-xs mt-3"
                      >
                        {isSavingAddress ? 'Checking...' : 'Check Serviceability'}
                      </Button>
                    )}

                    {/* PAYMENT METHOD - Mobile */}
                    {isAddressSaved && isServiceAvailable && (
                      <div className="mt-3 pt-3 border-t">
                        <h3 className="font-semibold text-xs mb-2">Payment Method</h3>
                        <div className="space-y-1.5">
                          <label
                            className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-all ${
                              paymentMethod === 'COD'
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-background-300 hover:bg-background-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="payment-mobile"
                              value="COD"
                              checked={paymentMethod === 'COD'}
                              onChange={(e) => setPaymentMethod(e.target.value as 'COD')}
                              className="w-3 h-3"
                            />
                            <p className="text-[11px] font-medium">Cash on Delivery</p>
                          </label>

                          <label
                            className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-all ${
                              paymentMethod === 'Online'
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-background-300 hover:bg-background-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="payment-mobile"
                              value="Online"
                              checked={paymentMethod === 'Online'}
                              onChange={(e) => setPaymentMethod(e.target.value as 'Online')}
                              className="w-3 h-3"
                            />
                            <p className="text-[11px] font-medium">Online Payment</p>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {deliveryMode === 'pickup' && (
              <div className="space-y-3">
                {/* SELECT CITY - Mobile */}
                <div className="bg-cream p-3 rounded-lg shadow-sm">
                  <h2 className="font-semibold text-sm mb-2">Select Store</h2>
                  <Select onValueChange={(value) => {
                    const selected = storeLocations.find(store => store.name === value);
                    setSelectedPickupStore(selected || null);
                  }}>
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {storeLocations.map((store) => (
                        <SelectItem key={store.name} value={store.name} className="text-xs">
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* PAYMENT METHOD - Pickup Mobile */}
                <div className="bg-cream p-3 rounded-lg shadow-sm">
                  <h3 className="font-semibold text-xs mb-2">Payment Method</h3>
                  <div className="space-y-1.5">
                    <label
                      className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer ${
                        paymentMethod === 'COD' ? 'border-blue-600 bg-blue-50' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment-pickup-mobile"
                        value="COD"
                        checked={paymentMethod === 'COD'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'COD')}
                        className="w-3 h-3"
                      />
                      <div className="flex-1">
                        <p className="text-[11px] font-medium">Pay at Store (COD)</p>
                      </div>
                    </label>
                    <label
                      className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer ${
                        paymentMethod === 'Online' ? 'border-blue-600 bg-blue-50' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment-pickup-mobile"
                        value="Online"
                        checked={paymentMethod === 'Online'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'Online')}
                        className="w-3 h-3"
                      />
                      <div className="flex-1">
                        <p className="text-[11px] font-medium">Online Payment</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* DESKTOP LAYOUT */}
          <div className="hidden lg:grid lg:grid-cols-10 gap-6">

            {/* LEFT - MAIN CONTENT (70%) */}
            <div className="lg:col-span-7 space-y-4 ">

              {/* Delivery/Pickup Selection - Desktop */}
              <div className="bg-cream p-5 rounded-xl shadow-sm">
                <h2 className="font-semibold text-base mb-4">Choose Mode</h2>
                <div className="flex gap-3">
                  <label
                    className={`flex-1 flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      deliveryMode === 'delivery'
                        ? 'border-orange-600 bg-orange-50 text-orange-800'
                        : 'border-background-300 bg-background-50 text-background-700 hover:border-background-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliveryMode"
                      value="delivery"
                      checked={deliveryMode === 'delivery'}
                      onChange={() => setDeliveryMode('delivery')}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium">Get it Delivered</span>
                  </label>
                  <label
                    className={`flex-1 flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      deliveryMode === 'pickup'
                        ? 'border-orange-600 bg-orange-50 text-orange-800'
                        : 'border-background-300 bg-background-50 text-background-700 hover:border-background-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliveryMode"
                      value="pickup"
                      checked={deliveryMode === 'pickup'}
                      onChange={() => setDeliveryMode('pickup')}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium">I will Pick it</span>
                  </label>
                </div>
              </div>

              {deliveryMode === 'delivery' && (
                <>
                  {/* Show all saved addresses if they exist and no address is selected */}
                  {!isAddressSaved && savedAddresses.length > 0 && !showAddressForm && (
                    <div className="bg-cream p-4 sm:p-6 rounded-xl shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-base sm:text-lg">Select Delivery Address</h2>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAddressForm(true)}
                          className="flex items-center gap-1.5"
                        >
                          <Plus className="h-4 w-4" />
                          Add New
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {savedAddresses.map((addr) => (
                          <div
                            key={addr._id}
                            className="border rounded-lg p-4 hover:border-green-500 transition-colors cursor-pointer group relative"
                            onClick={() => handleSelectSavedAddress(addr)}
                          >
                            <div className="flex items-start gap-3">
                              <div className="bg-blue-50 p-2 rounded-lg">
                                <MapPin className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-background-900">{addr.locationName}</p>
                                <p className="text-sm text-background-600 mt-1">
                                  {addr.addressLine1}
                                  {addr.addressLine2 && `, ${addr.addressLine2}`}
                                </p>
                                <p className="text-sm text-background-600">
                                  {addr.city}, {addr.postalCode}
                                </p>
                                <p className="text-xs text-background-500 mt-1 flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {addr.phone}
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAddress(addr._id!);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </button>
                            </div>
                            {addr.isDefault && (
                              <span className="absolute top-2 right-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                Default
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ADDRESS FORM */}
                  {!isAddressSaved && showAddressForm && (
                    <div className="bg-cream p-4 sm:p-6 rounded-xl shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-base sm:text-lg">
                          {savedAddresses.length > 0 ? 'Add New Address' : 'Delivery Address'}
                        </h2>
                        {savedAddresses.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAddressForm(false)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>

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
                          {deliveryMode === 'delivery' && (
                            <LeafletMap 
                              mapId="leaflet-map-desktop"
                              onSelectLocation={handleMapSelect}
                              isLocked={false}
                            />
                          )}
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
                            <p className="text-xs text-background-500 mt-1">Auto-filled from map. You can edit if needed.</p>
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

                          {/* CITY */}
                          <div>
                            <Label className="text-sm font-medium">City *</Label>

                            <div className="relative group">
                              <Input
                                value={address.city}
                                readOnly
                                placeholder="Select location on map"
                                className="mt-1.5 bg-background-50 cursor-not-allowed pr-10"
                              />

                              {/* Block icon */}
                              <div className="absolute inset-y-0 right-3 flex items-center opacity-0 group-hover:opacity-100 transition">
                                <svg
                                  className="h-4 w-4 text-red-500"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  viewBox="0 0 24 24"
                                >
                                  <circle cx="12" cy="12" r="9" />
                                  <line x1="5" y1="19" x2="19" y2="5" />
                                </svg>
                              </div>
                            </div>

                            <p className="text-xs text-background-500 mt-1">
                              Auto-filled from map and cannot be edited
                            </p>
                          </div>

                          {/* POSTAL CODE */}
                          <div>
                            <Label className="text-sm font-medium">Postal Code</Label>

                            <div className="relative group">
                              <Input
                                value={address.postalCode}
                                readOnly
                                placeholder="Postal code"
                                className="mt-1.5 bg-background-50 cursor-not-allowed pr-10"
                              />

                              {/* Block icon */}
                              <div className="absolute inset-y-0 right-3 flex items-center opacity-0 group-hover:opacity-100 transition">
                                <svg
                                  className="h-4 w-4 text-red-500"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  viewBox="0 0 24 24"
                                >
                                  <circle cx="12" cy="12" r="9" />
                                  <line x1="5" y1="19" x2="19" y2="5" />
                                </svg>
                              </div>
                            </div>

                            <p className="text-xs text-background-500 mt-1">
                              Auto-filled from map and cannot be edited
                            </p>
                          </div>

                          {/* COUNTRY */}
                          <div className="sm:col-span-2">
                            <Label className="text-sm font-medium">Country</Label>
                            <Input
                              value={address.country}
                              disabled
                              className="mt-1.5 bg-background-50 cursor-not-allowed"
                            />
                          </div>

                        </div>

                        {/* ADDRESS NAME */}
                        <div>
                          <Label className="text-sm font-medium">Address Name *</Label>
                          <Input
                            placeholder="e.g., Home, Work, Office"
                            value={address.locationName}
                            onChange={e => setAddress({ ...address, locationName: e.target.value })}
                            className="mt-1.5"
                          />
                        </div>

                        {/* SAVE BUTTON */}
                        <Button
                          onClick={handleSaveAddress}
                          disabled={!isFormComplete || isSavingAddress}
                          className="w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSavingAddress ? (
                            <>Checking serviceability...</>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Save Address
                            </>
                          )}
                        </Button>

                        {!isFormComplete && (
                          <p className="text-xs text-center text-background-500 mt-2">
                            Please fill all required fields and select location on map
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {isAddressSaved && (
                    <div className="bg-cream p-4 sm:p-6 rounded-xl shadow-sm">
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
                            <p className="font-medium text-background-900">{address.fullName}</p>
                            <p className="text-sm text-background-600 flex items-center gap-1.5 mt-1">
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
                            <p className="text-sm text-background-900 leading-relaxed">
                              {address.addressLine1}
                              {address.addressLine2 && `, ${address.addressLine2}`}
                            </p>
                            <p className="text-sm text-background-600 mt-1">
                              {address.city}, {address.postalCode}
                            </p>
                            <p className="text-sm text-background-600">
                              {address.country}
                            </p>
                          </div>
                        </div>
                  
                        {/* Location Name */}
                        {address.locationName && (
                          <div className="bg-background-50 p-3 rounded-lg">
                            <p className="text-xs text-background-500 mb-1">Selected Location:</p>
                            <p className="text-xs text-background-700 line-clamp-2">
                              {address.locationName}
                            </p>
                          </div>
                        )}
                  
                        {/* SERVICEABILITY STATUS */}
                        {serviceabilityResult && (
                          <div
                            className={`p-3 rounded-lg text-sm ${
                              isServiceAvailable
                                ? 'bg-green-50 text-green-700'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {isServiceAvailable ? (
                              <>
                                ✅ <strong>Delivery Available</strong>
                                <p className="text-xs mt-1">
                                  Riders are available for this location
                                </p>
                              </>
                            ) : (
                              <>
                                ❌ <strong>Delivery Not Available</strong>
                                <p className="text-xs mt-1">
                                  Sorry, we currently do not serve this location
                                </p>
                              </>
                            )}
                          </div>
                        )}

                        {/* 🔥 NEW: Free Delivery Badge - Desktop */}
                        {qualifiesForFreeDelivery && isServiceAvailable && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-green-700 font-semibold text-sm flex items-center gap-2">
                              🎉 FREE Delivery Applied!
                            </p>
                            <p className="text-green-600 text-xs mt-1">
                              You saved ₹{originalDeliveryTotal.toFixed(2)} on delivery charges
                            </p>
                            <p className="text-green-600 text-xs">
                              Orders above ₹{deliverySettings.freeDeliveryThreshold} qualify for free delivery
                            </p>
                          </div>
                        )}
                      </div>

                      {/* CHECK SERVICEABILITY BUTTON - Desktop */}
                      {isAddressSaved && (!serviceabilityResult || !isServiceAvailable) && address.latitude && address.longitude && (
                        <Button
                          onClick={async () => {
                            setIsSavingAddress(true);
                            try {
                              const serviceability = await checkServiceability(address.latitude!, address.longitude!);
                              setServiceabilityResult(serviceability);
                              setIsServiceAvailable(serviceability?.serviceability?.locationServiceAble === true);
                              toast({
                                title: 'Serviceability check complete',
                                description: serviceability?.serviceability?.locationServiceAble === true
                                  ? 'Delivery available for this location'
                                  : 'Delivery not available for this location',
                                variant: serviceability?.serviceability?.locationServiceAble === true ? 'default' : 'destructive'
                              });
                            } catch (error) {
                              toast({
                                title: 'Service check failed',
                                description: 'Unable to check delivery availability',
                                variant: 'destructive'
                              });
                            } finally {
                              setIsSavingAddress(false);
                            }
                          }}
                          disabled={isSavingAddress}
                          className="w-full mt-3"
                        >
                          {isSavingAddress ? 'Checking serviceability...' : 'Check Serviceability'}
                        </Button>
                      )}

                      {/* PAYMENT METHOD SELECTION - Desktop */}
                      {isAddressSaved && isServiceAvailable && (
                        <div className="bg-cream p-4 sm:p-6 rounded-xl shadow-sm mt-4">
                          <h3 className="font-semibold text-base mb-3">
                            Select Payment Method
                          </h3>

                          <div className="space-y-2">
                            <label
                              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-background-50 transition-colors ${
                                paymentMethod === 'COD' ? 'border-blue-600 bg-blue-50' : ''
                              }`}
                            >
                              <input
                                type="radio"
                                name="payment-delivery-desktop"
                                value="COD"
                                checked={paymentMethod === 'COD'}
                                onChange={(e) => setPaymentMethod(e.target.value as 'COD')}
                                className="w-4 h-4 text-green-600"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium">Cash on Delivery</p>
                                <p className="text-xs text-background-500">Pay when you receive</p>
                              </div>
                            </label>

                            <label
                              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-background-50 transition-colors ${
                                paymentMethod === 'Online' ? 'border-blue-600 bg-blue-50' : ''
                              }`}
                            >
                              <input
                                type="radio"
                                name="payment-delivery-desktop"
                                value="Online"
                                checked={paymentMethod === 'Online'}
                                onChange={(e) => setPaymentMethod(e.target.value as 'Online')}
                                className="w-4 h-4 text-green-600"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium">Online Payment</p>
                                <p className="text-xs text-background-500">UPI, Card, NetBanking</p>
                              </div>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {deliveryMode === 'pickup' && (
                <div className="space-y-4">
                  {/* SELECT CITY */}
                  <div className="bg-cream p-4 sm:p-6 rounded-xl shadow-sm">
                    <h2 className="font-semibold text-base sm:text-lg mb-3">Select Store</h2>
                    <Select onValueChange={(value) => {
                      const selected = storeLocations.find(store => store.name === value);
                      setSelectedPickupStore(selected || null);
                    }}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {storeLocations.map((store) => (
                          <SelectItem key={store.name} value={store.name}>
                            {store.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* SELECT STORE FOR PICKUP */}
                  <div className="bg-yellow-100 border border-yellow-200 rounded-xl p-4 sm:p-5 text-yellow-800">
                    <p className="text-sm font-medium">Please select store for pickup.</p>
                  </div>

                  {/* PAYMENT METHOD SELECTION (for pickup) - Desktop */}
                  <div className="bg-cream p-4 sm:p-6 rounded-xl shadow-sm mt-4">
                    <h3 className="font-semibold text-base mb-3">
                      Select Payment Method
                    </h3>

                    <div className="space-y-2">
                      <label
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-background-50 transition-colors ${
                          paymentMethod === 'COD' ? 'border-blue-600 bg-blue-50' : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment-pickup-desktop"
                          value="COD"
                          checked={paymentMethod === 'COD'}
                          onChange={(e) => setPaymentMethod(e.target.value as 'COD')}
                          className="w-4 h-4 text-orange-600"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Pay at Store (COD)</p>
                          <p className="text-xs text-background-500">Pay when you pick up</p>
                        </div>
                      </label>

                      <label
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-background-50 transition-colors ${
                          paymentMethod === 'Online' ? 'border-blue-600 bg-blue-50' : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment-pickup-desktop"
                          value="Online"
                          checked={paymentMethod === 'Online'}
                          onChange={(e) => setPaymentMethod(e.target.value as 'Online')}
                          className="w-4 h-4 text-orange-600"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Online Payment</p>
                          <p className="text-xs text-background-500">UPI, Card, NetBanking</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT - ORDER SUMMARY (Desktop Only - 30%) */}
            <div className="lg:col-span-3">
              <div className="lg:sticky lg:top-24 h-fit">
                <div className="bg-orange-100 rounded-xl p-4 sm:p-5 shadow-sm">

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
                            <p className="text-sm text-background-700">Qty: {item.qty}</p>
                          </div>
                          <p className="text-xs sm:text-sm font-semibold">
                            ₹{(price * item.qty).toFixed(2)}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* 🔥 UPDATED: DELIVERY INFO */}
                  {deliveryMode === 'delivery' && serviceabilityResult && isServiceAvailable && (
                    <div className="border-t pt-3 space-y-2 text-sm">
                      {qualifiesForFreeDelivery ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                          <p className="text-green-700 font-semibold text-sm">
                            🎉 FREE Delivery Applied!
                          </p>
                          <p className="text-green-600 text-xs mt-1">
                            Orders above ₹{deliverySettings.freeDeliveryThreshold}
                          </p>
                          <p className="text-green-600 text-xs line-through">
                            Original: ₹{originalDeliveryTotal.toFixed(2)}
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between">
                            <span className="text-background-700">Delivery Charge</span>
                            <span className="font-medium">₹{actualDeliveryPrice.toFixed(2)}</span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-background-700">Delivery Tax</span>
                            <span className="font-medium">₹{actualDeliveryTax.toFixed(2)}</span>
                          </div>

                          <div className="flex justify-between font-semibold text-orange-700">
                            <span>Total Delivery Fee</span>
                            <span>₹{actualDeliveryTotal.toFixed(2)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* TOTAL */}
<div className="border-t pt-3 mt-3 space-y-2 text-sm">

<div className="flex justify-between">
  <span className="text-background-700">Subtotal</span>
  <span className="font-medium">₹{cartTotal.toFixed(2)}</span>
</div>

<div className="flex justify-between">
  <span className="text-background-700">
    GST ({gstPercentage}%)
  </span>
  <span className="font-medium">
    ₹{gstAmount.toFixed(2)}
  </span>
</div>

{deliveryMode === 'delivery' && isServiceAvailable && (
  qualifiesForFreeDelivery ? (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
      <p className="text-green-700 font-semibold text-sm">
        🎉 Free Delivery Applied
      </p>
      <p className="text-green-600 text-xs mt-1">
        You saved ₹{originalDeliveryTotal.toFixed(2)}
      </p>
    </div>
  ) : (
    <div className="flex justify-between">
      <span className="text-background-700">Delivery</span>
      <span className="font-medium">
        ₹{deliveryTotal.toFixed(2)}
      </span>
    </div>
  )
)}

{/* FINAL TOTAL */}
<div className="border-t pt-3 flex justify-between text-lg font-bold">
  <span>Total Payable</span>
  <span className="text-orange-600">
    ₹{finalTotal.toFixed(2)}
  </span>
</div>
</div>


                  {/* PLACE ORDER BUTTON */}
                  <Button
                    disabled={(
                      (deliveryMode === 'delivery' && (!isAddressSaved || !isServiceAvailable))
                      ||
                      (deliveryMode === 'pickup' && !selectedPickupStore)
                      ||
                      !paymentMethod
                    )}
                    className="w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    onClick={placeOrder}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {paymentMethod === 'COD' ? 'Place Order (COD)' : 'Proceed to Payment'}
                  </Button>

                  {deliveryMode === 'delivery' && isAddressSaved && !isServiceAvailable && (
                    <p className="text-xs text-center text-red-500 mt-2">
                      Delivery service is not available for the selected address
                    </p>
                  )}
                  
                  {deliveryMode === 'delivery' && isAddressSaved && isServiceAvailable && !paymentMethod && (
                    <p className="text-xs text-center text-amber-600 mt-2">
                      Please select a payment method to continue
                    </p>
                  )}

                  {deliveryMode === 'pickup' && !selectedPickupStore && (
                    <p className="text-xs text-center text-red-500 mt-2">
                      Please select a store for pickup
                    </p>
                  )}

                  {deliveryMode === 'pickup' && selectedPickupStore && !paymentMethod && (
                    <p className="text-xs text-center text-amber-600 mt-2">
                      Please select a payment method to continue
                    </p>
                  )}

                </div>
              </div>
            </div>

          </div>

          {/* MOBILE: Place Order Button (Fixed at bottom) */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-cream border-t p-4 z-30">
            <Button
              disabled={(
                (deliveryMode === 'delivery' && (!isAddressSaved || !isServiceAvailable))
                ||
                (deliveryMode === 'pickup' && !selectedPickupStore)
                ||
                !paymentMethod
              )}
              className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={placeOrder}
            >
              <Check className="h-4 w-4 mr-2" />
              {paymentMethod === 'COD' ? 'Place Order (COD)' : 'Proceed to Payment'}
            </Button>

            {deliveryMode === 'delivery' && isAddressSaved && !isServiceAvailable && (
              <p className="text-xs text-center text-red-500 mt-2">
                Delivery not available for this address
              </p>
            )}
            
            {deliveryMode === 'delivery' && isAddressSaved && isServiceAvailable && !paymentMethod && (
              <p className="text-xs text-center text-amber-600 mt-2">
                Please select a payment method
              </p>
            )}

            {deliveryMode === 'pickup' && !selectedPickupStore && (
              <p className="text-xs text-center text-red-500 mt-2">
                Please select a store for pickup
              </p>
            )}

            {deliveryMode === 'pickup' && selectedPickupStore && !paymentMethod && (
              <p className="text-xs text-center text-amber-600 mt-2">
                Please select a payment method
              </p>
            )}
          </div>

          {/* Spacer for fixed button on mobile */}
          <div className="lg:hidden h-24"></div>

        </div>
      </section>
    </Layout>
  );
};

export default Checkout;