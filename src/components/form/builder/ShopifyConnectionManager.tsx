
import React, { useEffect, useState, useRef } from 'react';
import { useShopify } from '@/hooks/useShopify';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw, CheckCircle, ShieldOff } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import ShopifyDebugPanel from '../debug/ShopifyDebugPanel';
import { ShopifyConnectionManager as ShopifyConnectionUtil } from '@/utils/shopifyConnectionManager';

interface ShopifyConnectionManagerProps {
  formId?: string | null;
}

const ShopifyConnectionManager: React.FC<ShopifyConnectionManagerProps> = ({ formId }) => {
  const { isConnected, shop, isLoading, refreshConnection, manualReconnect } = useShopify();
  const { language } = useI18n();
  const [showDebugger, setShowDebugger] = useState(false);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEmergencyDisabled, setIsEmergencyDisabled] = useState(false);
  
  // Check if debug mode is enabled from localStorage or URL - but only once on mount
  // Use useRef to prevent this effect from creating infinite loops
  const hasCheckedDebugMode = useRef(false);
  
  useEffect(() => {
    // Only run once
    if (!hasCheckedDebugMode.current) {
      hasCheckedDebugMode.current = true;
      const isDebugMode = localStorage.getItem('debug_mode') === 'true' || 
                         window.location.search.includes('debug=true');
      setShowDebugger(isDebugMode);
      setIsEmergencyDisabled(ShopifyConnectionUtil.isEmergencyDisabled());
    }
    
    // Cleanup any pending timeouts on unmount
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  const handleRefreshConnection = async () => {
    // Don't do anything if emergency mode is enabled
    if (isEmergencyDisabled) {
      return;
    }
    
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

  const toggleEmergencyMode = () => {
    const newValue = ShopifyConnectionUtil.toggleEmergencyDisable();
    setIsEmergencyDisabled(newValue);
    window.location.reload(); // Force reload to apply the change
  };

  // Don't render anything if emergency mode is enabled
  if (isEmergencyDisabled) {
    return (
      <Alert className="bg-red-50 border-red-100 my-4">
        <ShieldOff className="h-4 w-4 text-red-500" />
        <AlertDescription className="flex justify-between items-center text-red-700">
          <span>
            {language === 'ar'
              ? 'تم تعطيل فحوصات اتصال Shopify. انقر لإعادة التمكين.'
              : 'Shopify connection checks are disabled. Click to re-enable.'}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleEmergencyMode}
            className="text-xs bg-white"
          >
            {language === 'ar' ? 'إعادة تمكين الاتصالات' : 'Re-enable Connections'}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

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
            <div className="flex gap-2">
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
                    {language === 'ar' ? 'تحديث الاتصال' : 'Refresh'}
                  </div>
                )}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={toggleEmergencyMode}
                className="text-xs"
              >
                <ShieldOff className="h-3 w-3 mr-1" />
                {language === 'ar' ? 'تعطيل' : 'Disable'}
              </Button>
            </div>
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={manualReconnect}
                disabled={isRefreshing || isLoading}
                className="text-xs bg-white"
              >
                {language === 'ar' ? 'توصيل Shopify' : 'Connect'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={toggleEmergencyMode}
                className="text-xs"
              >
                <ShieldOff className="h-3 w-3 mr-1" />
                {language === 'ar' ? 'تعطيل' : 'Disable'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Debug panel for troubleshooting - only show if debug mode is enabled */}
      {showDebugger && <ShopifyDebugPanel />}
    </div>
  );
};

export default ShopifyConnectionManager;
