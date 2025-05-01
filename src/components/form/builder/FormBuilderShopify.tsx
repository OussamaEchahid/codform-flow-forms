
import React from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { ShopifyFormData } from '@/lib/shopify/types';
import { useShopify } from '@/hooks/useShopify';

interface FormBuilderShopifyProps {
  onShopifyIntegration?: (settings: ShopifyFormData) => Promise<void>;
  isSyncing?: boolean;
}

const FormBuilderShopify: React.FC<FormBuilderShopifyProps> = ({ 
  onShopifyIntegration, 
  isSyncing = false 
}) => {
  const { t } = useI18n();
  const { isConnected, manualReconnect } = useShopify();

  const handleConnectClick = () => {
    if (!isConnected && manualReconnect) {
      manualReconnect();
    }
  };

  return (
    <div className="p-4 border rounded-md">
      <h3 className="font-medium text-lg mb-2">{t('shopify.integration') || 'Shopify Integration'}</h3>
      
      {!isConnected ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            {t('shopify.connection_required') || 
             'You need to connect to Shopify to use this feature.'}
          </p>
          <Button 
            onClick={handleConnectClick}
            className="w-full"
            disabled={isSyncing}
          >
            {t('shopify.connect_now') || 'Connect to Shopify'}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-green-600">
            {t('shopify.connected') || 'Connected to Shopify'}
          </p>
          {/* This is where the form settings would go in a more complete implementation */}
        </div>
      )}
    </div>
  );
};

export default FormBuilderShopify;
