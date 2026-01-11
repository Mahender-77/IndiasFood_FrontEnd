import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { Category } from '@/types';
import { PlusCircle, Edit, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isMutating, setIsMutating] = useState(false); // New state for mutation loading
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/admin/categories');
      setCategories(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch categories');
      toast({
        title: 'Error',
        description: 'Failed to fetch categories.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    setIsMutating(true);
    try {
      await api.post('/admin/categories', { name: categoryName, isActive });
      toast({
        title: 'Category Created',
        description: `Category "${categoryName}" has been added.`, 
      });
      setIsDialogOpen(false);
      setCategoryName('');
      setIsActive(true);
      fetchCategories();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to create category.',
        variant: 'destructive',
      });
    } finally {
      setIsMutating(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    setIsMutating(true);
    try {
      await api.put(`/admin/categories/${editingCategory._id}`, { name: categoryName, isActive });
      toast({
        title: 'Category Updated',
        description: `Category "${categoryName}" has been updated.`, 
      });
      setIsDialogOpen(false);
      setEditingCategory(null);
      setCategoryName('');
      setIsActive(true);
      fetchCategories();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to update category.',
        variant: 'destructive',
      });
    } finally {
      setIsMutating(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    setIsMutating(true);
    try {
      await api.delete(`/admin/categories/${id}`);
      toast({
        title: 'Category Deleted',
        description: 'Category has been removed.',
      });
      fetchCategories();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to delete category.',
        variant: 'destructive',
      });
    } finally {
      setIsMutating(false);
    }
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setIsActive(category.isActive);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    setCategoryName('');
    setIsActive(true);
  };

  if (loading) {
    return (
      <Layout>
        <section className="section-padding bg-background">
          <div className="container-custom">
            <Skeleton className="h-10 w-64 mb-8" />
            <Skeleton className="h-60 w-full rounded-md" />
          </div>
        </section>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <section className="section-padding bg-background">
          <div className="container-custom text-center py-16">
            <h1 className="font-display text-2xl font-bold text-foreground mb-4">Error</h1>
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="section-padding bg-background pt-0">
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
         
          <div className="flex justify-between items-center mb-8">
            <h1 className="font-display text-3xl font-bold">Manage Categories</h1>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingCategory(null);
                  setCategoryName('');
                  setIsActive(true);
                  setIsDialogOpen(true);
                }} disabled={isMutating}>
                  <PlusCircle className="h-4 w-4 mr-2" /> New Category
                </Button>
              </DialogTrigger>
              <DialogContent onEscapeKeyDown={handleDialogClose} onPointerDownOutside={handleDialogClose}>
                <DialogHeader>
                  <DialogTitle>{editingCategory ? 'Edit Category' : 'Create New Category'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoryName">Category Name</Label>
                    <Input
                      id="categoryName"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      placeholder="Enter category name"
                      disabled={isMutating}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isActive"
                      checked={isActive}
                      onCheckedChange={(checked) => setIsActive(!!checked)}
                      disabled={isMutating}
                    />
                    <Label htmlFor="isActive">Is Active</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={handleDialogClose} disabled={isMutating}>Cancel</Button>
                  <Button onClick={editingCategory ? handleUpdateCategory : handleCreateCategory} disabled={isMutating}>
                    {isMutating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : editingCategory ? (
                      'Save Changes'
                    ) : (
                      'Create Category'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>NAME</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No categories found.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category) => (
                    <TableRow key={category._id}>
                      <TableCell className="font-medium">{category._id}</TableCell>
                      <TableCell>{category.name}</TableCell>
                      <TableCell>
                        <Badge variant={category.isActive ? 'default' : 'secondary'}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(category)} disabled={isMutating}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteCategory(category._id)} disabled={isMutating}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AdminCategoriesPage;

