import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, X } from 'lucide-react';
import { ProductVariant } from '@/types';

interface LocationData {
  _id: string;
  name: string;
  displayName: string;
}

interface InventoryEntry {
  locationId?: string;
  locationName: string;
  displayName: string;
  stock: Array<{
    variantIndex: number;
    quantity: number;
  }>;
}

interface LocationInventoryManagerProps {
  inventoryData: InventoryEntry[];
  locations: LocationData[];
  variants: ProductVariant[];
  onAddLocation: (locationId: string) => void;
  onRemoveLocation: (locationId: string) => void;
  onUpdateStock: (locationId: string, variantIndex: number, quantity: number) => void;
}

export function LocationInventoryManager({
  inventoryData,
  locations,
  variants,
  onAddLocation,
  onRemoveLocation,
  onUpdateStock
}: LocationInventoryManagerProps) {
  // Get available locations that haven't been added yet
  const availableLocations = locations.filter(
    loc => !inventoryData.some(inv => inv.locationId === loc._id || inv.locationName === loc.name)
  );

  return (
    <div className="space-y-4 border-t pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Label className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Inventory Setup by Location
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            Add locations and set stock quantities for each variant
          </p>
        </div>

        {availableLocations.length > 0 && (
          <Select onValueChange={onAddLocation}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="+ Add Location" />
            </SelectTrigger>
            <SelectContent>
              {availableLocations.map(location => (
                <SelectItem key={location._id} value={location._id}>
                  {location.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {inventoryData.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 font-medium">No locations added yet</p>
          <p className="text-sm text-gray-500 mt-1">Add at least one location to set up inventory</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inventoryData.map((inventoryEntry, locationIndex) => {
            const totalStock = inventoryEntry.stock.reduce((sum, item) => sum + item.quantity, 0);
            const locationObj = locations.find(loc => loc._id === inventoryEntry.locationId || loc.name === inventoryEntry.locationName);

            return (
              <div
                key={inventoryEntry.locationName}
                className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-slate-50"
              >
                {/* Location Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-base">{inventoryEntry.displayName}</h4>
                      <p className="text-xs text-muted-foreground">Location {locationIndex + 1}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Total: {totalStock} units
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveLocation(inventoryEntry.locationId || '')}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Stock Inputs Grid */}
                {variants.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {inventoryEntry.stock.map((stockItem, stockIndex) => {
                      const variant = variants[stockItem.variantIndex];
                      const variantLabel = variant ? `${variant.value} (₹${variant.originalPrice})` : 'Unknown Variant';

                      return (
                        <div key={stockIndex} className="bg-white border rounded-lg p-3 shadow-sm">
                          <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                            {variantLabel}
                          </Label>

                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={stockItem.quantity}
                              onChange={(e) => {
                                const quantity = Math.max(0, Number(e.target.value) || 0);
                                onUpdateStock(
                                  inventoryEntry.locationId || inventoryEntry.locationName,
                                  stockItem.variantIndex,
                                  quantity
                                );
                              }}
                              placeholder="0"
                              min="0"
                              className="text-center font-semibold"
                            />
                            <span className="text-sm font-medium w-6 text-center">
                              {stockItem.quantity === 0 ? '🚫' : '✅'}
                            </span>
                          </div>

                          <p className="text-xs text-muted-foreground mt-1">
                            {stockItem.quantity} units in stock
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // Single Product (No Variants)
                  <div className="bg-white border rounded-lg p-4 max-w-md">
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Product Stock Quantity
                    </Label>

                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        value={inventoryEntry.stock[0]?.quantity || 0}
                        onChange={(e) => {
                          const quantity = Math.max(0, Number(e.target.value) || 0);
                          onUpdateStock(
                            inventoryEntry.locationId || inventoryEntry.locationName,
                            0,
                            quantity
                          );
                        }}
                        placeholder="0"
                        min="0"
                        className="text-center font-semibold"
                      />
                      <span className="text-sm font-medium whitespace-nowrap">
                        {(inventoryEntry.stock[0]?.quantity || 0) === 0 ? '🚫 Empty' : '✅ In Stock'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Location Summary */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-700">Total Stock for this Location:</span>
                    <span className="font-bold text-lg text-blue-600">{totalStock} units</span>
                  </div>

                  {/* Stock Status Indicator */}
                  {totalStock === 0 && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      ⚠️ No stock at this location. Please add inventory before saving.
                    </div>
                  )}
                  {totalStock > 0 && totalStock <= 5 && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                      ⚠️ Low stock alert. Consider restocking.
                    </div>
                  )}
                  {totalStock > 5 && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                      ✓ Adequate stock available
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Summary Card */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h5 className="font-semibold text-sm text-blue-900 mb-2">📍 Inventory Summary</h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-2 rounded border">
                <p className="text-muted-foreground">Locations Configured</p>
                <p className="font-bold text-lg text-blue-600">{inventoryData.length}</p>
              </div>
              <div className="bg-white p-2 rounded border">
                <p className="text-muted-foreground">Total Units</p>
                <p className="font-bold text-lg text-blue-600">
                  {inventoryData.reduce((sum, inv) => sum + inv.stock.reduce((s, st) => s + st.quantity, 0), 0)}
                </p>
              </div>
              <div className="bg-white p-2 rounded border">
                <p className="text-muted-foreground">Empty Locations</p>
                <p className="font-bold text-lg text-red-600">
                  {inventoryData.filter(inv => inv.stock.every(s => s.quantity === 0)).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}