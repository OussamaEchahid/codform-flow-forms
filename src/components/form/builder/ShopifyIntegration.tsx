
import React, { useState, useEffect } from 'react';
import { useShopify } from '@/hooks/useShopify';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { Loader2, ShoppingBag, Check, AlertCircle } from 'lucide-react';

interface ShopifyIntegrationProps {
  formId: string;
  formStyle: any;
  productId?: string;
  onSave: (settings: any) => void;
}

interface ShopifyFormSync {
  formId: string;
  settings: {
    position: "product-page" | "cart-page" | "checkout";
    style: any;
    products: string[];
    insertionMethod: string;
  };
}

const ShopifyIntegration: React.FC<ShopifyIntegrationProps> = ({ 
  formId, 
  formStyle, 
  productId, 
  onSave 
}) => {
  const { isConnected, syncFormWithShopify, products, loadProducts, isLoading } = useShopify();
  const { t, language } = useI18n();
  const [isSyncing, setIsSyncing] = useState(false);
  const [productInfo, setProductInfo] = useState(null);

  useEffect(() => {
    // Load current product information
    if (productId && products && products.length > 0) {
      const product = products.find(p => 
        p.id === productId || p.id.endsWith(`/${productId}`)
      );
      setProductInfo(product);
    }
  }, [productId, products]);

  useEffect(() => {
    if (isConnected && !products.length) {
      loadProducts();
    }
  }, [isConnected, loadProducts, products.length]);

  const handleSyncForm = async () => {
    if (!formId || !productId) {
      toast.error(language === 'ar' ? 'معلومات النموذج أو المنتج غير مكتملة' : 'Form or product information is incomplete');
      return;
    }
    
    try {
      setIsSyncing(true);
      
      const syncData: ShopifyFormSync = {
        formId: formId,
        settings: {
          position: "product-page",
          style: formStyle,
          products: [productId],
          insertionMethod: 'auto'
        }
      };
      
      // Call sync function
      await syncFormWithShopify(syncData);
      
      toast.success(language === 'ar' 
        ? 'تم مزامنة النموذج مع Shopify بنجاح' 
        : 'Form synced with Shopify successfully'
      );
      
      if (onSave) {
        onSave(syncData.settings);
      }
    } catch (error) {
      console.error('Error syncing form with Shopify:', error);
      toast.error(language === 'ar' 
        ? 'حدث خطأ أثناء مزامنة النموذج مع Shopify' 
        : 'Error syncing form with Shopify'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  // Function to get product name
  const getProductName = () => {
    if (!productInfo) return null;
    return productInfo.title;
  };

  return (
    <div className="space-y-6">
      {!isConnected ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {language === 'ar' ? 'تنبيه اتصال' : 'Connection Alert'}
              </h3>
              <p className="text-gray-600 mb-4">
                {language === 'ar' 
                  ? 'أنت غير متصل بمتجر Shopify. يرجى الاتصال بمتجر Shopify لمزامنة النموذج.'
                  : 'You are not connected to a Shopify store. Please connect to sync your form.'}
              </p>
              <Button 
                onClick={() => window.location.href = '/shopify'}
                variant="default"
              >
                {language === 'ar' ? 'الاتصال بمتجر Shopify' : 'Connect to Shopify Store'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-lg mb-2">
                    {language === 'ar' ? 'المنتج المرتبط' : 'Linked Product'}
                  </h3>
                  
                  <div className="flex items-center gap-3 mt-4">
                    <div className="bg-green-100 rounded-full p-2">
                      <ShoppingBag className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">{getProductName() || 'Unknown Product'}</div>
                      <div className="text-sm text-gray-500">
                        {productId ? `ID: ${productId}` : 'No product ID'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={handleSyncForm}
                  disabled={isSyncing || !productId}
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {language === 'ar' ? 'جاري المزامنة...' : 'Syncing...'}
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      {language === 'ar' ? 'مزامنة' : 'Sync'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-6">
            <h3 className="font-medium text-lg mb-2">
              {language === 'ar' ? 'معلومات النموذج' : 'Form Information'}
            </h3>
            <div className="bg-gray-50 rounded-md p-4 flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  {language === 'ar' ? 'معرف النموذج:' : 'Form ID:'}
                </span>
                <span className="font-mono">{formId}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  {language === 'ar' ? 'موضع العرض:' : 'Display Position:'}
                </span>
                <span>{language === 'ar' ? 'صفحة المنتج' : 'Product Page'}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  {language === 'ar' ? 'طريقة الإدراج:' : 'Insertion Method:'}
                </span>
                <span>{language === 'ar' ? 'تلقائي' : 'Automatic'}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ShopifyIntegration;
