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

      // Use Edge Function to generate OAuth URL and redirect
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.functions.invoke('shopify-auth', {
        body: { shop: shopDomain, userId: user?.id }
      });
      if (error || !data?.redirect) {
        throw new Error(error?.message || 'Failed to start Shopify OAuth');
      }
      setTimeout(() => { window.location.href = data.redirect; }, 800);
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