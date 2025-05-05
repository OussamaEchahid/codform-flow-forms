
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShopifyProduct } from '@/lib/shopify/types';
import { Badge } from '@/components/ui/badge';

interface ShopifyProductsListProps {
  products: ShopifyProduct[];
}

const ShopifyProductsList: React.FC<ShopifyProductsListProps> = ({ products }) => {
  if (!products || products.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        لا توجد منتجات لعرضها
      </div>
    );
  }

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
            {products.map((product) => (
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
                  {typeof product.price === 'string' 
                    ? `$${parseFloat(product.price).toFixed(2)}` 
                    : `$${product.price.toFixed(2)}`}
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
        <p className="text-right">إجمالي المنتجات: {products.length}</p>
      </div>
    </div>
  );
};

export default ShopifyProductsList;
