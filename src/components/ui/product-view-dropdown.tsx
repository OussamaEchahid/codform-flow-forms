import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Eye, ExternalLink } from 'lucide-react';
import { getActiveShopId } from '@/utils/shop-utils';

interface AssociatedProduct {
  id: string;
  title: string;
  image: string;
}

interface ProductViewDropdownProps {
  products: AssociatedProduct[];
  language?: 'ar' | 'en';
}

export const ProductViewDropdown: React.FC<ProductViewDropdownProps> = ({
  products,
  language = 'ar'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Get shop domain for product URLs
  const getShopDomain = () => {
    const shopId = getActiveShopId();
    if (!shopId) return null;
    
    // Remove .myshopify.com if present and add it back
    const cleanShopId = shopId.replace('.myshopify.com', '');
    return `${cleanShopId}.myshopify.com`;
  };

  // Generate product URL
  const getProductUrl = (productId: string) => {
    const shopDomain = getShopDomain();
    if (!shopDomain) return '#';

    // Clean product ID if it contains gid prefix
    const cleanProductId = productId.replace('gid://shopify/Product/', '');
    return `https://${shopDomain}/admin/products/${cleanProductId}`;
  };

  // Handle single product click
  const handleSingleProductClick = () => {
    if (products.length === 1) {
      const url = getProductUrl(products[0].id);
      window.open(url, '_blank');
    }
  };

  // Handle multiple products dropdown item click
  const handleProductClick = (productId: string) => {
    const url = getProductUrl(productId);
    window.open(url, '_blank');
    setIsOpen(false);
  };

  // No products case
  if (!products || products.length === 0) {
    return (
      <Button
        variant="ghost"
        size="icon"
        disabled
        title={language === 'ar' ? 'لا توجد منتجات مرتبطة' : 'No associated products'}
      >
        <Eye size={16} className="text-muted-foreground" />
      </Button>
    );
  }

  // Single product case - direct click
  if (products.length === 1) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleSingleProductClick}
        title={language === 'ar' 
          ? `عرض المنتج: ${products[0].title}` 
          : `View product: ${products[0].title}`
        }
      >
        <Eye size={16} />
      </Button>
    );
  }

  // Multiple products case - dropdown
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title={language === 'ar'
            ? `عرض ${products.length} منتج مرتبط`
            : `View ${products.length} associated products`
          }
        >
          <Eye size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72"
        side="bottom"
        sideOffset={5}
      >
        <div className="px-3 py-2 text-sm font-medium text-muted-foreground border-b bg-muted/50">
          {language === 'ar'
            ? `المنتجات المرتبطة (${products.length})`
            : `Associated Products (${products.length})`
          }
        </div>
        {products.map((product, index) => (
          <DropdownMenuItem
            key={product.id}
            onClick={() => handleProductClick(product.id)}
            className="flex items-center gap-3 py-2 cursor-pointer"
          >
            <div className="flex items-center gap-2 flex-1">
              <span className="flex items-center justify-center w-6 h-6 bg-primary/10 text-primary text-xs font-medium rounded-full">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {product.title}
                </div>
                <div className="text-xs text-muted-foreground">
                  ID: {product.id.replace('gid://shopify/Product/', '')}
                </div>
              </div>
            </div>
            <ExternalLink size={14} className="text-muted-foreground" />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
