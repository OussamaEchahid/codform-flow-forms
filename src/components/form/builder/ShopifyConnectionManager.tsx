
import React, { useEffect, useState, useRef } from 'react';
import { useShopify } from '@/hooks/useShopify';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw, CheckCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import ShopifyDebugPanel from '../debug/ShopifyDebugPanel';

interface ShopifyConnectionManagerProps {
  formId?: string | null;
}

const ShopifyConnectionManager: React.FC<ShopifyConnectionManagerProps> = ({ formId }) => {
  const { isConnected, shop, isLoading, refreshConnection, manualReconnect } = useShopify();
  const { language } = useI18n();
  const [showDebugger, setShowDebugger] = useState(false);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Check if debug mode is enabled from localStorage or URL - but only once on mount
  useEffect(() => {
    const isDebugMode = localStorage.getItem('debug_mode') === 'true' || 
                       window.location.search.includes('debug=true');
    setShowDebugger(isDebugMode);
    
    // Cleanup any pending timeouts on unmount
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  const handleRefreshConnection = async () => {
    // Prevent multiple rapid refresh attempts
    if (refreshConnection && !isLoading && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await refreshConnection();
      } catch (error) {
        console.error("Error refreshing Shopify connection:", error);
      } finally {
        // Add a small delay to prevent UI flickering
        refreshTimeoutRef.current = setTimeout(() => {
          setIsRefreshing(false);
        }, 1000);
      }
    }
  };

  return (
    <div className="mb-6">
      {isConnected ? (
        <Alert className="bg-green-50 border-green-100 my-4">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="flex justify-between items-center text-green-700">
            <span>
              {language === 'ar'
                ? `متصل بمتجر Shopify: ${shop || ''}`
                : `Connected to Shopify store: ${shop || ''}`}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshConnection}
              disabled={isLoading || isRefreshing}
              className="text-xs bg-white"
            >
              {isLoading || isRefreshing ? (
                <div className="flex items-center">
                  <div className="animate-spin h-3 w-3 border-t-2 border-b-2 border-green-600 rounded-full mr-1"></div>
                  {language === 'ar' ? 'جارٍ التحقق...' : 'Verifying...'}
                </div>
              ) : (
                <div className="flex items-center">
                  <RefreshCcw className="h-3 w-3 mr-1" />
                  {language === 'ar' ? 'تحديث الاتصال' : 'Refresh Connection'}
                </div>
              )}
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="bg-yellow-50 border-yellow-100 my-4">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="flex justify-between items-center text-yellow-700">
            <span>
              {language === 'ar'
                ? 'غير متصل بـ Shopify. قم بالتوصيل لاستخدام ميزات التكامل.'
                : 'Not connected to Shopify. Connect to use integration features.'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={manualReconnect}
              disabled={isRefreshing || isLoading}
              className="text-xs bg-white"
            >
              {language === 'ar' ? 'توصيل Shopify' : 'Connect Shopify'}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Debug panel for troubleshooting - only show if debug mode is enabled */}
      {showDebugger && <ShopifyDebugPanel />}
    </div>
  );
};

export default ShopifyConnectionManager;
