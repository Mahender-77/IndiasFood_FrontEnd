import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ImageUploader from '@/components/common/ImageUploader'; // Import ImageUploader
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Category } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

const AdminProductCreatePage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // State for new image files

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    weight: '', // New field
    shelfLife: '', // New field
    category: '',
    countInStock: '',
    videoUrl: '', // New field for video URL
  });

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleCategoryChange = (value: string) => {
    setFormData({ ...formData, category: value });
  };

  const handleImagesChange = (images: File[]) => {
    setSelectedFiles(images);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!token) {
      toast({
        title: 'Error',
        description: 'Not authorized. Please log in as admin.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    try {
      // 1. Create the product first
      const productPayload: any = {
        ...formData,
        price: Number(formData.price),
        countInStock: Number(formData.countInStock),
        // Conditionally include videoUrl if it's not empty
        ...(formData.videoUrl && { videoUrl: formData.videoUrl }),
      };

      // Conditionally add weight and shelfLife if they are not empty strings
      if (productPayload.weight === '') {
        delete productPayload.weight;
      }
      if (productPayload.shelfLife === '') {
        delete productPayload.shelfLife;
      }

      const { data: createdProduct } = await api.post('/admin/products', productPayload);

      // 2. Upload images if any were selected
      if (selectedFiles.length > 0) {
        const formDataImages = new FormData();
        selectedFiles.forEach(file => {
        formDataImages.append('images', file);
      });

      console.log('FormData for images being sent:');
      for (const pair of formDataImages.entries()) {
        console.log(`${pair[0]}, ${pair[1]}`);
      }

      await api.post(`/admin/products/${createdProduct._id}/images`, formDataImages, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      toast({
        title: 'Product Created',
        description: `${formData.name} has been added successfully.`,
      });
      navigate('/admin');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create product.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <section className="section-padding bg-background min-h-[calc(100vh-200px)] pt-0">
      <div className="bg-cream py-4">
        <div className="container-custom ">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
      <div className="container-custom pt-10">

<h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-8">
  Create New Product
</h1>

<form
  onSubmit={handleSubmit}
  className="max-w-4xl mx-auto space-y-6 bg-card p-6 rounded-xl shadow-card"
>

  {/* GRID WRAPPER */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

    <div className="space-y-2">
      <Label htmlFor="name">Product Name</Label>
      <Input id="name" value={formData.name} onChange={handleChange} required disabled={isLoading || categoriesLoading}/>
    </div>

    <div className="space-y-2">
      <Label htmlFor="price">Price</Label>
      <Input
        id="price"
        type="number"
        value={formData.price}
        onChange={handleChange}
        required
        disabled={isLoading || categoriesLoading}
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="weight">Weight (e.g., 250g)</Label>
      <Input id="weight" value={formData.weight} onChange={handleChange} disabled={isLoading || categoriesLoading}/>
    </div>

    <div className="space-y-2">
      <Label htmlFor="shelfLife">Shelf Life (e.g., 7 days)</Label>
      <Input id="shelfLife" value={formData.shelfLife} onChange={handleChange} disabled={isLoading || categoriesLoading}/>
    </div>

    <div className="space-y-2 md:col-span-2">
      <Label htmlFor="description">Description</Label>
      <Textarea
        id="description"
        value={formData.description}
        onChange={handleChange}
        required
        disabled={isLoading || categoriesLoading}
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="category">Category</Label>
      {categoriesLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : categoriesError ? (
        <p className="text-red-500 text-sm">Error loading categories.</p>
      ) : (
        <Select
          onValueChange={handleCategoryChange}
          value={formData.category}
          required
          disabled={isLoading || categoriesLoading}
        >
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
      <Input
        id="countInStock"
        type="number"
        value={formData.countInStock}
        onChange={handleChange}
        required
        disabled={isLoading || categoriesLoading}
      />
    </div>

    <div className="space-y-2 md:col-span-2">
      <Label>Product Images</Label>
      <ImageUploader onImagesChange={handleImagesChange} isMultiUpload={true} disabled={isLoading || categoriesLoading}/>
    </div>

    <div className="space-y-2 md:col-span-2">
      <Label htmlFor="videoUrl">Product Video URL (Optional)</Label>
      <Input id="videoUrl" value={formData.videoUrl} onChange={handleChange} placeholder="e.g., https://www.youtube.com/watch?v=VIDEO_ID" disabled={isLoading || categoriesLoading}/>
    </div>

  </div>

  <Button type="submit" className="w-full" disabled={isLoading || categoriesLoading}>
    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Create Product"}
  </Button>

</form>
</div>

      </section>
    </Layout>
  );
};

export default AdminProductCreatePage;
