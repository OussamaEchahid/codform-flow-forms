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
import { useShopify, ShopifyFormPosition } from '@/hooks/useShopify';
import { toast } from 'sonner';
import { useFormStore } from '@/hooks/useFormStore';
import {
  AlertCircle,
  ShoppingBag,
  RefreshCcw,
  Loader2,
  CheckCircle,
  XCircle,
  Settings,
  Copy,
  ExternalLink,
  Code,
  Layers,
  Puzzle,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { ShopifyProduct } from '@/lib/shopify/types';
import { shopifyProductSettings } from '@/lib/shopify/supabase-client';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const [position, setPosition] = useState<ShopifyFormPosition>('after_buy_buttons');
  const [existingSettings, setExistingSettings] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isAutoInserting, setIsAutoInserting] = useState(false);
  const [autoInsertSuccess, setAutoInsertSuccess] = useState<boolean | null>(null);

  // Load existing settings when component mounts
  useEffect(() => {
    if (actualFormId) {
      loadExistingSettings(actualFormId);
    }
  }, [actualFormId]);

  // Load saved product settings from database
  const loadExistingSettings = async (formId: string) => {
    try {
      const { data, error } = await shopifyProductSettings()
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
        
        // Use position if available
        if (data[0].position) {
          setPosition(data[0].position as ShopifyFormPosition);
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

  // Copy form ID to clipboard
  const copyFormIdToClipboard = () => {
    if (actualFormId) {
      navigator.clipboard.writeText(actualFormId).then(() => {
        setCopySuccess(true);
        toast.success(language === 'ar' 
          ? 'تم نسخ معرف النموذج إلى الحافظة' 
          : 'Form ID copied to clipboard');
        
        setTimeout(() => {
          setCopySuccess(false);
        }, 2000);
      });
    }
  };

  // Handler for auto inserting form into product templates
  const handleAutoInsert = async () => {
    if (!actualFormId) {
      toast.error(language === 'ar' 
        ? 'يجب حفظ النموذج أولاً قبل إدراجه في قالب المنتج' 
        : 'You must save the form first before inserting into product template');
      return;
    }

    if (!shop) {
      toast.error(language === 'ar'
        ? 'لم يتم العثور على متجر Shopify متصل'
        : 'No connected Shopify store found');
      return;
    }

    try {
      setIsAutoInserting(true);
      setAutoInsertSuccess(null);
      
      // Call syncForm with special flag for template update
      await syncForm({ 
        formId: actualFormId,
        shopDomain: shop,
        settings: {
          products: selectedProducts,
          blockId: blockId,
          position: position,
          updateTemplate: true // Special flag to indicate template update
        }
      });
      
      setAutoInsertSuccess(true);
      toast.success(language === 'ar' 
        ? 'تم إدراج النموذج تلقائيًا في قالب المنتج بنجاح!'
        : 'Form automatically inserted into product template successfully!');
      
    } catch (error) {
      console.error('Error auto-inserting form:', error);
      setAutoInsertSuccess(false);
      toast.error(language === 'ar'
        ? `فشل إدراج النموذج تلقائيًا: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
        : `Failed to auto-insert form: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAutoInserting(false);
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
      const { error: deleteError } = await shopifyProductSettings()
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
          position: position,
          enabled: true
        }));

        const { error: insertError } = await shopifyProductSettings()
          .insert(settings);

        if (insertError) {
          console.error('Error inserting settings:', insertError);
          throw insertError;
        }

        // After saving settings, sync the form with Shopify
        if (actualFormId) {
          await syncForm({ 
            formId: actualFormId,
            shopDomain: shop,
            settings: {
              products: selectedProducts,
              blockId: blockId,
              position: position
            }
          });
          
          // Also call the external onSave if provided
          if (onSave) {
            await onSave({ 
              formId: actualFormId,
              products: selectedProducts,
              blockId: blockId,
              position: position
            });
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

  // Open Shopify theme editor for product
  const openShopifyThemeEditor = (productId: string) => {
    if (shop) {
      const productHandle = products.find(p => p.id === productId)?.handle;
      if (productHandle) {
        const shopifyUrl = `https://${shop}/admin/themes/current/editor?previewPath=%2Fproducts%2F${productHandle}`;
        window.open(shopifyUrl, '_blank');
      }
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
        {/* Form ID section */}
        <div className="mb-6 border rounded-lg p-4 bg-slate-50">
          <h3 className="font-medium mb-2">
            {language === 'ar' ? 'معرف النموذج:' : 'Form ID:'}
          </h3>
          
          <div className="flex items-center gap-2">
            <div className="bg-white border rounded px-3 py-2 flex-1 font-mono text-sm break-all">
              {actualFormId || (language === 'ar' ? 'لم يتم العثور على معرف النموذج' : 'No form ID found')}
            </div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={copyFormIdToClipboard}
                    className={copySuccess ? "bg-green-100" : ""}
                  >
                    {copySuccess ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {language === 'ar' ? 'نسخ معرف النموذج' : 'Copy form ID'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <p className="text-sm text-muted-foreground mt-2">
            {language === 'ar' 
              ? 'يمكنك استخدام هذا المعرف لإضافة النموذج يدويًا إلى متجرك'
              : 'You can use this ID to manually add the form to your store'}
          </p>
        </div>
        
        {/* Auto-insert feature */}
        <div className="mb-6 border border-green-200 rounded-lg p-4 bg-green-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Puzzle className="h-5 w-5 mr-2 text-green-600" />
              <h3 className="font-medium">
                {language === 'ar' ? 'إدراج تلقائي في صفحة المنتج:' : 'Auto-insert in product page:'}
              </h3>
            </div>
            
            {autoInsertSuccess !== null && (
              <Badge variant={autoInsertSuccess ? "success" : "destructive"} className={autoInsertSuccess ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                {autoInsertSuccess 
                  ? (language === 'ar' ? 'تم بنجاح' : 'Success') 
                  : (language === 'ar' ? 'فشل' : 'Failed')}
              </Badge>
            )}
          </div>
          
          <p className="text-sm text-green-700 mb-3">
            {language === 'ar' 
              ? 'أضف النموذج تلقائيًا إلى قالب المنتج في متجرك. سيظهر لجميع المنتجات.'
              : 'Automatically add this form to your store\'s product template. It will appear for all products.'}
          </p>
          
          <div className="mb-4">
            <Label htmlFor="position" className="block mb-1">
              {language === 'ar' ? 'موقع النموذج في الصفحة:' : 'Form position on page:'}
            </Label>
            <Select
              value={position}
              onValueChange={(val) => setPosition(val as ShopifyFormPosition)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={language === 'ar' ? 'اختر موقعًا...' : 'Select a position...'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="after_gallery">
                  {language === 'ar' ? 'بعد معرض الصور' : 'After image gallery'}
                </SelectItem>
                <SelectItem value="before_description">
                  {language === 'ar' ? 'قبل الوصف' : 'Before description'}
                </SelectItem>
                <SelectItem value="after_description">
                  {language === 'ar' ? 'بعد الوصف' : 'After description'}
                </SelectItem>
                <SelectItem value="before_buy_buttons">
                  {language === 'ar' ? 'قبل أزرار الشراء' : 'Before buy buttons'}
                </SelectItem>
                <SelectItem value="after_buy_buttons">
                  {language === 'ar' ? 'بعد أزرار الشراء' : 'After buy buttons'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button
            onClick={handleAutoInsert}
            disabled={!actualFormId || isAutoInserting}
            variant="outline"
            className="w-full bg-green-100 hover:bg-green-200 text-green-800 border-green-300"
          >
            {isAutoInserting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Code className="mr-2 h-4 w-4" />
            )}
            {language === 'ar' ? 'إدراج النموذج في قالب المنتج' : 'Insert form into product template'}
          </Button>
        </div>
        
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
          <Label htmlFor="blockId" className="block mb-1">
            {language === 'ar' ? 'معرف كتلة النموذج (اختياري)' : 'Form Block ID (optional)'}
          </Label>
          <Input
            id="blockId"
            value={blockId}
            onChange={(e) => setBlockId(e.target.value)}
            placeholder={language === 'ar' ? 'أدخل معرف HTML لكتلة النموذج...' : 'Enter HTML ID for form block...'}
            className="mb-1"
          />
          <p className="text-sm text-muted-foreground">
            {language === 'ar'
              ? 'يستخدم لتحديد مكان إدراج النموذج في صفحة المنتج (سيتم إنشاؤه تلقائيًا إذا تُرك فارغًا)'
              : 'Used to identify where to insert the form in the product page (will be auto-generated if left empty)'}
          </p>
        </div>

        <div className="border rounded-lg p-4 mb-6">
          <h3 className="font-medium mb-2">
            {language === 'ar' ? 'حدد المنتجات:' : 'Select Products:'}
          </h3>
          
          <div className="max-h-64 overflow-y-auto">
            {products.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'لم يتم العثور على منتجات' : 'No products found'}
              </p>
            ) : (
              products.map((product: ShopifyProduct) => (
                <div key={product.id} className="flex items-center justify-between mb-3 p-2 border border-transparent hover:bg-slate-50 hover:border-slate-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`product-${product.id}`}
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={(checked) => handleProductSelect(product.id, !!checked)}
                    />
                    <Label htmlFor={`product-${product.id}`} className="flex-grow cursor-pointer ml-2">
                      {product.title}
                      {selectedProducts.includes(product.id) && (
                        <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 border-green-200">
                          {language === 'ar' ? 'تم الاختيار' : 'Selected'}
                        </Badge>
                      )}
                    </Label>
                  </div>
                  
                  {selectedProducts.includes(product.id) && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost"
                            size="icon"
                            onClick={() => openShopifyThemeEditor(product.id)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {language === 'ar' ? 'فتح في محرر القوالب' : 'Open in theme editor'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Step by step instructions */}
        <Alert className="mb-6 bg-blue-50 text-blue-800 border-blue-200">
          <AlertDescription>
            <h4 className="font-semibold mb-2">
              {language === 'ar' ? 'خطوات إضافة النموذج إلى متجرك:' : 'Steps to add the form to your store:'}
            </h4>
            <ol className="list-decimal ml-5 space-y-1">
              <li>{language === 'ar' ? 'حدد المنتجات التي ترغب في إضافة النموذج إليها' : 'Select the products you want to add the form to'}</li>
              <li>{language === 'ar' ? 'انقر على "حفظ إعدادات المنتج" أدناه' : 'Click "Save Product Settings" below'}</li>
              <li className="text-green-700 font-medium">
                {language === 'ar' ? 'أو استخدم زر "إدراج النموذج في قالب المنتج" للإضافة التلقائية!' : 'Or use "Insert form into product template" for automatic insertion!'}
              </li>
            </ol>
          </AlertDescription>
        </Alert>

        <Button
          onClick={handleSaveSettings}
          disabled={!actualFormId || isSyncing}
          className="w-full"
        >
          {isSyncing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Settings className="mr-2 h-4 w-4" />
          )}
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
      <CardFooter className="flex justify-between border-t pt-4">
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
        
        {shop && (
          <Button
            variant="link"
            size="sm"
            onClick={() => window.open(`https://${shop}/admin/themes/current/editor`, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            {language === 'ar' ? 'فتح محرر القوالب' : 'Open Theme Editor'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ShopifyIntegration;
