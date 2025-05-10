
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useShopify } from '@/hooks/useShopify';
import { Loader2, RefreshCw, Check, AlertTriangle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// ShopifyLandingPageSync component to display and manage Shopify connection status
const ShopifyLandingPageSync = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Get Shopify connection state from our hook
  const { shop, isConnected, isNetworkError, testConnection, refreshConnection } = useShopify();
  
  // Handle refresh connection
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const result = await refreshConnection();
      if (result) {
        toast.success('تم تحديث الاتصال بنجاح');
      } else {
        toast.error('فشل تحديث الاتصال');
      }
    } catch (error) {
      console.error('Error refreshing connection:', error);
      toast.error('حدث خطأ أثناء تحديث الاتصال');
    } finally {
      setIsRefreshing(false);
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      {isNetworkError && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p>مشكلة في الاتصال بالشبكة</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {isConnected ? (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1 flex items-center">
          <Check className="h-3 w-3" />
          <span>{shop || 'المتجر متصل'}</span>
        </Badge>
      ) : (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          غير متصل
        </Badge>
      )}
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={isRefreshing}
      >
        {isRefreshing ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <RefreshCw className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
};

export default ShopifyLandingPageSync;
