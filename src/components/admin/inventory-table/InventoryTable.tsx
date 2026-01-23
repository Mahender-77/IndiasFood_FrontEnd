import { Product, Category } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit, Warehouse, Image as ImageIcon, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface Location {
  _id: string;
  name: string;
  displayName: string;
}

interface InventoryTableProps {
  products: Product[];
  categories: Category[];
  locations: Location[];
  onEditProduct: (product: Product) => void;
  getLocationStock: (product: Product, locationName: string) => number;
  onUpdateStock?: (productId: string, location: string, variantIndex: number, quantity: number) => void;
  updatingStocks?: Set<string>;
}

export function InventoryTable({
  products,
  categories,
  locations,
  onEditProduct,
  getLocationStock,
  onUpdateStock,
  updatingStocks = new Set()
}: InventoryTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRowExpanded = (productId: string) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(productId)) {
      newSet.delete(productId);
    } else {
      newSet.add(productId);
    }
    setExpandedRows(newSet);
  };

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Warehouse className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">No products found</p>
          <p className="text-sm text-muted-foreground">
            Products will appear here once added to the database
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-0">
        {/* Desktop View */}
        <div className="hidden lg:block overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[70px] py-4">Image</TableHead>
                <TableHead className="min-w-[200px] py-4">Product</TableHead>
                <TableHead className="min-w-[130px] py-4">Category</TableHead>
                <TableHead className="min-w-[130px] py-4">Subcategory</TableHead>
                <TableHead className="min-w-[180px] py-4">Pricing</TableHead>
                <TableHead className="min-w-[130px] py-4">Variants</TableHead>
                <TableHead className="min-w-[220px] py-4">Stock by Location</TableHead>
                <TableHead className="w-[90px] text-center py-4">Status</TableHead>
                <TableHead className="w-[80px] text-center py-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map(product => {
                const categoryId = (product.category as any)?._id || product.category;
                const categoryName = categories.find(cat => cat._id === categoryId)?.name || 'Unknown';

                return (
                  <TableRow key={product._id} className="hover:bg-gray-50 transition-colors">
                    {/* Image */}
                    <TableCell className="py-3">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-14 h-14 object-cover rounded-lg shadow-sm"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center border">
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </TableCell>

                    {/* Product Name & Badges */}
                    <TableCell className="py-3">
                      <div className="space-y-2">
                        <div className="font-semibold text-sm text-gray-900">{product.name}</div>
                        <div className="flex flex-wrap gap-1">
                          {product.isGITagged && (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 font-medium">
                              🏷️ GI Tagged
                            </Badge>
                          )}
                          {product.isNewArrival && (
                            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 font-medium">
                              ✨ New
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs font-medium">
                            {product.variants && product.variants.length > 0 ? 'Multi-Variant' : 'Single'}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>

                    {/* Category */}
                    <TableCell className="py-3">
                      <Badge variant="outline" className="text-xs font-medium">{categoryName}</Badge>
                    </TableCell>

                    {/* Subcategory */}
                    <TableCell className="py-3">
                      {product.subcategory ? (
                        <Badge variant="outline" className="text-xs font-medium bg-blue-50 text-blue-700 border-blue-200">
                          {product.subcategory.charAt(0).toUpperCase() + product.subcategory.slice(1)}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Pricing */}
                    <TableCell className="py-3">
                      <div className="space-y-1.5">
                        {product.variants && product.variants.length > 0 ? (
                          <div className="space-y-1.5">
                            {product.variants.slice(0, 2).map((variant, index) => (
                              <div key={index} className="text-xs bg-gray-50 rounded px-2 py-1">
                                <div className="font-semibold text-gray-800">{variant.value}</div>
                                <div className="text-gray-600">
                                  <span className={variant.offerPrice ? 'line-through text-gray-400' : ''}>₹{variant.originalPrice}</span>
                                  {variant.offerPrice && <span className="text-green-600 font-medium ml-1">₹{variant.offerPrice}</span>}
                                </div>
                              </div>
                            ))}
                            {product.variants.length > 2 && (
                              <div className="text-xs text-muted-foreground font-medium">
                                +{product.variants.length - 2} more variants
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded px-2 py-1.5">
                            <div className={`font-bold text-sm ${product.offerPrice ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                              ₹{product.originalPrice || 'N/A'}
                            </div>
                            {product.offerPrice && (
                              <div className="text-sm text-green-600 font-bold">₹{product.offerPrice}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Variants Count */}
                    <TableCell className="py-3">
                      <div className="text-sm">
                        {product.variants && product.variants.length > 0 ? (
                          <Badge variant="outline" className="font-medium">{product.variants.length} variants</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">Single Product</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Stock by Location */}
                    <TableCell className="py-3">
                      <div className="space-y-1.5">
                      {locations.map(location => {
  const stock = getLocationStock(product, location.name) ?? 0; 
  // 👆 if null/undefined → treat as 0

  return (
    <div
      key={location._id}
      className="flex items-center justify-between text-sm gap-2"
    >
      <span className="text-gray-600 text-xs font-medium">
        {location.displayName}:
      </span>

      {stock === 0 ? (
        <Badge
          variant="destructive"
          className="text-xs font-medium"
        >
          Out of Stock
        </Badge>
      ) : (
        <Badge
          variant="secondary"
          className="text-xs bg-green-100 text-green-800 font-medium"
        >
          {stock} units
        </Badge>
      )}
    </div>
  );
})}

                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="text-center py-3">
                      <Badge 
                        variant={product.isActive ? "default" : "secondary"} 
                        className={`text-xs font-medium ${product.isActive ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400'}`}
                      >
                        {product.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-center py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEditProduct(product)}
                        className="hover:bg-orange-50 hover:border-orange-300"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View - Cards */}
        <div className="lg:hidden">
          {products.map(product => {
            const categoryId = (product.category as any)?._id || product.category;
            const categoryName = categories.find(cat => cat._id === categoryId)?.name || 'Unknown';
            const isExpanded = expandedRows.has(product._id);

            return (
              <div key={product._id} className="border-b last:border-b-0">
                {/* Card Header - Always Visible */}
                <div className="p-4 space-y-3">
                  <div className="flex gap-3">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    )}

                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1">{product.name}</h4>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {product.isGITagged && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                            🏷️ GI
                          </Badge>
                        )}
                        {product.isNewArrival && (
                          <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                            ✨ New
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">{categoryName}</Badge>
                        {product.subcategory && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            {product.subcategory.charAt(0).toUpperCase() + product.subcategory.slice(1)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pricing Summary */}
                  <div className="bg-orange-50 rounded p-2">
                    {product.variants && product.variants.length > 0 ? (
                      <div className="text-xs text-orange-800">
                        <span className="font-semibold">{product.variants.length} variants</span>
                        <div className="mt-1">
                          {product.variants.slice(0, 1).map((v, i) => (
                            <div key={i}>₹{v.originalPrice}{v.offerPrice && ` → ₹${v.offerPrice}`}</div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-orange-800">
                        <div className="font-semibold">₹{product.originalPrice || 'N/A'}</div>
                        {product.offerPrice && <div className="text-green-600">₹{product.offerPrice}</div>}
                      </div>
                    )}
                  </div>

                  {/* Status & Action Row */}
                  <div className="flex items-center justify-between">
                    <Badge variant={product.isActive ? "default" : "secondary"} className="text-xs">
                      {product.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEditProduct(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleRowExpanded(product._id)}
                      >
                        <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expandable Stock Details */}
                {isExpanded && (
                  <div className="border-t bg-gray-50 p-4 space-y-4">
                    <div>
                      <h5 className="font-semibold text-sm mb-2">Stock by Location</h5>
                      <div className="space-y-2">
                        {locations.map(location => {
                          const stock = getLocationStock(product, location.name);
                          return (
                            <div key={location._id} className="flex items-center justify-between text-sm bg-white p-2 rounded border">
                              <span className="font-medium">{location.displayName}</span>
                              {stock === 0 ? (
                                <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                  {stock} units
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Variants Details */}
                    {product.variants && product.variants.length > 0 && (
                      <div>
                        <h5 className="font-semibold text-sm mb-2">Variants ({product.variants.length})</h5>
                        <div className="space-y-2">
                          {product.variants.map((variant, index) => (
                            <div key={index} className="text-xs bg-white p-2 rounded border">
                              <div className="font-medium">{variant.value}</div>
                              <div className="text-muted-foreground">
                                ₹{variant.originalPrice}
                                {variant.offerPrice && ` → ₹${variant.offerPrice}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}