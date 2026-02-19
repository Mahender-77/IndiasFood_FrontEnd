/*
 * AdminInventory Component - Enhanced
 * 
 * Features:
 * - Support both single price and variant-based products
 * - Location-wise stock management with variant support
 * - Comprehensive filtering (location, category, status)
 * - Full CRUD operations with validation
 * - Mobile responsive design
 * - Real-time stock updates
 */

import { Layout } from '@/components/layout/Layout';
import { SEO } from '@/components/seo/SEO';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import { Category, Product, ProductVariant } from '@/types';
import {
  ArrowLeft,
  MapPin,
  Plus,
  Save,
  Search,
  Trash2,
  X
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// Import modular components
import { InventoryTable } from '@/components/admin/inventory-table/InventoryTable';
import { LocationInventoryManager } from '@/components/admin/inventory-table/LocationInventoryManager';
import { VariantBuilder } from '@/components/admin/inventory-table/VariantBuilder';
import { Link } from 'react-router-dom';


interface Location {
  storeId: string;        // 🔥 real ID
  name: string;
  displayName: string;
}


interface InventoryEntry {
  storeId: string;
  locationName: string;
  displayName: string;
  stock: {
    variantIndex: number;
    quantity: number;
  }[];
}

interface VariantStockEntry {
  storeId: string;
  quantity: number;
}


const PRODUCTS_PER_PAGE = 15;

// Extended interface for editing product with original data
interface EditingProduct extends Product {
  _originalData?: Product;
}

const AdminInventory = () => {
  // State Management
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  
  // Dialog States
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<EditingProduct | null>(null);
  const [isManageLocationsOpen, setIsManageLocationsOpen] = useState(false);
  
  // Form States
  const [newProduct, setNewProduct] = useState<Partial<Product & { imageFiles?: File[], inventoryData?: InventoryEntry[], variantStocks?: VariantStockEntry[][] }>>({
    name: '',
    description: '',
    originalPrice: undefined,
    offerPrice: undefined,
    shelfLife: undefined,
    videoUrl: '',
    variants: [],
    inventory: [],
    isGITagged: false,
    isNewArrival: false,
    images: [],
    imageFiles: [],
    isActive: true,
    inventoryData: [],
    variantStocks: []
  });
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [newLocation, setNewLocation] = useState<string>('');

  // Handle category change
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory(''); // Reset subcategory when category changes
  };
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  
  // Loading States
  const [uploadingImages, setUploadingImages] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [updatingStocks, setUpdatingStocks] = useState<Set<string>>(new Set());

  // Fetch Data on Mount
  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchLocations();
  }, []);

  const stores = useMemo(() => {
    const map = new Map<string, { _id: string; name: string }>();
  
    locations.forEach(loc => {
      if (!map.has(loc.storeId)) {
        map.set(loc.storeId, {
          _id: loc.storeId,
          name: loc.displayName || loc.name
        });
      }
    });
  
    return Array.from(map.values());
  }, [locations]);
  

 // Filtered Products
