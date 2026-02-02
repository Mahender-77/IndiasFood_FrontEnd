import { ProductVariant } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, MapPin, X } from 'lucide-react';

interface StoreLocation {
  storeId: string;
  name: string;
  displayName: string;
}

interface VariantStockEntry {
  storeId: string;
  quantity: number;
}


interface VariantBuilderProps {
  variants: ProductVariant[];
  locations: StoreLocation[];
  variantStocks: VariantStockEntry[][];
  onAddVariant: () => void;
  onRemoveVariant: (index: number) => void;
  onUpdateVariant: (
    index: number,
    field: keyof ProductVariant,
    value: any
  ) => void;
  onAddLocationToVariant: (variantIndex: number, storeId: string) => void;
  onRemoveLocationFromVariant: (variantIndex: number, storeId: string) => void;
  onUpdateVariantStock: (
    variantIndex: number,
    storeId: string,
    quantity: number
  ) => void;
  isEditing?: boolean;
}


export function VariantBuilder({
  variants,
  onAddVariant,
  onRemoveVariant,
  onUpdateVariant,
  locations,
  variantStocks = [],
  onUpdateVariantStock,
  onAddLocationToVariant,
  onRemoveLocationFromVariant,
  isEditing = false
}: VariantBuilderProps) {
  return (
    <div className="space-y-4 border-t pt-6">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-lg font-semibold">Product Variants</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Create multiple variations of your product (e.g., different weights or pack sizes)
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddVariant}
          className="flex-shrink-0"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Variant
        </Button>
      </div>

      {variants.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <div className="text-gray-500 text-sm">
            <p className="font-medium mb-1">No variants added yet</p>
            <p>Add variants to create a multi-variant product with individual pricing</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>💡 Variant Pricing:</strong> Each variant can have its own price. 
              Examples: "200g", "500g", "1kg", "12pcs", "small", "large"
            </p>
          </div>

          {variants.map((variant, index) => {
            const isValid = variant.value?.trim() && variant.originalPrice > 0;
            return (
              <div
                key={index}
                className={`border rounded-lg p-4 transition-colors ${
                  isValid
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                {/* Header Row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">Variant {index + 1}</span>
                    {isValid ? (
                      <Badge className="text-xs bg-green-100 text-green-800 border-0">
                        ✓ Complete
                      </Badge>
                    ) : (
                      <Badge className="text-xs bg-red-100 text-red-800 border-0">
                        ⚠ Incomplete
                      </Badge>
                    )}
                  </div>

                  {variants.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveVariant(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-100 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Input Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Type */}
                  <div>
                    <Label htmlFor={`variant-type-${index}`} className="text-sm font-medium">
                      Type
                    </Label>
                    <Select
                      value={variant.type || 'weight'}
                      onValueChange={(value: 'weight' | 'pieces' | 'box') =>
                        onUpdateVariant(index, 'type', value)
                      }
                    >
                      <SelectTrigger id={`variant-type-${index}`} className="mt-1 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weight">
                          <span className="flex items-center gap-2">⚖️ Weight</span>
                        </SelectItem>
                        <SelectItem value="pieces">
                          <span className="flex items-center gap-2">#️⃣ Pieces</span>
                        </SelectItem>
                        <SelectItem value="box">
                          <span className="flex items-center gap-2">📦 Box</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Value/Size */}
                  <div>
                    <Label htmlFor={`variant-value-${index}`} className="text-sm font-medium">
                      Value *
                    </Label>
                    <Input
                      id={`variant-value-${index}`}
                      value={variant.value || ''}
                      onChange={(e) => onUpdateVariant(index, 'value', e.target.value)}
                      placeholder={
                        variant.type === 'weight'
                          ? 'e.g., 200g, 1kg'
                          : variant.type === 'pieces'
                          ? 'e.g., 12pcs, 24pcs'
                          : 'e.g., small, large'
                      }
                      className="mt-1 text-sm"
                    />
                  </div>

                  {/* Original Price */}
                  <div>
                    <Label htmlFor={`variant-price-${index}`} className="text-sm font-medium">
                      Price (₹) *
                    </Label>
                    <Input
                      id={`variant-price-${index}`}
                      type="number"
                      value={variant.originalPrice || ''}
                      onChange={(e) => onUpdateVariant(index, 'originalPrice', Number(e.target.value) || 0)}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="mt-1 text-sm"
                    />
                  </div>

                  {/* Offer Price */}
                  <div>
                    <Label htmlFor={`variant-offer-${index}`} className="text-sm font-medium">
                      Offer Price (₹)
                    </Label>
                    <Input
                      id={`variant-offer-${index}`}
                      type="number"
                      value={variant.offerPrice || ''}
                      onChange={(e) => onUpdateVariant(index, 'offerPrice',
                        e.target.value ? Number(e.target.value) : undefined
                      )}
                      placeholder="Optional"
                      min="0"
                      step="0.01"
                      className="mt-1 text-sm"
                    />
                  </div>
                </div>

                {/* Validation Messages */}
                <div className="mt-3 space-y-1 text-xs">
                  {!variant.value?.trim() && (
                    <p className="text-red-600 flex items-center gap-1">
                      ✗ Variant value is required
                    </p>
                  )}
                  {variant.originalPrice <= 0 && (
                    <p className="text-red-600 flex items-center gap-1">
                      ✗ Price must be greater than 0
                    </p>
                  )}
                  {variant.offerPrice !== undefined && variant.offerPrice > 0 &&
                   variant.offerPrice >= variant.originalPrice && (
                    <p className="text-red-600 flex items-center gap-1">
                      ✗ Offer price must be less than original price
                    </p>
                  )}
                  {isValid && (
                    <p className="text-green-600 flex items-center gap-1">
                      ✓ Variant is valid
                    </p>
                  )}
                </div>

                {/* Location & Stock Management for this Variant */}
                {isValid && (
                  <div className="mt-4 p-3 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <Label className="text-sm font-medium">Stock Locations for {variant.value}</Label>
                      </div>
                      <Select
                        onValueChange={(locationId) => onAddLocationToVariant?.(index, locationId)}
                        value=""
                      >
                        <SelectTrigger className="w-40 text-xs">
                          <SelectValue placeholder="Add Location" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations
                            .filter(loc => !variantStocks[index]?.some(stock => stock.storeId === loc.storeId))
                            .map(location => (
                              <SelectItem key={location.storeId} value={location.storeId}>
                                {location.displayName}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {(!variantStocks[index] || variantStocks[index].length === 0) ? (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        <MapPin className="h-5 w-5 mx-auto mb-2 opacity-50" />
                        <p>No locations selected for this variant</p>
                        <p className="text-xs">Add locations above to set stock quantities</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {variantStocks[index].map((stock) => {
                          const location = locations.find(loc => loc.storeId === stock.storeId);
                          return (
                            <div key={stock.storeId} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg bg-gray-50">
                              <div className="flex-1">
                                <Label className="text-xs font-medium text-gray-700">
                                  {location?.displayName}
                                </Label>
                                <Input
                                  type="number"
                                  value={stock.quantity}
                                  onChange={(e) => onUpdateVariantStock?.(index, stock.storeId, Math.max(0, Number(e.target.value)))}
                                  placeholder="0"
                                  min="0"
                                  className="mt-1 text-sm h-8"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => onRemoveLocationFromVariant?.(index, stock.storeId)}
                                className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {variantStocks[index]?.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-gray-200">
                        <div className="text-xs text-gray-600">
                          <strong>Total Stock:</strong> {variantStocks[index].reduce((sum, stock) => sum + stock.quantity, 0)} units
                          across {variantStocks[index].length} location{variantStocks[index].length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Summary Info */}
          {variants.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>📊 Variant Summary:</strong> {variants.length} variant{variants.length !== 1 ? 's' : ''} configured
                {variants.filter(v => v.value?.trim() && v.originalPrice > 0).length === variants.length && (
                  <span className="ml-2 text-green-700">✓ All complete</span>
                )}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}