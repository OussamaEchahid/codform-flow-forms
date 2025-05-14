
import React, { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShopifyProduct } from '@/lib/shopify/types';
import { Badge } from '@/components/ui/badge';

interface ShopifyProductsListProps {
  products: ShopifyProduct[];
  hideTestProducts?: boolean;
}

const ShopifyProductsList: React.FC<ShopifyProductsListProps> = ({ 
  products,
  hideTestProducts = true
}) => {
  // تحسين الدالة لتصفية المنتجات التجريبية بشكل أفضل
  const filteredProducts = useMemo(() => {
    if (!hideTestProducts || !products || products.length === 0) {
      return products;
    }
    
    return products.filter(product => {
      const title = product.title?.toLowerCase() || '';
      const handle = product.handle?.toLowerCase() || '';
      const tags = product.tags ? (Array.isArray(product.tags) ? product.tags.join(' ').toLowerCase() : product.tags.toLowerCase()) : '';
      
      // توسيع نطاق التصفية لتشمل المزيد من الكلمات الدالة على المنتجات التجريبية
      const testKeywords = ['test', 'demo', 'sample', 'example', 'dummy', 'trial'];
      
      // التحقق من وجود أي من الكلمات المفتاحية في العنوان أو المعرف أو الوسوم
      return !testKeywords.some(keyword => 
        title.includes(keyword) || 
        handle.includes(keyword) || 
        tags.includes(keyword)
      );
    });
  }, [products, hideTestProducts]);
  
  if (!filteredProducts || filteredProducts.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        لا توجد منتجات لعرضها
      </div>
    );
  }

  // Helper function to format price safely
  const formatPrice = (price: string | number | undefined): string => {
    if (price === undefined) return '$0.00';
    
    if (typeof price === 'string') {
      const numPrice = parseFloat(price);
      return isNaN(numPrice) ? '$0.00' : `$${numPrice.toFixed(2)}`;
    }
    
    if (typeof price === 'number') {
      return `$${price.toFixed(2)}`;
    }
    
    return '$0.00';
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">الصورة</TableHead>
              <TableHead>اسم المنتج</TableHead>
              <TableHead>المعرف</TableHead>
              <TableHead className="text-right">السعر</TableHead>
              <TableHead className="text-right">المخزون</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  {product.images && product.images.length > 0 ? (
                    <img 
                      src={product.images[0]} 
                      alt={product.title} 
                      className="w-16 h-16 object-cover rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/60x60/eee/ccc?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-400">لا توجد صورة</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{product.title}</TableCell>
                <TableCell className="text-xs text-gray-500 font-mono">
                  {product.id.includes('/') 
                    ? product.id.split('/').pop() 
                    : product.id}
                </TableCell>
                <TableCell className="text-right">
                  {formatPrice(product.price)}
                </TableCell>
                <TableCell className="text-right">
                  {product.variants && product.variants.length > 0 ? (
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={product.variants.some(v => v.available) ? "success" : "destructive"}>
                        {product.variants.some(v => v.available) ? "متوفر" : "غير متوفر"}
                      </Badge>
                      <span className="text-xs text-gray-500">{product.variants.length} متغير</span>
                    </div>
                  ) : (
                    <Badge variant="outline">غير معروف</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="bg-gray-50 p-3 rounded border text-sm text-gray-600">
        <p className="text-right">إجمالي المنتجات: {filteredProducts.length}</p>
      </div>
    </div>
  );
};

export default ShopifyProductsList;
