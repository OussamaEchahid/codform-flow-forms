
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShopifyProduct } from '@/lib/shopify/types';
import { Badge } from '@/components/ui/badge';

interface ShopifyProductsListProps {
  products: ShopifyProduct[];
}

const ShopifyProductsList: React.FC<ShopifyProductsListProps> = ({ products }) => {
  if (!products || products.length === 0) {
    return <div className="text-center p-4">لا توجد منتجات متاحة</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <Card key={product.id} className="overflow-hidden">
          <CardHeader className="p-0">
            {product.images && product.images.length > 0 ? (
              <img 
                src={product.images[0]} 
                alt={product.title} 
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">لا توجد صورة</span>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-4">
            <CardTitle className="text-lg mb-2 truncate">{product.title}</CardTitle>
            <div className="flex justify-between items-center mt-2">
              <span className="font-bold">{product.price} USD</span>
              <Badge variant="outline">{product.variants?.length || 0} متغيرات</Badge>
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-0 flex justify-between">
            <span className="text-sm text-gray-500">المعرف: {product.id.split('/').pop()}</span>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default ShopifyProductsList;
