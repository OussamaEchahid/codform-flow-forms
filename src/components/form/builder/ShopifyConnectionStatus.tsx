
import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { CheckCircle, AlertCircle, Loader2, RefreshCw, Store } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ShopifyConnectionStatus = () => {
  const { language } = useI18n();
  const { isConnected, shopDomain, isLoading, isValidating, error, reload } = useShopifyConnection();
  const [showDetails, setShowDetails] = useState(false);

  const checkConnection = async () => {
    await reload();
  };

  const connectionStatus = isConnected ? (
    <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 flex items-center gap-1">
      <CheckCircle className="h-3 w-3" />
      {language === 'ar' ? 'متصل' : 'Connected'}
    </Badge>
  ) : error ? (
    <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 flex items-center gap-1">
      <AlertCircle className="h-3 w-3" />
      {language === 'ar' ? 'غير متصل' : 'Disconnected'}
    </Badge>
  ) : isLoading || isValidating ? (
    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 flex items-center gap-1">
      <Loader2 className="h-3 w-3 animate-spin" />
      {language === 'ar' ? 'جاري التحقق...' : 'Checking...'}
    </Badge>
  ) : (
    <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200 flex items-center gap-1">
      <AlertCircle className="h-3 w-3" />
      {language === 'ar' ? 'غير معروف' : 'Unknown'}
    </Badge>
  );

  return (
    <TooltipProvider>
      <div className="flex gap-2 items-center">
        <Store className="h-4 w-4 text-gray-500" />
        
        <Tooltip>
          <TooltipTrigger className="flex items-center gap-1">
            {shopDomain ? (
              <span className="text-sm font-medium truncate max-w-[140px]">
                {shopDomain}
              </span>
            ) : (
              <span className="text-sm text-gray-500">
                {language === 'ar' ? 'لا يوجد متجر' : 'No store'}
              </span>
            )}
            {connectionStatus}
          </TooltipTrigger>
          <TooltipContent className="p-4 w-64">
            <div className="space-y-2">
              <div className="font-semibold">
                {language === 'ar' ? 'حالة اتصال Shopify' : 'Shopify Connection Status'}
              </div>
              {shopDomain && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{language === 'ar' ? 'المتجر:' : 'Store:'}</span>
                  <span>{shopDomain}</span>
                </div>
              )}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkConnection}
                  disabled={isValidating}
                  className="mt-2 w-full"
                >
                  {isValidating ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-1" />
                  )}
                  {language === 'ar' ? 'تحديث الاتصال' : 'Refresh Connection'}
                </Button>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default ShopifyConnectionStatus;
