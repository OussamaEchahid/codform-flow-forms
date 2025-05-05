import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useShopify } from '@/hooks/useShopify';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useFormStore } from '@/hooks/useFormStore';
import {
  AlertCircle,
  ShoppingBag,
  RefreshCcw,
  Loader2,
  CheckCircle,
  XCircle,
  Settings,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { ShopifyProduct } from '@/lib/shopify/types';

// Update the component props to match what's expected in FormBuilderEditor
interface ShopifyIntegrationProps {
  // Making this optional to prevent errors
  formId?: string;
  // These are also optional since they might not be provided
  onSave?: (settings: any) => Promise<void>;
  isSyncing?: boolean;
}

/**
 * A component for integrating a form with Shopify products
 */
const ShopifyIntegration: React.FC<ShopifyIntegrationProps> = ({
  formId,
  onSave,
  isSyncing: externalIsSyncing
}) => {
  const { language, t } = useI18n();
  const { formState } = useFormStore();
  const actualFormId = formId || formState.id || '';
  
  // Get Shopify integration state from hook
  const {
    isLoading,
    isConnected,
    products,
    shop,
    error,
    loadProducts,
    syncForm,
    tokenError,
    tokenExpired,
    refreshConnection,
    isSyncing: hookIsSyncing
  } = useShopify();
  
  // Combine external and internal syncing states
  const isSyncing = externalIsSyncing || hookIsSyncing;

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [blockId, setBlockId] = useState<string>('');
  const [existingSettings, setExistingSettings] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  // Load existing settings when component mounts
  useEffect(() => {
    if (actualFormId) {
      loadExistingSettings(actualFormId);
    }
  }, [actualFormId]);

  // Load saved product settings from database
  const loadExistingSettings = async (formId: string) => {
    try {
      const { data, error } = await supabase
        .from('shopify_product_settings')
        .select('*')
        .eq('form_id', formId);

      if (error) {
        console.error('Error loading existing settings:', error);
        return;
      }

      setExistingSettings(data || []);
      
      // Extract selected product IDs and block ID from existing settings
      if (data && data.length > 0) {
        const productIds = data.map(setting => setting.product_id);
        setSelectedProducts(productIds);
        
        // Use the first block ID found (assuming all settings use the same block ID)
        if (data[0].block_id) {
          setBlockId(data[0].block_id);
        }
      }
    } catch (error) {
      console.error('Error in loadExistingSettings:', error);
    }
  };

  // Load products when component mounts if connected
  useEffect(() => {
    if (isConnected && shop) {
      loadProducts();
      setConnectionStatus('connected');
    } else {
      setConnectionStatus('error');
    }
  }, [isConnected, shop, loadProducts]);

  // Handler for checkbox changes
  const handleProductSelect = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  // Handler for saving product settings
  const handleSaveSettings = async () => {
    if (!actualFormId) {
      toast.error(language === 'ar' 
        ? 'يجب حفظ النموذج أولاً قبل إعداد تكامل Shopify' 
        : 'You must save the form first before setting up Shopify integration');
      return;
    }

    if (!shop) {
      toast.error(language === 'ar'
        ? 'لم يتم العثور على متجر Shopify متصل'
        : 'No connected Shopify store found');
      return;
    }

    try {
      // First delete any existing settings
      const { error: deleteError } = await supabase
        .from('shopify_product_settings')
        .delete()
        .eq('form_id', actualFormId);

      if (deleteError) {
        console.error('Error deleting existing settings:', deleteError);
        throw deleteError;
      }

      // Then insert new settings
      if (selectedProducts.length > 0) {
        const settings = selectedProducts.map(productId => ({
          form_id: actualFormId,
          product_id: productId,
          shop_id: shop,
          block_id: blockId,
          enabled: true
        }));

        const { error: insertError } = await supabase
          .from('shopify_product_settings')
          .insert(settings);

        if (insertError) {
          console.error('Error inserting settings:', insertError);
          throw insertError;
        }

        // After saving settings, sync the form with Shopify
        if (actualFormId) {
          await syncForm({ formId: actualFormId });
          
          // Also call the external onSave if provided
          if (onSave) {
            await onSave({ formId: actualFormId });
          }
          
          toast.success(language === 'ar' 
            ? 'تم حفظ الإعدادات وتزامن النموذج بنجاح!'
            : 'Settings saved and form synced successfully!');
        }
      } else {
        toast.success(language === 'ar'
          ? 'تم مسح إعدادات المنتج'
          : 'Product settings cleared');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(language === 'ar'
        ? 'حدث خطأ أثناء حفظ الإعدادات'
        : 'Error saving settings');
    }
  };

  // معالج مخصص للضغط على إعادة المحاولة مع العودة
  const handleRetryWithFallback = async () => {
    try {
      // Attempt to refresh connection instead of fetching products
      setConnectionStatus('checking');
      // Using refreshConnection instead of fetchProducts
      await refreshConnection();
      
      // If no error is thrown, connection is still valid
      toast.success(language === 'ar'
        ? 'تم إعادة الاتصال بنجاح!'
        : 'Successfully reconnected!');
      setConnectionStatus('connected');
      
      // Load products after successful reconnection
      loadProducts();
    } catch (error) {
      console.error('Error in retry with fallback:', error);
      toast.error(language === 'ar'
        ? 'فشل إعادة الاتصال. يرجى تحديث رمز الوصول'
        : 'Failed to reconnect. Please update access token');
      setConnectionStatus('error');
    }
  };

  // Render different content based on connection status
  const renderContent = () => {
    if (connectionStatus === 'checking') {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
          <p className="text-lg font-medium text-center">
            {language === 'ar' ? 'التحقق من اتصال Shopify...' : 'Checking Shopify connection...'}
          </p>
        </div>
      );
    }

    if (connectionStatus === 'error' || !isConnected || tokenError || tokenExpired) {
      return (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="bg-red-100 p-3 rounded-full">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          
          <h3 className="text-xl font-bold text-center">
            {language === 'ar' ? 'خطأ في الاتصال بـ Shopify' : 'Shopify Connection Error'}
          </h3>
          
          <p className="text-center max-w-md">
            {tokenError || tokenExpired
              ? (language === 'ar' 
                  ? 'رمز الوصول إلى Shopify غير صالح أو منتهي الصلاحية. يرجى تحديثه.'
                  : 'Shopify access token is invalid or expired. Please update it.')
              : (language === 'ar'
                  ? 'لم يتم العثور على اتصال Shopify. يرجى الاتصال بمتجر Shopify أولاً.'
                  : 'No Shopify connection found. Please connect to a Shopify store first.')}
          </p>
          
          <div className="flex space-x-3 space-y-0">
            <Button onClick={handleRetryWithFallback} variant="secondary">
              <RefreshCcw className="mr-2 h-4 w-4" />
              {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
            </Button>
            
            <Button
              onClick={() => window.location.href = '/shopify'}
              variant="default"
            >
              {language === 'ar' ? 'اتصال بمتجر Shopify' : 'Connect Shopify Store'}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <ShoppingBag className="h-5 w-5 mr-2 text-green-600" />
            <span className="font-medium">
              {language === 'ar'
                ? `متصل بـ: ${shop}`
                : `Connected to: ${shop}`}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadProducts}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {language === 'ar' ? 'تحديث المنتجات' : 'Refresh Products'}
          </Button>
        </div>

        <div className="mb-4">
          <Label htmlFor="blockId">
            {language === 'ar' ? 'معرف كتلة النموذج (اختياري)' : 'Form Block ID (optional)'}
          </Label>
          <Input
            id="blockId"
            value={blockId}
            onChange={(e) => setBlockId(e.target.value)}
            placeholder={language === 'ar' ? 'أدخل معرف HTML لكتلة النموذج...' : 'Enter HTML ID for form block...'}
            className="mt-1"
          />
          <p className="text-sm text-muted-foreground mt-1">
            {language === 'ar'
              ? 'يستخدم لتحديد مكان إدراج النموذج في صفحة المنتج (سيتم إنشاؤه تلقائيًا إذا تُرك فارغًا)'
              : 'Used to identify where to insert the form in the product page (will be auto-generated if left empty)'}
          </p>
        </div>

        <div className="border rounded-lg p-2 overflow-y-auto max-h-64 mb-4">
          <p className="font-medium mb-2">
            {language === 'ar' ? 'حدد المنتجات:' : 'Select Products:'}
          </p>
          
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {language === 'ar' ? 'لم يتم العثور على منتجات' : 'No products found'}
            </p>
          ) : (
            products.map((product: ShopifyProduct) => (
              <div key={product.id} className="flex items-center space-x-2 mb-2">
                <Checkbox
                  id={`product-${product.id}`}
                  checked={selectedProducts.includes(product.id)}
                  onCheckedChange={(checked) => handleProductSelect(product.id, !!checked)}
                />
                <Label htmlFor={`product-${product.id}`} className="flex-grow cursor-pointer">
                  {product.title}
                </Label>
              </div>
            ))
          )}
        </div>

        <Button
          onClick={handleSaveSettings}
          disabled={!actualFormId}
          className="w-full"
        >
          <Settings className="mr-2 h-4 w-4" />
          {language === 'ar' ? 'حفظ إعدادات المنتج' : 'Save Product Settings'}
        </Button>
      </>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {language === 'ar' ? 'تكامل منتج Shopify' : 'Shopify Product Integration'}
        </CardTitle>
        <CardDescription>
          {language === 'ar'
            ? 'حدد منتجات Shopify لعرض هذا النموذج عليها'
            : 'Select Shopify products to display this form on'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
      <CardFooter className="flex justify-end border-t pt-4">
        <div className="text-sm text-muted-foreground">
          {isConnected ? (
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              {language === 'ar' ? 'متصل بـ Shopify' : 'Connected to Shopify'}
            </div>
          ) : (
            <div className="flex items-center">
              <XCircle className="h-4 w-4 text-red-500 mr-1" />
              {language === 'ar' ? 'غير متصل بـ Shopify' : 'Not connected to Shopify'}
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ShopifyIntegration;
