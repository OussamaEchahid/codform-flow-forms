
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
  
  // Reset redirect state on page change
  useEffect(() => {
    setIsRedirecting(false);
    console.log('useShopify hook initialized with shop:', shop);
    
    // Initial connection status check - skip if already verified
    if (isTokenVerified) {
      console.log('Token already verified by AuthProvider, assuming connected');
      setConnectionStatus('connected');
    } else if (shopifyConnected && shop) {
      verifyShopifyConnection()
        .then(connected => {
          console.log('Initial connection check result:', connected);
          setConnectionStatus(connected ? 'connected' : 'disconnected');
        })
        .catch(() => {
          setConnectionStatus('disconnected');
        });
    } else {
      setConnectionStatus('disconnected');
    }
  }, [shop, shopifyConnected, isTokenVerified]);

  // Helper function to handle authentication errors - NEVER auto-redirect
  const handleAuthError = useCallback((errorMessage: string) => {
    console.error('Shopify authentication error:', errorMessage);
    setConnectionStatus('disconnected');
    
    // Log the error but don't auto-redirect
    if (errorMessage.includes('authentication error') || 
        errorMessage.includes('token is invalid') || 
        errorMessage.includes('token has expired') || 
        errorMessage.includes('HTML instead of JSON')) {
      
      console.log('Authentication error detected. Manual reconnection required');
      toast.error('تم اكتشاف مشكلة في الاتصال بـ Shopify. يرجى إعادة الاتصال.', {
        duration: 7000,
      });
      
      // Return true to indicate this was handled as an auth error
      return true;
    }
    return false;
  }, []);

  // وظيفة للتحقق من اتصال Shopify عن طريق اختبار API
  const verifyShopifyConnection = useCallback(async (): Promise<boolean> => {
    console.log("verifyShopifyConnection called");
    if (!shopifyConnected || !shop) {
      console.log('Cannot verify connection: shop not connected');
      return false;
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
        return false;
      }
      
      if (!storeData || !storeData.access_token) {
        console.error('No store data or access token found');
        return false;
      }
      
      try {
        // تكوين مثيل API واختبار الاتصال بشكل مباشر
        const api = createShopifyAPI(storeData.access_token, shop);
        const result = await api.verifyConnection();
        console.log('Connection verification result:', result);
        return !!result;
      } catch (error) {
        console.error('Connection verification failed:', error);
        return false;
      }
    } catch (err) {
      console.error('Error verifying connection:', err);
      return false;
    }
  }, [shop, shopifyConnected]);

  // إعادة اتصال يدوية مع إجراءات مضادة لحلقات إعادة التوجيه
  const manualReconnect = useCallback(() => {
    console.log('Manual reconnect triggered');
    // التحقق من وجود محاولات إعادة توجيه كثيرة في الجلسة
    const redirectAttempts = parseInt(sessionStorage.getItem('shopify_redirect_attempts') || '0', 10);
    if (redirectAttempts > 5) {
      toast.error('تم اكتشاف الكثير من محاولات إعادة التوجيه. يرجى تحديث الصفحة وإعادة المحاولة لاحقًا.');
      return false;
    }
    
    // منع محاولات إعادة اتصال سريعة
    if (isRedirecting) {
      console.log('Already attempting to redirect, ignoring duplicate request');
      return false;
    }
    
    setIsRedirecting(true);
    console.log('Manual reconnect initiated');
    
    // مسح جميع البيانات المخزنة لضمان بداية جديدة
    localStorage.clear();
    sessionStorage.clear();
    
    // إعادة تعيين عداد إعادة التوجيه
    sessionStorage.setItem('shopify_redirect_attempts', '1');
    
    // مسح بيانات اتصال Shopify بشكل صريح
    localStorage.removeItem('shopify_store');
    localStorage.removeItem('shopify_connected');
    localStorage.removeItem('shopify_reconnect_attempts');
    localStorage.removeItem('shopify_last_connect_time');
    localStorage.removeItem('shopify_last_redirect_time');
    localStorage.removeItem('shopify_temp_store');
    
    // تحديث سياق المصادقة إذا كان متاحًا
    if (refreshShopifyConnection) {
      refreshShopifyConnection();
    }
    
    // استخدام window.location لتنقل أكثر موثوقية مع الطابع الزمني وقيم عشوائية
    setTimeout(() => {
      console.log('Redirecting to /shopify with forced reconnect parameters');
      const randomStr = Math.random().toString(36).substring(7);
      window.location.href = `/shopify?reconnect=manual&force=true&ts=${Date.now()}&r=${randomStr}`;
      
      // إعادة تعيين حالة إعادة التوجيه بعد مرور بعض الوقت في حالة فشل التنقل
      setTimeout(() => {
        setIsRedirecting(false);
      }, 5000);
    }, 500);
    
    return true;
  }, [refreshShopifyConnection, isRedirecting]);

  // Product fetching function with improved error handling
  const fetchProducts = useCallback(async () => {
    // Skip product fetching if redirecting
    if (isRedirecting) {
      console.log('Skipping fetchProducts due to ongoing redirect');
      return;
    }
    
    // Check shop connection status
    if (!shopifyConnected || !shop) {
      console.log('Shopify connection not established, skipping fetch');
      setError('Shopify connection not established');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      console.log(`Fetching products for shop: ${shop}`);
      // Get store access token
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
      
      // Make sure storeData has the access_token property
      const accessToken = storeData.access_token;
      if (!accessToken) {
        throw new Error('Access token not found in store data');
      }
      
      console.log('Access token retrieved successfully');

      // Create API instance with token and store scope
      try {
        const api = createShopifyAPI(accessToken, shop);
        
        // Verify connection first
        try {
          await api.verifyConnection();
          console.log('Connection verified successfully');
        } catch (verifyError: any) {
          console.error('Verification error:', verifyError.message);
          if (handleAuthError(verifyError.message)) {
            return; // Stop execution if it's an auth error that's being handled
          }
          throw verifyError;
        }
        
        const fetchedProducts = await api.getProducts();
        console.log(`Retrieved ${fetchedProducts.length} products`);
        setProducts(fetchedProducts);
      } catch (apiError: any) {
        console.error('API error:', apiError);
        if (handleAuthError(apiError.message)) {
          return; // Stop execution if it's an auth error that's being handled
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
  }, [shop, shopifyConnected, handleAuthError, isRedirecting]);

  // Fix the syncFormWithShopify function to return a properly typed value
  const syncFormWithShopify = useCallback(async (formData: ShopifyFormData) => {
    // Implementation code
    console.log("Syncing form with Shopify", formData);
    // Return a Promise that resolves to void
    return Promise.resolve();
  }, []);

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
    connectionStatus
  };
};
