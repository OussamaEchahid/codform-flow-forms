import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { createShopifyAPI } from '@/lib/shopify/api';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import ShopifyProductsList from '@/components/shopify/ShopifyProductsList';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, RefreshCw, ShieldAlert } from 'lucide-react';
import { ShopifyTokenUpdater } from '@/components/shopify/ShopifyTokenUpdater';

const ShopifyTest: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [shop, setShop] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<any>({});
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [testStep, setTestStep] = useState<string | null>(null);
  const [showTokenUpdater, setShowTokenUpdater] = useState<boolean>(false);

  // Load connection state on mount
  useEffect(() => {
    const shopFromStorage = localStorage.getItem('shopify_store');
    const connected = localStorage.getItem('shopify_connected') === 'true';
    
    setShop(shopFromStorage);
    setIsConnected(connected);
    
    // Get all connection data from localStorage
    const connectionData = {
      shopify_store: localStorage.getItem('shopify_store'),
      shopify_connected: localStorage.getItem('shopify_connected'),
      bypass_auth: localStorage.getItem('bypass_auth'),
      last_connected_shop: localStorage.getItem('last_connected_shop'),
      last_successful_connection: localStorage.getItem('last_successful_connection'),
      shopify_failsafe: localStorage.getItem('shopify_failsafe'),
    };
    
    setConnectionState(connectionData);
  }, []);

  // Reset all Shopify connection data in localStorage
  const handleResetConnectionState = () => {
    if (confirm('هل أنت متأكد من أنك تريد إعادة ضبط حالة الاتصال بالكامل؟ سيؤدي هذا إلى محو جميع بيانات الاتصال المخزنة.')) {
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem('shopify_temp_store');
      localStorage.removeItem('shopify_recovery_mode');
      localStorage.removeItem('bypass_auth');
      localStorage.removeItem('shopify_failsafe');
      localStorage.removeItem('last_connected_shop');
      localStorage.removeItem('last_successful_connection');
      
      toast.success('تم إعادة ضبط حالة الاتصال');
      window.location.reload();
    }
  };

  // Toggle token updater visibility
  const toggleTokenUpdater = () => {
    setShowTokenUpdater(!showTokenUpdater);
  };

  // Fetch access token from Supabase directly
  const fetchAccessToken = async (shopDomain: string) => {
    setTestStep('جاري جلب رمز الوصول...');
    
    try {
      // Use direct query to fetch token
      const { data, error } = await supabase
        .from('shopify_stores')
        .select('access_token, token_type, updated_at')
        .eq('shop', shopDomain)
        .single();
        
      if (error) {
        console.error("Error fetching store data:", error);
        setErrorDetails(`خطأ في جلب بيانات المتجر: ${error.message}`);
        return null;
      }
      
      if (!data || !data.access_token) {
        setErrorDetails('لم يتم العثور على رمز وصول لهذا المتجر');
        return null;
      }
      
      console.log("Token retrieved successfully, type:", data.token_type, "updated:", data.updated_at);
      setAccessToken(data.access_token);
      return data.access_token;
    } catch (error) {
      console.error("Error in fetchAccessToken:", error);
      setErrorDetails(`خطأ: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
      return null;
    }
  };

  // Test connection to Shopify API
  const testConnection = async () => {
    setIsLoading(true);
    setErrorDetails(null);
    setTestStep('جاري التحقق من الاتصال...');
    
    try {
      if (!shop) {
        setErrorDetails('يرجى تحديد متجر Shopify للاختبار');
        setIsLoading(false);
        return;
      }

      // نقوم أولاً بالتحقق من وجود المتجر في قاعدة البيانات
      const { data: shopData, error: shopError } = await supabase
        .from('shopify_stores')
        .select('*')
        .eq('shop', shop)
        .maybeSingle();

      if (shopError) {
        console.error('Error fetching shop data:', shopError);
        setErrorDetails(`خطأ في جلب بيانات المتجر: ${shopError.message}`);
        setIsLoading(false);
        return;
      }

      if (!shopData) {
        setErrorDetails('لم يتم العثور على معلومات المتجر في قاعدة البيانات. يرجى إعادة الاتصال بالمتجر.');
        setIsConnected(false);
        setIsLoading(false);
        return;
      }

      setTestStep('جاري إنشاء عميل API...');
      
      try {
        // تحقق من صحة الاتصال باستخدام Edge Function
        const { data: verificationData, error: verificationError } = await supabase.functions.invoke('shopify-test-connection', {
          body: { 
            shop: shopData.shop,
            accessToken: shopData.access_token
          }
        });

        if (verificationError || !verificationData?.success) {
          throw new Error(verificationError?.message || 'فشل التحقق من الاتصال');
        }

        setIsConnected(true);
        toast.success(`تم الاتصال بمتجر Shopify بنجاح: ${shop}`);
        
        // تحديث localStorage
        localStorage.setItem('shopify_store', shop);
        localStorage.setItem('shopify_connected', 'true');
        localStorage.setItem('last_successful_connection', Date.now().toString());
        localStorage.setItem('last_connected_shop', shop);
      } catch (connectionError: any) {
        console.error('Connection verification error:', connectionError);
        setIsConnected(false);
        setErrorDetails(`فشل التحقق من الاتصال: ${connectionError.message}`);
        toast.error('فشل اختبار الاتصال');
      }
    } catch (error: any) {
      console.error('Test connection error:', error);
      setIsConnected(false);
      setErrorDetails(`خطأ: ${error.message}`);
      toast.error('فشل اختبار الاتصال');
    } finally {
      setIsLoading(false);
      setTestStep(null);
    }
  };

  // Fetch products from Shopify
  const fetchProducts = async () => {
    setIsLoading(true);
    setErrorDetails(null);
    setProducts([]);
    setTestStep('جاري جلب المنتجات...');
    
    try {
      if (!shop) {
        setErrorDetails('يرجى تحديد متجر Shopify للاختبار');
        setIsLoading(false);
        return;
      }
      
      // First get access token
      const token = await fetchAccessToken(shop);
      
      if (!token) {
        setErrorDetails('لم يتم العثور على رمز وصول صالح');
        setIsLoading(false);
        return;
      }
      
      setTestStep('جاري إنشاء عميل API...');
      
      // Create API client directly
      const api = createShopifyAPI(token, shop);
      
      // First verify connection
      setTestStep('جاري التحقق من الاتصال...');
      try {
        await api.verifyConnection();
      } catch (connectionError: any) {
        console.error("Connection verification failed:", connectionError);
        const errorMessage = connectionError instanceof Error 
          ? connectionError.message 
          : 'خطأ غير معروف في الاتصال';
          
        setErrorDetails(errorMessage);
        toast.error('فشل التحقق من الاتصال قبل جلب المنتجات');
        setIsLoading(false);
        return;
      }
      
      setTestStep('جاري جلب المنتجات...');
      
      try {
        // Fetch products with better error handling
        const fetchedProducts = await api.getProducts();
        setProducts(fetchedProducts);
        
        if (fetchedProducts.length > 0) {
          toast.success(`تم جلب ${fetchedProducts.length} منتج من متجر Shopify`);
        } else {
          toast.info('لم يتم العثور على منتجات في متجر Shopify');
        }
      } catch (productsError: any) {
        console.error("Error fetching products:", productsError);
        const errorMessage = productsError instanceof Error 
          ? productsError.message 
          : 'خطأ غير معروف في جلب المنتجات';
          
        setErrorDetails(errorMessage);
        toast.error('فشل جلب المنتجات');
      }
    } catch (error) {
      console.error("Error in fetchProducts:", error);
      setErrorDetails(`خطأ: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
      toast.error('فشل جلب المنتجات');
    } finally {
      setIsLoading(false);
      setTestStep(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShop(e.target.value);
  };

  return (
    <div className="container mx-auto py-6 bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">اختبار اتصال Shopify</h1>
        <div className="space-x-2 rtl:space-x-reverse">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            العودة للوحة التحكم
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Connection status and settings */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>حالة الاتصال</CardTitle>
            <CardDescription>معلومات حول اتصال Shopify الحالي</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">الحالة:</span>
                {isConnected === true && (
                  <Badge className="bg-green-500">متصل</Badge>
                )}
                {isConnected === false && (
                  <Badge variant="destructive">غير متصل</Badge>
                )}
                {isConnected === null && (
                  <Badge variant="outline">غير معروف</Badge>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="shop" className="block text-sm font-medium">
                  متجر Shopify:
                </label>
                <div className="flex space-x-2 rtl:space-x-reverse">
                  <input
                    id="shop"
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-right"
                    value={shop || ''}
                    onChange={handleInputChange}
                    placeholder="متجر.myshopify.com"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <Button 
                  onClick={testConnection} 
                  disabled={isLoading || !shop}
                  className="w-full"
                >
                  {isLoading && testStep === 'جاري التحقق من الاتصال...' ? 'جاري الاختبار...' : 'اختبار الاتصال'}
                </Button>
                
                <Button 
                  onClick={fetchProducts} 
                  disabled={isLoading || !shop}
                  className="w-full"
                  variant="outline"
                >
                  {isLoading && testStep === 'جاري جلب المنتجات...' ? 'جاري جلب المنتجات...' : 'جلب المنتجات'}
                </Button>
                
                <Button 
                  onClick={toggleTokenUpdater}
                  className="w-full"
                  variant="secondary"
                >
                  {showTokenUpdater ? 'إخفاء محدث رمز الوصول' : 'تحديث رمز الوصول يدويًا'}
                </Button>
                
                <Button 
                  variant="destructive" 
                  className="w-full" 
                  onClick={handleResetConnectionState}
                >
                  إعادة ضبط حالة الاتصال
                </Button>
              </div>

              {testStep && (
                <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800">{testStep}</p>
                </div>
              )}

              {errorDetails && (
                <Alert variant="destructive" className="mt-4">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>خطأ</AlertTitle>
                  <AlertDescription className="text-sm whitespace-pre-wrap">
                    {errorDetails}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Connection debug info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>معلومات التصحيح</CardTitle>
            <CardDescription>بيانات حالة الاتصال المخزنة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-sm font-medium text-gray-500 text-right">المفتاح</th>
                      <th className="px-4 py-2 text-sm font-medium text-gray-500 text-right">القيمة</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {Object.entries(connectionState).map(([key, value]) => (
                      <tr key={key} className="border-t">
                        <td className="px-4 py-2 text-sm text-gray-900 font-mono">{key}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 font-mono break-all">
                          {value !== null ? String(value) : 'null'}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t">
                      <td className="px-4 py-2 text-sm text-gray-900 font-mono">access_token (in memory)</td>
                      <td className="px-4 py-2 text-sm text-gray-900 font-mono">
                        {accessToken ? `${accessToken.substring(0, 7)}...${accessToken.substring(accessToken.length - 4)}` : 'غير متوفر'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {accessToken && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-yellow-800 font-medium">تم العثور على رمز وصول لمتجر {shop}</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-yellow-600" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">هذا هو الرمز المخزن في قاعدة البيانات. إذا كان منتهي الصلاحية، يجب إعادة الاتصال</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">
                    طول الرمز: {accessToken.length} حرف | 
                    البداية: {accessToken.substring(0, 7)}... | 
                    النهاية: ...{accessToken.substring(accessToken.length - 4)}
                  </p>
                </div>
              )}
              
              {errorDetails && errorDetails.includes('منتهي الصلاحية') && (
                <Alert className="mt-4 bg-amber-50 border-amber-200">
                  <RefreshCw className="h-4 w-4" />
                  <AlertTitle>رمز الوصول قد يحتاج للتحديث</AlertTitle>
                  <AlertDescription className="text-sm">
                    يبدو أن رمز الوصول الحالي منتهي الصلاحية أو غير صالح. جرب استخدام وظيفة "تحديث رمز الوصول يدويًا" أعلاه.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Token Updater */}
        {showTokenUpdater && (
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>تحديث رمز الوصول</CardTitle>
              <CardDescription>قم بتحديث رمز الوصول لمتجر Shopify مباشرة في قاعدة البيانات</CardDescription>
            </CardHeader>
            <CardContent>
              <ShopifyTokenUpdater />
            </CardContent>
          </Card>
        )}
        
        {/* Products display */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>منتجات المتجر</CardTitle>
            <CardDescription>المنتجات التي تم جلبها من متجر Shopify</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && testStep === 'جاري جلب المنتجات...' ? (
              <div className="flex justify-center items-center p-12">
                <p className="text-gray-500">جاري تحميل المنتجات...</p>
              </div>
            ) : products && products.length > 0 ? (
              <ShopifyProductsList products={products} />
            ) : (
              <div className="flex justify-center items-center p-12 border border-dashed rounded-md">
                <p className="text-gray-500">لم يتم جلب أي منتجات بعد</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShopifyTest;
