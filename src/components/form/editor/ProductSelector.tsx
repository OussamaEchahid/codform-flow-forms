import React, { useEffect } from 'react';
import { useSimpleShopify } from '@/hooks/useSimpleShopify';
import { useI18n } from '@/lib/i18n';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface ProductSelectorProps {
  value: string;
  onChange: (productId: string) => void;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({ value, onChange }) => {
  const { language } = useI18n();
  const { products, loadProducts, loading } = useSimpleShopify();

  useEffect(() => {
    if (!products || products.length === 0) {
      loadProducts();
    }
  }, [products, loadProducts]);

  const handleRefresh = () => {
    loadProducts();
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="text-sm text-gray-600">
          {language === 'ar' ? 'جاري تحميل المنتجات...' : 'Loading products...'}
        </span>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          {language === 'ar' ? 'لم يتم العثور على منتجات' : 'No products found'}
        </p>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          {language === 'ar' ? 'تحديث' : 'Refresh'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={language === 'ar' ? 'اختر منتج' : 'Select a product'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">
            {language === 'ar' ? 'لا شيء' : 'None'}
          </SelectItem>
          {products.map((product) => (
            <SelectItem key={product.id} value={product.id}>
              <div className="flex items-center space-x-2">
                {product.image && (
                  <img 
                    src={typeof product.image === 'string' ? product.image : product.image.src} 
                    alt={product.title}
                    className="w-6 h-6 rounded object-cover"
                  />
                )}
                <span>{product.title}</span>
                {product.variants?.[0]?.price && (
                  <span className="text-sm text-gray-500">
                    ({product.variants[0].price})
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="outline" size="sm" onClick={handleRefresh} className="w-full">
        <RefreshCw className="w-4 h-4 mr-2" />
        {language === 'ar' ? 'تحديث المنتجات' : 'Refresh Products'}
      </Button>
    </div>
  );
};

export default ProductSelector;