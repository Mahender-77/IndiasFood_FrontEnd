/*
 * AdminInventory Component - Enhanced Dashboard UI
 * UI redesigned to match the Inventory & Revenue Dashboard mockup
 * All existing functionalities, links, and logic preserved
 */

import { Layout } from '@/components/layout/Layout';
import { SEO } from '@/components/seo/SEO';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
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
  X,
  Gift,
  Package,
  AlertTriangle,
  Clock,
  TrendingUp,
  Download,
  BarChart2,
  ChevronRight,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// Import modular components
import { InventoryTable } from '@/components/admin/inventory-table/InventoryTable';
import { BatchInventoryManager, LocationBatchEntry, BatchEntry } from '@/components/admin/inventory-table/BatchInventoryManager';
import { VariantBuilder } from '@/components/admin/inventory-table/VariantBuilder';
import { Link } from 'react-router-dom';


interface Location {
  storeId: string;
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
const LOW_STOCK_THRESHOLD = 10;

interface EditingProduct extends Product {
  _originalData?: Product;
}

const AdminInventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<EditingProduct | null>(null);
  const [createStep, setCreateStep] = useState<'basic' | 'add-batch'>('basic');
  const [showBatchSection, setShowBatchSection] = useState(false);
  const [createFlowHasVariants, setCreateFlowHasVariants] = useState(false);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const [selectedVariantForBatch, setSelectedVariantForBatch] = useState(0);
  const [batchStepStoreId, setBatchStepStoreId] = useState<string>('');
  const [batchStepStoreIds, setBatchStepStoreIds] = useState<string[]>([]);
  const [batchStepOriginalPrice, setBatchStepOriginalPrice] = useState<number>(0);
  const [batchStepOfferPrice, setBatchStepOfferPrice] = useState<number | undefined>(undefined);
  const [isManageLocationsOpen, setIsManageLocationsOpen] = useState(false);

  const [newProduct, setNewProduct] = useState<Partial<Product & {
    imageFiles?: File[];
    inventoryData?: InventoryEntry[];
    batchInventoryData?: LocationBatchEntry[];
    variantStocks?: VariantStockEntry[][];
  }>>({
    name: '', description: '', originLocation: '', originalPrice: undefined, offerPrice: undefined,
    videoUrl: '', variants: [], inventory: [], isGITagged: false, isMostSaled: false,
    images: [], imageFiles: [], isActive: true, inventoryData: [], batchInventoryData: [], variantStocks: [],
    dealTriggerDays: undefined, dealDiscountPercent: undefined
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [newLocation, setNewLocation] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [updatingStocks, setUpdatingStocks] = useState<Set<string>>(new Set());
  const [addBatchForm, setAddBatchForm] = useState<{ location: string; variantIndex: number } | null>(null);
  const [editAddBatchVariant, setEditAddBatchVariant] = useState(0);
  const [editModalProductType, setEditModalProductType] = useState<'with-variants' | 'without-variants' | null>(null);
  const [addBatchData, setAddBatchData] = useState({
    quantity: 0,
    manufacturingDate: new Date().toISOString().slice(0, 10),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    purchasePrice: 0, sellingPrice: 0,
    batchWholePrice: undefined as number | undefined,
    dealTriggerDays: undefined as number | undefined,
    dealDiscountPercent: undefined as number | undefined,
    newArrivalUntil: '' as string
  });

  const [addingBatches, setAddingBatches] = useState(false);
  const [showLowStockModal, setShowLowStockModal] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchLocations();
  }, []);

  const stores = useMemo(() => {
    const map = new Map<string, { _id: string; name: string }>();
    locations.forEach(loc => { if (!map.has(loc.storeId)) map.set(loc.storeId, { _id: loc.storeId, name: loc.displayName || loc.name }); });
    return Array.from(map.values());
  }, [locations]);

