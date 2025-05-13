
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, FileCheck, RefreshCw, UploadCloud, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { useShopify } from '@/hooks/useShopify';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ShopifyProduct } from '@/lib/shopify/types';
import { shopifySupabase } from '@/lib/shopify/supabase-client';
import { Checkbox } from '@/components/ui/checkbox';

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
      
      toast.success('Product associations saved successfully');
      
      // Call the onSave callback if provided
      if (onSave) {
        await onSave({
          products: selectedProducts
        });
      }
    } catch (error) {
      console.error('Error saving product associations:', error);
      toast.error('Could not save product associations');
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
      
      {/* Product associations section - new section */}
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
                                src={typeof product.images[0] === 'string' 
                                  ? product.images[0] 
                                  : product.images[0] && typeof product.images[0] === 'object' 
                                    ? product.images[0].src || '' 
                                    : ''}
                                alt={product.title}
                                className="h-12 w-12 object-cover rounded"
                              />
                            )}
                            <div>
                              <h4 className="font-medium">{product.title}</h4>
                              <p className="text-sm text-muted-foreground">ID: {product.id}</p>
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
    </div>
  );
};

export default ShopifyIntegration;
