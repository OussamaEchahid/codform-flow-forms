import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Plus, Settings, Zap, AlertCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { shopifyStores } from '@/lib/shopify/supabase-client';
import ShopifyStoresManager from '@/components/shopify/ShopifyStoresManager';

const MyStores = () => {
  const { language } = useI18n();
  const [urlShop, setUrlShop] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // فحص URL للمتجر عند تحميل الصفحة
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shopParam = urlParams.get('shop');
    
    if (shopParam) {
      let normalizedShop = shopParam.trim().toLowerCase();
      if (!normalizedShop.includes('.myshopify.com')) {
        normalizedShop = `${normalizedShop}.myshopify.com`;
      }
      setUrlShop(normalizedShop);
    }
  }, []);

  // إضافة المتجر من URL
  const handleAddFromUrl = async () => {
    if (!urlShop) return;
    
    setIsAdding(true);
    try {
      console.log('💾 Adding shop manually:', urlShop);
      
      // فحص إذا كان موجود
      const { data: existing } = await shopifyStores()
        .select('*')
        .eq('shop', urlShop)
        .maybeSingle();

      if (existing) {
        // تفعيل المتجر الموجود
        await shopifyStores()
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .eq('shop', urlShop);
        
        toast({
          title: "تم تفعيل المتجر",
          description: `تم تفعيل ${urlShop} بنجاح`,
        });
      } else {
        // إضافة متجر جديد
        await shopifyStores()
          .insert({
            shop: urlShop,
            is_active: true,
            access_token: null,
            scope: null,
            token_type: 'Bearer'
          });
        
        toast({
          title: "تم حفظ المتجر",
          description: `تم حفظ ${urlShop} بنجاح`,
        });
      }
      
      // إعادة تحميل الصفحة لإظهار المتجر الجديد
      window.location.reload();
      
    } catch (error) {
      console.error('❌ Error adding shop:', error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ المتجر",
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {language === 'ar' ? 'متاجري' : 'My Stores'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'ar' 
            ? 'إدارة المتاجر المرتبطة بحسابك'
            : 'Manage your connected stores'
          }
        </p>
      </div>

      {/* زر إضافة سريع للمتجر من URL */}
      {urlShop && (
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Zap className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <strong>متجر جديد مكتشف:</strong> {urlShop}
                <br />
                <span className="text-sm">اضغط لإضافته إلى قائمة متاجرك فوراً</span>
              </div>
              <Button 
                onClick={handleAddFromUrl}
                disabled={isAdding}
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                {isAdding ? 'جاري الحفظ...' : 'إضافة فوراً'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <ShopifyStoresManager />
    </div>
  );
};

export default MyStores;