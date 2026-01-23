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
import { Category, SubCategory } from '@/types';
import { PlusCircle, Edit, Trash2, ArrowLeft, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
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
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
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
      // Filter out empty subcategory names
      const validSubcategories = subcategories.filter(sub => sub.name.trim() !== '');
      await api.post('/admin/categories', {
        name: categoryName,
        isActive,
        subcategories: validSubcategories
      });
      toast({
        title: 'Category Created',
        description: `Category "${categoryName}" has been added.`, 
      });
      setIsDialogOpen(false);
      setCategoryName('');
      setIsActive(true);
      setSubcategories([]);
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
      // Filter out empty subcategory names
      const validSubcategories = subcategories.filter(sub => sub.name.trim() !== '');
      await api.put(`/admin/categories/${editingCategory._id}`, {
        name: categoryName,
        isActive,
        subcategories: validSubcategories
      });
      toast({
        title: 'Category Updated',
        description: `Category "${categoryName}" has been updated.`, 
      });
      setIsDialogOpen(false);
      setEditingCategory(null);
      setCategoryName('');
      setIsActive(true);
      setSubcategories([]);
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
    setIsActive(category.isActive ?? true);
    setSubcategories(category.subcategories ?? []);
    setIsDialogOpen(true);
  };

  const addSubcategory = () => {
    const newSubcategory = {
      _id: `temp-${Date.now()}-${Math.random()}`,
      name: '',
      isActive: true
    };
    setSubcategories([...subcategories, newSubcategory]);
  };

  const removeSubcategory = (index: number) => {
    setSubcategories(subcategories.filter((_, i) => i !== index));
  };

  const updateSubcategory = (index: number, field: keyof SubCategory, value: any) => {
    const updated = [...subcategories];
    updated[index] = { ...updated[index], [field]: value };
    setSubcategories(updated);
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    setCategoryName('');
    setIsActive(true);
    setSubcategories([]);
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
                  setSubcategories([]);
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

                  {/* Subcategories Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Subcategories</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addSubcategory}
                        disabled={isMutating}
                      >
                        <PlusCircle className="h-4 w-4 mr-1" />
                        Add Subcategory
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {subcategories.map((subcategory, index) => (
                        <div key={subcategory._id || `sub-${index}`} className="flex items-center gap-2 p-2 border rounded">
                          <Input
                            value={subcategory.name}
                            onChange={(e) => updateSubcategory(index, 'name', e.target.value)}
                            placeholder="Subcategory name"
                            className="flex-1"
                            disabled={isMutating}
                          />
                          <Checkbox
                            checked={subcategory.isActive ?? true}
                            onCheckedChange={(checked) => updateSubcategory(index, 'isActive', !!checked)}
                            disabled={isMutating}
                          />
                          <Label className="text-xs">Active</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeSubcategory(index)}
                            disabled={isMutating}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {subcategories.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No subcategories added yet
                        </p>
                      )}
                    </div>
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
                  <TableHead>SUBCATEGORIES</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No categories found.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category) => (
                    <>
                      <TableRow key={category._id}>
                        <TableCell className="font-medium">{category._id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {(category.subcategories && category.subcategories.length > 0) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleCategoryExpansion(category._id)}
                                className="p-0 h-4 w-4"
                              >
                                {expandedCategories.has(category._id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            {category.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          {category.subcategories && category.subcategories.length > 0 ? (
                            <Badge variant="outline">
                              {category.subcategories.length} subcategories
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">None</span>
                          )}
                        </TableCell>
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
                      {/* Subcategories rows */}
                      {expandedCategories.has(category._id) && category.subcategories && category.subcategories.map((subcategory, index) => (
                        <TableRow key={subcategory._id || `${category._id}-sub-${index}`} className="bg-muted/30">
                          <TableCell></TableCell>
                          <TableCell className="pl-8">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-primary rounded-full"></span>
                              {subcategory.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              Subcategory
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={subcategory.isActive ? 'default' : 'secondary'} className="text-xs">
                              {subcategory.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      ))}
                    </>
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

