
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { shopifyConnectionService } from '@/services/ShopifyConnectionService';
import { shopifyStores } from '@/lib/shopify/supabase-client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export const ShopifyDebugPanel = () => {
  const [loading, setLoading] = useState(true);
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'error' | 'loading' | 'no-token'>('loading');
  const { shop } = useAuth();
  
  const loadTokenInfo = async () => {
    setLoading(true);
    
    try {
      if (!shop) {
        setConnectionStatus('no-token');
        setTokenInfo({ error: "لا يوجد متجر متصل" });
        return;
      }
      
      // جلب معلومات المتجر من قاعدة البيانات
      const { data, error } = await shopifyStores()
        .select('*')
        .eq('shop', shop)
        .order('updated_at', { ascending: false })
        .limit(1);
        
      if (error) {
        console.error("Error fetching store data:", error);
        setConnectionStatus('error');
        setTokenInfo({ error: "خطأ في جلب بيانات المتجر", details: error.message });
        return;
      }
      
      if (!data || data.length === 0) {
        setConnectionStatus('no-token');
        setTokenInfo({ error: "لم يتم العثور على بيانات المتجر في قاعدة البيانات" });
        return;
      }
      
      // استخراج بيانات المتجر
      const storeData = data[0];
      
      // التحقق من الرمز المؤقت
      const isPlaceholderToken = storeData.access_token === 'placeholder_token';
      
      // التحقق من صحة الرمز
      let isValid = false;
      if (!isPlaceholderToken && storeData.access_token) {
        isValid = await shopifyConnectionService.testConnection(shop, storeData.access_token);
      }
      
      // تحضير معلومات الرمز
      const tokenInfoData = {
        shop: storeData.shop,
        isActive: storeData.is_active,
        tokenCreatedAt: storeData.created_at,
        tokenUpdatedAt: storeData.updated_at,
        isPlaceholderToken,
        tokenType: storeData.token_type || 'offline',
        hasToken: !!storeData.access_token,
        tokenValid: isValid,
        tokenPartial: storeData.access_token ? `${storeData.access_token.substring(0, 6)}...` : null,
      };
      
      // تعيين حالة الاتصال بناءً على صحة الرمز
      if (isPlaceholderToken) {
        setConnectionStatus('error');
      } else if (isValid) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('error');
      }
      
      setTokenInfo(tokenInfoData);
    } catch (err) {
      console.error("Error in loadTokenInfo:", err);
      setConnectionStatus('error');
      setTokenInfo({ error: "خطأ غير متوقع", details: err instanceof Error ? err.message : String(err) });
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefresh = () => {
    loadTokenInfo();
  };
  
  const handleReconnect = () => {
    window.location.href = `/shopify?shop=${shop}&force_update=true`;
  };
  
  // جلب معلومات الرمز عند تحميل المكون
  useEffect(() => {
    loadTokenInfo();
  }, [shop]);
  
  // عرض حالة التحميل
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span>جاري تحميل معلومات الاتصال...</span>
      </div>
    );
  }
  
  // عرض معلومات الخطأ
  if (tokenInfo?.error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-yellow-500" />
          <span className="font-medium">{tokenInfo.error}</span>
        </div>
        {tokenInfo.details && (
          <p className="text-sm text-gray-500">{tokenInfo.details}</p>
        )}
        <Button onClick={handleRefresh} variant="outline" size="sm">
          إعادة التحقق
        </Button>
      </div>
    );
  }
  
  // عرض معلومات الاتصال
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="font-medium ml-2">حالة الاتصال:</span>
          {connectionStatus === 'connected' ? (
            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> متصل
            </Badge>
          ) : connectionStatus === 'error' ? (
            <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> خطأ في الاتصال
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
              غير متصل
            </Badge>
          )}
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          تحديث
        </Button>
      </div>
      
      <Card className="p-4 bg-gray-50">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="font-medium">المتجر:</dt>
            <dd>{tokenInfo?.shop || '-'}</dd>
          </div>
          
          <div className="flex justify-between">
            <dt className="font-medium">حالة الرمز:</dt>
            <dd className={tokenInfo?.tokenValid ? 'text-green-600' : 'text-red-600'}>
              {tokenInfo?.isPlaceholderToken ? (
                <span className="text-yellow-600">رمز مؤقت (غير صالح)</span>
              ) : tokenInfo?.tokenValid ? (
                'صالح'
              ) : (
                'غير صالح'
              )}
            </dd>
          </div>
          
          {tokenInfo?.hasToken && !tokenInfo?.isPlaceholderToken && (
            <div className="flex justify-between">
              <dt className="font-medium">جزء من الرمز:</dt>
              <dd className="font-mono">{tokenInfo?.tokenPartial || '-'}</dd>
            </div>
          )}
          
          <div className="flex justify-between">
            <dt className="font-medium">نوع الرمز:</dt>
            <dd>{tokenInfo?.tokenType || '-'}</dd>
          </div>
          
          <div className="flex justify-between">
            <dt className="font-medium">تاريخ التحديث:</dt>
            <dd>{tokenInfo?.tokenUpdatedAt ? new Date(tokenInfo.tokenUpdatedAt).toLocaleString() : '-'}</dd>
          </div>
        </dl>
      </Card>
      
      {(connectionStatus === 'error' || connectionStatus === 'no-token') && (
        <div className="pt-2">
          <Button onClick={handleReconnect} variant="default" size="sm" className="w-full">
            إعادة الاتصال بـ Shopify
          </Button>
        </div>
      )}
    </div>
  );
};