const filteredProducts = useMemo(() => {
  return (products || []).filter((product) => {
    if (!product) return false; // 🔥 protect against undefined items

    // 🔥 Safe name + description access
    const name = product?.name?.toLowerCase() || "";
    const description = product?.description?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      name.includes(search) || description.includes(search);

    if (!matchesSearch) return false;

    // Location filter
    if (selectedLocationFilter !== "all") {
      const hasLocation = product.inventory?.some((inv) =>
        inv?.location?.toLowerCase() ===
        selectedLocationFilter.toLowerCase()
      );

      if (!hasLocation) return false;
    }

    // Category filter
    if (selectedCategoryFilter !== "all") {
      const categoryId =
        (product.category as any)?._id || product.category;

      if (categoryId !== selectedCategoryFilter) return false;
    }

    // Status filter
    if (selectedStatusFilter !== "all") {
      if (selectedStatusFilter === "active" && !product.isActive)
        return false;

      if (selectedStatusFilter === "inactive" && product.isActive)
        return false;
    }

    return true;
  });
}, [
  products,
  searchTerm,
  selectedLocationFilter,
  selectedCategoryFilter,
  selectedStatusFilter,
]);


  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedLocationFilter, selectedCategoryFilter, selectedStatusFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const onToggleMostSaled = useCallback(async (productId: string, isMostSaled: boolean) => {
    try {
      const token = localStorage.getItem('userToken');
      await api.put(`/admin/inventory/${productId}/most-saled`, { value: isMostSaled }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProducts(prevProducts =>
        prevProducts.map(product =>
          product._id === productId ? { ...product, isMostSaled } : product
        )
      );
      toast.success(`Product marked as ${isMostSaled ? 'Most Sold' : 'Not Most Sold'}`);
    } catch (error: any) {
      console.error('Failed to toggle most saled status:', error);
      toast.error('Failed to update most saled status.');
    }
  }, []);

  // Optimized API Calls
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      const response = await api.get('/admin/inventory', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (Array.isArray(response.data)) {
        setProducts(response.data);
      } else {
        setProducts([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
      
      if (error.response?.status === 401) {
        toast.error('Please login as admin');
      } else if (error.response?.status === 403) {
        toast.error('Admin access required');
      } else {
        toast.error('Failed to load products');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/products/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const fetchLocations = async () => {
    const res = await api.get('/admin/delivery-locations');
  
    setLocations(
      res.data.map((loc: any) => ({
        storeId: loc.storeId,        // 🔥
        name: loc.name,
        displayName: loc.displayName || loc.name
      }))
    );
  };
  

  const handleImageUpload = async (files: FileList) => {
    if (!files || files.length === 0) return [];
  
    setUploadingImages(true);
  
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('images', file);
      });
  
      const response = await api.post('/upload/images', formData);
      return response.data.urls || [];
    } catch (error: any) {
      console.error('Failed to upload images:', error);
      toast.error('Failed to upload images');
      return [];
    } finally {
      setUploadingImages(false);
    }
  };
  

  // Optimized image upload with better error handling
  const uploadImagesOptimized = async (files: File[]) => {
    if (!files || files.length === 0) return [];
  
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file); // 🔥 MUST be "images"
      });
  
      const response = await api.post('/upload/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
  
      return response.data.urls || [];
    } catch (error: any) {
      console.error('Image upload failed:', error.response?.data || error);
      return [];
    }
  };
  
  
  
  // Product Creation
  const handleCreateProduct = async () => {
    if (creatingProduct) return;
  
    // ---------------- VALIDATION ----------------
  
    if (!newProduct.name?.trim()) {
      toast.error('Product name is required');
      return;
    }
  
    if (!selectedCategory) {
      toast.error('Please select a category');
      return;
    }
  
    const hasVariants =
      newProduct.variants && newProduct.variants.length > 0;
  
    if (hasVariants) {
      if (
        !newProduct.variantStocks?.length ||
        !newProduct.variantStocks.some(vs =>
          vs?.some(s => s.quantity > 0)
        )
      ) {
        toast.error('Add stock for variants');
        return;
      }
  
      const invalidVariants = newProduct.variants.filter(
        v => !v.value?.trim() || v.originalPrice <= 0
      );
  
      if (invalidVariants.length > 0) {
        toast.error(
          `${invalidVariants.length} variant(s) incomplete`
        );
        return;
      }
    } else {
      if (
        !newProduct.inventoryData?.length ||
        !newProduct.inventoryData.some(inv =>
          inv.stock.some(s => s.quantity > 0)
        )
      ) {
        toast.error('Add at least one location with stock');
        return;
      }
  
      if (
        newProduct.originalPrice === undefined ||
        newProduct.originalPrice <= 0
      ) {
        toast.error('Valid price required');
        return;
      }
  
      if (
        newProduct.offerPrice !== undefined &&
        (newProduct.offerPrice <= 0 ||
          newProduct.offerPrice >= newProduct.originalPrice)
      ) {
        toast.error('Invalid offer price');
        return;
      }
    }
  
    setCreatingProduct(true);
  
    try {
      // ---------------- PREPARE INVENTORY ----------------
  
      let inventory: any[] = [];
  
      if (hasVariants) {
        const locationMap = new Map();
  
        newProduct.variantStocks?.forEach(
          (variantStock, variantIndex) => {
            variantStock?.forEach(stock => {
              const locationName = locations.find(
                loc => loc.storeId === stock.storeId
              )?.name;
  
              if (locationName && stock.quantity > 0) {
                if (!locationMap.has(locationName)) {
                  locationMap.set(locationName, []);
                }
  
                locationMap.get(locationName).push({
                  variantIndex,
                  quantity: stock.quantity,
                  lowStockThreshold: 5
                });
              }
            });
          }
        );
  
        inventory = Array.from(locationMap.entries()).map(
          ([location, stock]) => ({
            location,
            stock
          })
        );
      } else {
        inventory =
          newProduct.inventoryData
            ?.map(inv => ({
              location: inv.locationName,
              stock: inv.stock
                .filter(s => s.quantity > 0)
                .map(s => ({
                  variantIndex: s.variantIndex,
                  quantity: s.quantity,
                  lowStockThreshold: 5
                }))
            }))
            .filter(inv => inv.stock.length > 0) || [];
      }
  
      // ---------------- FIX STORE ID ----------------
  
      let finalStoreId = selectedStoreId;
  
      if (!finalStoreId) {
        if (newProduct.variantStocks?.length) {
          for (const variantStock of newProduct.variantStocks) {
            if (variantStock?.length) {
              finalStoreId = variantStock[0].storeId;
              break;
            }
          }
        }
  
        if (!finalStoreId && newProduct.inventoryData?.length) {
          finalStoreId = newProduct.inventoryData[0].storeId;
        }
      }
  
      if (!finalStoreId) {
        toast.error(
          'Store is required. Please add at least one location.'
        );
        setCreatingProduct(false);
        return;
      }
  
      // ---------------- CREATE PRODUCT FIRST (FAST) ----------------
  
      const productData = {
        name: newProduct.name.trim(),
        description: newProduct.description?.trim() || '',
        store: finalStoreId,
        originalPrice: newProduct.originalPrice,
        offerPrice: newProduct.offerPrice,
        variants: hasVariants ? newProduct.variants : undefined,
        shelfLife: newProduct.shelfLife !== undefined && newProduct.shelfLife !== null ? Number(newProduct.shelfLife) : undefined,
        category: selectedCategory,
        subcategory:
          selectedSubcategory &&
          selectedSubcategory !== 'none'
            ? selectedSubcategory
            : undefined,
        videoUrl: newProduct.videoUrl?.trim() || '',
        images: [], // 🔥 create first without images
        inventory,
        isGITagged: newProduct.isGITagged || false,
        isNewArrival: newProduct.isNewArrival || false,
        isActive: true
      };
  
      const response = await api.post(
        '/admin/inventory/create-product',
        productData
      );
  
      console.log("FULL RESPONSE:", response);
      console.log("DATA:", response.data);
      
      
      const createdProduct = response.data;

      setProducts(prev => [createdProduct, ...(prev || [])]);
      
      // ---------------- UPLOAD IMAGES AFTER (BACKGROUND) ----------------
  
      if (newProduct.imageFiles?.length) {
        const uploadedImages =
          await uploadImagesOptimized(
            newProduct.imageFiles
          );
          console.log("UPLOADED IMAGES:", uploadedImages);
  
        if (uploadedImages.length > 0) {
          const updateRes = await api.put(
            `/admin/inventory/products/${createdProduct._id}`,
            { images: uploadedImages }
          );

          const updatedProduct = updateRes.data;
          
          setProducts(prev =>
            prev.map(p =>
              p._id === updatedProduct._id
                ? updatedProduct
                : p
            )
          );
        }
      }
  
      toast.success('Product created successfully');
  
      setIsCreateDialogOpen(false);
      resetNewProductForm();
  
    } catch (error: any) {
      console.error('Product creation failed:', error);
  
      if (error.response?.status === 400) {
        toast.error(
          error.response?.data?.message ||
            'Invalid product data'
        );
      } else if (error.response?.status === 403) {
        toast.error('Permission denied');
      } else {
        toast.error('Failed to create product');
      }
    } finally {
      setCreatingProduct(false);
    }
  };
  

  const resetNewProductForm = () => {
    setNewProduct({
      name: '',
      description: '',
      originalPrice: undefined,
      offerPrice: undefined,
      shelfLife: undefined,
      videoUrl: '',
      variants: [],
      inventory: [],
      isGITagged: false,
      isNewArrival: false,
      images: [],
      imageFiles: [],
      isActive: true,
      inventoryData: [],
      variantStocks: []
    });
    setSelectedCategory('');
    setSelectedSubcategory('');
  };

  // Product Editing
  const handleEditProduct = (product: Product) => {
    // Store original product data for displaying current stock quantities
    const originalProduct = JSON.parse(JSON.stringify(product));
    setEditingProduct({ ...product, _originalData: originalProduct });
  };

  const handleSaveProduct = async () => {
    if (!editingProduct) {
      toast.error('No product selected for editing');
      return;
    }

    if (savingProduct) return;

    // Validation
    if (!editingProduct.name?.trim()) {
      toast.error('Product name is required');
      return;
    }

    if (editingProduct.variants && editingProduct.variants.length > 0) {
      const invalidVariants = editingProduct.variants.filter(variant =>
        !variant.value?.trim() || variant.originalPrice <= 0
      );

      if (invalidVariants.length > 0) {
        toast.error(`Please complete all variant details. ${invalidVariants.length} variant(s) incomplete.`);
        return;
      }
    } else {
      if (editingProduct.originalPrice === undefined || editingProduct.originalPrice < 0) {
        toast.error('Original price is required');
        return;
      }

      if (editingProduct.offerPrice !== undefined && editingProduct.offerPrice < 0) {
        toast.error('Offer price must be 0 or greater');
        return;
      }

      if (editingProduct.offerPrice !== undefined && editingProduct.offerPrice >= editingProduct.originalPrice) {
        toast.error('Offer price must be less than original price');
        return;
      }
    }

    setSavingProduct(true);

    try {
      const updateData = {
        name: editingProduct.name.trim(),
        description: editingProduct.description?.trim() || '',
        originalPrice: editingProduct.originalPrice,
        offerPrice: editingProduct.offerPrice,
        shelfLife: editingProduct.shelfLife !== undefined && editingProduct.shelfLife !== null ? Number(editingProduct.shelfLife) : undefined,
        videoUrl: editingProduct.videoUrl?.trim() || '',
        variants: editingProduct.variants || [],
        inventory: editingProduct.inventory || [],
        subcategory: editingProduct.subcategory || undefined,
        isGITagged: editingProduct.isGITagged || false,
        isNewArrival: editingProduct.isNewArrival || false,
        isActive: editingProduct.isActive ?? true,
        images: editingProduct.images || []
      };

      const response = await api.put(`/admin/inventory/products/${editingProduct._id}`, updateData);

      if (response.status === 200) {
        toast.success('Product updated successfully');
        setEditingProduct(null);
        await fetchProducts();
      }
    } catch (error: any) {
      console.error('Failed to update product:', error);

      if (error.response?.status === 404) {
        toast.error('Product not found');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to update this product');
      } else if (error.response?.status === 400) {
        toast.error(error.response?.data?.message || 'Invalid product data');
      } else {
        toast.error('Failed to update product. Please try again.');
      }
    } finally {
      setSavingProduct(false);
    }
  };

  // Stock Updates
  const handleUpdateStock = async (productId: string, location: string, variantIndex: number, quantity: number) => {
    const stockKey = `${productId}-${location}-${variantIndex}`;

    if (updatingStocks.has(stockKey)) return;

    setUpdatingStocks(prev => new Set(prev).add(stockKey));

    try {
      await api.put(`/admin/inventory/${productId}/stock`, {
        location,
        variantIndex,
        quantity
      });

      // Update local state
      setProducts(prevProducts =>
        prevProducts.map(product => {
          if (product._id === productId) {
            const updatedProduct = JSON.parse(JSON.stringify(product));

            if (!updatedProduct.inventory) {
              updatedProduct.inventory = [];
            }

            const locationIndex = updatedProduct.inventory.findIndex((inv: any) => inv.location === location);

            if (locationIndex >= 0) {
              const locationInventory = updatedProduct.inventory[locationIndex];
              if (!locationInventory.stock) {
                locationInventory.stock = [];
              }

              const stockIndex = locationInventory.stock.findIndex((stock: any) => stock.variantIndex === variantIndex);

              if (stockIndex >= 0) {
                locationInventory.stock[stockIndex].quantity = quantity;
              } else {
                locationInventory.stock.push({
                  variantIndex,
                  quantity,
                  lowStockThreshold: 5
                });
              }
            } else {
              updatedProduct.inventory.push({
                location,
                stock: [{
                  variantIndex,
                  quantity,
                  lowStockThreshold: 5
                }]
              });
            }

            return updatedProduct;
          }
          return product;
        })
      );

      // Update editing product if same
      if (editingProduct && editingProduct._id === productId) {
        setEditingProduct(prev => {
          if (!prev) return prev;

          const updatedProduct = JSON.parse(JSON.stringify(prev));

          if (!updatedProduct.inventory) {
            updatedProduct.inventory = [];
          }

          const locationIndex = updatedProduct.inventory.findIndex((inv: any) => inv.location === location);

          if (locationIndex >= 0) {
            const locationInventory = updatedProduct.inventory[locationIndex];
            if (!locationInventory.stock) {
              locationInventory.stock = [];
            }

            const stockIndex = locationInventory.stock.findIndex((stock: any) => stock.variantIndex === variantIndex);

            if (stockIndex >= 0) {
              locationInventory.stock[stockIndex].quantity = quantity;
            } else {
              locationInventory.stock.push({
                variantIndex,
                quantity,
                lowStockThreshold: 5
              });
            }
          } else {
            updatedProduct.inventory.push({
              location,
              stock: [{
                variantIndex,
                quantity,
                lowStockThreshold: 5
              }]
            });
          }

          return updatedProduct;
        });
      }
    } catch (error: any) {
      console.error('Failed to update stock:', error);

      if (error.response?.status === 400) {
        toast.error(`Failed to update stock: ${error.response?.data?.message || 'Invalid data'}`);
      } else if (error.response?.status === 404) {
        toast.error('Product not found');
      } else {
        toast.error('Failed to update stock. Please try again.');
      }
    } finally {
      setUpdatingStocks(prev => {
        const newSet = new Set(prev);
        newSet.delete(stockKey);
        return newSet;
      });
    }
  };


  // const removeLocation = async (locationId: string, locationName: string) => {
  //   if (locations.length <= 1) {
  //     toast.error('Cannot remove the last location');
  //     return;
  //   }

  //   try {
  //     await api.delete(`/admin/locations/${locationId}`);
  //     setLocations(locations.filter(loc => loc._id !== locationId));
  //     toast.success(`Location "${locationName}" removed successfully`);
  //   } catch (error: any) {
  //     toast.error(error.response?.data?.message || 'Failed to remove location');
  //   }
  // };

  const getLocationStock = (product: Product, locationName: string) => {
    const locationInventory = product.inventory?.find(
      inv => inv.location.toLowerCase() === locationName.toLowerCase()
    );
  
    // product not available here
    if (!locationInventory) return null;
  
    return (
      locationInventory.stock?.reduce(
        (sum, s) => sum + (s.quantity || 0),
        0
      ) || 0
    );
  };
  


  // Inventory Management for Product Creation
  const addLocationToInventory = (storeId: string) => {
    const locationObj = locations.find(l => l.storeId === storeId);
    if (!locationObj) return;
  
    // 🔥 Set store once (product → store relation)
    if (!selectedStoreId) {
      setSelectedStoreId(storeId);
    }
  
    const existingIndex = newProduct.inventoryData?.findIndex(
      inv => inv.storeId === storeId
    );
  
    if (existingIndex !== undefined && existingIndex >= 0) {
      toast.error(`Location "${locationObj.displayName}" is already added`);
      return;
    }
  
    const newInventoryEntry: InventoryEntry = {
      storeId: storeId,                // ✅ FIXED
      locationName: locationObj.name,
      displayName: locationObj.displayName,
      stock:
        newProduct.variants && newProduct.variants.length > 0
          ? newProduct.variants.map((_, index) => ({
              variantIndex: index,
              quantity: 0
            }))
          : [{ variantIndex: 0, quantity: 0 }]
    };
  
    setNewProduct(prev => ({
      ...prev,
      inventoryData: [...(prev.inventoryData || []), newInventoryEntry]
    }));
  
    toast.success(`Added location "${locationObj.displayName}"`);
  };
  

  const removeLocationFromInventory = (storeId: string) => {
    const locationObj = locations.find(loc => loc.storeId === storeId);
  
    setNewProduct(prev => ({
      ...prev,
      inventoryData:
        prev.inventoryData?.filter(inv => inv.storeId !== storeId) || []
    }));
  
    toast.success(`Removed location "${locationObj?.displayName}"`);
  };
  

  const updateCreationStock = (
    storeId: string,
    variantIndex: number,
    quantity: number
  ) => {
    setNewProduct(prev => ({
      ...prev,
      inventoryData:
        prev.inventoryData?.map(inv =>
          inv.storeId === storeId
            ? {
                ...inv,
                stock: inv.stock.map(stock =>
                  stock.variantIndex === variantIndex
                    ? { ...stock, quantity: Math.max(0, quantity) }
                    : stock
                )
              }
            : inv
        ) || []
    }));
  };
  

  // Variant Management
  const addVariant = (isNewProduct: boolean = false) => {
    const newVariant: ProductVariant = {
      type: 'weight',
      value: '',
      originalPrice: 0,
      offerPrice: undefined
    };

    if (isNewProduct) {
      setNewProduct(prev => {
        const currentVariants = prev.variants || [];
        const newVariantIndex = currentVariants.length;

        // Add stock entries for the new variant to all existing locations
        const updatedInventoryData = (prev.inventoryData || []).map(inventoryEntry => ({
          ...inventoryEntry,
          stock: [
            ...inventoryEntry.stock,
            { variantIndex: newVariantIndex, quantity: 0 }
          ]
        }));

        return {
          ...prev,
          variants: [...currentVariants, newVariant],
          inventoryData: updatedInventoryData
        };
      });
    } else if (editingProduct) {
      setEditingProduct(prev => {
        if (!prev) return prev;

        const currentVariants = prev.variants || [];
        const newVariantIndex = currentVariants.length;

        // Add stock entries for the new variant to all existing locations
        const updatedInventory = (prev.inventory || []).map(locationInventory => ({
          ...locationInventory,
          stock: [
            ...locationInventory.stock,
            {
              variantIndex: newVariantIndex,
              quantity: 0,
              lowStockThreshold: 5
            }
          ]
        }));

        return {
          ...prev,
          variants: [...currentVariants, newVariant],
          inventory: updatedInventory
        };
      });
    }
  };

  const removeVariant = (index: number, isNewProduct: boolean = false) => {
    if (isNewProduct) {
      setNewProduct(prev => {
        if (!prev.variants || index < 0 || index >= prev.variants.length) return prev;

        // Remove the variant and adjust stock entries for all locations
        const updatedInventoryData = (prev.inventoryData || []).map(inventoryEntry => ({
          ...inventoryEntry,
          stock: inventoryEntry.stock
            .filter(stockItem => stockItem.variantIndex !== index) // Remove stock for this variant
            .map(stockItem => ({
              ...stockItem,
              variantIndex: stockItem.variantIndex > index ? stockItem.variantIndex - 1 : stockItem.variantIndex // Adjust indices
            }))
        }));

        return {
          ...prev,
          variants: prev.variants.filter((_, i) => i !== index),
          inventoryData: updatedInventoryData
        };
      });
    } else if (editingProduct) {
      setEditingProduct(prev => {
        if (!prev || !prev.variants || index < 0 || index >= prev.variants.length) return prev;

        // Remove the variant and adjust stock entries for all locations
        const updatedInventory = (prev.inventory || []).map(locationInventory => ({
          ...locationInventory,
          stock: locationInventory.stock
            .filter(stockItem => stockItem.variantIndex !== index) // Remove stock for this variant
            .map(stockItem => ({
              ...stockItem,
              variantIndex: stockItem.variantIndex > index ? stockItem.variantIndex - 1 : stockItem.variantIndex // Adjust indices
            }))
        }));

        return {
          ...prev,
          variants: prev.variants.filter((_, i) => i !== index),
          inventory: updatedInventory
        };
      });
    }
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: any, isNewProduct: boolean = false) => {
    if (isNewProduct) {
      setNewProduct(prev => {
        if (!prev.variants || index >= prev.variants.length) return prev;

        const updatedVariants = [...prev.variants];
        updatedVariants[index] = { ...updatedVariants[index], [field]: value };

        return {
          ...prev,
          variants: updatedVariants
        };
      });
    } else if (editingProduct) {
      setEditingProduct(prev => {
        if (!prev || !prev.variants || index >= prev.variants.length) return prev;

        const updatedVariants = [...prev.variants];
        updatedVariants[index] = { ...updatedVariants[index], [field]: value };

        return {
          ...prev,
          variants: updatedVariants
        };
      });
    }
  };

  // Variant Stock Management
  const addLocationToVariant = (variantIndex: number, storeId: string) => {
    const locationObj = locations.find(loc => loc.storeId === storeId);
    if (!locationObj) return;
  
    setNewProduct(prev => {
      const variantStocks = prev.variantStocks || [];
      const currentStocks = variantStocks[variantIndex] || [];
  
      // Check if store already exists for this variant
      if (currentStocks.some(stock => stock.storeId === storeId)) {
        toast.error(
          `Location "${locationObj.displayName}" is already added to this variant`
        );
        return prev;
      }
  
      const updatedVariantStocks = [...variantStocks];
      updatedVariantStocks[variantIndex] = [
        ...currentStocks,
        { storeId, quantity: 0 }
      ];
  
      return {
        ...prev,
        variantStocks: updatedVariantStocks
      };
    });
  
    toast.success(`Added location "${locationObj.displayName}" to variant`);
  };
  

  const removeLocationFromVariant = (variantIndex: number, storeId: string) => {
    const locationObj = locations.find(loc => loc.storeId === storeId);
  
    setNewProduct(prev => {
      const variantStocks = prev.variantStocks || [];
      const updatedVariantStocks = [...variantStocks];
  
      updatedVariantStocks[variantIndex] =
        updatedVariantStocks[variantIndex]?.filter(
          stock => stock.storeId !== storeId
        ) || [];
  
      return {
        ...prev,
        variantStocks: updatedVariantStocks
      };
    });
  
    toast.success(
      `Removed location "${locationObj?.displayName}" from variant`
    );
  };
  

  const updateVariantStock = (variantIndex: number, locationId: string, quantity: number) => {
    setNewProduct(prev => {
      const variantStocks = prev.variantStocks || [];
      const updatedVariantStocks = [...variantStocks];
      const variantStock = updatedVariantStocks[variantIndex] || [];

      const stockIndex = variantStock.findIndex(stock => stock.storeId === locationId);
      if (stockIndex >= 0) {
        updatedVariantStocks[variantIndex] = variantStock.map((stock, index) =>
          index === stockIndex ? { ...stock, quantity: Math.max(0, quantity) } : stock
        );
      }

      return {
        ...prev,
        variantStocks: updatedVariantStocks
      };
    });
  };

  // Inventory Management for Editing
  const addLocationToEditingProduct = (storeId: string) => {
    if (!editingProduct) return;
  
    const locationObj = locations.find(loc => loc.storeId === storeId);
    if (!locationObj) return;
  
    const existingLocation = editingProduct.inventory?.find(
      inv => inv.location === locationObj.name
    );
  
    if (existingLocation) {
      toast.error(`Location "${locationObj.displayName}" is already added`);
      return;
    }
  
    const newInventoryEntry = {
      location: locationObj.name,
      stock:
        editingProduct.variants && editingProduct.variants.length > 0
          ? editingProduct.variants.map((_, index) => ({
              variantIndex: index,
              quantity: 0,
              lowStockThreshold: 5
            }))
          : [{ variantIndex: 0, quantity: 0, lowStockThreshold: 5 }]
    };
  
    setEditingProduct({
      ...editingProduct,
      inventory: [...(editingProduct.inventory || []), newInventoryEntry]
    });
  
    toast.success(`Added location "${locationObj.displayName}"`);
  };
  

  const removeLocationFromEditingProduct = (locationName: string) => {
    if (!editingProduct) return;

    const locationObj = locations.find(loc => loc.name === locationName);
    setEditingProduct({
      ...editingProduct,
      inventory: editingProduct.inventory?.filter(inv => inv.location !== locationName) || []
    });

    toast.success(`Removed location "${locationObj?.displayName}"`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO
        title="Inventory Management - Admin"
        description="Manage product inventory, stock levels, pricing, and locations."
        keywords="admin inventory, product management, stock control"
      />

      <section className=" bg-cream min-h-[calc(100vh-150px)]">
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
        <div className="w-full lg:w-[90%] mx-auto py-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Inventory Management
            </h1>

            {/* Filters and Actions - Inline Layout */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              {/* Search */}
              <div className="relative flex-1 min-w-[150px] max-w-[200px]">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>

              {/* Location Filter */}
              <Select value={selectedLocationFilter} onValueChange={setSelectedLocationFilter}>
                <SelectTrigger className="h-9 w-[130px] text-sm">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map(location => (
                    <SelectItem key={location.storeId} value={location.name}>
                      {location.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Category Filter */}
              <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
                <SelectTrigger className="h-9 w-[130px] text-sm">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
                <SelectTrigger className="h-9 w-[110px] text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              {/* Divider */}
              <div className="hidden sm:block h-6 w-px bg-gray-300 mx-1"></div>
           
              {/* Add Product */}
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-500 hover:bg-orange-600 h-9">
                    <Plus className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Add Product</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                    <DialogDescription>
                      Create a new product with inventory management across multiple locations.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    {/* Basic Product Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Product Name *</Label>
                        <Input
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                          placeholder="Enter product name"
                        />
                      </div>
                      <div>
                        <Label>Category *</Label>
                        <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(category => (
                              <SelectItem key={category._id} value={category._id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {(() => {
                        const selectedCategoryObj = categories.find(cat => cat._id === selectedCategory);
                        return selectedCategoryObj && selectedCategoryObj.subcategories && selectedCategoryObj.subcategories.length > 0 ? (
                          <div>
                            <Label>Subcategory</Label>
                            <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select subcategory (optional)" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {selectedCategoryObj.subcategories.map(subcategory => (
                                  <SelectItem key={subcategory._id || subcategory.name} value={subcategory.name}>
                                    {subcategory.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : null;
                      })()}
                    </div>

                    {/* Description */}
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                        placeholder="Enter product description"
                        rows={3}
                      />
                    </div>

                    {/* Variants Section */}
                    <VariantBuilder
  variants={newProduct.variants || []}
  onAddVariant={() => addVariant(true)}
  onRemoveVariant={(index) => removeVariant(index, true)}
  onUpdateVariant={(index, field, value) =>
    updateVariant(index, field, value, true)
  }
  locations={locations}
  variantStocks={newProduct.variantStocks || []}
  onAddLocationToVariant={addLocationToVariant}
  onRemoveLocationFromVariant={removeLocationFromVariant}
  onUpdateVariantStock={updateVariantStock}
/>


                    {/* Pricing Section */}
                    {(!newProduct.variants || newProduct.variants.length === 0) ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label>Original Price (₹) *</Label>
                          <Input
                            type="number"
                            placeholder="Enter base price"
                            onChange={(e) => setNewProduct({ ...newProduct, originalPrice: Number(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <Label>Offer Price (₹)</Label>
                          <Input
                            type="number"
                            placeholder="Optional discount price"
                            value={newProduct.offerPrice || ''}
                            onChange={(e) => setNewProduct({
                              ...newProduct,
                              offerPrice: e.target.value ? Number(e.target.value) : undefined
                            })}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                          <strong>Variant-Based Pricing:</strong> Individual prices are set for each variant above.
                        </p>
                      </div>
                    )}

                    {/* Additional Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Shelf Life (Days)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={newProduct.shelfLife || ''}
                          onChange={(e) => setNewProduct({ ...newProduct, shelfLife: e.target.value ? Number(e.target.value) : undefined })}
                          placeholder="e.g., 7"
                        />
                      </div>
                      <div>
                        <Label>Video URL</Label>
                        <Input
                          value={newProduct.videoUrl}
                          onChange={(e) => setNewProduct({ ...newProduct, videoUrl: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                    </div>

                    {/* Flags */}
                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={newProduct.isGITagged || false}
                          onCheckedChange={(checked) => setNewProduct({ ...newProduct, isGITagged: checked })}
                        />
                        <Label>GI Tagged</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={newProduct.isNewArrival || false}
                          onCheckedChange={(checked) => setNewProduct({ ...newProduct, isNewArrival: checked })}
                        />
                        <Label>New Arrival</Label>
                      </div>
                    </div>

                    {/* Images */}
                    <div>
                      <Label>Product Images</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Select multiple images for your product (max 10 images). You can select multiple files at once or add them in batches.
                      </p>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                const files = Array.from(e.target.files);
                                const previewUrls = files.map(file => URL.createObjectURL(file));
                                setNewProduct({
                                  ...newProduct,
                                  imageFiles: [...(newProduct.imageFiles || []), ...files],
                                  images: [...(newProduct.images || []), ...previewUrls]
                                });
                              }
                            }}
                            disabled={uploadingImages || (newProduct.images?.length || 0) >= 10}
                            className="cursor-pointer flex-1"
                          />
                          {(newProduct.images?.length || 0) > 0 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Clear all images
                                newProduct.images?.forEach(url => {
                                  if (url.startsWith('blob:')) {
                                    URL.revokeObjectURL(url);
                                  }
                                });
                                setNewProduct({
                                  ...newProduct,
                                  images: [],
                                  imageFiles: []
                                });
                              }}
                              className="whitespace-nowrap"
                            >
                              Clear All
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          💡 Tip: Hold Ctrl/Cmd while clicking to select multiple files at once
                        </p>

                        {newProduct.images && newProduct.images.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-sm font-medium">Selected Images ({newProduct.images.length})</Label>
                              {newProduct.images.length >= 10 && (
                                <Badge variant="secondary" className="text-xs">Maximum reached</Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                              {newProduct.images.map((image, index) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={image}
                                    alt={`Product ${index + 1}`}
                                    className="w-full h-20 object-cover rounded border"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                      URL.revokeObjectURL(newProduct.images?.[index] || '');
                                      setNewProduct({
                                        ...newProduct,
                                        images: newProduct.images?.filter((_, i) => i !== index),
                                        imageFiles: newProduct.imageFiles?.filter((_, i) => i !== index)
                                      });
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                  <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1 py-0.5 rounded">
                                    {index + 1}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {(!newProduct.images || newProduct.images.length === 0) && (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <div className="text-gray-500">
                              <p className="text-sm">No images selected</p>
                              <p className="text-xs mt-1">Click to browse and select multiple images</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Location Inventory Setup - Only for non-variant products */}
                    {(!newProduct.variants || newProduct.variants.length === 0) && (
                      <LocationInventoryManager
                        inventoryData={newProduct.inventoryData || []}
                        locations={locations}
                        variants={newProduct.variants || []}
                        onAddLocation={addLocationToInventory}
                        onRemoveLocation={removeLocationFromInventory}
                        onUpdateStock={updateCreationStock}
                      />
                    )}

                    {/* Info for variant products */}
                    {newProduct.variants && newProduct.variants.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-800">
                          <strong>📍 Location Management:</strong> Stock quantities are managed individually for each variant above.
                          Each variant can be available at different locations with different stock levels.
                        </p>
                      </div>
                    )}

                    {/* Dialog Actions */}
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateProduct}
                        disabled={creatingProduct}
                      >
                        {creatingProduct ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creating...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Create Product
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Results Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
              {filteredProducts.length !== products.length && ` (filtered from ${products.length})`}
            </div>
            {totalPages > 1 && (
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
            )}
          </div>

          {/* Products Table */}
          <InventoryTable
            products={paginatedProducts}
            categories={categories}
            locations={locations}
            onEditProduct={handleEditProduct}
            getLocationStock={getLocationStock}
            onUpdateStock={handleUpdateStock}
            updatingStocks={updatingStocks}
            onToggleMostSaled={onToggleMostSaled}
          />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 bg-white rounded-lg border">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
              </div>
              
              <div className="flex items-center gap-2">
                {/* First Page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  className="hidden sm:flex"
                >
                  First
                </Button>
                
                {/* Previous */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(pageNum)}
                        className={`w-9 h-9 p-0 ${currentPage === pageNum ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                {/* Next */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
                
                {/* Last Page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="hidden sm:flex"
                >
                  Last
                </Button>
              </div>
            </div>
          )}

          {/* Edit Product Dialog */}
          <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Product - {editingProduct?.name}</DialogTitle>
                <DialogDescription>
                  Modify product details, pricing, and inventory across locations.
                </DialogDescription>
              </DialogHeader>

              {editingProduct && (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Product Name *</Label>
                      <Input
                        value={editingProduct.name}
                        onChange={(e) => setEditingProduct({
                          ...editingProduct,
                          name: e.target.value
                        })}
                        className={!editingProduct.name?.trim() ? 'border-red-300' : ''}
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Input
                        value={(editingProduct.category as any)?.name || ''}
                        readOnly
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={editingProduct.description || ''}
                      onChange={(e) => setEditingProduct({
                        ...editingProduct,
                        description: e.target.value
                      })}
                      rows={3}
                    />
                  </div>

                  {/* Pricing */}
                  {editingProduct.variants && editingProduct.variants.length > 0 ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <strong>Variant-Based Pricing:</strong> Adjust prices in the Variants section below.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Original Price (₹)</Label>
                        <Input
                          type="number"
                          value={editingProduct.originalPrice}
                          onChange={(e) => setEditingProduct({
                            ...editingProduct,
                            originalPrice: Number(e.target.value)
                          })}
                        />
                      </div>
                      <div>
                        <Label>Offer Price (₹)</Label>
                        <Input
                          type="number"
                          value={editingProduct.offerPrice || ''}
                          onChange={(e) => setEditingProduct({
                            ...editingProduct,
                            offerPrice: e.target.value ? Number(e.target.value) : undefined
                          })}
                        />
                      </div>
                    </div>
                  )}

                  {/* Additional Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Shelf Life (Days)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={editingProduct.shelfLife || ''}
                        onChange={(e) => setEditingProduct({
                          ...editingProduct,
                          shelfLife: e.target.value ? Number(e.target.value) : undefined
                        })}
                        placeholder="e.g., 7"
                      />
                    </div>
                    <div>
                      <Label>Video URL</Label>
                      <Input
                        value={editingProduct.videoUrl || ''}
                        onChange={(e) => setEditingProduct({
                          ...editingProduct,
                          videoUrl: e.target.value
                        })}
                      />
                    </div>
                  </div>

                  {/* Status Flags */}
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={editingProduct.isActive || false}
                        onCheckedChange={(checked) => setEditingProduct({
                          ...editingProduct,
                          isActive: checked
                        })}
                      />
                      <Label>Active</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={editingProduct.isGITagged || false}
                        onCheckedChange={(checked) => setEditingProduct({
                          ...editingProduct,
                          isGITagged: checked
                        })}
                      />
                      <Label>GI Tagged</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={editingProduct.isNewArrival || false}
                        onCheckedChange={(checked) => setEditingProduct({
                          ...editingProduct,
                          isNewArrival: checked
                        })}
                      />
                      <Label>New Arrival</Label>
                    </div>
                  </div>

                  {/* Variants */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-lg font-semibold">Product Variants</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addVariant(false)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Variant
                      </Button>
                    </div>
                    {editingProduct.variants && editingProduct.variants.length > 0 ? (
                      <div className="space-y-3">
                        {editingProduct.variants.map((variant, index) => {
                          const isValid = variant.value.trim() && variant.originalPrice > 0;
                          return (
                            <div key={index} className={`border rounded-lg p-3 ${isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">Variant {index + 1}</span>
                                {editingProduct.variants && editingProduct.variants.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeVariant(index, false)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div>
                                  <Label className="text-sm">Type</Label>
                                  <Select
                                    value={variant.type}
                                    onValueChange={(value: 'weight' | 'pieces' | 'box') =>
                                      updateVariant(index, 'type', value, false)
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="weight">Weight</SelectItem>
                                      <SelectItem value="pieces">Pieces</SelectItem>
                                      <SelectItem value="box">Box</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-sm">Value</Label>
                                  <Input
                                    value={variant.value}
                                    onChange={(e) => updateVariant(index, 'value', e.target.value, false)}
                                    placeholder="e.g., 500g"
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm">Price (₹)</Label>
                                  <Input
                                    type="number"
                                    value={variant.originalPrice}
                                    onChange={(e) => updateVariant(index, 'originalPrice', Number(e.target.value), false)}
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm">Offer (₹)</Label>
                                  <Input
                                    type="number"
                                    value={variant.offerPrice || ''}
                                    onChange={(e) => updateVariant(index, 'offerPrice',
                                      e.target.value ? Number(e.target.value) : undefined, false)}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground bg-gray-50 border rounded-lg p-4 text-center">
                        No variants added. Add variants to create multi-variant products.
                      </div>
                    )}
                  </div>

                  {/* Images */}
                  <div>
                    <Label>Product Images</Label>
                    <Input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={async (e) => {
                        if (e.target.files && editingProduct) {
                          const imageUrls = await handleImageUpload(e.target.files);
                          if (imageUrls.length > 0) {
                            setEditingProduct({
                              ...editingProduct,
                              images: [...editingProduct.images, ...imageUrls]
                            });
                          }
                        }
                      }}
                      disabled={uploadingImages}
                    />
                    {editingProduct.images && editingProduct.images.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                        {editingProduct.images.map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={image}
                              alt={`Product ${index + 1}`}
                              className="w-full h-20 object-cover rounded"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute -top-2 -right-2 h-6 w-6 p-0"
                              onClick={() => {
                                setEditingProduct({
                                  ...editingProduct,
                                  images: editingProduct.images.filter((_, i) => i !== index)
                                });
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Location Inventory */}
                  {locations.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-lg font-semibold">📍 Inventory by Location</Label>
                        <Select onValueChange={addLocationToEditingProduct}>
                          <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="Add Location" />
                          </SelectTrigger>
                          <SelectContent>
                            {locations
                              .filter(loc => !editingProduct.inventory?.some(inv => inv.location === loc.name))
                              .map(location => (
                                <SelectItem key={location.storeId} value={location.storeId}>
                                  {location.displayName}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {(!editingProduct.inventory || editingProduct.inventory.length === 0) ? (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                          <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600">No locations configured</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {editingProduct.inventory.map((locationInventory) => {
                            const locationObj = locations.find(loc => loc.name === locationInventory.location);
                            // Use original stock quantities for display, not the current modified values
                            const originalLocationInventory = editingProduct._originalData?.inventory?.find(
                              orig => orig.location === locationInventory.location
                            );
                            const totalStock = originalLocationInventory?.stock?.reduce((sum, stockItem) => sum + (stockItem.quantity || 0), 0) || 0;

                            return (
                              <div key={locationInventory.location} className="border rounded-lg p-4 bg-gray-50">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold capitalize">
                                      {locationObj?.displayName || locationInventory.location}
                                      <span className="ml-2 text-sm font-normal text-gray-600">
                                        (Current: {totalStock} units)
                                      </span>
                                    </span>
                                    <MapPin className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <div className={`text-sm font-medium px-2 py-1 rounded-full ${
                                      totalStock === 0
                                        ? 'bg-red-100 text-red-800'
                                        : totalStock <= 5
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-green-100 text-green-800'
                                    }`}>
                                      {totalStock === 0 ? '🚫 Out of Stock' : `📦 ${totalStock} units`}
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeLocationFromEditingProduct(locationInventory.location)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {editingProduct.variants && editingProduct.variants.length > 0 ? (
                                    editingProduct.variants.map((variant, variantIndex) => {
                                      const stock = locationInventory.stock?.find(s => s.variantIndex === variantIndex);
                                      const variantStock = stock?.quantity || 0;

                                      return (
                                        <div key={variantIndex} className="bg-white border rounded-lg p-3">
                                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                            {variant.value} Stock
                                          </Label>
                                          <div className="flex items-center gap-2">
                                            <Input
                                              type="number"
                                              value={variantStock}
                                              onChange={(e) => {
                                                const quantity = Math.max(0, Number(e.target.value));
                                                handleUpdateStock(editingProduct._id, locationInventory.location, variantIndex, quantity);
                                              }}
                                              className={`text-center font-semibold ${
                                                variantStock === 0
                                                  ? 'border-red-300 bg-red-50'
                                                  : 'border-green-300 bg-green-50'
                                              }`}
                                              min="0"
                                              disabled={updatingStocks.has(`${editingProduct._id}-${locationInventory.location}-${variantIndex}`)}
                                            />
                                            {updatingStocks.has(`${editingProduct._id}-${locationInventory.location}-${variantIndex}`) ? (
                                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                            ) : (
                                              <span className={`text-sm ${variantStock === 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                {variantStock === 0 ? '❌' : '✅'}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })
                                  ) : (
                                    <div className="bg-white border rounded-lg p-3 col-span-full sm:col-span-1">
                                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Stock Quantity
                                      </Label>
                                      <div className="flex items-center gap-2">
                                        <Input
                                          type="number"
                                          value={locationInventory.stock?.[0]?.quantity || 0}
                                          onChange={(e) => {
                                            const quantity = Math.max(0, Number(e.target.value));
                                            handleUpdateStock(editingProduct._id, locationInventory.location, 0, quantity);
                                          }}
                                          className={`text-center font-semibold ${
                                            (locationInventory.stock?.[0]?.quantity || 0) === 0
                                              ? 'border-red-300 bg-red-50'
                                              : 'border-green-300 bg-green-50'
                                          }`}
                                          min="0"
                                          disabled={updatingStocks.has(`${editingProduct._id}-${locationInventory.location}-0`)}
                                        />
                                        {updatingStocks.has(`${editingProduct._id}-${locationInventory.location}-0`) ? (
                                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                        ) : (
                                          <span className={`text-sm ${
                                            (locationInventory.stock?.[0]?.quantity || 0) === 0 ? 'text-red-600' : 'text-green-600'
                                          }`}>
                                            {(locationInventory.stock?.[0]?.quantity || 0) === 0 ? '❌' : '✅'}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="mt-3 pt-3 border-t">
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium">Total Stock:</span>
                                    <span className="font-bold">{totalStock} units</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Save Actions */}
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setEditingProduct(null)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveProduct}
                      disabled={savingProduct}
                    >
                      {savingProduct ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </section>
    </Layout>
  );
};

export default AdminInventory;