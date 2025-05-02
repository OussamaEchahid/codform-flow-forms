
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { ShopifyConnectionManager } from '@/components/shopify/ShopifyConnectionManager';

const ShopifyPage = () => {
  const { shopifyConnected, shop, refreshShopifyConnection } = useAuth();
  const { language } = useI18n();
  const navigate = useNavigate();
  
  // Check connection status on load
  useEffect(() => {
    if (refreshShopifyConnection) {
      refreshShopifyConnection().then(isConnected => {
        if (isConnected) {
          toast.success(
            language === 'ar'
              ? 'تم الاتصال بـ Shopify بنجاح'
              : 'Successfully connected to Shopify'
          );
          
          // Automatically redirect back to forms page if connected
          setTimeout(() => {
            navigate('/forms');
          }, 1500);
        }
      });
    }
  }, [refreshShopifyConnection, language, navigate]);
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">
            {language === 'ar' ? 'تكامل Shopify' : 'Shopify Integration'}
          </h1>
          <p className="text-gray-600">
            {language === 'ar' 
              ? 'قم بتوصيل متجر Shopify الخاص بك لتفعيل نماذج Codform.'
              : 'Connect your Shopify store to enable Codform forms.'}
          </p>
        </div>
        
        <div className="mb-6">
          <ShopifyConnectionManager 
            variant="panel"
            showStatus={true}
          />
        </div>
        
        {shopifyConnected && (
          <div className="text-center">
            <button
              onClick={() => navigate('/forms')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {language === 'ar' 
                ? '→ العودة إلى النماذج' 
                : '→ Back to Forms'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopifyPage;
