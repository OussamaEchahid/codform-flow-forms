
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle,
  Code,
  ExternalLink,
  Eye,
  Info,
  Loader2,
  RefreshCw,
  RotateCcw,
  Settings,
  Share2,
  ShieldAlert,
  ShoppingCart,
  WifiOff
} from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useShopify } from '@/hooks/useShopify';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useShopifySettings } from '@/lib/shopify/ShopifySettingsProvider';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';

interface ShopifyLandingPageSyncProps {
  pageId: string;
  pageSlug: string;
  isPublished: boolean;
}

interface PublishResult {
  success: boolean;
  message: string;
  metaobjectCreated?: boolean;
  metaobjectId?: string;
  productUrl?: string;
  landingPageUrl?: string;
  fallbackUsed?: boolean;
  fallbackSuccess?: boolean;
  hasMetaobjectPermission?: boolean;
  metaobjectErrors?: any[];
}

const ShopifyLandingPageSync: React.FC<ShopifyLandingPageSyncProps> = ({ pageId, pageSlug, isPublished }) => {
  const { language } = useI18n();
  const navigate = useNavigate();
  const { 
    isConnected, 
    shop, 
    products, 
    isLoading: isShopifyLoading, 
    loadProducts, 
    testConnection 
  } = useShopify();
  const { settings } = useShopifySettings();
  const { isNetworkError } = useShopifyConnection(); // Get network error state from context
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState<boolean>(false);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState<boolean>(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const [selectedConnectionTab, setSelectedConnectionTab] = useState<'connect' | 'debug'>('connect');
  const [syncStatus, setSyncStatus] = useState<'none' | 'synced' | 'error'>('none');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncInfo, setSyncInfo] = useState<any>(null);
  const [debugMode, setDebugMode] = useState<boolean>(settings.debugMode);
  const [fallbackMode, setFallbackMode] = useState<boolean>(settings.fallbackModeOnly);
  const [ignoreMetaobjectErrors, setIgnoreMetaobjectErrors] = useState<boolean>(settings.ignoreMetaobjectErrors);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [permissionError, setPermissionError] = useState<boolean>(false);
  const [loadPermissions, setLoadPermissions] = useState<boolean>(false);
  const [missingPermissions, setMissingPermissions] = useState<string[]>([]);
  const [bypassValidation, setBypassValidation] = useState<boolean>(false); // New state for bypassing validation

  // Sync local state with global settings
  useEffect(() => {
    setDebugMode(settings.debugMode);
    setFallbackMode(settings.fallbackModeOnly);
    setIgnoreMetaobjectErrors(settings.ignoreMetaobjectErrors);
  }, [settings.debugMode, settings.fallbackModeOnly, settings.ignoreMetaobjectErrors]);

  // Enable bypass validation if network error is detected
  useEffect(() => {
    if (isNetworkError) {
      setBypassValidation(true);
      // Auto-enable fallback mode with network errors
      setFallbackMode(true);
      console.log('Network error detected, enabling bypass validation and fallback mode');
    }
  }, [isNetworkError]);

  // Load products when connected
  useEffect(() => {
    if (isConnected && shop) {
      loadProducts().catch(err => {
        console.error("Error loading products:", err);
        // If products can't be loaded, we'll still show the UI with empty products
      });
    }
  }, [isConnected, shop, loadProducts]);

  // Check existing sync
  useEffect(() => {
    const checkExistingSync = async () => {
      if (!pageId) return;
      
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('shopify_page_syncs')
          .select('*')
          .eq('page_id', pageId)
          .maybeSingle();
          
        if (error) {
          console.error('Error checking sync status:', error);
          return;
        }
        
        if (data) {
          setSyncStatus('synced');
          setSyncInfo(data);
        }
      } catch (error) {
        console.error('Error checking sync:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkExistingSync();
  }, [pageId]);

  const handleCheckPermissions = async () => {
    if (!isConnected || !shop) return;
    
    try {
      setLoadPermissions(true);
      
      // Skip permission check if we have network errors
      if (isNetworkError || bypassValidation) {
        console.log('Skipping permission check due to network issues');
        // Auto-enable fallback mode and assume we need it
        setFallbackMode(true);
        setPermissionError(true);
        setMissingPermissions(['Assuming permissions missing due to network issues']);
        return;
      }
      
      try {
        const { data, error } = await supabase.functions.invoke('shopify-test-connection', {
          body: { 
            shop, 
            accessToken: '', // Will be retrieved server-side
            checkPermissions: true,
            requestId: `perm_check_${Math.random().toString(36).substring(2, 8)}`
          }
        });
        
        if (error || !data?.success) {
          console.error('Error checking permissions:', error || data?.message);
          // If check fails, assume we need fallback mode
          setFallbackMode(true);
          setPermissionError(true);
          return;
        }
        
        if (data.permissions) {
          setPermissionError(!data.permissions.valid);
          setMissingPermissions(data.permissions.missingScopes || []);
          
          if (!data.permissions.hasMetaobjectPermission) {
            console.log('Missing metaobject permission');
            setFallbackMode(true); // Auto-enable fallback mode
          }
        }
      } catch (error) {
        console.error('Network error checking permissions:', error);
        // Auto-enable fallback mode on network errors
        setFallbackMode(true);
        setPermissionError(true);
      }
    } catch (error) {
      console.error('Error in handleCheckPermissions:', error);
    } finally {
      setLoadPermissions(false);
    }
  };

  useEffect(() => {
    if (isConnected && shop) {
      handleCheckPermissions();
    }
  }, [isConnected, shop, isNetworkError, bypassValidation]);

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const checkConnection = async (): Promise<boolean> => {
    // Skip connection test if we're in network error mode or bypass validation
    if (isNetworkError || bypassValidation || fallbackMode) {
      console.log('Skipping connection test due to network issues or fallback mode');
      return true; // Assume connection is valid
    }
    
    if (!isConnected) {
      toast.error(language === 'ar' ? 'يرجى الاتصال بـ Shopify أولاً' : 'Please connect to Shopify first');
      return false;
    }
    
    try {
      const result = await testConnection(true);
      if (!result) {
        toast.error(language === 'ar' ? 'فشل اختبار الاتصال' : 'Connection test failed');
      }
      return result;
    } catch (error) {
      console.error('Connection test error:', error);
      // If this is likely a network error, be permissive
      if (error.message?.includes('Failed to fetch') || 
          error.message?.includes('NetworkError')) {
        console.log('Network error detected during connection test, proceeding anyway');
        setBypassValidation(true);
        return true;
      }
      toast.error(language === 'ar' ? 'خطأ في اختبار الاتصال' : 'Connection test error');
      return false;
    }
  };

  const handlePublishToShopify = async () => {
    if (!pageId || !selectedProductId || !shop) {
      toast.error(language === 'ar' ? 'الرجاء اختيار منتج أولاً' : 'Please select a product first');
      return;
    }
    
    if (!isPublished) {
      toast.error(language === 'ar' ? 'يرجى نشر الصفحة أولاً' : 'Please publish the page first');
      return;
    }
    
    try {
      setIsPublishing(true);
      setPublishResult(null);
      setSyncError(null);
      
      // First test connection - but skip if we're in fallback mode or have network issues
      let connectionValid = true;
      if (!fallbackMode && !isNetworkError && !bypassValidation) {
        connectionValid = await checkConnection();
      }
      
      if (!connectionValid && !fallbackMode && !isNetworkError && !bypassValidation) {
        setIsPublishing(false);
        setIsErrorDialogOpen(true);
        setSyncError('connection_failed');
        return;
      }
      
      console.log('Publishing page to Shopify', {
        pageId,
        pageSlug,
        productId: selectedProductId,
        fallbackMode,
        debugMode,
        ignoreMetaobjectErrors,
        bypassValidation,
        isNetworkError
      });
      
      // Show toast with progress
      const toastId = toast.loading(
        language === 'ar' 
          ? 'جاري النشر في متجر Shopify...' 
          : 'Publishing to Shopify store...'
      );
      
      try {
        const { data, error } = await supabase.functions.invoke('shopify-publish-page', {
          body: {
            pageId,
            pageSlug,
            productId: selectedProductId,
            shop,
            accessToken: '', // Will be retrieved server-side
            requestId: `publish_${Math.random().toString(36).substring(2, 8)}`,
            timestamp: Date.now(),
            fallbackOnly: fallbackMode || isNetworkError || bypassValidation, // Use fallback if network issues
            debugMode: debugMode,
            ignoreMetaobjectErrors: ignoreMetaobjectErrors || isNetworkError || bypassValidation, // Ignore errors with network issues
          }
        });
        
        if (error) {
          console.error('Error from shopify-publish-page function:', error);
          
          // Check if this is a network error
          if (error.message?.includes('Failed to fetch') || 
              error.message?.includes('NetworkError') ||
              error.message?.includes('Failed to send')) {
            
            // Enable bypass mode and try again with full fallback
            if (!fallbackMode || !ignoreMetaobjectErrors) {
              setBypassValidation(true);
              setFallbackMode(true);
              setIgnoreMetaobjectErrors(true);
              
              toast.error(language === 'ar' 
                ? 'خطأ في الشبكة، جاري إعادة المحاولة بالوضع الاحتياطي...' 
                : 'Network error, retrying with fallback mode...', 
                { id: toastId }
              );
              
              // Try again with fallback mode
              setIsPublishing(false);
              setTimeout(() => {
                handlePublishToShopify();
              }, 500);
              return;
            }
            
            // If already in fallback mode, show network error
            toast.error(language === 'ar' ? 'خطأ في الشبكة' : 'Network error', { id: toastId });
            setSyncError('network_error');
            setIsErrorDialogOpen(true);
            return;
          }
          
          toast.error(language === 'ar' ? 'فشل النشر في Shopify' : 'Failed to publish to Shopify', { id: toastId });
          setSyncError('function_error');
          setIsErrorDialogOpen(true);
          return;
        }
        
        if (!data.success) {
          console.error('Error from function:', data.message);
          toast.error(data.message || (language === 'ar' ? 'فشل النشر في Shopify' : 'Failed to publish to Shopify'), { id: toastId });
          setPublishResult(data);
          setSyncError('api_error');
          setIsErrorDialogOpen(true);
          return;
        }
        
        // Success
        setPublishResult(data);
        toast.success(language === 'ar' ? 'تم النشر بنجاح' : 'Published successfully', { id: toastId });
        setSyncStatus('synced');
        setIsDialogOpen(false);
        setIsSuccessDialogOpen(true);
        
        // Update sync info
        const { data: syncData } = await supabase
          .from('shopify_page_syncs')
          .select('*')
          .eq('page_id', pageId)
          .maybeSingle();
          
        if (syncData) {
          setSyncInfo(syncData);
        }
      } catch (functionError) {
        console.error('Error invoking function:', functionError);
        
        // Check if it's a network error
        if (functionError.message?.includes('Failed to fetch') || 
            functionError.message?.includes('NetworkError')) {
          
          // Set network error state
          setBypassValidation(true);
          setSyncError('network_error');
          
          toast.error(language === 'ar' ? 'خطأ في الشبكة' : 'Network error', { id: toastId });
          setIsErrorDialogOpen(true);
        } else {
          toast.error(language === 'ar' ? 'حدث خطأ أثناء النشر' : 'Error during publishing', { id: toastId });
          setSyncError('unknown_error');
          setIsErrorDialogOpen(true);
        }
      }
    } catch (error) {
      console.error('Error in handlePublishToShopify:', error);
      toast.error(language === 'ar' ? 'حدث خطأ أثناء النشر' : 'Error during publishing');
      setSyncError('unknown_error');
      setIsErrorDialogOpen(true);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prevCount => prevCount + 1);
    setIsErrorDialogOpen(false);
    // Wait a bit before reopening the publish dialog
    setTimeout(() => {
      setIsDialogOpen(true);
    }, 500);
  };

  const renderErrorMessage = () => {
    switch (syncError) {
      case 'connection_failed':
        return {
          title: language === 'ar' ? 'فشل الاتصال' : 'Connection Failed',
          description: language === 'ar' 
            ? 'لم نتمكن من الاتصال بمتجر Shopify الخاص بك. يرجى التحقق من اتصالك والمحاولة مرة أخرى.'
            : 'We could not connect to your Shopify store. Please check your connection and try again.'
        };
      case 'function_error':
        return {
          title: language === 'ar' ? 'خطأ في وظيفة النشر' : 'Publishing Function Error',
          description: language === 'ar'
            ? 'حدث خطأ في وظيفة النشر. يرجى المحاولة مرة أخرى لاحقًا.'
            : 'There was an error in the publishing function. Please try again later.'
        };
      case 'network_error':
        return {
          title: language === 'ar' ? 'خطأ في الشبكة' : 'Network Error',
          description: language === 'ar'
            ? 'حدث خطأ في الشبكة أثناء محاولة الاتصال بـ Shopify. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى، أو استخدام وضع النشر الاحتياطي.'
            : 'A network error occurred while trying to connect to Shopify. Please check your internet connection and try again, or use fallback publishing mode.'
        };
      case 'api_error':
        return {
          title: language === 'ar' ? 'خطأ API' : 'API Error',
          description: publishResult?.message || (language === 'ar' 
            ? 'حدث خطأ أثناء الاتصال بـ Shopify API. يرجى المحاولة مرة أخرى.'
            : 'There was an error connecting to the Shopify API. Please try again.')
        };
      default:
        return {
          title: language === 'ar' ? 'خطأ غير معروف' : 'Unknown Error',
          description: language === 'ar'
            ? 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى لاحقًا.'
            : 'An unexpected error occurred. Please try again later.'
        };
    }
  };

  // Redirect to Shopify connect page
  const handleConnectShopify = () => {
    navigate('/shopify-connect');
  };

  // Open product URL in new tab
  const handleOpenProduct = () => {
    if (publishResult?.productUrl) {
      window.open(publishResult.productUrl, '_blank');
    }
  };

  // Open landing page URL in new tab
  const handleOpenLandingPage = () => {
    if (publishResult?.landingPageUrl) {
      window.open(publishResult.landingPageUrl, '_blank');
    } else if (syncInfo?.synced_url) {
      window.open(syncInfo.synced_url, '_blank');
    }
  };

  return (
    <div className="space-y-4 p-4">
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">
            {language === 'ar' ? 'نشر في متجر Shopify' : 'Publish to Shopify Store'}
          </CardTitle>
          <CardDescription>
            {language === 'ar' 
              ? 'اربط هذه الصفحة بمنتج في متجر Shopify الخاص بك'
              : 'Link this landing page to a product in your Shopify store'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            {isConnected ? (
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
                <p className="font-medium text-sm">
                  {language === 'ar' 
                    ? `متصل بمتجر: ${shop}` 
                    : `Connected to shop: ${shop}`}
                </p>
              </div>
            ) : (
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500"></div>
                <p className="text-sm text-amber-700 font-medium">
                  {language === 'ar' 
                    ? 'غير متصل بمتجر Shopify' 
                    : 'Not connected to a Shopify store'}
                </p>
              </div>
            )}
            
            {(isNetworkError || bypassValidation) && (
              <Alert variant="warning" className="mt-2 bg-amber-50">
                <WifiOff className="h-4 w-4" />
                <AlertTitle>
                  {language === 'ar' ? 'وضع الاتصال المحدود' : 'Limited Connection Mode'}
                </AlertTitle>
                <AlertDescription>
                  {language === 'ar' 
                    ? 'تم اكتشاف مشكلات في الشبكة. سنستخدم وضع النشر الاحتياطي.' 
                    : 'Network issues detected. Using fallback publishing mode.'}
                </AlertDescription>
              </Alert>
            )}
            
            {permissionError && (
              <Alert variant="warning" className="mt-2 bg-amber-50">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>
                  {language === 'ar' ? 'مشكلة في الصلاحيات' : 'Permission Issue'}
                </AlertTitle>
                <AlertDescription>
                  {language === 'ar' 
                    ? 'التطبيق يفتقر إلى بعض الصلاحيات المطلوبة. سيتم استخدام طريقة بديلة.' 
                    : 'The app lacks some required permissions. A fallback method will be used.'}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-3">
            {syncStatus === 'synced' ? (
              <>
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <div className="flex items-start">
                    <CheckCircle className="text-green-600 h-5 w-5 mt-0.5 mr-2" />
                    <div>
                      <p className="font-medium text-green-800">
                        {language === 'ar' 
                          ? 'تم ربط هذه الصفحة بمتجر Shopify'
                          : 'This page is linked to your Shopify store'}
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        {language === 'ar'
                          ? 'تم المزامنة في: ' + new Date(syncInfo?.updated_at || '').toLocaleString()
                          : 'Last synced: ' + new Date(syncInfo?.updated_at || '').toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={handleOpenDialog}
                    className="flex-1"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {language === 'ar' ? 'إعادة النشر' : 'Re-publish'}
                  </Button>
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleOpenLandingPage}
                    className="flex-1"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {language === 'ar' ? 'معاينة الصفحة' : 'View Page'}
                  </Button>
                </div>
              </>
            ) : (
              <Button
                onClick={handleOpenDialog}
                disabled={!isConnected || isLoading || !isPublished}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" />
                    {language === 'ar' ? 'نشر في Shopify' : 'Publish to Shopify'}
                  </>
                )}
              </Button>
            )}
            
            {!isPublished && (
              <Alert variant="warning" className="mt-2 bg-amber-50">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>
                  {language === 'ar' ? 'الصفحة غير منشورة' : 'Page Not Published'}
                </AlertTitle>
                <AlertDescription>
                  {language === 'ar' 
                    ? 'يجب نشر الصفحة قبل ربطها بمتجر Shopify.' 
                    : 'You must publish the page before linking it to Shopify.'}
                </AlertDescription>
              </Alert>
            )}
            
            {!isConnected && (
              <Button 
                variant="outline"
                onClick={handleConnectShopify}
                className="w-full mt-2"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                {language === 'ar' ? 'الاتصال بـ Shopify' : 'Connect to Shopify'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Product Selection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'اختر منتج للربط' : 'Select Product to Link'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar' 
                ? 'اختر المنتج الذي ترغب في ربط صفحة الهبوط هذه به.'
                : 'Choose the product you want to link this landing page to.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-3">
            {isShopifyLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : !products || products.length === 0 ? (
              <Alert variant="warning" className="bg-amber-50">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>
                  {language === 'ar' ? 'لا توجد منتجات' : 'No Products'}
                </AlertTitle>
                <AlertDescription>
                  {language === 'ar' 
                    ? 'لم نتمكن من العثور على أي منتجات في متجرك.' 
                    : 'We could not find any products in your store.'}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="product">
                    {language === 'ar' ? 'المنتج' : 'Product'}
                  </Label>
                  <Select
                    value={selectedProductId}
                    onValueChange={setSelectedProductId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'ar' ? "اختر منتج..." : "Select a product..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Switch
                      id="fallback-mode"
                      checked={fallbackMode || isNetworkError || bypassValidation}
                      disabled={isNetworkError || bypassValidation} // Disable if we have network errors
                      onCheckedChange={setFallbackMode}
                    />
                    <Label htmlFor="fallback-mode" className="cursor-pointer">
                      {language === 'ar' ? 'وضع الاحتياطي فقط' : 'Fallback Mode Only'}
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-gray-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          {language === 'ar'
                            ? 'استخدام الطريقة الاحتياطية البسيطة فقط (تحديث وصف المنتج والميتا فيلدز)'
                            : 'Use simple fallback method only (product description and metafields update)'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Switch
                      id="debug-mode"
                      checked={debugMode}
                      onCheckedChange={setDebugMode}
                    />
                    <Label htmlFor="debug-mode" className="cursor-pointer">
                      {language === 'ar' ? 'وضع التصحيح' : 'Debug Mode'}
                    </Label>
                  </div>
                </div>

                {/* Add ignore metaobject errors switch */}
                <div className="flex items-center space-x-2 rtl:space-x-reverse pt-2">
                  <Switch
                    id="ignore-metaobject-errors"
                    checked={ignoreMetaobjectErrors || isNetworkError || bypassValidation}
                    disabled={isNetworkError || bypassValidation} // Disable if we have network errors
                    onCheckedChange={setIgnoreMetaobjectErrors}
                  />
                  <Label htmlFor="ignore-metaobject-errors" className="cursor-pointer">
                    {language === 'ar' ? 'تجاهل أخطاء Metaobject' : 'Ignore Metaobject Errors'}
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-gray-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        {language === 'ar'
                          ? 'متابعة النشر حتى مع وجود أخطاء في metaobject'
                          : 'Continue publishing even when metaobject errors occur'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Network error mode indicator */}
                {(isNetworkError || bypassValidation) && (
                  <Alert variant="warning" className="bg-amber-50 border-amber-200">
                    <WifiOff className="h-4 w-4" />
                    <AlertTitle>
                      {language === 'ar' ? 'وضع الشبكة المحدود' : 'Limited Network Mode'}
                    </AlertTitle>
                    <AlertDescription>
                      {language === 'ar' 
                        ? 'تم اكتشاف مشكلات في الشبكة. سيتم تفعيل جميع خيارات الاحتياط تلقائيًا لضمان نجاح النشر.'
                        : 'Network issues detected. All failsafe options have been automatically enabled to ensure publishing succeeds.'}
                    </AlertDescription>
                  </Alert>
                )}
                
                {permissionError && (
                  <Alert variant="warning" className="bg-amber-50">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>
                      {language === 'ar' ? 'صلاحيات مفقودة' : 'Missing Permissions'}
                    </AlertTitle>
                    <AlertDescription>
                      {language === 'ar' 
                        ? 'بعض الصلاحيات مفقودة. سيتم استخدام طريقة بديلة للنشر.' 
                        : 'Some permissions are missing. A fallback publishing method will be used.'}
                      {missingPermissions.length > 0 && (
                        <div className="mt-2 text-xs">
                          {language === 'ar' ? 'الصلاحيات المفقودة:' : 'Missing permissions:'}
                          <ul className="list-disc ms-4 mt-1">
                            {missingPermissions.map((scope, idx) => (
                              <li key={idx}>{scope}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              disabled={isPublishing}
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handlePublishToShopify}
              disabled={!selectedProductId || isPublishing}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === 'ar' ? 'جاري النشر...' : 'Publishing...'}
                </>
              ) : (
                <>
                  <Share2 className="mr-2 h-4 w-4" />
                  {language === 'ar' ? 'نشر الآن' : 'Publish Now'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Success Dialog */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-green-700">
              <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
              {language === 'ar' ? 'تم النشر بنجاح!' : 'Published Successfully!'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-3">
            <div className="bg-green-50 border border-green-100 p-3 rounded-md">
              <p>
                {language === 'ar'
                  ? 'تم ربط صفحة الهبوط بنجاح بمنتجك في متجر Shopify.'
                  : 'Your landing page has been successfully linked to your Shopify product.'}
              </p>
              
              {publishResult?.fallbackUsed && (
                <div className="mt-2 p-2 bg-white border border-green-100 rounded-sm">
                  <span className="text-sm font-medium">
                    {language === 'ar' ? 'تم استخدام الطريقة البديلة:' : 'Used fallback method:'}
                  </span>
                  <ul className="text-xs list-disc ms-5 mt-1">
                    <li>
                      {language === 'ar' 
                        ? 'تم تحديث وصف المنتج بإضافة رابط الصفحة'
                        : 'Updated product description with page link'}
                    </li>
                    {publishResult.fallbackSuccess && (
                      <li>
                        {language === 'ar'
                          ? 'تم إضافة metafield للمنتج'
                          : 'Added metafield to product'}
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
            
            {debugMode && publishResult && (
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-md">
                <details>
                  <summary className="cursor-pointer flex items-center font-medium">
                    <Code className="h-4 w-4 mr-2" />
                    {language === 'ar' ? 'معلومات التصحيح' : 'Debug Information'}
                  </summary>
                  <pre className="text-xs mt-2 p-2 bg-slate-100 rounded overflow-x-auto">
                    {JSON.stringify(publishResult, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsSuccessDialogOpen(false)}
            >
              {language === 'ar' ? 'إغلاق' : 'Close'}
            </Button>
            
            <Button
              variant="secondary"
              className="flex-1"
              onClick={handleOpenLandingPage}
            >
              <Eye className="mr-2 h-4 w-4" />
              {language === 'ar' ? 'معاينة الصفحة' : 'View Page'}
            </Button>
            
            <Button
              className="flex-1"
              onClick={handleOpenProduct}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {language === 'ar' ? 'فتح المنتج' : 'Open Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Error Dialog */}
      <Dialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-700">
              <AlertCircle className="mr-2 h-5 w-5 text-red-600" />
              {language === 'ar' ? 'فشل النشر' : 'Publishing Failed'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-3">
            <div className="bg-red-50 border border-red-100 p-3 rounded-md">
              <h4 className="font-medium text-red-800">{renderErrorMessage().title}</h4>
              <p className="mt-1 text-red-700">{renderErrorMessage().description}</p>
            </div>
            
            {syncError === 'network_error' && (
              <Alert variant="warning" className="bg-amber-50">
                <WifiOff className="h-4 w-4" />
                <AlertTitle>
                  {language === 'ar' ? 'مشكلة في الشبكة' : 'Network Issue'}
                </AlertTitle>
                <AlertDescription>
                  {language === 'ar' 
                    ? 'تم اكتشاف مشكلات في الشبكة. حاول استخدام وضع النشر الاحتياطي لتجاوز هذه المشكلة.'
                    : 'Network issues have been detected. Try using fallback publishing mode to bypass this issue.'}
                </AlertDescription>
              </Alert>
            )}
            
            {publishResult?.hasMetaobjectPermission === false && (
              <Alert variant="warning" className="bg-amber-50">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>
                  {language === 'ar' ? 'مشكلة في الصلاحيات' : 'Permission Issue'}
                </AlertTitle>
                <AlertDescription>
                  {language === 'ar' 
                    ? 'التطبيق يفتقد صلاحية "write_metaobject_definitions". تم تفعيل وضع النشر الاحتياطي تلقائياً.'
                    : 'App is missing "write_metaobject_definitions" permission. Fallback mode has been enabled automatically.'}
                </AlertDescription>
              </Alert>
            )}
            
            {debugMode && publishResult && (
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-md">
                <details>
                  <summary className="cursor-pointer flex items-center font-medium">
                    <Code className="h-4 w-4 mr-2" />
                    {language === 'ar' ? 'معلومات التصحيح' : 'Debug Information'}
                  </summary>
                  <pre className="text-xs mt-2 p-2 bg-slate-100 rounded overflow-x-auto">
                    {JSON.stringify(publishResult, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsErrorDialogOpen(false)}
            >
              {language === 'ar' ? 'إغلاق' : 'Close'}
            </Button>
            
            {/* Enable fallback options for network issues */}
            {(syncError === 'network_error' || syncError === 'connection_failed') && (
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setFallbackMode(true);
                  setIgnoreMetaobjectErrors(true);
                  setBypassValidation(true);
                  handleRetry();
                }}
              >
                <Settings className="mr-2 h-4 w-4" />
                {language === 'ar' ? 'استخدام الوضع الاحتياطي' : 'Use Full Fallback Mode'}
              </Button>
            )}
            
            {/* Auto-enable fallback mode on next attempt if permission issue detected */}
            {publishResult?.hasMetaobjectPermission === false && !fallbackMode && (
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setFallbackMode(true);
                  handleRetry();
                }}
              >
                <Settings className="mr-2 h-4 w-4" />
                {language === 'ar' ? 'استخدام الوضع الاحتياطي' : 'Use Fallback Mode'}
              </Button>
            )}
            
            <Button
              className="flex-1"
              onClick={handleRetry}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShopifyLandingPageSync;
