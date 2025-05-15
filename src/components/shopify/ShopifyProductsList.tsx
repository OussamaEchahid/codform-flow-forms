import React from 'react';
import { ShopifyProduct } from '@/lib/shopify/types';

interface ShopifyProductsListProps {
  products: ShopifyProduct[];
}

const ShopifyProductsList: React.FC<ShopifyProductsListProps> = ({ products }) => {
  return (
    <div>
      {products.map(product => (
        <div key={product.id} className="mb-4 p-4 border rounded-md">
          <div className="flex items-start">
            {product.image ? (
              <img 
                src={typeof product.image === 'string' ? product.image : product.image.src}
                alt={typeof product.image === 'string' ? product.title : product.image.alt || product.title}
                className="w-20 h-20 object-contain mr-4"
              />
            ) : product.images && product.images.length > 0 ? (
              <img 
                src={typeof product.images[0] === 'string' ? product.images[0] : product.images[0].src}
                alt={product.title}
                className="w-20 h-20 object-contain mr-4"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-200 flex items-center justify-center mr-4">
                <span className="text-gray-500">No Image</span>
              </div>
            )}
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{product.title}</h3>
              <p className="text-gray-600">{product.price ? `$${product.price}` : 'No price'}</p>
              
              {/* Handle variants section conditionally */}
              {product.variants && product.variants.length > 0 && (
                <div className="mt-2">
                  <h4 className="text-sm font-medium">Variants: {product.variants.length}</h4>
                  {product.variants.slice(0, 1).map(variant => (
                    <p key={variant.id} className="text-sm text-gray-500">
                      {variant.title}: ${variant.price} 
                      {variant.inventory_quantity !== undefined && (
                        <span className="ml-2">{variant.inventory_quantity} in stock</span>
                      )}
                    </p>
                  ))}
                  {product.variants.length > 1 && (
                    <p className="text-xs text-gray-400">{product.variants.length - 1} more variants...</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ShopifyProductsList;
