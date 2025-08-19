import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
interface ShopifyReconnectButtonProps {
  shopDomain?: string;
  onReconnectStart?: () => void;
  onReconnectComplete?: () => void;
}
const ShopifyReconnectButton: React.FC<ShopifyReconnectButtonProps> = ({
  shopDomain,
  onReconnectStart,
  onReconnectComplete
}) => {
  const [isReconnecting, setIsReconnecting] = useState(false);
  const handleReconnect = async () => {
    try {
      setIsReconnecting(true);
      onReconnectStart?.();

      // Clear existing connection data
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem('shopify_active_store');

      // Import connection manager and clear stores
      const {
        shopifyConnectionManager
      } = await import('@/lib/shopify/connection-manager');
      shopifyConnectionManager.clearAllStores();
      toast.info('تم مسح بيانات الاتصال القديمة، سيتم إعادة التوجيه...');

      // Redirect to Shopify connection
      const baseUrl = window.location.origin;
      const shopifyAuthUrl = shopDomain ? `https://7e4608874bbcc38afa1953948da28407.shopifypreview.com/admin/oauth/authorize?client_id=7e4608874bbcc38afa1953948da28407&scope=read_products,read_orders,write_products,write_orders&redirect_uri=${encodeURIComponent(baseUrl + '/api/shopify-callback')}&state=${Date.now()}&shop=${shopDomain}` : '/shopify-connect';
      setTimeout(() => {
        if (shopDomain && shopDomain.includes('myshopify.com')) {
          window.location.href = shopifyAuthUrl;
        } else {
          window.location.href = '/shopify-connect';
        }
      }, 1000);
    } catch (error) {
      console.error('Error during reconnection:', error);
      toast.error('حدث خطأ أثناء إعادة الربط');
      setIsReconnecting(false);
    }
  };
  return <div className="space-y-4">
      
      
      
    </div>;
};
export default ShopifyReconnectButton;