import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select components
import { Switch } from '@/components/ui/switch';
import ImageUploader from '@/components/common/ImageUploader'; // Import ImageUploader
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Product, Category } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

export const AdminProductEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]); // State for categories
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [selectedNewFiles, setSelectedNewFiles] = useState<File[]>([]); // State for new image files
  const [existingImages, setExistingImages] = useState<string[]>([]); // State for existing image URLs

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    weight: '',
    shelfLife: undefined as number | undefined,
    category: '',
    countInStock: '',
    videoUrl: '',
    isActive: true,
  });
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [errorProduct, setErrorProduct] = useState<string | null>(null);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      setCategoriesError(null);
      try {
        const { data } = await api.get('/admin/categories');
        setCategories(data);
      } catch (err: any) {
        setCategoriesError(err.response?.data?.message || 'Failed to fetch categories.');
        toast({
          title: 'Error',
          description: err.response?.data?.message || 'Failed to fetch categories.',
          variant: 'destructive',
        });
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, [toast]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!token || !id) return;
      setLoadingProduct(true);
      setErrorProduct(null);
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data.product);
        setFormData({
          name: data.product.name,
          description: data.product.description,
          price: data.product.price.toString(),
          weight: data.product.weight || '',
          shelfLife: data.product.shelfLife !== undefined && data.product.shelfLife !== null ? data.product.shelfLife : undefined,
          category: (data.product.category as Category)._id, // Ensure category is ID
          countInStock: data.product.countInStock.toString(),
          videoUrl: data.product.videoUrl || '',
          isActive: data.product.isActive || true,
        });
        setExistingImages(data.product.images || []); // Set existing images
      } catch (err: any) {
        setErrorProduct(err.response?.data?.message || 'Failed to fetch product for editing.');
        toast({
          title: 'Error',
          description: err.response?.data?.message || 'Failed to fetch product details.',
          variant: 'destructive',
        });
      } finally {
        setLoadingProduct(false);
      }
    };
    fetchProduct();
  }, [id, token, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleCategoryChange = (value: string) => {
    setFormData({ ...formData, category: value });
  };

  const handleNewImagesChange = (images: File[]) => {
    setSelectedNewFiles(images);
  };

  const handleExistingImageRemove = (imageUrl: string) => {
    setExistingImages(existingImages.filter(img => img !== imageUrl));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!token || !id) {
      toast({
        title: 'Error',
        description: 'Not authorized or product ID missing.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    try {
      // 1. Update product details (excluding images)
      await api.put(`/admin/products/${id}`, {
        ...formData,
        price: Number(formData.price),
        countInStock: Number(formData.countInStock),
        images: existingImages, // Send updated existing images back
        // Conditionally include weight, shelfLife, and videoUrl
        ...(formData.weight && { weight: formData.weight }),
        ...(formData.shelfLife !== undefined && formData.shelfLife !== null && { shelfLife: Number(formData.shelfLife) }),
        // Conditionally include videoUrl if it's not empty
        ...(formData.videoUrl && { videoUrl: formData.videoUrl }),
      });

      // 2. Upload new images if any were selected
      if (selectedNewFiles.length > 0) {
        const formDataImages = new FormData();
        selectedNewFiles.forEach(file => {
          formDataImages.append('images', file);
        });

        await api.post(`/admin/products/${id}/images`, formDataImages, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      toast({
        title: 'Product Updated',
        description: `${formData.name} has been updated successfully.`,
      });
      navigate('/admin');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update product.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingProduct) {
    return (
      <Layout>
        <section className="section-padding bg-cream min-h-[calc(100vh-200px)]">
          <div className="container-custom">
            <Skeleton className="h-10 w-64 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
            <Skeleton className="h-40 w-full mt-6" />
            <Skeleton className="h-10 w-full mt-6" />
          </div>
        </section>
      </Layout>
    );
  }

  if (errorProduct) {
    return (
      <Layout>
        <section className="section-padding bg-cream min-h-[calc(100vh-200px)] text-center py-16">
          <h1 className="font-display text-2xl font-bold mb-4">Error</h1>
          <p className="text-red-500 mb-4">{errorProduct}</p>
          <Link to="/admin">
            <Button variant="outline">
              Back to Admin
            </Button>
          </Link>
        </section>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <section className="section-padding bg-cream min-h-[calc(100vh-200px)] text-center py-16">
          <h1 className="font-display text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-4">The product you are looking for does not exist.</p>
          <Link to="/admin">
            <Button variant="outline">
              Back to Admin
            </Button>
          </Link>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="section-padding bg-cream min-h-[calc(100vh-200px)]">
        <div className="container-custom">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin Dashboard
          </Link>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-8">
            Edit Product: <span className="product-name">{product.name}</span>
          </h1>

          <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-6 bg-card p-6 rounded-xl shadow-card">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" value={formData.name} onChange={handleChange} required disabled={isLoading || categoriesLoading || loadingProduct}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formData.description} onChange={handleChange} required disabled={isLoading || categoriesLoading || loadingProduct}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input id="price" type="number" value={formData.price} onChange={handleChange} required disabled={isLoading || categoriesLoading || loadingProduct}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (e.g., 250g)</Label>
              <Input id="weight" value={formData.weight} onChange={handleChange} disabled={isLoading || categoriesLoading || loadingProduct}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shelfLife">Shelf Life (Days)</Label>
              <Input 
                id="shelfLife" 
                type="number"
                min="0"
                value={formData.shelfLife || ''} 
                onChange={(e) => setFormData({ ...formData, shelfLife: e.target.value ? Number(e.target.value) : undefined })} 
                disabled={isLoading || categoriesLoading || loadingProduct}
                placeholder="e.g., 7"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              {categoriesLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : categoriesError ? (
                <p className="text-red-500 text-sm">Error loading categories.</p>
              ) : (
                <Select onValueChange={handleCategoryChange} value={formData.category} required disabled={isLoading || categoriesLoading || loadingProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="countInStock">Count In Stock</Label>
              <Input id="countInStock" type="number" value={formData.countInStock} onChange={handleChange} required disabled={isLoading || categoriesLoading || loadingProduct}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="videoUrl">Product Video URL (Optional)</Label>
              <Input id="videoUrl" value={formData.videoUrl} onChange={handleChange} placeholder="e.g., https://www.youtube.com/watch?v=VIDEO_ID" disabled={isLoading || categoriesLoading || loadingProduct}/>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                disabled={isLoading || categoriesLoading || loadingProduct}
              />
              <Label htmlFor="isActive">Is Active</Label>
            </div>

            <div className="space-y-2">
              <Label>Product Images</Label>
              <ImageUploader
                existingImages={existingImages}
                onImagesChange={handleNewImagesChange}
                onExistingImageRemove={handleExistingImageRemove}
                maxFiles={5}
                disabled={isLoading || categoriesLoading || loadingProduct}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || categoriesLoading || loadingProduct}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Update Product'}
            </Button>
          </form>
        </div>
      </section>
    </Layout>
  );
};
