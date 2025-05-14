
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useShopify } from '@/hooks/useShopify';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProductSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (productId: string, productTitle: string) => void;
}

const ProductSelectionDialog: React.FC<ProductSelectionDialogProps> = ({ 
  open, 
  onClose, 
  onSelect 
}) => {
  const { loadProducts, products, isLoading } = useShopify();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadProducts();
    }
  }, [open, loadProducts]);

  const handleSelectProduct = () => {
    if (!selectedProductId) {
      toast.error('الرجاء اختيار منتج');
      return;
    }

    const selectedProduct = products.find(p => p.id === selectedProductId);
    if (selectedProduct) {
      onSelect(selectedProduct.id, selectedProduct.title);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">اختيار المنتج</DialogTitle>
        </DialogHeader>

        <div className="py-4" dir="rtl">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              <span className="mr-3">جاري تحميل المنتجات...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center p-4">
              <p className="text-gray-500">لا توجد منتجات متاحة</p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              <div className="space-y-2">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={`p-3 border rounded-md cursor-pointer transition-colors ${
                      selectedProductId === product.id ? 'border-primary bg-primary/10' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedProductId(product.id)}
                  >
                    <div className="flex items-center">
                      {product.image ? (
                        <img 
                          src={product.image.src} 
                          alt={product.title} 
                          className="w-12 h-12 object-cover rounded mr-3" 
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded mr-3 flex items-center justify-center text-gray-400">
                          صورة غير متوفرة
                        </div>
                      )}
                      <div className="flex-1 mr-3">
                        <h4 className="font-medium text-gray-900">{product.title}</h4>
                        <p className="text-sm text-gray-500">{product.vendor}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button 
            onClick={handleSelectProduct}
            disabled={!selectedProductId || isLoading}
          >
            اختيار المنتج
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductSelectionDialog;
