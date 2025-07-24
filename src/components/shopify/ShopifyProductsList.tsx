
import React, { memo } from 'react';
import { ShopifyProduct } from '@/lib/shopify/types';
import { Badge } from '@/components/ui/badge';

interface ShopifyProductsListProps {
  products: ShopifyProduct[];
  onSelectProduct?: (productId: string) => void;
  selectedProductIds?: string[];
}

const ShopifyProductsList: React.FC<ShopifyProductsListProps> = memo(({ 
  products, 
  onSelectProduct,
  selectedProductIds = []
}) => {
  const getProductImage = (product: ShopifyProduct): string | undefined => {
    if (product.image) {
      return typeof product.image === 'string' ? product.image : product.image.src;
    } else if (product.images && product.images.length > 0) {
      return typeof product.images[0] === 'string' ? product.images[0] : product.images[0].src;
    }
    return undefined;
  };

  const getProductImageAlt = (product: ShopifyProduct): string => {
    if (product.image && typeof product.image !== 'string' && product.image.alt) {
      return product.image.alt;
    }
    return product.title;
  };

  // Format price with correct currency
  const formatProductPrice = (product: ShopifyProduct): string => {
    const price = parseFloat(product.price || '0');
    
    if (product.money_format) {
      return product.money_format.replace('{{amount}}', price.toFixed(2));
    }
    
    if (product.currency) {
      return `${price.toFixed(2)} ${product.currency}`;
    }
    
    return `$${price.toFixed(2)}`;
  };

  return (
    <div className="space-y-4">
      {products.length === 0 ? (
        <div className="text-center p-6 bg-gray-50 rounded-md">
          <p className="text-gray-500">No products found</p>
        </div>
      ) : (
        products.map(product => (
          <div 
            key={product.id} 
            className={`mb-4 p-4 border rounded-md transition-colors ${
              selectedProductIds.includes(product.id) 
                ? 'border-primary/70 bg-primary/5' 
                : 'hover:bg-gray-50'
            } ${onSelectProduct ? 'cursor-pointer' : ''}`}
            onClick={() => onSelectProduct && onSelectProduct(product.id)}
          >
            <div className="flex items-start">
              {getProductImage(product) ? (
                <img 
                  src={getProductImage(product)}
                  alt={getProductImageAlt(product)}
                  className="w-20 h-20 object-contain mr-4"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-200 flex items-center justify-center mr-4">
                  <span className="text-gray-500">No Image</span>
                </div>
              )}
              
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold">{product.title}</h3>
                  {selectedProductIds.includes(product.id) && (
                    <Badge className="ml-2" variant="default">Selected</Badge>
                  )}
                </div>
                
                <p className="text-gray-600">{product.price ? formatProductPrice(product) : 'No price'}</p>
                
                {/* Status badge */}
                <div className="mt-1 mb-2">
                  <Badge 
                    variant={
                      product.status === 'active' ? 'success' :
                      product.status === 'draft' ? 'secondary' : 'destructive'
                    }
                  >
                    {product.status}
                  </Badge>
                </div>
                
                {/* Handle variants section conditionally */}
                {product.variants && product.variants.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-sm font-medium">Variants: {product.variants.length}</h4>
                    {product.variants.slice(0, 1).map(variant => {
                      const variantPrice = product.money_format 
                        ? product.money_format.replace('{{amount}}', parseFloat(variant.price).toFixed(2))
                        : `${parseFloat(variant.price).toFixed(2)} ${product.currency || 'USD'}`;
                      
                      return (
                        <p key={variant.id} className="text-sm text-gray-500">
                          {variant.title}: {variantPrice}
                          {variant.inventory_quantity !== undefined && (
                            <span className="ml-2">{variant.inventory_quantity} in stock</span>
                          )}
                        </p>
                      );
                    })}
                    {product.variants.length > 1 && (
                      <p className="text-xs text-gray-400">{product.variants.length - 1} more variants...</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
});

export default ShopifyProductsList;
