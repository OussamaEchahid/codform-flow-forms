
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ShopifyProductsList from '@/components/shopify/ShopifyProductsList';
import { ShopifyProduct } from '@/lib/shopify/types';

interface ProductSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectProduct: (productId: string, productTitle: string) => void;
}

const ProductSelectionDialog: React.FC<ProductSelectionDialogProps> = ({
  open,
  onClose,
  onSelectProduct
}) => {
  const { language } = useI18n();
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedProductTitle, setSelectedProductTitle] = useState<string>('');
  
  // Fetch products when dialog is opened
  useEffect(() => {
    if (open) {
      fetchProducts();
    }
  }, [open]);
  
  // Get the current shop ID from localStorage
  const getShopId = () => {
    return localStorage.getItem('shopify_store');
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const shopId = getShopId();
      
      if (!shopId) {
        console.error("No shop ID found in localStorage");
        return;
      }
      
      // Fetch real products from Supabase function
      const { data, error } = await supabase.functions.invoke('shopify-products', {
        body: { shop: shopId }
      });
      
      if (error) {
        console.error("Error fetching products:", error);
        return;
      }
      
      // Filter out test products (if there are any)
      const filteredProducts = data.products.filter((product: any) => 
        !product.title.toLowerCase().includes('test') && 
        !product.title.toLowerCase().includes('sample')
      );
      
      setProducts(filteredProducts);
    } catch (error) {
      console.error("Error in fetchProducts:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleProductSelect = (product: ShopifyProduct) => {
    // Extract the product ID (last part after the last slash if present)
    const productId = product.id.includes('/') ? product.id.split('/').pop()! : product.id;
    setSelectedProduct(productId);
    setSelectedProductTitle(product.title);
  };
  
  const handleConfirmSelection = () => {
    if (selectedProduct) {
      onSelectProduct(selectedProduct, selectedProductTitle);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>
            {language === 'ar' ? 'اختر منتجًا للنموذج' : 'Select Product for Form'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ar' 
              ? 'اختر المنتج الذي سيتم عرض النموذج المخصص عليه'
              : 'Select the product where this custom form will be displayed'}
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="mr-2">
              {language === 'ar' ? 'جاري تحميل المنتجات...' : 'Loading products...'}
            </span>
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto">
            <div className="mb-4 bg-gray-100 p-2 rounded text-sm">
              {language === 'ar' 
                ? 'انقر على منتج لاختياره' 
                : 'Click on a product to select it'}
            </div>
            
            {products.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500">
                  {language === 'ar' ? 'لم يتم العثور على منتجات' : 'No products found'}
                </p>
              </div>
            ) : (
              <div className="grid gap-2">
                {products.map((product) => (
                  <div 
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    className={`border p-3 rounded cursor-pointer flex items-center ${
                      selectedProduct === (product.id.includes('/') ? product.id.split('/').pop() : product.id) 
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {product.images && product.images.length > 0 ? (
                      <img 
                        src={product.images[0]} 
                        alt={product.title}
                        className="w-12 h-12 object-cover rounded mr-3"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/60x60/eee/ccc?text=No+Image';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center mr-3">
                        <span className="text-xs text-gray-500">No img</span>
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium">{product.title}</h4>
                      <p className="text-sm text-gray-500">
                        ID: {product.id.includes('/') ? product.id.split('/').pop() : product.id}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button 
            onClick={handleConfirmSelection} 
            disabled={!selectedProduct || isLoading}
          >
            {language === 'ar' ? 'استخدام المنتج المحدد' : 'Use Selected Product'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductSelectionDialog;
