
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useShopify } from '@/hooks/useShopify';
import { Loader2, RefreshCw, Check, AlertTriangle, Globe } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// Define props interface for ShopifyLandingPageSync component
interface ShopifyLandingPageSyncProps {
  pageId?: string;
  pageSlug?: string;
  isPublished?: boolean;
}

// ShopifyLandingPageSync component to display and manage Shopify connection status
const ShopifyLandingPageSync: React.FC<ShopifyLandingPageSyncProps> = ({ 
  pageId,
  pageSlug,
  isPublished 
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  
  // Track mounting state to prevent state updates after unmount
  const isMounted = useRef(true);
  
  // Generate a stable instance ID
  const instanceId = useRef(`sync-${Math.random().toString(36).substr(2, 8)}`);
  
  // Get Shopify connection state from our hook
  const { shop, isConnected, isNetworkError, testConnection, refreshConnection } = useShopify();
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Handle refresh connection with retry logic
  const handleRefresh = async () => {
    if (isRefreshing) return; // Prevent multiple refreshes
    
    setIsRefreshing(true);
    try {
      console.log(`[${instanceId.current}] Refreshing Shopify connection`);
      const result = await refreshConnection(true); // Force refresh
      
      if (result) {
        toast.success('تم تحديث الاتصال بنجاح');
        if (isMounted.current) {
          setRetryCount(0);
          setLastRefreshed(new Date());
        }
      } else {
        // If first attempt failed, try once more
        if (retryCount < 1) {
          console.log(`[${instanceId.current}] First attempt failed, retrying...`);
          toast.info('جاري إعادة المحاولة...');
          
          // Short delay before retry
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          const retryResult = await refreshConnection(true);
          if (retryResult) {
            toast.success('تم تحديث الاتصال بنجاح بعد إعادة المحاولة');
            if (isMounted.current) {
              setRetryCount(0);
              setLastRefreshed(new Date());
            }
          } else {
            toast.error('فشل تحديث الاتصال بعد المحاولة الثانية');
            if (isMounted.current) {
              setRetryCount(prev => prev + 1);
            }
          }
        } else {
          toast.error('فشل تحديث الاتصال');
          if (isMounted.current) {
            setRetryCount(prev => prev + 1);
          }
        }
      }
    } catch (error) {
      console.error(`[${instanceId.current}] Error refreshing connection:`, error);
      toast.error('حدث خطأ أثناء تحديث الاتصال');
    } finally {
      if (isMounted.current) {
        setIsRefreshing(false);
      }
    }
  };
  
  // Format for tooltip display
  const getTooltipContent = () => {
    if (isNetworkError) {
      return 'مشكلة في الاتصال بالشبكة - انقر للتحديث';
    }
    
    if (!isConnected) {
      return 'غير متصل بمتجر Shopify - انقر للتحديث';
    }
    
    if (lastRefreshed) {
      return `متصل بـ ${shop || 'المتجر'} - آخر تحديث: ${lastRefreshed.toLocaleTimeString()}`;
    }
    
    return `متصل بـ ${shop || 'المتجر'}`;
  };
  
  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              {isNetworkError && (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
              
              {isConnected ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1 flex items-center">
                  <Check className="h-3 w-3" />
                  <span>{shop || 'المتجر متصل'}</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 gap-1 flex items-center">
                  <Globe className="h-3 w-3" />
                  <span>غير متصل</span>
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getTooltipContent()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="relative"
      >
        {isRefreshing ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <RefreshCw className="h-3 w-3" />
        )}
        {retryCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {retryCount}
          </span>
        )}
      </Button>
    </div>
  );
};

export default ShopifyLandingPageSync;
