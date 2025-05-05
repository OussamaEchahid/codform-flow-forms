
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

  // Fetch access token from Supabase directly
  const fetchAccessToken = async (shopDomain: string) => {
    setTestStep('جاري جلب رمز الوصول...');
    
    try {
      // Use direct query to fetch token
      const { data, error } = await supabase
        .from('shopify_stores')
        .select('access_token')
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
        return;
      }
      
      // First get access token
      const token = await fetchAccessToken(shop);
      
      if (!token) {
        setErrorDetails('لم يتم العثور على رمز وصول صالح');
        return;
      }
      
      setTestStep('جاري إنشاء عميل API...');
      
      // Create API client directly
      const api = createShopifyAPI(token, shop);
      
      setTestStep('جاري اختبار الاتصال...');
      
      // Test connection
      const result = await api.verifyConnection();
      setIsConnected(result);
      
      if (result) {
        toast.success(`تم الاتصال بمتجر Shopify بنجاح: ${shop}`);
        
        // Update localStorage for consistency
        localStorage.setItem('shopify_store', shop);
        localStorage.setItem('shopify_connected', 'true');
        localStorage.setItem('last_successful_connection', Date.now().toString());
        localStorage.setItem('last_connected_shop', shop);
      } else {
        toast.error('فشل الاتصال بمتجر Shopify');
        setErrorDetails('فشل التحقق من الاتصال: رمز الوصول قد يكون منتهي الصلاحية');
      }
    } catch (error) {
      console.error("Error testing connection:", error);
      setIsConnected(false);
      setErrorDetails(`خطأ: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
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
        return;
      }
      
      // First get access token
      const token = await fetchAccessToken(shop);
      
      if (!token) {
        setErrorDetails('لم يتم العثور على رمز وصول صالح');
        return;
      }
      
      setTestStep('جاري إنشاء عميل API...');
      
      // Create API client directly
      const api = createShopifyAPI(token, shop);
      
      setTestStep('جاري جلب المنتجات...');
      
      // Fetch products
      const fetchedProducts = await api.getProducts();
      setProducts(fetchedProducts);
      
      if (fetchedProducts.length > 0) {
        toast.success(`تم جلب ${fetchedProducts.length} منتج من متجر Shopify`);
      } else {
        toast.info('لم يتم العثور على منتجات في متجر Shopify');
      }
    } catch (error) {
      console.error("Error fetching products:", error);
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
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    value={shop || ''}
                    onChange={handleInputChange}
                    placeholder="متجر.myshopify.com"
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
                  <p className="text-sm text-yellow-800 font-medium">تم العثور على رمز وصول لمتجر {shop}</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    طول الرمز: {accessToken.length} حرف | 
                    البداية: {accessToken.substring(0, 7)}... | 
                    النهاية: ...{accessToken.substring(accessToken.length - 4)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
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
            ) : products.length > 0 ? (
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
