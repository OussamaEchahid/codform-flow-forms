
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
  HelpCircle,
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { shopifySupabase } from '@/lib/shopify/supabase-client';

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
    isSyncing: hookIsSyncing,
    accessToken
  } = useShopify();
  
  // Combine external and internal syncing states
  const isSyncing = externalIsSyncing || hookIsSyncing;

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [blockId, setBlockId] = useState<string>('');
  const [existingSettings, setExistingSettings] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [copySuccess, setCopySuccess] = useState(false);
  const [insertionMethod, setInsertionMethod] = useState<'auto' | 'manual'>('auto');
  const [themeType, setThemeType] = useState<'os2' | 'traditional' | 'auto-detect'>('auto-detect');
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [isUpdatingTheme, setIsUpdatingTheme] = useState<boolean>(false);
  const [activationScreen, setActivationScreen] = useState<boolean>(true);

  // Load existing settings when component mounts
  useEffect(() => {
    if (actualFormId) {
      loadExistingSettings(actualFormId);
    }
  }, [actualFormId]);

  // Load saved product settings from database
  const loadExistingSettings = async (formId: string) => {
    try {
      // Load product settings
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
      }
      
      // Load insertion settings
      try {
        const { data: insertionData, error: insertionError } = await shopifySupabase
          .from('shopify_form_insertion')
          .select('*')
          .eq('form_id', formId)
          .single();
        
        if (!insertionError && insertionData) {
          setInsertionMethod(insertionData.insertion_method || 'auto');
          setThemeType(insertionData.theme_type || 'auto-detect');
          
          // If we have insertion data, don't show activation screen
          setActivationScreen(false);
        }
      } catch (insertionLoadError) {
        console.error('Error loading insertion settings:', insertionLoadError);
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

  // Update theme directly using the new edge function
  const updateShopifyTheme = async () => {
    if (!actualFormId || !shop || !accessToken) {
      toast.error(language === 'ar' 
        ? 'بيانات غير كافية لتحديث القالب' 
        : 'Insufficient data to update theme');
      return;
    }

    setIsUpdatingTheme(true);

    try {
      const { data, error } = await shopifySupabase.functions.invoke('shopify-theme-update', {
        body: { 
          shop, 
          accessToken, 
          formId: actualFormId,
          blockId,
          themeType,
          position: 'product-page'
        }
      });

      if (error) {
        console.error('Error updating theme:', error);
        throw new Error(error.message || 'حدث خطأ أثناء تحديث القالب');
      }

      if (!data.success) {
        throw new Error(data.message || 'فشل تحديث القالب');
      }

      toast.success(language === 'ar' 
        ? 'تم تحديث قالب المتجر وإضافة النموذج بنجاح!' 
        : 'Store theme updated and form added successfully!');
        
      // Update insertion method to avoid showing activation screen again
      setActivationScreen(false);
      
      // Save the settings in the database too
      await handleSaveSettings(false);
    } catch (error) {
      console.error('Theme update error:', error);
      toast.error(language === 'ar'
        ? `فشل تحديث القالب: ${error.message}` 
        : `Failed to update theme: ${error.message}`);
    } finally {
      setIsUpdatingTheme(false);
    }
  };

  // Handler for saving product settings
  const handleSaveSettings = async (showSuccess = true) => {
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
              position: 'product-page',
              themeType: themeType,
              insertionMethod: insertionMethod
            }
          });
          
          // Also call the external onSave if provided
          if (onSave) {
            await onSave({ 
              formId: actualFormId,
              products: selectedProducts,
              blockId: blockId,
              position: 'product-page',
              themeType: themeType,
              insertionMethod: insertionMethod
            });
          }
          
          // Show instructions if manual insertion is selected
          if (insertionMethod === 'manual') {
            setShowInstructions(true);
          }
          
          if (showSuccess) {
            toast.success(language === 'ar' 
              ? 'تم حفظ الإعدادات وتزامن النموذج بنجاح!'
              : 'Settings saved and form synced successfully!');
          }
        }
      } else {
        if (showSuccess) {
          toast.success(language === 'ar'
            ? 'تم مسح إعدادات المنتج'
            : 'Product settings cleared');
        }
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
  
  // Open Shopify theme editor directly
  const openShopifyThemeEditor2 = () => {
    if (shop) {
      window.open(`https://${shop}/admin/themes/current/editor`, '_blank');
    }
  };

  // Render instructions for manual insertion
  const renderManualInstructions = () => {
    return (
      <Alert className="mb-6 bg-blue-50 border-blue-200">
        <AlertTitle className="text-blue-800 flex items-center">
          <HelpCircle className="h-4 w-4 mr-2" />
          {language === 'ar' ? 'تعليمات التثبيت اليدوي' : 'Manual Installation Instructions'}
        </AlertTitle>
        <AlertDescription className="space-y-4">
          <p className="text-blue-700">
            {language === 'ar' 
              ? 'لقد اخترت طريقة الإدراج اليدوي للنموذج. اتبع الخطوات التالية لإضافة النموذج إلى متجرك:' 
              : 'You have chosen manual insertion method. Follow these steps to add the form to your store:'}
          </p>
          
          <ol className="list-decimal ml-5 space-y-2 text-blue-700">
            <li>
              {language === 'ar' 
                ? 'انتقل إلى متجرك واضغط على "تخصيص القالب"' 
                : 'Go to your store and click "Customize Theme"'}
            </li>
            <li>
              {language === 'ar' 
                ? 'انتقل إلى صفحة المنتج التي تريد إضافة النموذج إليها' 
                : 'Navigate to the product page you want to add the form to'}
            </li>
            <li>
              {language === 'ar' 
                ? 'اضغط على "إضافة قسم" واختر "تطبيقات"' 
                : 'Click "Add section" and choose "Apps"'}
            </li>
            <li>
              {language === 'ar' 
                ? 'ابحث عن "نموذج الدفع عند الاستلام" وأضفه' 
                : 'Look for "COD Form" and add it'}
            </li>
            <li>
              {language === 'ar' 
                ? `أدخل معرف النموذج التالي: ${actualFormId}` 
                : `Enter this Form ID: ${actualFormId}`}
            </li>
            <li>
              {language === 'ar' 
                ? 'احفظ التغييرات' 
                : 'Save your changes'}
            </li>
          </ol>
          
          <div className="flex justify-end mt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={openShopifyThemeEditor2}
              className="text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              {language === 'ar' ? 'فتح محرر القوالب' : 'Open Theme Editor'}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  // Render theme compatibility information
  const renderThemeCompatibilityInfo = () => {
    return (
      <Accordion type="single" collapsible className="mb-4">
        <AccordionItem value="theme-compat">
          <AccordionTrigger className="text-sm font-medium">
            {language === 'ar' 
              ? 'معلومات توافق القالب ومشاكل الإدراج' 
              : 'Theme Compatibility & Insertion Issues'}
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground space-y-2">
            <p>
              {language === 'ar'
                ? 'قد تواجه بعض القوالب مشاكل في الإدراج التلقائي للنموذج. إذا واجهت خطأ 422 أو لم يظهر النموذج، جرب الإدراج اليدوي بدلاً من ذلك.'
                : 'Some themes may have issues with automatic form insertion. If you encounter a 422 error or the form doesn\'t appear, try manual insertion instead.'}
            </p>
            <div className="flex items-center justify-between mt-2 border-t pt-2">
              <span className="font-medium">Online Store 2.0:</span>
              <Badge variant="outline" className="bg-green-50">
                {language === 'ar' ? 'متوافق' : 'Compatible'}
              </Badge>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <span className="font-medium">Dawn Theme:</span>
              <Badge variant="outline" className="bg-green-50">
                {language === 'ar' ? 'متوافق' : 'Compatible'}
              </Badge>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <span className="font-medium">Legacy Themes:</span>
              <Badge variant="outline" className="bg-amber-50 text-amber-800">
                {language === 'ar' ? 'قد يتطلب الإدراج اليدوي' : 'May require manual insertion'}
              </Badge>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <span className="font-medium">Custom Themes:</span>
              <Badge variant="outline" className="bg-amber-50 text-amber-800">
                {language === 'ar' ? 'قد يتطلب الإدراج اليدوي' : 'May require manual insertion'}
              </Badge>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  };
  
  // Render activation screen
  const renderActivationScreen = () => {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="bg-green-100 p-4 rounded-full mb-4">
          <ShoppingBag className="h-12 w-12 text-green-600" />
        </div>
        
        <h3 className="text-xl font-bold mb-3">
          {language === 'ar' ? 'تفعيل نموذج الدفع عند الاستلام' : 'Activate Cash On Delivery Form'}
        </h3>
        
        <p className="text-gray-600 mb-6 max-w-md">
          {language === 'ar' 
            ? 'لإضافة نموذج الدفع عند الاستلام إلى متجرك، يمكنك اختيار طريقة الإدراج المفضلة لديك:'
            : 'To add the Cash On Delivery form to your store, choose your preferred insertion method:'}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mb-6">
          <div 
            className={cn(
              "border rounded-lg p-5 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all",
              insertionMethod === 'auto' ? "border-blue-500 bg-blue-50" : "border-gray-200"
            )}
            onClick={() => setInsertionMethod('auto')}
          >
            <div className="flex items-center mb-2">
              <div className={cn(
                "w-5 h-5 rounded-full mr-2 flex items-center justify-center border",
                insertionMethod === 'auto' ? "border-blue-500" : "border-gray-300"
              )}>
                {insertionMethod === 'auto' && (
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                )}
              </div>
              <h4 className="font-medium">
                {language === 'ar' ? 'إدراج تلقائي' : 'Automatic Insertion'}
              </h4>
            </div>
            <p className="text-sm text-gray-500 ml-7">
              {language === 'ar' 
                ? 'سيقوم النظام بإضافة النموذج تلقائياً إلى صفحة المنتج الخاصة بك'
                : 'The system will automatically add the form to your product page'}
            </p>
          </div>
          
          <div 
            className={cn(
              "border rounded-lg p-5 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all",
              insertionMethod === 'manual' ? "border-blue-500 bg-blue-50" : "border-gray-200"
            )}
            onClick={() => setInsertionMethod('manual')}
          >
            <div className="flex items-center mb-2">
              <div className={cn(
                "w-5 h-5 rounded-full mr-2 flex items-center justify-center border",
                insertionMethod === 'manual' ? "border-blue-500" : "border-gray-300"
              )}>
                {insertionMethod === 'manual' && (
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                )}
              </div>
              <h4 className="font-medium">
                {language === 'ar' ? 'إدراج يدوي' : 'Manual Insertion'}
              </h4>
            </div>
            <p className="text-sm text-gray-500 ml-7">
              {language === 'ar' 
                ? 'سيتم تزويدك بتعليمات لإضافة النموذج يدويًا باستخدام محرر السمة'
                : 'You will be provided with instructions to add the form manually using theme editor'}
            </p>
          </div>
        </div>
        
        <div className="space-x-3">
          <Button
            onClick={() => setActivationScreen(false)}
            variant="outline"
          >
            {language === 'ar' ? 'تخطي هذه الخطوة' : 'Skip this step'}
          </Button>
          
          {insertionMethod === 'auto' ? (
            <Button 
              onClick={updateShopifyTheme}
              disabled={isUpdatingTheme}
              className="min-w-[160px]"
            >
              {isUpdatingTheme ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === 'ar' ? 'جاري التفعيل...' : 'Activating...'}
                </>
              ) : (
                <>
                  {language === 'ar' ? 'تفعيل تلقائي' : 'Activate Automatically'}
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={() => {
                setActivationScreen(false);
                setShowInstructions(true);
                handleSaveSettings(false);
              }}
            >
              {language === 'ar' ? 'عرض تعليمات التثبيت' : 'Show Installation Instructions'}
            </Button>
          )}
        </div>
      </div>
    );
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

    // Show activation screen if needed
    if (activationScreen) {
      return renderActivationScreen();
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

        {/* Insertion method selection */}
        <div className="mb-4 border rounded-lg p-4 bg-slate-50">
          <h3 className="font-medium mb-3">
            {language === 'ar' ? 'طريقة إدراج النموذج:' : 'Form Insertion Method:'}
          </h3>
          
          <RadioGroup 
            value={insertionMethod} 
            onValueChange={(value) => setInsertionMethod(value as 'auto' | 'manual')}
            className="space-y-2"
          >
            <div className={cn(
              "flex items-center space-x-2 border rounded p-3",
              insertionMethod === 'auto' ? "border-blue-300 bg-blue-50" : "border-gray-200"
            )}>
              <RadioGroupItem value="auto" id="insertion-auto" />
              <Label htmlFor="insertion-auto" className="flex-1 cursor-pointer">
                <div className="font-medium">
                  {language === 'ar' ? 'إدراج تلقائي' : 'Automatic Insertion'}
                </div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' 
                    ? 'النظام سيحاول إدراج النموذج تلقائياً في صفحة المنتج'
                    : 'System will attempt to automatically insert the form in the product page'}
                </p>
              </Label>
            </div>
            
            <div className={cn(
              "flex items-center space-x-2 border rounded p-3",
              insertionMethod === 'manual' ? "border-blue-300 bg-blue-50" : "border-gray-200"
            )}>
              <RadioGroupItem value="manual" id="insertion-manual" />
              <Label htmlFor="insertion-manual" className="flex-1 cursor-pointer">
                <div className="font-medium">
                  {language === 'ar' ? 'إدراج يدوي' : 'Manual Insertion'}
                </div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' 
                    ? 'سيتم تزويدك بتعليمات لإضافة النموذج يدوياً باستخدام محرر السمة'
                    : 'You will be provided with instructions to add the form manually using theme editor'}
                </p>
              </Label>
            </div>
          </RadioGroup>
          
          {renderThemeCompatibilityInfo()}

          {insertionMethod === 'manual' && showInstructions && renderManualInstructions()}
          
          {insertionMethod === 'auto' && (
            <Button
              onClick={updateShopifyTheme}
              disabled={isUpdatingTheme}
              className="w-full mt-4"
            >
              {isUpdatingTheme ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {language === 'ar' ? 'تحديث القالب وإضافة النموذج' : 'Update Theme & Add Form'}
            </Button>
          )}
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
              {language === 'ar' ? 'خطوات تكامل النموذج مع متجرك:' : 'Steps to integrate the form with your store:'}
            </h4>
            <ol className="list-decimal ml-5 space-y-1">
              <li>{language === 'ar' ? 'حدد المنتجات التي ترغب في إضافة النموذج إليها' : 'Select the products you want to add the form to'}</li>
              <li>{language === 'ar' ? 'اختر طريقة الإدراج (تلقائي أو يدوي)' : 'Choose insertion method (automatic or manual)'}</li>
              <li>{language === 'ar' ? 'انقر على "حفظ إعدادات المنتج" أدناه' : 'Click "Save Product Settings" below'}</li>
              <li>{language === 'ar' ? 'اتبع التعليمات لإكمال عملية الإدراج' : 'Follow instructions to complete the insertion process'}</li>
            </ol>
          </AlertDescription>
        </Alert>

        <Button
          onClick={() => handleSaveSettings(true)}
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
            ? 'حدد منتجات Shopify لعرض هذا النموذج عليها واختر طريقة الإدراج المفضلة'
            : 'Select Shopify products and choose your preferred insertion method'}
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
            onClick={openShopifyThemeEditor2}
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
