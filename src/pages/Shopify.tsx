
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle, CheckCircle, Store } from 'lucide-react';
import { shopifySupabase, shopifyStores } from '@/lib/shopify/supabase-client';
import { shopifyConnectionService } from '@/services/ShopifyConnectionService';
import { toast } from 'sonner';

const Shopify = () => {
  const [shopDomain, setShopDomain] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedShop, setConnectedShop] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // فحص الاتصال الحالي عند تحميل الصفحة
  useEffect(() => {
    const checkExistingConnection = async () => {
      setIsCheckingStatus(true);
      
      try {
        console.log('Checking existing Shopify connection...');
        
        // فحص ما إذا كان لدينا اتصال في قاعدة البيانات
        const { data, error } = await shopifyStores()
          .select('*')
          .eq('is_active', true)
          .order('updated_at', { ascending: false })
          .limit(1);
            
        if (error) {
          console.error('Error fetching store data:', error);
          setConnectionError('خطأ في التحقق من حالة الاتصال');
          setIsConnected(false);
        } else if (data && data.length > 0) {
          console.log('Found active store in database:', data[0].shop);
          
          // اختبار صلاحية الرمز
          const isValid = await shopifyConnectionService.isTokenValid(data[0].shop);
          
          if (isValid) {
            setConnectedShop(data[0].shop);
            setIsConnected(true);
            // تحديث localStorage للتناسق
            localStorage.setItem('shopify_store', data[0].shop);
            localStorage.setItem('shopify_connected', 'true');
          } else {
            console.log('Token is not valid, clearing connection state');
            setIsConnected(false);
            setConnectionError('رمز الوصول غير صالح، يرجى إعادة الاتصال');
            // مسح localStorage
            localStorage.removeItem('shopify_store');
            localStorage.removeItem('shopify_connected');
          }
        } else {
          console.log('No active shop found in database');
          
          // كخيار احتياطي، تحقق من localStorage
          const storedShop = localStorage.getItem('shopify_store');
          const storedConnected = localStorage.getItem('shopify_connected') === 'true';
          
          if (storedShop && storedConnected) {
            console.log('Found store in localStorage:', storedShop);
            
            // التحقق في قاعدة البيانات
            const { data: shopData } = await shopifyStores()
              .select('*')
              .eq('shop', storedShop)
              .limit(1);
              
            if (shopData && shopData.length > 0) {
              console.log('Store found in database, testing token validity');
              const isValid = await shopifyConnectionService.isTokenValid(storedShop);
              
              if (isValid) {
                console.log('Token is valid, activating store');
                setConnectedShop(storedShop);
                setIsConnected(true);
                // التأكد من أنه تم تعيينه كنشط في قاعدة البيانات
                await shopifyConnectionService.forceActivateStore(storedShop);
              } else {
                console.log('Token is not valid, clearing connection state');
                setIsConnected(false);
                setConnectionError('رمز الوصول غير صالح، يرجى إعادة الاتصال');
                // مسح localStorage
                localStorage.removeItem('shopify_store');
                localStorage.removeItem('shopify_connected');
              }
            } else {
              console.log('Store not found in database, clearing local state');
              setIsConnected(false);
              // مسح localStorage
              localStorage.removeItem('shopify_store');
              localStorage.removeItem('shopify_connected');
            }
          } else {
            setIsConnected(false);
          }
        }
      } catch (error) {
        console.error('Error checking connection status:', error);
        setConnectionError('خطأ في التحقق من حالة الاتصال');
        setIsConnected(false);
      } finally {
        setIsCheckingStatus(false);
      }
    };
    
    // استخراج معلمة المتجر من URL إذا كانت موجودة
    const urlParams = new URLSearchParams(location.search);
    const shopParam = urlParams.get('shop');
    
    if (shopParam) {
      setShopDomain(shopParam);
    }

    checkExistingConnection();
  }, [location.search]);

  const handleConnect = async () => {
    if (!shopDomain.trim()) {
      toast.error('يرجى إدخال نطاق المتجر');
      return;
    }
    
    // تنظيف إدخال نطاق المتجر
    let normalizedShopDomain = shopDomain.trim().toLowerCase();
    
    // إزالة البروتوكول إذا كان موجودًا
    if (normalizedShopDomain.startsWith('http://') || normalizedShopDomain.startsWith('https://')) {
      try {
        const url = new URL(normalizedShopDomain);
        normalizedShopDomain = url.hostname;
      } catch (e) {
        console.error('Invalid URL format', e);
      }
    }
    
    // إضافة نطاق myshopify.com إذا لم يكن موجودًا
    if (!normalizedShopDomain.includes('.myshopify.com')) {
      normalizedShopDomain = `${normalizedShopDomain}.myshopify.com`;
    }
    
    // حفظ آخر متجر URL للاسترداد المحتمل
    localStorage.setItem('shopify_last_url_shop', normalizedShopDomain);
    
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      console.log(`Initiating connection to shop: ${normalizedShopDomain}`);
      
      // استدعاء Edge Function في Supabase لبدء تدفق OAuth
      const { data, error } = await shopifySupabase.functions.invoke('shopify-auth', {
        body: { 
          shop: normalizedShopDomain
        }
      });
      
      if (error) {
        throw new Error(`فشل في بدء عملية الاتصال: ${error.message}`);
      }
      
      if (!data || !data.redirect) {
        throw new Error('لم يتم استلام رابط إعادة التوجيه من الخادم');
      }
      
      console.log('Redirect URL received:', data.redirect);
      console.log('Auth state:', data.state);
      console.log('DB state saved:', data.dbState);
      
      // حفظ المتجر الذي نتصل به في localStorage للاسترداد إذا لزم الأمر
      localStorage.setItem('shopify_temp_store', normalizedShopDomain);
      
      // إعداد تأخير قصير قبل إعادة التوجيه للتأكد من تحديث localStorage
      setTimeout(() => {
        // إعادة التوجيه إلى تدفق OAuth لـ Shopify
        window.location.href = data.redirect;
      }, 500);
      
    } catch (error) {
      console.error('Connection error:', error);
      setConnectionError(error instanceof Error ? error.message : 'حدث خطأ غير متوقع أثناء الاتصال');
      setIsConnecting(false);
      toast.error('فشل في الاتصال بالمتجر');
    }
  };
  
  const handleDisconnect = async () => {
    try {
      // التأكيد قبل قطع الاتصال
      if (!window.confirm('هل أنت متأكد من رغبتك في قطع الاتصال بهذا المتجر؟')) {
        return;
      }
      
      console.log('Disconnecting from shop:', connectedShop);
      
      // مسح حالة الاتصال
      shopifyConnectionService.completeConnectionReset();
      
      // تحديث قاعدة البيانات إذا لزم الأمر
      if (connectedShop) {
        const { error } = await shopifyStores()
          .update({ is_active: false })
          .eq('shop', connectedShop);
          
        if (error) {
          console.error('Error updating store status in database:', error);
        }
      }
      
      // تحديث الحالة
      setIsConnected(false);
      setConnectedShop(null);
      
      toast.success('تم قطع الاتصال بنجاح');
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('فشل في قطع الاتصال');
    }
  };
  
  const handleViewDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-6 w-6" />
            الاتصال بمتجر Shopify
          </CardTitle>
          <CardDescription>قم بربط متجرك لجلب المنتجات وإدارة النماذج</CardDescription>
        </CardHeader>
        
        {isCheckingStatus ? (
          <CardContent className="text-center py-6">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-500" />
            <p className="mt-4">جاري التحقق من حالة الاتصال...</p>
          </CardContent>
        ) : isConnected ? (
          <CardContent>
            <div className="p-4 bg-green-50 rounded-md border border-green-200 mb-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 ml-2 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-800">متصل بنجاح</p>
                  <p className="text-sm text-green-700">المتجر: {connectedShop}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <Button 
                className="w-full" 
                variant="default" 
                onClick={handleViewDashboard}
              >
                الذهاب إلى لوحة التحكم
              </Button>
              
              <Button 
                className="w-full" 
                variant="outline" 
                onClick={handleDisconnect}
              >
                قطع الاتصال
              </Button>
            </div>
          </CardContent>
        ) : (
          <CardContent>
            {connectionError && (
              <div className="p-3 bg-red-50 rounded-md border border-red-200 mb-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-red-500 ml-2 flex-shrink-0" />
                  <div className="text-sm text-red-700">{connectionError}</div>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shop">نطاق متجر Shopify</Label>
                <Input
                  id="shop"
                  placeholder="متجرك.myshopify.com"
                  value={shopDomain}
                  onChange={(e) => setShopDomain(e.target.value)}
                  disabled={isConnecting}
                />
                <p className="text-xs text-gray-500">
                  أدخل نطاق متجرك مثل: your-store.myshopify.com
                </p>
              </div>
            </div>
          </CardContent>
        )}
        
        <CardFooter className="border-t p-4">
          {!isConnected ? (
            <Button 
              className="w-full" 
              onClick={handleConnect} 
              disabled={isConnecting || isCheckingStatus}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الاتصال...
                </>
              ) : (
                'الاتصال بالمتجر'
              )}
            </Button>
          ) : (
            <div className="w-full text-center text-sm text-gray-500">
              للاتصال بمتجر مختلف، قم بقطع الاتصال أولاً
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default Shopify;
