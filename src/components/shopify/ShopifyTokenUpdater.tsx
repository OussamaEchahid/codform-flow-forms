
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { shopifySupabase } from '@/lib/shopify/supabase-client';
import { shopifyConnectionService } from '@/services/ShopifyConnectionService';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export const ShopifyTokenUpdater = () => {
  const [shopDomain, setShopDomain] = useState<string>('');
  const [accessToken, setAccessToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPlaceholderToken, setHasPlaceholderToken] = useState<boolean>(false);
  const { toast } = useToast();
  const { shop } = useAuth();

  // تحميل المتجر الحالي عند تحميل المكون
  useEffect(() => {
    const loadCurrentShop = async () => {
      try {
        // استخدام المتجر الحالي إذا كان موجودًا
        if (shop) {
          setShopDomain(shop);
          
          // التحقق مما إذا كان المتجر يستخدم رمزًا placeholder
          const token = await shopifyConnectionService.getAccessToken(shop);
          
          // التحقق من الرمز المؤقت بالطريقة المباشرة
          if (token === 'placeholder_token') {
            setHasPlaceholderToken(true);
            setError('هذا المتجر يستخدم حاليًا قيمة مؤقتة (placeholder). يرجى إدخال رمز وصول حقيقي.');
          }
        } else {
          // محاولة الحصول على المتجر من التخزين المحلي
          const storedShop = localStorage.getItem('shopify_store');
          if (storedShop) {
            setShopDomain(storedShop);
          }
        }
      } catch (err) {
        console.error('Error loading current shop:', err);
      }
    };
    
    loadCurrentShop();
  }, [shop]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shopDomain || !accessToken) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    
    setError(null);
    setIsSuccess(false);
    setIsLoading(true);
    
    try {
      // التحقق من أن الرمز ليس رمزًا مؤقتًا
      if (accessToken === 'placeholder_token') {
        throw new Error('لا يمكن استخدام "placeholder_token" كرمز وصول حقيقي');
      }
      
      // استدعاء دالة Edge Function لتحديث الرمز
      const { data, error } = await shopifySupabase.functions.invoke('update-shopify-token', {
        body: {
          shop: shopDomain,
          token: accessToken
        }
      });
      
      if (error) {
        throw new Error(`خطأ في استدعاء الدالة: ${error.message || "خطأ غير معروف"}`);
      }
      
      if (!data.success) {
        throw new Error(data.error || 'فشل تحديث رمز الوصول');
      }
      
      // تحديث حالة الاتصال
      await shopifyConnectionService.syncStoreToDatabase(shopDomain, accessToken, true);
      
      // إعادة تأكيد صحة الرمز الجديد
      const isValid = await shopifyConnectionService.testConnection(shopDomain, accessToken);
      
      if (!isValid) {
        throw new Error('تم تحديث الرمز، لكن اختبار الاتصال فشل. يرجى التحقق من الرمز وإعادة المحاولة.');
      }
      
      setIsSuccess(true);
      setHasPlaceholderToken(false);
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث رمز وصول Shopify بنجاح.",
        variant: "success",
      });
      
      // مسح الحقول
      setAccessToken('');
    } catch (err) {
      console.error('Error updating token:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحديث الرمز');
      
      toast({
        title: "فشل التحديث",
        description: err instanceof Error ? err.message : 'حدث خطأ أثناء تحديث الرمز',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {hasPlaceholderToken && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>تم اكتشاف رمز مؤقت</AlertTitle>
          <AlertDescription>
            هذا المتجر يستخدم حاليًا رمزًا وهميًا ("placeholder_token"). يجب عليك إدخال رمز وصول حقيقي من Shopify لكي تعمل واجهة API بشكل صحيح.
          </AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>خطأ</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {isSuccess && (
        <Alert variant="success">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>تم التحديث بنجاح</AlertTitle>
          <AlertDescription>
            تم تحديث رمز وصول Shopify بنجاح. يجب أن تعمل واجهة API الآن بشكل صحيح.
          </AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="shop-domain">نطاق المتجر</Label>
          <Input
            id="shop-domain"
            placeholder="متجرك.myshopify.com"
            value={shopDomain}
            onChange={(e) => setShopDomain(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="access-token">رمز الوصول</Label>
          <Input
            id="access-token"
            placeholder="رمز وصول Shopify الخاص بك"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            required
            type="password"
          />
          <p className="text-sm text-gray-500">
            يمكنك الحصول على رمز الوصول من إعدادات تطبيق Shopify الخاص بك، في قسم "API credentials".
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button type="submit" disabled={isLoading || !shopDomain || !accessToken}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                جاري التحديث...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                تحديث رمز الوصول
              </>
            )}
          </Button>
        </div>
      </form>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>
          <strong>أين أجد رمز الوصول؟</strong>
        </p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>انتقل إلى حساب شريك Shopify الخاص بك</li>
          <li>اذهب إلى Apps &gt; اختر التطبيق المخصص الخاص بك</li>
          <li>انتقل إلى علامة التبويب "API credentials"</li>
          <li>استخدم Admin API access token الخاص بك</li>
        </ul>
      </div>
    </div>
  );
};
