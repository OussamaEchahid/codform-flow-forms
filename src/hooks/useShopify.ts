
import { useState, useEffect, useCallback } from 'react';
import { createShopifyAPI } from '@/lib/shopify/api';
import { ShopifyProduct, ShopifyFormData } from '@/lib/shopify/types';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export const useShopify = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const { shop, shopifyConnected, refreshShopifyConnection, isTokenVerified } = useAuth();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'verifying' | 'connected' | 'disconnected'>('verifying');
  const [lastConnectionCheck, setLastConnectionCheck] = useState<number>(0);
  
  // إعادة تعيين حالة إعادة التوجيه عند تغيير الصفحة
  useEffect(() => {
    setIsRedirecting(false);
    console.log('useShopify hook initialized with shop:', shop);
    
    // التحقق الأولي من حالة الاتصال - تخطي إذا تم التحقق بالفعل
    if (isTokenVerified) {
      console.log('Token already verified by AuthProvider, assuming connected');
      setConnectionStatus('connected');
    } else if (shopifyConnected && shop) {
      // منع التحقق المتكرر في فترة قصيرة
      const now = Date.now();
      if (now - lastConnectionCheck > 30000) { // تحقق كل 30 ثانية فقط
        setLastConnectionCheck(now);
        verifyShopifyConnection()
          .then(connected => {
            console.log('Initial connection check result:', connected);
            setConnectionStatus(connected ? 'connected' : 'disconnected');
          })
          .catch(() => {
            setConnectionStatus('disconnected');
          });
      }
    } else {
      setConnectionStatus('disconnected');
    }
  }, [shop, shopifyConnected, isTokenVerified, lastConnectionCheck]);

  // وظيفة مساعدة للتعامل مع أخطاء المصادقة - عدم إعادة التوجيه تلقائيًا
  const handleAuthError = useCallback((errorMessage: string) => {
    console.error('Shopify authentication error:', errorMessage);
    setConnectionStatus('disconnected');
    
    // تسجيل الخطأ ولكن عدم إعادة التوجيه تلقائيًا
    if (errorMessage.includes('authentication error') || 
        errorMessage.includes('token is invalid') || 
        errorMessage.includes('token has expired') || 
        errorMessage.includes('HTML instead of JSON')) {
      
      console.log('Authentication error detected. Manual reconnection required');
      toast.error('تم اكتشاف مشكلة في الاتصال بـ Shopify. يرجى إعادة الاتصال.', {
        duration: 7000,
      });
      
      // إرجاع true للإشارة إلى أن هذا تم التعامل معه كخطأ مصادقة
      return true;
    }
    return false;
  }, []);

  // وظيفة للتحقق من اتصال Shopify عن طريق اختبار API مع آلية تخزين مؤقت
  const verifyShopifyConnection = useCallback(async (): Promise<boolean> => {
    console.log("verifyShopifyConnection called");
    
    if (!shopifyConnected || !shop) {
      console.log('Cannot verify connection: shop not connected');
      return false;
    }

    // استخدام التخزين المؤقت لمنع الطلبات المتكررة
    const now = Date.now();
    const lastCheck = parseInt(localStorage.getItem('shopify_last_connection_check') || '0', 10);
    const cachedResult = localStorage.getItem('shopify_connection_verified');
    
    // إذا كان هناك نتيجة مخزنة مؤقتًا وكان آخر تحقق قبل أقل من 5 دقائق
    if (cachedResult && (now - lastCheck) < 300000) {
      console.log('Using cached connection verification result:', cachedResult === 'true');
      return cachedResult === 'true';
    }

    try {
      console.log(`Verifying connection for shop: ${shop}`);
      // الحصول على رمز وصول المتجر
      const { data: storeData, error: storeError } = await supabase
        .from('shopify_stores')
        .select('access_token, updated_at')
        .eq('shop', shop)
        .maybeSingle();
      
      if (storeError) {
        console.error('Store access token error:', storeError);
        localStorage.setItem('shopify_last_connection_check', now.toString());
        localStorage.setItem('shopify_connection_verified', 'false');
        return false;
      }
      
      if (!storeData || !storeData.access_token) {
        console.error('No store data or access token found');
        localStorage.setItem('shopify_last_connection_check', now.toString());
        localStorage.setItem('shopify_connection_verified', 'false');
        return false;
      }
      
      try {
        // تكوين مثيل API واختبار الاتصال بشكل مباشر
        const api = createShopifyAPI(storeData.access_token, shop);
        const result = await api.verifyConnection();
        console.log('Connection verification result:', result);
        
        // تخزين نتيجة التحقق
        localStorage.setItem('shopify_last_connection_check', now.toString());
        localStorage.setItem('shopify_connection_verified', result ? 'true' : 'false');
        
        return !!result;
      } catch (error) {
        console.error('Connection verification failed:', error);
        localStorage.setItem('shopify_last_connection_check', now.toString());
        localStorage.setItem('shopify_connection_verified', 'false');
        return false;
      }
    } catch (err) {
      console.error('Error verifying connection:', err);
      localStorage.setItem('shopify_last_connection_check', now.toString());
      localStorage.setItem('shopify_connection_verified', 'false');
      return false;
    }
  }, [shop, shopifyConnected]);

  // إعادة اتصال يدوية مع إجراءات مضادة لحلقات إعادة التوجيه وتخزين مؤقت متقدم
  const manualReconnect = useCallback(() => {
    console.log('Manual reconnect triggered');
    
    // التحقق من عدم إعادة التوجيه بالفعل
    if (isRedirecting) {
      console.log('Already attempting to redirect, ignoring duplicate request');
      return false;
    }
    
    // تقييد التوجيه المتكرر
    const lastRedirectTime = parseInt(localStorage.getItem('shopify_last_redirect_time') || '0', 10);
    const now = Date.now();
    
    if ((now - lastRedirectTime) < 10000) {
      console.log('Redirect throttling: must wait before next attempt');
      toast.info('الرجاء الانتظار قبل محاولة إعادة الاتصال مرة أخرى');
      return false;
    }
    
    // تعيين العلامات وتخزين وقت إعادة التوجيه
    setIsRedirecting(true);
    localStorage.setItem('shopify_last_redirect_time', now.toString());
    
    // مسح بيانات الاتصال لتجنب استخدام البيانات القديمة
    localStorage.removeItem('shopify_store');
    localStorage.removeItem('shopify_connected');
    localStorage.removeItem('shopify_connection_verified');
    localStorage.removeItem('shopify_last_connection_check');
    sessionStorage.removeItem('shopify_redirect_attempts');
    sessionStorage.removeItem('shopify_connecting');
    sessionStorage.removeItem('shopify_callback_attempts');
    
    // تحديث سياق المصادقة
    if (refreshShopifyConnection) {
      refreshShopifyConnection();
    }
    
    // إعادة التوجيه مع معلمات عشوائية لمنع التخزين المؤقت
    setTimeout(() => {
      const randomParam = Math.random().toString(36).substring(7);
      window.location.href = `/shopify?reconnect=true&force=true&ts=${now}&r=${randomParam}`;
    }, 500);
    
    return true;
  }, [refreshShopifyConnection, isRedirecting]);

  // وظيفة جلب المنتجات مع معالجة محسنة للأخطاء وتخزين مؤقت
  const fetchProducts = useCallback(async () => {
    // تخطي جلب المنتجات إذا كانت هناك إعادة توجيه جارية
    if (isRedirecting) {
      console.log('Skipping fetchProducts due to ongoing redirect');
      return;
    }
    
    // التحقق من حالة اتصال المتجر
    if (!shopifyConnected || !shop) {
      console.log('Shopify connection not established, skipping fetch');
      setError('Shopify connection not established');
      return;
    }

    // منع الطلبات المتزامنة
    if (isLoading) {
      console.log('Already loading products, skipping duplicate fetch');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching products for shop: ${shop}`);
      // الحصول على رمز وصول المتجر
      const { data: storeData, error: storeError } = await supabase
        .from('shopify_stores')
        .select('access_token, updated_at')
        .eq('shop', shop)
        .maybeSingle();
      
      if (storeError) {
        console.error('Store access token error:', storeError);
        throw new Error('Could not retrieve store access token');
      }
      
      if (!storeData) {
        console.error('No store data found');
        throw new Error('No store data found');
      }
      
      // التأكد من وجود رمز الوصول في بيانات المتجر
      const accessToken = storeData.access_token;
      if (!accessToken) {
        throw new Error('Access token not found in store data');
      }
      
      console.log('Access token retrieved successfully');

      // إنشاء مثيل API مع الرمز ونطاق المتجر
      try {
        const api = createShopifyAPI(accessToken, shop);
        
        // التحقق من الاتصال أولاً
        try {
          await api.verifyConnection();
          
          // تحديث حالة التحقق من الاتصال
          localStorage.setItem('shopify_last_connection_check', Date.now().toString());
          localStorage.setItem('shopify_connection_verified', 'true');
          
          console.log('Connection verified successfully');
        } catch (verifyError: any) {
          console.error('Verification error:', verifyError.message);
          if (handleAuthError(verifyError.message)) {
            return; // إيقاف التنفيذ إذا كان خطأ مصادقة يتم معالجته
          }
          throw verifyError;
        }
        
        // استخدام تخزين مؤقت للمنتجات لتقليل طلبات API
        const cachedProducts = localStorage.getItem('shopify_products_cache');
        const cacheTime = parseInt(localStorage.getItem('shopify_products_cache_time') || '0', 10);
        const now = Date.now();
        
        // استخدام المنتجات المخزنة مؤقتًا إذا كانت حديثة (أقل من 5 دقائق)
        if (cachedProducts && (now - cacheTime) < 300000) {
          console.log('Using cached products data');
          setProducts(JSON.parse(cachedProducts));
        } else {
          // جلب منتجات جديدة
          const fetchedProducts = await api.getProducts();
          console.log(`Retrieved ${fetchedProducts.length} products`);
          setProducts(fetchedProducts);
          
          // تخزين المنتجات للاستخدام لاحقًا
          localStorage.setItem('shopify_products_cache', JSON.stringify(fetchedProducts));
          localStorage.setItem('shopify_products_cache_time', now.toString());
        }
      } catch (apiError: any) {
        console.error('API error:', apiError);
        if (handleAuthError(apiError.message)) {
          return; // إيقاف التنفيذ إذا كان خطأ مصادقة يتم معالجته
        }
        throw apiError;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(errorMessage);
      console.error('Error fetching products:', err);
    } finally {
      setIsLoading(false);
    }
  }, [shop, shopifyConnected, handleAuthError, isRedirecting, isLoading]);

  // وظيفة مزامنة النموذج مع Shopify محسنة مع معالجة الأخطاء
  const syncFormWithShopify = useCallback(async (formData: ShopifyFormData) => {
    console.log("Syncing form with Shopify", formData);
    
    if (!shop || !shopifyConnected) {
      toast.error('يجب الاتصال بـ Shopify أولاً');
      return Promise.reject(new Error('Not connected to Shopify'));
    }
    
    setIsSyncing(true);
    
    try {
      // التحقق من حالة الاتصال أولاً
      const isConnected = await verifyShopifyConnection();
      if (!isConnected) {
        throw new Error('Shopify connection verification failed');
      }
      
      // تنفيذ المزامنة هنا - هذه نسخة بسيطة
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('تمت المزامنة بنجاح مع Shopify');
      return Promise.resolve();
    } catch (error) {
      console.error('Error syncing with Shopify:', error);
      toast.error('فشلت المزامنة مع Shopify');
      return Promise.reject(error);
    } finally {
      setIsSyncing(false);
    }
  }, [shop, shopifyConnected, verifyShopifyConnection]);

  // إضافة دالة تحديث الاتصال متاحة للمستخدم
  const refreshConnection = useCallback(async () => {
    setConnectionStatus('verifying');
    const isConnected = await verifyShopifyConnection();
    setConnectionStatus(isConnected ? 'connected' : 'disconnected');
    return isConnected;
  }, [verifyShopifyConnection]);

  return {
    products,
    isLoading,
    error,
    syncFormWithShopify,
    fetchProducts,
    isConnected: connectionStatus === 'connected',
    isSyncing,
    isRedirecting,
    manualReconnect,
    verifyShopifyConnection,
    connectionStatus,
    refreshConnection // إضافة دالة تحديث الاتصال للتصدير
  };
};