  const filteredProducts = useMemo(() => {
    return (products || []).filter((product) => {
      if (!product) return false;
      const name = product?.name?.toLowerCase() || "";
      const description = product?.description?.toLowerCase() || "";
      const search = searchTerm.toLowerCase().trim();
      const matchesNameOrDesc = !search || name.includes(search) || description.includes(search);
      const matchesBatchId = product.inventory?.some((inv) =>
        inv.batches?.some((b) => String(b.batchNumber ?? '').toLowerCase().includes(search))
      );
      if (!matchesNameOrDesc && !matchesBatchId) return false;
      if (selectedLocationFilter !== "all") {
        const hasLocation = product.inventory?.some((inv) => inv?.location?.toLowerCase() === selectedLocationFilter.toLowerCase());
        if (!hasLocation) return false;
      }
      if (selectedCategoryFilter !== "all") {
        const categoryId = (product.category as any)?._id || product.category;
        if (categoryId !== selectedCategoryFilter) return false;
      }
      if (selectedStatusFilter !== "all") {
        if (selectedStatusFilter === "active" && !product.isActive) return false;
        if (selectedStatusFilter === "inactive" && product.isActive) return false;
      }
      return true;
    });
  }, [products, searchTerm, selectedLocationFilter, selectedCategoryFilter, selectedStatusFilter]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedLocationFilter, selectedCategoryFilter, selectedStatusFilter]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const goToPage = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  const goToPreviousPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };
  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };

  // Computed stats
  const lowStockItems = useMemo(() => {
    const result: Array<{
      productId: string;
      productName: string;
      variant: string;
      batchNumber: string;
      quantity: number;
      location: string;
    }> = [];

    products.forEach(product => {
      product.inventory?.forEach(inv => {
        if (inv.batches?.length) {
          inv.batches.forEach(batch => {
            if (batch.quantity > 0 && batch.quantity <= LOW_STOCK_THRESHOLD) {
              const variant = product.variants?.[batch.variantIndex];

              result.push({
                productId: product._id,
                productName: product.name,
                variant: variant?.value || 'Default',
                batchNumber: batch.batchNumber,
                quantity: batch.quantity,
                location: inv.location,
              });
            }
          });
        }
      });
    });

    return result;
  }, [products]);

  const lowStockCount = lowStockItems.length;

  const expiringCount = useMemo(() => {
    const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return products.filter(p =>
      p.inventory?.some(inv => inv.batches?.some(b => {
        const exp = new Date(b.expiryDate);
        return exp > new Date() && exp <= sevenDaysLater;
      }))
    ).length;
  }, [products]);

  const expiringBatches = useMemo(() => {
    const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const result: { productName: string; variantValue?: string; batchNumber: string; daysLeft: number }[] = [];
    products.forEach(p => {
      p.inventory?.forEach(inv => {
        inv.batches?.forEach(b => {
          const exp = new Date(b.expiryDate);
          const now = new Date();
          const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysLeft >= 0 && exp <= sevenDaysLater) {
            const variant = p.variants?.[b.variantIndex];
            result.push({ productName: p.name, variantValue: variant?.value, batchNumber: b.batchNumber, daysLeft });
          }
        });
      });
    });
    return result.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 5);
  }, [products]);

  const onToggleMostSaled = useCallback(async (productId: string, isMostSaled: boolean) => {
    try {
      const token = localStorage.getItem('userToken');
      await api.put(`/admin/inventory/${productId}/most-saled`, { value: isMostSaled }, { headers: { Authorization: `Bearer ${token}` } });
      setProducts(prevProducts => prevProducts.map(product => product._id === productId ? { ...product, isMostSaled } : product));
      toast.success(`Product marked as ${isMostSaled ? 'Most Sold' : 'Not Most Sold'}`);
    } catch (error: any) { toast.error('Failed to update most saled status.'); }
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      const response = await api.get('/admin/inventory', { headers: { Authorization: `Bearer ${token}` } });
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      setProducts([]);
      if (error.response?.status === 401) toast.error('Please login as admin');
      else if (error.response?.status === 403) toast.error('Admin access required');
      else toast.error('Failed to load products');
    } finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/products/categories');
      setCategories(response.data);
    } catch (error) { toast.error('Failed to load categories'); }
  };

  const fetchLocations = async () => {
    const res = await api.get('/admin/delivery-locations');
    setLocations(res.data.map((loc: any) => ({ storeId: loc.storeId, name: loc.name, displayName: loc.displayName || loc.name })));
  };

  const handleImageUpload = async (files: FileList) => {
    if (!files || files.length === 0) return [];
    setUploadingImages(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => formData.append('images', file));
      const response = await api.post('/upload/images', formData);
      return response.data.urls || [];
    } catch (error: any) { toast.error('Failed to upload images'); return []; } finally { setUploadingImages(false); }
  };

  const uploadImagesOptimized = async (files: File[]) => {
    if (!files || files.length === 0) return [];
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('images', file));
      const response = await api.post('/upload/images', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      return response.data.urls || [];
    } catch (error: any) { return []; }
  };

  const handleCreateProduct = async () => {
    if (creatingProduct) return;
    if (!newProduct.name?.trim()) { toast.error('Product name is required'); return; }
    if (!selectedCategory) { toast.error('Please select a category'); return; }
    setCreatingProduct(true);
    try {
      const productData = {
        name: newProduct.name.trim(), description: newProduct.description?.trim() || '',
        originLocation: newProduct.originLocation?.trim() || undefined, category: selectedCategory,
        subcategory: selectedSubcategory && selectedSubcategory !== 'none' ? selectedSubcategory : undefined,
        videoUrl: newProduct.videoUrl?.trim() || '', images: [],
        isGITagged: newProduct.isGITagged || false,
        isMostSaled: newProduct.isMostSaled || false, isActive: true
      };
      const response = await api.post('/admin/inventory/create-product', productData);
      const createdProduct = response.data?.product ?? response.data;
      setProducts(prev => [createdProduct, ...(prev || [])]);
      if (newProduct.imageFiles?.length) {
        const uploadedImages = await uploadImagesOptimized(newProduct.imageFiles);
        if (uploadedImages.length > 0) {
          const updateRes = await api.put(`/admin/inventory/products/${createdProduct._id}`, { images: uploadedImages });
          const updatedProduct = updateRes.data;
          setProducts(prev => prev.map(p => (p._id === updatedProduct._id ? updatedProduct : p)));
        }
      }
      toast.success('Product created. Click "Add Batch" to add inventory.');
      setCreatedProductId(createdProduct._id);
      setCreateStep('add-batch');
    } catch (error: any) { toast.error(error.response?.data?.message || 'Failed to create product'); } finally { setCreatingProduct(false); }
  };

  const handleAddBatches = async () => {
    if (!createdProductId || addingBatches) return;
    const hasVariants = createFlowHasVariants && newProduct.variants && newProduct.variants.length > 0;
    if (hasVariants) {
      const invalidVariants = newProduct.variants?.filter(v => !v.value?.trim() || v.originalPrice <= 0) ?? [];
      if (invalidVariants.length > 0) { toast.error('Complete all variant details'); return; }
    } else {
      if (!batchStepOriginalPrice || batchStepOriginalPrice <= 0) { toast.error('Enter valid original price'); return; }
    }
    if (!createFlowHasVariants && (!batchStepStoreIds.length || !batchStepStoreIds[0])) { toast.error('Select at least one store'); return; }
    const batchesToSend: any[] = [];
    (newProduct.batchInventoryData || []).forEach(inv => {
      (inv.batches || []).filter(b => b && (b.quantity ?? 0) > 0).forEach(b => {
        const purchasePrice = !hasVariants ? (b.batchWholePrice != null && b.batchWholePrice >= 0 ? b.batchWholePrice : (b.purchasePrice != null && b.purchasePrice > 0 ? b.purchasePrice : batchStepOriginalPrice)) : (b.purchasePrice ?? 0);
        const sellingPrice = !hasVariants && (b.sellingPrice == null || b.sellingPrice === 0) ? (batchStepOfferPrice ?? batchStepOriginalPrice) : (b.sellingPrice ?? 0);
        const locationName = String(inv.locationName ?? '').trim().toLowerCase();
        if (!locationName) return;
        batchesToSend.push({
          location: locationName, batchNumber: b.batchNumber,
          manufacturingDate: typeof b.manufacturingDate === 'string' ? b.manufacturingDate.slice(0, 10) : new Date(b.manufacturingDate).toISOString().slice(0, 10),
          expiryDate: typeof b.expiryDate === 'string' ? b.expiryDate.slice(0, 10) : new Date(b.expiryDate).toISOString().slice(0, 10),
          purchasePrice, sellingPrice, variantIndex: b.variantIndex ?? 0, quantity: b.quantity,
          batchWholePrice: b.batchWholePrice != null && b.batchWholePrice >= 0 ? Number(b.batchWholePrice) : undefined,
          dealTriggerDays: b.dealTriggerDays != null ? Number(b.dealTriggerDays) : undefined,
          dealDiscountPercent: b.dealDiscountPercent != null ? Number(b.dealDiscountPercent) : undefined,
          ...(b.newArrivalUntil
            ? { newArrivalUntil: typeof b.newArrivalUntil === 'string' ? b.newArrivalUntil.slice(0, 10) : new Date(b.newArrivalUntil).toISOString().slice(0, 10) }
            : {})
        });
      });
    });
    if (batchesToSend.length === 0) { toast.error('Add at least one batch with quantity > 0'); return; }
    const storeForPayload = (batchStepStoreIds[0] ?? batchStepStoreId) || (createFlowHasVariants ? newProduct.batchInventoryData?.[0]?.storeId : undefined);
    if (!storeForPayload) { toast.error(createFlowHasVariants ? 'Add at least one location and batch below' : 'Select a store'); return; }
    setAddingBatches(true);
    try {
      const payload: any = { store: storeForPayload, batches: batchesToSend };
      if (!hasVariants) { payload.originalPrice = batchStepOriginalPrice; payload.offerPrice = batchStepOfferPrice ?? undefined; }
      if (hasVariants && newProduct.variants?.length) { payload.addVariants = newProduct.variants.map(v => ({ type: v.type, value: v.value, originalPrice: v.originalPrice, offerPrice: v.offerPrice })); }
      const res = await api.put(`/admin/inventory/${createdProductId}/batches`, payload);
      const updatedProduct = res.data?.product ?? res.data;
      setProducts(prev => prev.map(p => (p._id === createdProductId ? updatedProduct : p)));
      toast.success('Batches added successfully');
      closeCreateModalAndReset();
    } catch (error: any) { toast.error(error.response?.data?.message || 'Failed to add batches'); } finally { setAddingBatches(false); }
  };

  const closeCreateModalAndReset = () => {
    setIsCreateDialogOpen(false); resetNewProductForm(); setCreateStep('basic'); setShowBatchSection(false);
    setCreatedProductId(null); setCreateFlowHasVariants(false); setSelectedVariantForBatch(0);
    setBatchStepStoreId(''); setBatchStepStoreIds([]); setBatchStepOriginalPrice(0); setBatchStepOfferPrice(undefined);
  };

  const resetNewProductForm = () => {
    setNewProduct({ name: '', description: '', originalPrice: undefined, originLocation: '', offerPrice: undefined, videoUrl: '', variants: [], inventory: [], isGITagged: false, isMostSaled: false, images: [], imageFiles: [], isActive: true, inventoryData: [], batchInventoryData: [], variantStocks: [], dealTriggerDays: undefined, dealDiscountPercent: undefined });
    setSelectedCategory(''); setSelectedSubcategory(''); setSelectedStoreId('');
  };

  const handleEditProduct = (product: Product) => {
    const originalProduct = JSON.parse(JSON.stringify(product));
    setEditingProduct({ ...product, _originalData: originalProduct });
    setAddBatchForm(null);
    const hasAnyInventory = product.inventory && product.inventory.length > 0 && product.inventory.some(inv => (inv.batches && inv.batches.length > 0) || (inv.stock && inv.stock.length > 0));
    if (!hasAnyInventory) setEditModalProductType(product.variants && product.variants.length > 0 ? 'with-variants' : 'without-variants');
    else setEditModalProductType(null);
  };

  const handleCategoryChange = (categoryId: string) => { setSelectedCategory(categoryId); setSelectedSubcategory(''); };

  const handleSaveProduct = async () => {
    if (!editingProduct || savingProduct) return;
    if (!editingProduct.name?.trim()) { toast.error('Product name is required'); return; }
    if (editingProduct.variants && editingProduct.variants.length > 0) {
      const invalidVariants = editingProduct.variants.filter(variant => !variant.value?.trim() || variant.originalPrice <= 0);
      if (invalidVariants.length > 0) { toast.error(`Please complete all variant details. ${invalidVariants.length} variant(s) incomplete.`); return; }
    } else {
      if (editingProduct.originalPrice === undefined || editingProduct.originalPrice < 0) { toast.error('Original price is required'); return; }
      if (editingProduct.offerPrice !== undefined && editingProduct.offerPrice < 0) { toast.error('Offer price must be 0 or greater'); return; }
      if (editingProduct.offerPrice !== undefined && editingProduct.offerPrice >= editingProduct.originalPrice) { toast.error('Offer price must be less than original price'); return; }
    }
    setSavingProduct(true);
    try {
      const hasVariants = editingProduct.variants && editingProduct.variants.length > 0;
      const updateData: Record<string, unknown> = {
        name: editingProduct.name.trim(), description: editingProduct.description?.trim() || '', videoUrl: editingProduct.videoUrl?.trim() || '',
        variants: editingProduct.variants || [], inventory: editingProduct.inventory || [], subcategory: editingProduct.subcategory || undefined,
        isGITagged: editingProduct.isGITagged || false, isActive: editingProduct.isActive ?? true,
        images: editingProduct.images || [],
        dealTriggerDays: editingProduct.dealTriggerDays != null ? Number(editingProduct.dealTriggerDays) : undefined,
        dealDiscountPercent: editingProduct.dealDiscountPercent != null ? Number(editingProduct.dealDiscountPercent) : undefined
      };
      if (!hasVariants) { updateData.originalPrice = editingProduct.originalPrice; updateData.offerPrice = editingProduct.offerPrice; }
      const response = await api.put(`/admin/inventory/products/${editingProduct._id}`, updateData);
      if (response.status === 200) { toast.success('Product updated successfully'); setEditingProduct(null); setEditModalProductType(null); await fetchProducts(); }
    } catch (error: any) {
      if (error.response?.status === 404) toast.error('Product not found');
      else if (error.response?.status === 403) toast.error('You do not have permission to update this product');
      else if (error.response?.status === 400) toast.error(error.response?.data?.message || 'Invalid product data');
      else toast.error('Failed to update product. Please try again.');
    } finally { setSavingProduct(false); }
  };

  const persistEditingProduct = async (): Promise<void> => {
    if (!editingProduct) return;
    if (editingProduct.variants && editingProduct.variants.length > 0) {
      const invalid = editingProduct.variants.filter(v => !v.value?.trim() || v.originalPrice <= 0);
      if (invalid.length > 0) { toast.error('Complete all variant details (value and price) before adding a batch.'); throw new Error('Validation failed'); }
    }
    const hasVariants = editingProduct.variants && editingProduct.variants.length > 0;
    const updateData: Record<string, unknown> = {
      name: editingProduct.name.trim(), description: editingProduct.description?.trim() || '', videoUrl: editingProduct.videoUrl?.trim() || '',
      variants: editingProduct.variants || [], inventory: editingProduct.inventory || [], subcategory: editingProduct.subcategory || undefined,
      isGITagged: editingProduct.isGITagged || false, isActive: editingProduct.isActive ?? true,
      images: editingProduct.images || [],
      dealTriggerDays: editingProduct.dealTriggerDays != null ? Number(editingProduct.dealTriggerDays) : undefined,
      dealDiscountPercent: editingProduct.dealDiscountPercent != null ? Number(editingProduct.dealDiscountPercent) : undefined
    };
    if (!hasVariants) { updateData.originalPrice = editingProduct.originalPrice; updateData.offerPrice = editingProduct.offerPrice; }
    await api.put(`/admin/inventory/products/${editingProduct._id}`, updateData);
  };

  const handleAddBatch = async (productId: string, location: string, variantIndex: number, batch: { quantity: number; manufacturingDate: string; expiryDate: string; purchasePrice: number; sellingPrice: number; batchWholePrice?: number; dealTriggerDays?: number; dealDiscountPercent?: number; newArrivalUntil?: string; }) => {
    const stockKey = `add-batch-${productId}-${location}-${variantIndex}`;
    if (updatingStocks.has(stockKey)) return;
    setUpdatingStocks(prev => new Set(prev).add(stockKey));
    try {
      const token = localStorage.getItem('userToken');
      if (editingProduct && editingProduct._id === productId) await persistEditingProduct();
      const response = await api.put(`/admin/inventory/${productId}/stock`, {
        location: location.trim().toLowerCase(), variantIndex, quantity: batch.quantity,
        manufacturingDate: batch.manufacturingDate, expiryDate: batch.expiryDate,
        purchasePrice: batch.purchasePrice, sellingPrice: batch.sellingPrice, batchNumber: `BATCH-${Date.now()}`,
        ...(batch.batchWholePrice != null && batch.batchWholePrice >= 0 && { batchWholePrice: batch.batchWholePrice }),
        ...(batch.dealTriggerDays != null && batch.dealTriggerDays >= 0 && { dealTriggerDays: batch.dealTriggerDays }),
        ...(batch.dealDiscountPercent != null && batch.dealDiscountPercent >= 0 && { dealDiscountPercent: batch.dealDiscountPercent }),
        ...(batch.newArrivalUntil ? { newArrivalUntil: batch.newArrivalUntil } : {})
      }, { headers: { Authorization: `Bearer ${token}` } });
      if (response.status !== 200) throw new Error('Failed to save batch');
      toast.success('New batch added');
      const res = await api.get('/admin/inventory', { headers: { Authorization: `Bearer ${token}` } });
      const list = Array.isArray(res.data) ? res.data : [];
      setProducts(list);
      if (editingProduct && editingProduct._id === productId) {
        const updated = list.find((p: Product) => p._id === productId);
        if (updated) setEditingProduct({ ...updated, _originalData: editingProduct._originalData });
      }
      setAddBatchForm(null);
    } catch (error: any) { toast.error(error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to add batch'); }
    finally { setUpdatingStocks(prev => { const s = new Set(prev); s.delete(stockKey); return s; }); }
  };

  const handleUpdateStock = async (productId: string, location: string, variantIndex: number, quantity: number) => {
    const stockKey = `${productId}-${location}-${variantIndex}`;
    if (updatingStocks.has(stockKey)) return;
    setUpdatingStocks(prev => new Set(prev).add(stockKey));
    try {
      await api.put(`/admin/inventory/${productId}/stock`, { location, variantIndex, quantity });
      setProducts(prevProducts => prevProducts.map(product => {
        if (product._id !== productId) return product;
        const updatedProduct = JSON.parse(JSON.stringify(product));
        if (!updatedProduct.inventory) updatedProduct.inventory = [];
        const locIdx = updatedProduct.inventory.findIndex((inv: any) => inv.location === location);
        const now = new Date();
        const batchOrStock = { batchNumber: `BATCH-${Date.now()}`, quantity, manufacturingDate: now, expiryDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), purchasePrice: product.originalPrice ?? 0, sellingPrice: product.offerPrice ?? product.originalPrice ?? 0, variantIndex };
        if (locIdx >= 0) {
          const loc = updatedProduct.inventory[locIdx];
          if (loc.batches) { loc.batches = loc.batches.filter((b: any) => b.variantIndex !== variantIndex); loc.batches.push(batchOrStock); }
          else { if (!loc.stock) loc.stock = []; const si = loc.stock.findIndex((s: any) => s.variantIndex === variantIndex); if (si >= 0) loc.stock[si].quantity = quantity; else loc.stock.push({ variantIndex, quantity, lowStockThreshold: 5 }); }
        } else { updatedProduct.inventory.push({ location, batches: [batchOrStock] }); }
        return updatedProduct;
      }));
    } catch (error: any) {
      if (error.response?.status === 400) toast.error(`Failed to update stock: ${error.response?.data?.message || 'Invalid data'}`);
      else if (error.response?.status === 404) toast.error('Product not found');
      else toast.error('Failed to update stock. Please try again.');
    } finally { setUpdatingStocks(prev => { const newSet = new Set(prev); newSet.delete(stockKey); return newSet; }); }
  };

  const getLocationStock = (product: Product, locationName: string) => {
    const locationInventory = product.inventory?.find(inv => inv.location?.toLowerCase() === locationName?.toLowerCase());
    if (!locationInventory) return null;
    if (locationInventory.batches?.length) return locationInventory.batches.reduce((sum, b) => sum + (b.quantity || 0), 0);
    return locationInventory.stock?.reduce((sum, s) => sum + (s.quantity || 0), 0) || 0;
  };

  const addLocationToBatchInventory = (storeId: string) => {
    const locationObj = locations.find(l => l.storeId === storeId);
    if (!locationObj) return;
    if (!selectedStoreId) setSelectedStoreId(storeId);
    if (newProduct.batchInventoryData?.some(inv => inv.storeId === storeId)) { toast.error(`Location "${locationObj.displayName}" is already added`); return; }
    const newEntry: LocationBatchEntry = { storeId, locationName: locationObj.name, displayName: locationObj.displayName, batches: [] };
    setNewProduct(prev => ({ ...prev, batchInventoryData: [...(prev.batchInventoryData || []), newEntry] }));
    toast.success(`Added location "${locationObj.displayName}"`);
  };

  const removeLocationFromBatchInventory = (storeId: string) => {
    const locationObj = locations.find(loc => loc.storeId === storeId);
    setNewProduct(prev => ({ ...prev, batchInventoryData: prev.batchInventoryData?.filter(inv => inv.storeId !== storeId) || [] }));
    toast.success(`Removed location "${locationObj?.displayName}"`);
  };

  useEffect(() => {
    const selectedStoreIds = batchStepStoreIds.length ? batchStepStoreIds : (batchStepStoreId ? [batchStepStoreId] : []);
    if (createStep !== 'add-batch' || createFlowHasVariants || selectedStoreIds.length === 0 || (newProduct.batchInventoryData?.length ?? 0) > 0 || locations.length === 0) return;
    const firstStoreId = selectedStoreIds[0];
    const storeLocations = locations.filter(l => String(l.storeId) === String(firstStoreId));
    if (storeLocations.length === 0) return;
    const first = storeLocations[0];
    setNewProduct(prev => ({ ...prev, batchInventoryData: [{ storeId: first.storeId, locationName: first.name, displayName: first.displayName, batches: [] }] }));
  }, [createStep, createFlowHasVariants, batchStepStoreId, batchStepStoreIds, locations, newProduct.batchInventoryData?.length]);

  const addBatchToLocation = (storeId: string, batch: BatchEntry) => {
    setNewProduct(prev => { const data = prev.batchInventoryData || []; return { ...prev, batchInventoryData: data.map(inv => inv.storeId === storeId ? { ...inv, batches: [...inv.batches, batch] } : inv) }; });
  };

  const updateBatchAtLocation = (storeId: string, batchTempId: string, updates: Partial<BatchEntry>) => {
    setNewProduct(prev => { const data = prev.batchInventoryData || []; return { ...prev, batchInventoryData: data.map(inv => inv.storeId === storeId ? { ...inv, batches: inv.batches.map(b => (b._tempId === batchTempId || b.batchNumber === batchTempId) ? { ...b, ...updates } : b) } : inv) }; });
  };

  const removeBatchFromLocation = (storeId: string, batchTempId: string) => {
    setNewProduct(prev => ({ ...prev, batchInventoryData: prev.batchInventoryData?.map(inv => inv.storeId === storeId ? { ...inv, batches: inv.batches.filter(b => b._tempId !== batchTempId && b.batchNumber !== batchTempId) } : inv) || [] }));
  };

  const addLocationToInventory = (storeId: string) => {
    const locationObj = locations.find(l => l.storeId === storeId);
    if (!locationObj) return;
    if (!selectedStoreId) setSelectedStoreId(storeId);
    if (newProduct.inventoryData?.some(inv => inv.storeId === storeId)) { toast.error(`Location "${locationObj.displayName}" is already added`); return; }
    const newInventoryEntry: InventoryEntry = { storeId, locationName: locationObj.name, displayName: locationObj.displayName, stock: newProduct.variants && newProduct.variants.length > 0 ? newProduct.variants.map((_, index) => ({ variantIndex: index, quantity: 0 })) : [{ variantIndex: 0, quantity: 0 }] };
    setNewProduct(prev => ({ ...prev, inventoryData: [...(prev.inventoryData || []), newInventoryEntry] }));
    toast.success(`Added location "${locationObj.displayName}"`);
  };

  const removeLocationFromInventory = (storeId: string) => {
    const locationObj = locations.find(loc => loc.storeId === storeId);
    setNewProduct(prev => ({ ...prev, inventoryData: prev.inventoryData?.filter(inv => inv.storeId !== storeId) || [] }));
    toast.success(`Removed location "${locationObj?.displayName}"`);
  };

  const updateCreationStock = (storeId: string, variantIndex: number, quantity: number) => {
    setNewProduct(prev => ({ ...prev, inventoryData: prev.inventoryData?.map(inv => inv.storeId === storeId ? { ...inv, stock: inv.stock.map(stock => stock.variantIndex === variantIndex ? { ...stock, quantity: Math.max(0, quantity) } : stock) } : inv) || [] }));
  };

  const addVariant = (isNewProduct: boolean = false) => {
    const newVariant: ProductVariant = { type: 'weight', value: '', originalPrice: 0, offerPrice: undefined, isActive: true };
    if (isNewProduct) {
      setNewProduct(prev => {
        const currentVariants = prev.variants || [];
        const newVariantIndex = currentVariants.length;
        const updatedInventoryData = (prev.inventoryData || []).map(inventoryEntry => ({ ...inventoryEntry, stock: [...inventoryEntry.stock, { variantIndex: newVariantIndex, quantity: 0 }] }));
        return { ...prev, variants: [...currentVariants, newVariant], inventoryData: updatedInventoryData };
      });
    } else if (editingProduct) {
      setEditingProduct(prev => {
        if (!prev) return prev;
        const currentVariants = prev.variants || [];
        const newVariantIndex = currentVariants.length;
        const updatedInventory = (prev.inventory || []).map(locationInventory => ({ ...locationInventory, stock: [...locationInventory.stock, { variantIndex: newVariantIndex, quantity: 0, lowStockThreshold: 5 }] }));
        return { ...prev, variants: [...currentVariants, newVariant], inventory: updatedInventory };
      });
    }
  };

  const removeVariant = (index: number, isNewProduct: boolean = false) => {
    if (isNewProduct) {
      setNewProduct(prev => {
        if (!prev.variants || index < 0 || index >= prev.variants.length) return prev;
        const updatedInventoryData = (prev.inventoryData || []).map(inventoryEntry => ({ ...inventoryEntry, stock: inventoryEntry.stock.filter(stockItem => stockItem.variantIndex !== index).map(stockItem => ({ ...stockItem, variantIndex: stockItem.variantIndex > index ? stockItem.variantIndex - 1 : stockItem.variantIndex })) }));
        return { ...prev, variants: prev.variants.filter((_, i) => i !== index), inventoryData: updatedInventoryData };
      });
    } else if (editingProduct) {
      setEditingProduct(prev => {
        if (!prev || !prev.variants || index < 0 || index >= prev.variants.length) return prev;
        const updatedInventory = (prev.inventory || []).map(locationInventory => ({ ...locationInventory, stock: locationInventory.stock.filter(stockItem => stockItem.variantIndex !== index).map(stockItem => ({ ...stockItem, variantIndex: stockItem.variantIndex > index ? stockItem.variantIndex - 1 : stockItem.variantIndex })) }));
        return { ...prev, variants: prev.variants.filter((_, i) => i !== index), inventory: updatedInventory };
      });
    }
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: any, isNewProduct: boolean = false) => {
    if (isNewProduct) {
      setNewProduct(prev => { if (!prev.variants || index >= prev.variants.length) return prev; const updatedVariants = [...prev.variants]; updatedVariants[index] = { ...updatedVariants[index], [field]: value }; return { ...prev, variants: updatedVariants }; });
    } else if (editingProduct) {
      setEditingProduct(prev => { if (!prev || !prev.variants || index >= prev.variants.length) return prev; const updatedVariants = [...prev.variants]; updatedVariants[index] = { ...updatedVariants[index], [field]: value }; return { ...prev, variants: updatedVariants }; });
    }
  };

  const addLocationToVariant = (variantIndex: number, storeId: string) => {
    const locationObj = locations.find(loc => loc.storeId === storeId);
    if (!locationObj) return;
    setNewProduct(prev => {
      const variantStocks = prev.variantStocks || [];
      const currentStocks = variantStocks[variantIndex] || [];
      if (currentStocks.some(stock => stock.storeId === storeId)) { toast.error(`Location "${locationObj.displayName}" is already added to this variant`); return prev; }
      const updatedVariantStocks = [...variantStocks]; updatedVariantStocks[variantIndex] = [...currentStocks, { storeId, quantity: 0 }];
      return { ...prev, variantStocks: updatedVariantStocks };
    });
    toast.success(`Added location "${locationObj.displayName}" to variant`);
  };

  const removeLocationFromVariant = (variantIndex: number, storeId: string) => {
    const locationObj = locations.find(loc => loc.storeId === storeId);
    setNewProduct(prev => { const variantStocks = prev.variantStocks || []; const updatedVariantStocks = [...variantStocks]; updatedVariantStocks[variantIndex] = updatedVariantStocks[variantIndex]?.filter(stock => stock.storeId !== storeId) || []; return { ...prev, variantStocks: updatedVariantStocks }; });
    toast.success(`Removed location "${locationObj?.displayName}" from variant`);
  };

  const updateVariantStock = (variantIndex: number, locationId: string, quantity: number) => {
    setNewProduct(prev => {
      const variantStocks = prev.variantStocks || []; const updatedVariantStocks = [...variantStocks]; const variantStock = updatedVariantStocks[variantIndex] || [];
      const stockIndex = variantStock.findIndex(stock => stock.storeId === locationId);
      if (stockIndex >= 0) updatedVariantStocks[variantIndex] = variantStock.map((stock, index) => index === stockIndex ? { ...stock, quantity: Math.max(0, quantity) } : stock);
      return { ...prev, variantStocks: updatedVariantStocks };
    });
  };

  const addLocationToEditingProduct = (storeId: string) => {
    if (!editingProduct) return;
    const locationObj = locations.find(loc => loc.storeId === storeId);
    if (!locationObj) return;
    const existingLocation = editingProduct.inventory?.find(inv => inv.location === locationObj.name);
    if (existingLocation) { toast.error(`Location "${locationObj.displayName}" is already added`); return; }
    const newInventoryEntry = { location: locationObj.name, stock: editingProduct.variants && editingProduct.variants.length > 0 ? editingProduct.variants.map((_, index) => ({ variantIndex: index, quantity: 0, lowStockThreshold: 5 })) : [{ variantIndex: 0, quantity: 0, lowStockThreshold: 5 }] };
    setEditingProduct({ ...editingProduct, inventory: [...(editingProduct.inventory || []), newInventoryEntry] });
    toast.success(`Added location "${locationObj.displayName}"`);
  };

  const removeLocationFromEditingProduct = (locationName: string) => {
    if (!editingProduct) return;
    const locationObj = locations.find(loc => loc.name === locationName);
    setEditingProduct({ ...editingProduct, inventory: editingProduct.inventory?.filter(inv => inv.location !== locationName) || [] });
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
      <SEO title="Inventory Management - Admin" description="Manage product inventory, stock levels, pricing, and locations." keywords="admin inventory, product management, stock control" />

      <section className="bg-[#f7f7f5] min-h-[calc(100vh-150px)]">
        {/* Top Header Bar */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="w-full lg:w-[90vw] max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <Link to="/admin" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors group">
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="w-full lg:w-[95vw] max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

          {/* ── Page Title + Actions ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Inventory &amp; Revenue Dashboard</h1>
              <p className="text-sm text-gray-500 mt-0.5">Manage your sweets inventory and monitor real-time sales performance.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* <Button variant="outline" className="h-9 gap-2 text-sm font-medium border-gray-300" asChild>
                <Link to="/admin/customers">
                  <Gift className="h-4 w-4" />
                  Giveaways
                </Link>
              </Button> */}
              <Button variant="outline" className="h-9 gap-2 text-sm font-medium border-gray-300">
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={(open) => { if (!open) closeCreateModalAndReset(); setIsCreateDialogOpen(open); }}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-500 hover:bg-orange-600 h-9 gap-2 text-sm font-semibold shadow-sm">
                    <Plus className="h-4 w-4" />
                    Add Batch
                  </Button>
                </DialogTrigger>
                {/* ── Create Product Dialog (unchanged logic) ── */}
                <DialogContent className="max-w-2xl sm:max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                    <DialogDescription>
                      {createStep === 'basic' ? 'Step 1: Add basic product information.' : 'Step 2: Add batches to enable inventory.'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><Label>Product Name *</Label><Input value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Enter product name" /></div>
                      <div>
                        <Label>Category *</Label>
                        <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                          <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                          <SelectContent>{categories.map(category => (<SelectItem key={category._id} value={category._id}>{category.name}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                      {(() => { const selectedCategoryObj = categories.find(cat => cat._id === selectedCategory); return selectedCategoryObj && selectedCategoryObj.subcategories && selectedCategoryObj.subcategories.length > 0 ? (<div><Label>Subcategory</Label><Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}><SelectTrigger><SelectValue placeholder="Select subcategory (optional)" /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem>{selectedCategoryObj.subcategories.map(subcategory => (<SelectItem key={subcategory._id || subcategory.name} value={subcategory.name}>{subcategory.name}</SelectItem>))}</SelectContent></Select></div>) : null; })()}
                    </div>
                    {createStep === 'basic' && (<><div><Label>Description</Label><Textarea value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} placeholder="Enter product description" rows={3} /></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><Label>Product Origin (Optional)</Label><Input value={newProduct.originLocation || ''} onChange={(e) => setNewProduct({ ...newProduct, originLocation: e.target.value })} placeholder="e.g., Hyderabad, Kakinada" /></div><div><Label>Video URL</Label><Input value={newProduct.videoUrl} onChange={(e) => setNewProduct({ ...newProduct, videoUrl: e.target.value })} placeholder="https://..." /></div></div>
                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-center space-x-2"><Switch checked={newProduct.isGITagged || false} onCheckedChange={(checked) => setNewProduct({ ...newProduct, isGITagged: checked })} /><Label>GI Tagged</Label></div>
                      <div className="flex items-center space-x-2"><Switch checked={newProduct.isMostSaled || false} onCheckedChange={(checked) => setNewProduct({ ...newProduct, isMostSaled: checked })} /><Label>Most Sold</Label></div>
                    </div>
                    <div>
                      <Label>Product Images</Label>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Input type="file" multiple accept="image/*" onChange={(e) => { if (e.target.files && e.target.files.length > 0) { const files = Array.from(e.target.files); const previewUrls = files.map(file => URL.createObjectURL(file)); setNewProduct({ ...newProduct, imageFiles: [...(newProduct.imageFiles || []), ...files], images: [...(newProduct.images || []), ...previewUrls] }); } }} disabled={uploadingImages || (newProduct.images?.length || 0) >= 10} className="cursor-pointer flex-1" />
                          {(newProduct.images?.length || 0) > 0 && (<Button type="button" variant="outline" size="sm" onClick={() => { newProduct.images?.forEach(url => { if (url.startsWith('blob:')) URL.revokeObjectURL(url); }); setNewProduct({ ...newProduct, images: [], imageFiles: [] }); }} className="whitespace-nowrap">Clear All</Button>)}
                        </div>
                        {newProduct.images && newProduct.images.length > 0 && (<div className="grid grid-cols-3 sm:grid-cols-4 gap-2">{newProduct.images.map((image, index) => (<div key={index} className="relative group"><img src={image} alt={`Product ${index + 1}`} className="w-full h-20 object-cover rounded border" /><Button type="button" variant="destructive" size="sm" className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { URL.revokeObjectURL(newProduct.images?.[index] || ''); setNewProduct({ ...newProduct, images: newProduct.images?.filter((_, i) => i !== index), imageFiles: newProduct.imageFiles?.filter((_, i) => i !== index) }); }}><X className="h-3 w-3" /></Button></div>))}</div>)}
                      </div>
                    </div></>)}
                    {createStep === 'add-batch' && (
                      <div className="space-y-4 border-t pt-6">
                        {!showBatchSection ? (
                          <div className="flex flex-col items-center gap-4 py-6">
                            <p className="text-muted-foreground">Add inventory batches to enable sales.</p>
                            <Button onClick={() => setShowBatchSection(true)}><Plus className="h-4 w-4 mr-2" />Add Batch</Button>
                            <Button variant="ghost" onClick={closeCreateModalAndReset}>Skip for now</Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-4">
                              <Label>Product type:</Label>
                              <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={!createFlowHasVariants} onChange={() => setCreateFlowHasVariants(false)} />Without Variants</label>
                                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={createFlowHasVariants} onChange={() => setCreateFlowHasVariants(true)} />With Variants</label>
                              </div>
                            </div>
                            {!createFlowHasVariants && (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border">
                                <div className="space-y-2">
                                  <Label>Store(s) *</Label>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button variant="outline" className="w-full justify-start text-left font-normal min-h-10">
                                        {(batchStepStoreIds.length || (batchStepStoreId && 1)) ? (<span className="truncate">{(batchStepStoreIds.length ? batchStepStoreIds : [batchStepStoreId]).map(id => stores.find(s => s._id === id)?.name ?? id).join(', ')}</span>) : (<span className="text-muted-foreground">Select store(s)</span>)}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-2" align="start">
                                      <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {stores.map(s => { const selectedIds = batchStepStoreIds.length ? batchStepStoreIds : (batchStepStoreId ? [batchStepStoreId] : []); const checked = selectedIds.includes(s._id); return (<label key={s._id} className="flex items-center gap-2 cursor-pointer rounded px-2 py-1.5 hover:bg-muted"><Checkbox checked={checked} onCheckedChange={isChecked => { const ids = batchStepStoreIds.length ? [...batchStepStoreIds] : (batchStepStoreId ? [batchStepStoreId] : []); const next = isChecked ? (ids.includes(s._id) ? ids : [...ids, s._id]) : ids.filter(i => i !== s._id); setBatchStepStoreIds(next); setBatchStepStoreId(next[0] ?? ''); }} /><span className="text-sm">{s.name}</span></label>); })}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                                <div><Label>Original Price (₹) *</Label><Input type="number" min="0" value={batchStepOriginalPrice || ''} onChange={e => setBatchStepOriginalPrice(Number(e.target.value) || 0)} placeholder="e.g. 120" /></div>
                                <div><Label>Offer Price (₹)</Label><Input type="number" min="0" value={batchStepOfferPrice ?? ''} onChange={e => setBatchStepOfferPrice(e.target.value ? Number(e.target.value) : undefined)} placeholder="Optional" /></div>
                              </div>
                            )}
                            {createFlowHasVariants && (<VariantBuilder variants={newProduct.variants || []} onAddVariant={() => addVariant(true)} onRemoveVariant={(index) => removeVariant(index, true)} onUpdateVariant={(index, field, value) => updateVariant(index, field, value, true)} locations={locations} variantStocks={newProduct.variantStocks || []} onAddLocationToVariant={addLocationToVariant} onRemoveLocationFromVariant={removeLocationFromVariant} onUpdateVariantStock={updateVariantStock} />)}
                            {(!createFlowHasVariants || (newProduct.variants && newProduct.variants.length > 0)) && (
                              <BatchInventoryManager inventoryData={newProduct.batchInventoryData || []} locations={createFlowHasVariants ? locations : (batchStepStoreIds.length ? batchStepStoreIds : batchStepStoreId ? [batchStepStoreId] : []).length > 0 ? locations.filter(l => (batchStepStoreIds.length ? batchStepStoreIds : [batchStepStoreId]).includes(l.storeId)) : []} variantIndex={createFlowHasVariants ? selectedVariantForBatch : 0} variants={createFlowHasVariants ? (newProduct.variants || []) : undefined} selectedVariantIndex={selectedVariantForBatch} onVariantChange={createFlowHasVariants ? setSelectedVariantForBatch : undefined} onAddLocation={addLocationToBatchInventory} onRemoveLocation={removeLocationFromBatchInventory} onAddBatch={addBatchToLocation} onUpdateBatch={updateBatchAtLocation} onRemoveBatch={removeBatchFromLocation} defaultPurchasePrice={createFlowHasVariants && newProduct.variants?.[selectedVariantForBatch] ? newProduct.variants[selectedVariantForBatch].originalPrice : (batchStepOriginalPrice || (newProduct.originalPrice ?? 0))} defaultSellingPrice={createFlowHasVariants && newProduct.variants?.[selectedVariantForBatch] ? (newProduct.variants[selectedVariantForBatch].offerPrice ?? newProduct.variants[selectedVariantForBatch].originalPrice) : (batchStepOfferPrice ?? batchStepOriginalPrice ?? newProduct.offerPrice ?? newProduct.originalPrice ?? 0)} defaultOriginalPrice={!createFlowHasVariants ? (batchStepOriginalPrice || (newProduct.originalPrice ?? 0)) : undefined} />
                            )}
                            <div className="flex justify-end gap-3 pt-4">
                              <Button variant="outline" onClick={closeCreateModalAndReset}>Skip</Button>
                              <Button onClick={handleAddBatches} disabled={addingBatches}>{addingBatches ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Adding...</>) : <>Add Batches &amp; Finish</>}</Button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    {createStep === 'basic' && (
                      <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={closeCreateModalAndReset}>Cancel</Button>
                        <Button onClick={handleCreateProduct} disabled={creatingProduct}>{creatingProduct ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Creating...</>) : (<><Save className="h-4 w-4 mr-2" />Create Product</>)}</Button>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* ── Stats Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Products */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                <Package className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Products</p>
                <p className="text-2xl font-extrabold text-gray-900 leading-tight">{products.length.toLocaleString()}</p>
                {/* <p className="text-xs text-green-600 font-medium mt-0.5">+{Math.max(0, products.filter(p => p.isNewArrival).length)} new arrivals</p> */}
              </div>
            </div>
            {/* Low Stock */}
            <div onClick={() => setShowLowStockModal(true)} className="cursor-pointer">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Low Stock Items</p>
                  <p className="text-2xl font-extrabold text-red-600 leading-tight">{lowStockCount}</p>
                  <p className="text-xs text-red-500 font-medium mt-0.5">Requires attention</p>
                </div>
              </div>
            </div>
            {/* Expiring */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Expiring in 7 Days</p>
                <p className="text-2xl font-extrabold text-amber-600 leading-tight">{expiringCount}</p>
                <p className="text-xs text-amber-600 font-medium mt-0.5">Promotions suggested</p>
              </div>
            </div>
            {/* Active Products */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Products</p>
                <p className="text-2xl font-extrabold text-green-700 leading-tight">{products.filter(p => p.isActive).length}</p>
                <p className="text-xs text-green-600 font-medium mt-0.5">+18.4% growth</p>
              </div>
            </div>
          </div>

          {/* ── Product Inventory Table Section ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Table Header with filters */}
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-base font-bold text-gray-900">Product Inventory</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                  {/* Search */}
                  <div className="space-y-1 min-w-0">
                    {/* <Label className="text-sm font-medium text-gray-700">Search</Label> */}
                    <div className="relative min-w-0">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search products, batch..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-9 text-sm w-full min-w-0 bg-gray-50 border-gray-200 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Location Filter */}
                  <div className="space-y-1 min-w-0">
                    {/* <Label className="text-sm font-medium text-gray-700">Location</Label> */}
                    <Select value={selectedLocationFilter} onValueChange={setSelectedLocationFilter}>
                      <SelectTrigger className="h-9 w-full text-sm bg-gray-50 border-gray-200 rounded-lg min-w-0">
                        <SelectValue placeholder="Location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        {locations.map(location => (<SelectItem key={location.storeId} value={location.name}>{location.displayName}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category Filter */}
                  <div className="space-y-1 min-w-0">
                    {/* <Label className="text-sm font-medium text-gray-700">Category</Label> */}
                    <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
                      <SelectTrigger className="h-9 w-full text-sm bg-gray-50 border-gray-200 rounded-lg min-w-0">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(category => (<SelectItem key={category._id} value={category._id}>{category.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-1 min-w-0">
                    {/* <Label className="text-sm font-medium text-gray-700">Status</Label> */}
                    <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
                      <SelectTrigger className="h-9 w-full text-sm bg-gray-50 border-gray-200 rounded-lg min-w-0">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0 border-gray-200 bg-gray-50 self-end"
                    aria-label="Filter"
                    title="Filter"
                  >
                    <Filter className="h-4 w-4 text-gray-500" />
                  </Button> */}
                </div>
              </div>
            </div>

            {/* Results info */}
            <div className="px-5 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Showing {Math.min(startIndex + 1, filteredProducts.length)}–{Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
                {filteredProducts.length !== products.length && ` (filtered from ${products.length})`}
              </p>
              {totalPages > 1 && <p className="text-xs text-gray-500">Page {currentPage} of {totalPages}</p>}
            </div>

            {/* Table */}
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

            {/* View all / Pagination footer */}
            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
              {totalPages > 1 ? (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => goToPage(1)} disabled={currentPage === 1} className="hidden sm:flex">First</Button>
                  <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={currentPage === 1}>Previous</Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (currentPage <= 3) pageNum = i + 1;
                      else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = currentPage - 2 + i;
                      return (<Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" onClick={() => goToPage(pageNum)} className={`w-9 h-9 p-0 ${currentPage === pageNum ? 'bg-orange-500 hover:bg-orange-600 border-orange-500' : ''}`}>{pageNum}</Button>);
                    })}
                  </div>
                  <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage === totalPages}>Next</Button>
                  <Button variant="outline" size="sm" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} className="hidden sm:flex">Last</Button>
                </div>
              ) : (
                <button className="text-sm font-semibold text-orange-500 hover:text-orange-600 flex items-center gap-1">
                  View All {filteredProducts.length} Products <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* ── Revenue Overview + Expiring Batches ── */}
          {/* <div className="grid grid-cols-1 lg:grid-cols-5 gap-5"> */}
            {/* Revenue Chart */}
            {/* <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-900">Revenue Overview</h2>
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  {(['Daily', 'Weekly', 'Monthly'] as const).map(tab => (
                    <button key={tab} onClick={() => setRevenueTab(tab)} className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${revenueTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{tab}</button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={revenueChartData} barSize={24} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <YAxis hide />
                  <Tooltip formatter={(value: number) => [`₹${(value / 1000).toFixed(0)}K`, 'Revenue']} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px' }} cursor={{ fill: 'rgba(249, 115, 22, 0.05)' }} />
                  <Bar dataKey="revenue" fill="#f97316" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Orders Revenue</p>
                  <p className="text-lg font-extrabold text-gray-900 mt-0.5">₹5.2L</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Giveaway Cost</p>
                  <p className="text-lg font-extrabold text-red-500 mt-0.5">-₹70K</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Net Revenue</p>
                  <p className="text-lg font-extrabold text-green-600 mt-0.5">₹4.5L</p>
                </div>
              </div>
            </div> */}

            {/* Expiring Batches */}
            {/* <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-900">Expiring Batches</h2>
                <Bell className="h-4 w-4 text-gray-400" />
              </div>
              {expiringBatches.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-400">No batches expiring in 7 days 🎉</div>
              ) : (
                <div className="space-y-3">
                  {expiringBatches.map((b, i) => {
                    const urgency = b.daysLeft <= 2 ? { bg: 'bg-red-50', badge: 'bg-red-500', text: 'text-red-700', bar: 'bg-red-400' } : b.daysLeft <= 5 ? { bg: 'bg-amber-50', badge: 'bg-amber-500', text: 'text-amber-700', bar: 'bg-amber-400' } : { bg: 'bg-blue-50', badge: 'bg-blue-500', text: 'text-blue-700', bar: 'bg-blue-400' };
                    return (
                      <div key={i} className={`${urgency.bg} rounded-xl p-3`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{b.productName}{b.variantValue ? ` (${b.variantValue})` : ''}</p>
                            <p className="text-xs text-gray-500">Batch: #{b.batchNumber.slice(-8)}</p>
                          </div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${urgency.badge}`}>{b.daysLeft} DAYS LEFT</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${urgency.bar}`} style={{ width: `${Math.min(100, (b.daysLeft / 7) * 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {expiringBatches.length > 0 && (
                <button className="mt-4 w-full text-center text-sm font-semibold text-orange-500 hover:text-orange-600 border border-orange-200 rounded-xl py-2 transition-colors hover:bg-orange-50">
                  View All Expiring Batches
                </button>
              )}
            </div>
          </div> */}

          {/* ── Data Exports ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-orange-500" />
                <h2 className="text-base font-bold text-gray-900">Data Exports</h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  {['Daily', 'Weekly', 'Monthly'].map(tab => (
                    <button key={tab} className="px-3 py-1 text-xs font-semibold text-gray-500 hover:text-gray-800 rounded-md hover:bg-white transition-colors">{tab}</button>
                  ))}
                </div>
                <span className="text-xs text-gray-500 font-medium bg-gray-100 px-3 py-1.5 rounded-lg">📅 May 01 – May 07, 2024</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Export Orders', icon: Download, color: 'bg-orange-500 hover:bg-orange-600 text-white' },
                { label: 'Export Sales', icon: BarChart2, color: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200' },
                { label: 'Export Inventory', icon: Package, color: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200' },
                { label: 'Export Giveaways', icon: Gift, color: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200' },
              ].map(({ label, icon: Icon, color }) => (
                <button key={label} className={`${color} rounded-xl py-3 px-4 flex items-center justify-center gap-2 text-sm font-semibold transition-colors shadow-sm`}>
                  <Icon className="h-4 w-4" />{label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── Low Stock Details ── */}
      <Dialog open={showLowStockModal} onOpenChange={setShowLowStockModal}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Low stock items</DialogTitle>
            <DialogDescription>
              Batches with quantity above 0 and at or below the low stock threshold ({LOW_STOCK_THRESHOLD}).
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-1 -mr-1">
            {lowStockItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No low stock batches right now.</p>
            ) : (
              lowStockItems.map((item, index) => (
                <div key={index} className="border-b py-2 last:border-b-0">
                  <p className="font-semibold">{item.productName}</p>
                  <p className="text-sm text-gray-500">
                    Variant: {item.variant} | Batch: {item.batchNumber}
                  </p>
                  <p className="text-sm text-red-500 font-medium">
                    Qty: {item.quantity} | Location: {item.location}
                  </p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Product Dialog (full logic preserved) ── */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => { if (!open) { setEditingProduct(null); setEditModalProductType(null); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Product - {editingProduct?.name}</DialogTitle><DialogDescription>Modify product details, pricing, and inventory across locations.</DialogDescription></DialogHeader>
          {editingProduct && (() => {
            return (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Product Name *</Label><Input value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} className={!editingProduct.name?.trim() ? 'border-red-300' : ''} /></div>
                  <div><Label>Category</Label><Input value={(editingProduct.category as any)?.name || ''} readOnly /></div>
                </div>
                {editingProduct && (() => {
                  const hasAnyInventory = editingProduct.inventory && editingProduct.inventory.length > 0 && editingProduct.inventory.some(inv => (inv.batches && inv.batches.length > 0) || (inv.stock && inv.stock.length > 0));
                  if (!hasAnyInventory) {
                    return (<div className="p-4 border rounded-lg bg-slate-50 border-slate-200"><Label className="text-base font-semibold block mb-2">Product type (for adding batches)</Label><div className="flex gap-4"><label className={`flex items-center gap-2 cursor-pointer px-4 py-3 rounded-lg border-2 transition-colors ${editModalProductType === 'without-variants' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}><input type="radio" name="editProductType" checked={editModalProductType === 'without-variants'} onChange={() => setEditModalProductType('without-variants')} /><span className="font-medium">Without Variants</span></label><label className={`flex items-center gap-2 cursor-pointer px-4 py-3 rounded-lg border-2 transition-colors ${editModalProductType === 'with-variants' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}><input type="radio" name="editProductType" checked={editModalProductType === 'with-variants'} onChange={() => setEditModalProductType('with-variants')} /><span className="font-medium">With Variants</span></label></div></div>);
                  }
                  return null;
                })()}
                {editingProduct && (() => {
                  const hasAnyInventory = editingProduct.inventory && editingProduct.inventory.length > 0 && editingProduct.inventory.some(inv => (inv.batches && inv.batches.length > 0) || (inv.stock && inv.stock.length > 0));
                  const effectiveHasVariants = hasAnyInventory ? !!(editingProduct.variants && editingProduct.variants.length > 0) : (editModalProductType === 'with-variants');
                  if (!effectiveHasVariants) return null;
                  const variants = editingProduct.variants || [];
                  return (
                    <div className="p-4 border rounded-lg bg-blue-50/50 border-blue-200">
                      <div className="flex items-center justify-between mb-2"><Label className="text-lg font-semibold">Product Variants</Label><Button type="button" variant="outline" size="sm" onClick={() => addVariant(false)}><Plus className="h-4 w-4 mr-1" />Add Variant</Button></div>
                      {variants.length === 0 ? (<p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">No variants yet.</p>) : (
                        <div className="space-y-3">{variants.map((variant, index) => {
                          const isActive = variant.isActive !== false;
                          return (<div key={index} className={`border rounded-lg p-3 ${isActive ? 'bg-white' : 'bg-gray-100'}`}><div className="flex items-center justify-between mb-2"><span className="font-medium">Variant {index + 1}</span><div className="flex items-center gap-2"><Label className="text-sm text-muted-foreground">Active</Label><Switch checked={isActive} onCheckedChange={(checked) => updateVariant(index, 'isActive', checked, false)} /></div></div><div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><div><Label className="text-sm">Type</Label><Select value={variant.type} onValueChange={(value: 'weight' | 'pieces' | 'box') => updateVariant(index, 'type', value, false)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="weight">Weight</SelectItem><SelectItem value="pieces">Pieces</SelectItem><SelectItem value="box">Box</SelectItem></SelectContent></Select></div><div><Label className="text-sm">Value</Label><Input value={variant.value} onChange={(e) => updateVariant(index, 'value', e.target.value, false)} placeholder="e.g., 500g" /></div><div><Label className="text-sm">Price (₹) *</Label><Input type="number" min="0" value={variant.originalPrice} onChange={(e) => updateVariant(index, 'originalPrice', Number(e.target.value) || 0, false)} /></div><div><Label className="text-sm">Offer (₹)</Label><Input type="number" min="0" value={variant.offerPrice || ''} onChange={(e) => updateVariant(index, 'offerPrice', e.target.value ? Number(e.target.value) : undefined, false)} placeholder="Optional" /></div></div></div>);
                        })}</div>
                      )}
                    </div>
                  );
                })()}
                {editingProduct && (() => {
                  const hasAnyInventory = editingProduct.inventory && editingProduct.inventory.length > 0 && editingProduct.inventory.some(inv => (inv.batches && inv.batches.length > 0) || (inv.stock && inv.stock.length > 0));
                  const effectiveHasVariants = hasAnyInventory ? !!(editingProduct.variants && editingProduct.variants.length > 0) : (editModalProductType === 'with-variants');
                  if (effectiveHasVariants) return null;
                  return (<div className="p-4 border rounded-lg"><Label className="text-base font-semibold">Pricing</Label><div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3"><div><Label>Original Price (₹) *</Label><Input type="number" min="0" value={editingProduct.originalPrice ?? ''} onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: e.target.value ? Number(e.target.value) : undefined })} /></div><div><Label>Offer Price (₹)</Label><Input type="number" min="0" value={editingProduct.offerPrice ?? ''} onChange={(e) => setEditingProduct({ ...editingProduct, offerPrice: e.target.value ? Number(e.target.value) : undefined })} /></div></div></div>);
                })()}
                <div><Label>Description</Label><Textarea value={editingProduct.description || ''} onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })} rows={3} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><Label>Video URL</Label><Input value={editingProduct.videoUrl || ''} onChange={(e) => setEditingProduct({ ...editingProduct, videoUrl: e.target.value })} /></div></div>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center space-x-2"><Switch checked={editingProduct.isActive || false} onCheckedChange={(checked) => setEditingProduct({ ...editingProduct, isActive: checked })} /><Label>Active</Label></div>
                  <div className="flex items-center space-x-2"><Switch checked={editingProduct.isGITagged || false} onCheckedChange={(checked) => setEditingProduct({ ...editingProduct, isGITagged: checked })} /><Label>GI Tagged</Label></div>
                </div>
                <div>
                  <Label>Product Images</Label>
                  <Input type="file" multiple accept="image/*" onChange={async (e) => { if (e.target.files && editingProduct) { const imageUrls = await handleImageUpload(e.target.files); if (imageUrls.length > 0) setEditingProduct({ ...editingProduct, images: [...editingProduct.images, ...imageUrls] }); } }} disabled={uploadingImages} />
                  {editingProduct.images && editingProduct.images.length > 0 && (<div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">{editingProduct.images.map((image, index) => (<div key={index} className="relative"><img src={image} alt={`Product ${index + 1}`} className="w-full h-20 object-cover rounded" /><Button type="button" variant="destructive" size="sm" className="absolute -top-2 -right-2 h-6 w-6 p-0" onClick={() => setEditingProduct({ ...editingProduct, images: editingProduct.images.filter((_, i) => i !== index) })}><X className="h-3 w-3" /></Button></div>))}</div>)}
                </div>
                {locations.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4"><Label className="text-lg font-semibold">📍 Inventory by Location</Label>
                      <Select onValueChange={addLocationToEditingProduct}><SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Add Location" /></SelectTrigger><SelectContent>{locations.filter(loc => !editingProduct.inventory?.some(inv => inv.location === loc.name)).map(location => (<SelectItem key={location.storeId} value={location.storeId}>{location.displayName}</SelectItem>))}</SelectContent></Select>
                    </div>
                    {(!editingProduct.inventory || editingProduct.inventory.length === 0) ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center"><MapPin className="h-8 w-8 text-amber-500 mx-auto mb-2" /><p className="text-amber-800 font-medium">Step 2: Add your first batch</p></div>
                    ) : (
                      <div className="space-y-4">
                        {editingProduct.inventory.map((locationInventory) => {
                          const locationObj = locations.find(loc => loc.name === locationInventory.location);
                          const variants = editingProduct.variants || [];
                          const isVariantActive = (i: number) => (variants[i] as ProductVariant)?.isActive !== false;
                          const totalStock = locationInventory.batches?.length ? locationInventory.batches.reduce((sum, b) => { if (!isVariantActive(b.variantIndex)) return sum; return sum + (b.quantity || 0); }, 0) : (locationInventory.stock?.reduce((sum, s) => { if (!isVariantActive(s.variantIndex)) return sum; return sum + (s.quantity || 0); }, 0) || 0);
                          const batches = locationInventory.batches || [];
                          const formatDate = (d: string | Date) => { if (!d) return '-'; const date = typeof d === 'string' ? new Date(d) : d; return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); };
                          return (
                            <div key={locationInventory.location} className="border rounded-lg p-4 bg-gray-50">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
                                <div className="flex items-center gap-2"><span className="font-semibold capitalize">{locationObj?.displayName || locationInventory.location}<span className="ml-2 text-sm font-normal text-gray-600">(Current: {totalStock} units)</span></span><MapPin className="h-5 w-5 text-blue-600" /></div>
                                <div className="flex items-center gap-2"><div className={`text-sm font-medium px-2 py-1 rounded-full ${totalStock === 0 ? 'bg-red-100 text-red-800' : totalStock <= 5 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{totalStock === 0 ? '🚫 Out of Stock' : `📦 ${totalStock} units`}</div><Button type="button" variant="ghost" size="sm" onClick={() => removeLocationFromEditingProduct(locationInventory.location)} className="text-red-600 hover:text-red-700"><X className="h-4 w-4" /></Button></div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {editingProduct.variants && editingProduct.variants.length > 0 ? editingProduct.variants.map((variant, variantIndex) => {
                                  const variantStock = locationInventory.batches?.length ? locationInventory.batches.filter(b => b.variantIndex === variantIndex).reduce((s, b) => s + (b.quantity || 0), 0) : (locationInventory.stock?.find(s => s.variantIndex === variantIndex)?.quantity || 0);
                                  return (<div key={variantIndex} className="bg-white border rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"><div><Label className="text-sm font-medium text-gray-700 block">{variant.value}</Label><p className={`text-sm mt-0.5 ${variantStock === 0 ? 'text-red-600' : 'text-gray-600'}`}>Current: {variantStock} units</p></div><Button type="button" variant="outline" size="sm" className="shrink-0 text-blue-600 hover:text-blue-700 border-blue-200" onClick={() => { setAddBatchForm({ location: locationInventory.location, variantIndex }); setAddBatchData({ quantity: 0, manufacturingDate: new Date().toISOString().slice(0, 10), expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), purchasePrice: variant.originalPrice ?? 0, sellingPrice: variant.offerPrice ?? variant.originalPrice ?? 0, batchWholePrice: undefined, dealTriggerDays: undefined, dealDiscountPercent: undefined, newArrivalUntil: '' }); }}><Plus className="h-3 w-3 mr-1" /> Add batch</Button></div>);
                                }) : (<div className="bg-white border rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 col-span-full sm:col-span-1"><div><Label className="text-sm font-medium text-gray-700 block">Stock</Label><p className="text-sm mt-0.5 text-gray-600">Current: {locationInventory.batches?.length ? locationInventory.batches.filter(b => b.variantIndex === 0).reduce((s, b) => s + (b.quantity || 0), 0) : (locationInventory.stock?.[0]?.quantity || 0)} units</p></div><Button type="button" variant="outline" size="sm" className="shrink-0 text-blue-600 hover:text-blue-700 border-blue-200" onClick={() => { setAddBatchForm({ location: locationInventory.location, variantIndex: 0 }); setAddBatchData({ quantity: 0, manufacturingDate: new Date().toISOString().slice(0, 10), expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), purchasePrice: editingProduct?.originalPrice ?? 0, sellingPrice: editingProduct?.offerPrice ?? editingProduct?.originalPrice ?? 0, batchWholePrice: undefined, dealTriggerDays: undefined, dealDiscountPercent: undefined, newArrivalUntil: '' }); }}><Plus className="h-3 w-3 mr-1" /> Add batch</Button></div>)}
                              </div>
                              {batches.length > 0 && (
                                <div className="mt-4 pt-4 border-t">
                                  <Label className="text-sm font-semibold text-gray-800 mb-3 block">📋 Batch-wise Breakdown</Label>
                                  <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="bg-gray-100 border-b">
                                          <th className="text-left py-2.5 px-3 font-semibold text-gray-700">Batch #</th>
                                          {editingProduct.variants && editingProduct.variants.length > 0 && (
                                            <th className="text-left py-2.5 px-3 font-semibold text-gray-700">Variant</th>
                                          )}
                                          <th className="text-right py-2.5 px-3 font-semibold text-gray-700">Qty</th>
                                          <th className="text-left py-2.5 px-3 font-semibold text-gray-700">Mfg Date</th>
                                          <th className="text-left py-2.5 px-3 font-semibold text-gray-700">Expiry</th>
                                          <th className="text-left py-2.5 px-3 font-semibold text-gray-700 whitespace-nowrap">New until</th>
                                          <th className="text-left py-2.5 px-3 font-semibold text-gray-700">Status</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {batches.map((batch, idx) => {
                                          const exp = typeof batch.expiryDate === 'string' ? new Date(batch.expiryDate) : batch.expiryDate;
                                          const now = new Date();
                                          const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                          const status =
                                            daysLeft < 0
                                              ? { label: 'Expired', cls: 'bg-red-100 text-red-800' }
                                              : daysLeft <= 3
                                                ? { label: 'Expiring Soon', cls: 'bg-amber-100 text-amber-800' }
                                                : { label: 'OK', cls: 'bg-green-100 text-green-800' };
                                          const variantLabel =
                                            editingProduct.variants && editingProduct.variants[batch.variantIndex]
                                              ? editingProduct.variants[batch.variantIndex].value
                                              : 'Default';
                                          const newUntil = batch.newArrivalUntil
                                            ? formatDate(batch.newArrivalUntil)
                                            : '—';
                                          return (
                                            <tr key={idx} className={`border-b border-gray-100 last:border-0 ${idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                                              <td className="py-2.5 px-3 font-medium text-gray-900">{batch.batchNumber}</td>
                                              {editingProduct.variants && editingProduct.variants.length > 0 && (
                                                <td className="py-2.5 px-3 text-gray-700">{variantLabel}</td>
                                              )}
                                              <td className="py-2.5 px-3 text-right font-semibold">{batch.quantity ?? 0}</td>
                                              <td className="py-2.5 px-3 text-gray-700">{formatDate(batch.manufacturingDate)}</td>
                                              <td className="py-2.5 px-3 text-gray-700">{formatDate(batch.expiryDate)}</td>
                                              <td className="py-2.5 px-3 text-gray-700 text-xs whitespace-nowrap" title="New Arrivals listing ends this date">
                                                {newUntil}
                                              </td>
                                              <td className="py-2.5 px-3">
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.cls}`}>
                                                  {status.label}
                                                  {daysLeft >= 0 && daysLeft <= 30 && ` (${daysLeft}d)`}
                                                </span>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                              {addBatchForm?.location === locationInventory.location && (
                                <div className="mt-4 pt-4 border-t space-y-3 p-3 bg-blue-50 rounded-lg">
                                  <p className="text-sm font-medium text-blue-900">New batch for {editingProduct.variants && editingProduct.variants[addBatchForm?.variantIndex ?? 0] ? editingProduct.variants[addBatchForm.variantIndex].value : 'this product'}</p>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                    <div><Label className="text-xs">Qty *</Label><Input type="number" min="0" value={addBatchData.quantity} onChange={e => setAddBatchData(d => ({ ...d, quantity: Math.max(0, Number(e.target.value) || 0) }))} /></div>
                                    <div><Label className="text-xs">Mfg Date</Label><Input type="date" value={addBatchData.manufacturingDate} onChange={e => setAddBatchData(d => ({ ...d, manufacturingDate: e.target.value }))} /></div>
                                    <div><Label className="text-xs">Expiry Date</Label><Input type="date" value={addBatchData.expiryDate} onChange={e => setAddBatchData(d => ({ ...d, expiryDate: e.target.value }))} /></div>
                                    <div><Label className="text-xs">New arrival until</Label><Input type="date" value={addBatchData.newArrivalUntil} onChange={e => setAddBatchData(d => ({ ...d, newArrivalUntil: e.target.value }))} title="Show on New Arrivals through this date" /></div>
                                    <div><Label className="text-xs">Batch whole price (₹)</Label><Input type="number" min="0" placeholder="Optional" value={addBatchData.batchWholePrice ?? ''} onChange={e => setAddBatchData(d => ({ ...d, batchWholePrice: e.target.value ? Number(e.target.value) : undefined }))} /></div>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-blue-200">
                                    <Label className="text-xs font-semibold text-amber-800 col-span-full">Deal of the Day (optional)</Label>
                                    <div><Label className="text-xs">Deal trigger days</Label><Input type="number" min="0" placeholder="e.g. 2" value={addBatchData.dealTriggerDays ?? ''} onChange={e => setAddBatchData(d => ({ ...d, dealTriggerDays: e.target.value ? Number(e.target.value) : undefined }))} /></div>
                                    <div><Label className="text-xs">Discount %</Label><Input type="number" min="0" max="100" placeholder="e.g. 20" value={addBatchData.dealDiscountPercent ?? ''} onChange={e => setAddBatchData(d => ({ ...d, dealDiscountPercent: e.target.value ? Number(e.target.value) : undefined }))} /></div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={() => { if (!editingProduct) return; const vi = addBatchForm?.variantIndex ?? 0; const variant = editingProduct.variants?.[vi]; handleAddBatch(editingProduct._id, locationInventory.location, vi, { ...addBatchData, purchasePrice: addBatchData.purchasePrice || (variant?.originalPrice ?? editingProduct.originalPrice ?? 0), sellingPrice: addBatchData.sellingPrice || (variant?.offerPrice ?? variant?.originalPrice ?? editingProduct?.offerPrice ?? editingProduct?.originalPrice ?? 0), batchWholePrice: addBatchData.batchWholePrice, dealTriggerDays: addBatchData.dealTriggerDays, dealDiscountPercent: addBatchData.dealDiscountPercent, ...(addBatchData.newArrivalUntil ? { newArrivalUntil: addBatchData.newArrivalUntil } : {}) }); setAddBatchForm(null); }} disabled={addBatchData.quantity <= 0}>Add Batch</Button>
                                    <Button size="sm" variant="outline" onClick={() => setAddBatchForm(null)}>Cancel</Button>
                                  </div>
                                </div>
                              )}
                              <div className="mt-3 pt-3 border-t flex justify-between items-center text-sm"><span className="font-medium">Total Stock:</span><span className="font-bold">{totalStock} units</span></div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setEditingProduct(null)}>Cancel</Button>
                  <Button onClick={handleSaveProduct} disabled={savingProduct}>{savingProduct ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Saving...</>) : (<><Save className="h-4 w-4 mr-2" />Save Changes</>)}</Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AdminInventory;