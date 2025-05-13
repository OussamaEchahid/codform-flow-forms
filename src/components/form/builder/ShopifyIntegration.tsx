import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, FileCheck, RefreshCw, UploadCloud, X, Copy } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { useShopify } from '@/hooks/useShopify';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ShopifyProduct } from '@/lib/shopify/types';
import { shopifySupabase } from '@/lib/shopify/supabase-client';
import { Checkbox } from '@/components/ui/checkbox';
import ShopifyIntegrationGuide from '@/components/shopify/ShopifyIntegrationGuide';

interface ShopifyIntegrationProps {
  formId: string;
  onSave?: (settings: any) => Promise<void>;
  isSyncing?: boolean;
}

const ShopifyIntegration: React.FC<ShopifyIntegrationProps> = ({ formId, onSave, isSyncing }) => {
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const auth = useAuth();
  const { isSyncing: isShopifySyncing, isRetrying, tokenError, failSafeMode, refreshConnection: refreshShopifyConnection } = useShopify();

  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSettingProducts, setIsSettingProducts] = useState(false);
  const [productSettings, setProductSettings] = useState<Array<{product_id: string, form_id: string, enabled: boolean}>>([]);
  const [showGuide, setShowGuide] = useState(false);
  
  // Copy form ID to clipboard
  const copyFormIdToClipboard = () => {
    if (formId) {
      navigator.clipboard.writeText(formId);
      toast.success(language === 'ar' ? 'تم نسخ معرّف النموذج' : 'Form ID copied to clipboard');
    }
  };
  
  // Add this function to load associated products when component mounts
  const loadAssociatedProducts = useCallback(async () => {
    if (!formId || !auth.shop) return;
    
    try {
      setIsLoadingProducts(true);
      const { data, error } = await supabase
        .from('shopify_product_settings')
        .select('*')
        .eq('form_id', formId)
        .eq('enabled', true);
        
      if (error) throw error;
      
      const productIds = data?.map(setting => setting.product_id) || [];
      setSelectedProducts(productIds);
      setProductSettings(data || []);
    } catch (error) {
      console.error('Error loading associated products:', error);
      toast.error('Could not load associated products');
    } finally {
      setIsLoadingProducts(false);
    }
  }, [formId, auth.shop]);
  
  // Function to load products from the store
  const loadShopifyProducts = useCallback(async () => {
    if (!auth.shop) return;
    
    try {
      setIsLoadingProducts(true);
      // Load products from Shopify store
      const response = await shopifySupabase.functions.invoke('shopify-products', {
        body: { shop: auth.shop }
      });
      
      if (response.error) throw response.error;
      
      setProducts(response.data?.products || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Could not load products from Shopify');
    } finally {
      setIsLoadingProducts(false);
    }
  }, [auth.shop]);
  
  // Function to save product associations
  const saveProductAssociations = async () => {
    if (!formId || !auth.shop) return;
    
    try {
      setIsSettingProducts(true);
      
      // Remove existing settings
      await supabase
        .from('shopify_product_settings')
        .delete()
        .eq('form_id', formId);
        
      // Add new settings for selected products
      if (selectedProducts.length > 0) {
        const newSettings = selectedProducts.map(productId => ({
          form_id: formId,
          product_id: productId,
          shop_id: auth.shop,
          enabled: true
        }));
        
        const { error } = await supabase
          .from('shopify_product_settings')
          .insert(newSettings);
          
        if (error) throw error;
      }
      
      toast.success('تم حفظ ارتباط المنتجات بنجاح');
      setShowGuide(true);
      
      // Call the onSave callback if provided
      if (onSave) {
        await onSave({
          products: selectedProducts
        });
      }
    } catch (error) {
      console.error('Error saving product associations:', error);
      toast.error('لم يتم حفظ ارتباطات المنتجات');
    } finally {
      setIsSettingProducts(false);
    }
  };
  
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  // Load products and associations when component mounts
  useEffect(() => {
    if (auth.shop) {
      loadShopifyProducts();
      loadAssociatedProducts();
    }
  }, [auth.shop, loadShopifyProducts, loadAssociatedProducts]);
  
  const renderStatus = () => {
    if (tokenError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('shopify.status.errorTitle')}</AlertTitle>
          <AlertDescription>
            {t('shopify.status.errorDescription')}
            <Button variant="link" onClick={refreshShopifyConnection} disabled={isRetrying}>
              {isRetrying ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {t('shopify.status.reconnecting')}
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t('shopify.status.reconnect')}
                </>
              )}
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    if (auth.shopifyConnected) {
      return (
        <Alert variant="success">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>{t('shopify.status.connectedTitle')}</AlertTitle>
          <AlertDescription>{t('shopify.status.connectedDescription')}</AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t('shopify.status.notConnectedTitle')}</AlertTitle>
        <AlertDescription>{t('shopify.status.notConnectedDescription')}</AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="space-y-6 mb-4">
      {/* Form title section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-right">
            {t('shopify.integration.title')}
          </h2>
          <p className="text-sm text-muted-foreground text-right">
            {t('shopify.integration.description')}
          </p>
        </div>
        {renderStatus()}
      </div>

      {/* Integration Guide */}
      {showGuide && <ShopifyIntegrationGuide />}

      {/* Form ID section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-right">معرّف النموذج الحالي</CardTitle>
          <CardDescription className="text-right">
            استخدم هذا المعرّف عند إضافة النموذج يدويًا في متجر شوبيفاي
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between bg-muted p-3 rounded-md">
            <code dir="ltr" className="text-sm font-mono">{formId}</code>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={copyFormIdToClipboard} 
              className="h-8 w-8 p-0"
              title="نسخ المعرف"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Connection status & setup section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-right">{t('shopify.connection.title')}</CardTitle>
          <CardDescription className="text-right">
            {t('shopify.connection.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!auth.shopifyConnected ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <p className="text-muted-foreground text-center">
                {t('shopify.connection.instructions')}
              </p>
              <Button onClick={() => navigate('/shopify')}>
                <UploadCloud className="mr-2 h-4 w-4" />
                {t('shopify.connection.connectButton')}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4">
              <p className="text-muted-foreground text-center">
                {t('shopify.connection.connectedAs')} <strong>{auth.shop}</strong>
              </p>
              <Button variant="destructive" onClick={() => {
                if (auth.emergencyReset) {
                  auth.emergencyReset();
                }
              }}>
                <X className="mr-2 h-4 w-4" />
                {t('shopify.connection.disconnectButton')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Product associations section */}
      {auth.shopifyConnected && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-right">{t('shopify.products.associateTitle')}</CardTitle>
            <p className="text-sm text-muted-foreground text-right">
              {t('shopify.products.associateDescription')}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoadingProducts ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <>
                  {products.length > 0 ? (
                    <div className="grid gap-4">
                      {products.map(product => (
                        <div 
                          key={product.id}
                          className={`p-4 border rounded-lg flex items-center justify-between ${
                            selectedProducts.includes(product.id) ? 'border-primary bg-primary/5' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {product.images && product.images.length > 0 && (
                              <img 
                                src={getProductImageSrc(product.images[0])}
                                alt={product.title}
                                className="h-12 w-12 object-cover rounded"
                              />
                            )}
                            <div>
                              <h4 className="font-medium">{product.title}</h4>
                              <p className="text-sm text-muted-foreground">ID: {extractProductId(product.id)}</p>
                            </div>
                          </div>
                          <Checkbox 
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={() => toggleProductSelection(product.id)}
                            id={`product-${product.id}`}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-8 border rounded-lg">
                      <p className="text-muted-foreground">
                        {t('shopify.products.noProducts')}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    <Button
                      onClick={saveProductAssociations}
                      disabled={isSettingProducts || isSyncing}
                    >
                      {isSettingProducts || isSyncing ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          {t('shopify.products.saving')}
                        </>
                      ) : (
                        t('shopify.products.saveAssociations')
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Button to show/hide the integration guide */}
      <div className="flex justify-center">
        <Button 
          variant="outline" 
          onClick={() => setShowGuide(!showGuide)}
        >
          {showGuide ? 'إخفاء الدليل' : 'عرض دليل ربط النماذج بشوبيفاي'}
        </Button>
      </div>
    </div>
  );
};

// Helper function to safely get product image source
const getProductImageSrc = (image: string | { src?: string } | any): string => {
  if (!image) return '';
  
  if (typeof image === 'string') {
    return image;
  }
  
  if (typeof image === 'object' && image !== null) {
    return image.src || '';
  }
  
  return '';
};

// Helper function to extract product ID for display
const extractProductId = (fullId: string): string => {
  if (fullId.includes('/')) {
    return fullId.split('/').pop() || fullId;
  }
  return fullId;
};

export default ShopifyIntegration;
