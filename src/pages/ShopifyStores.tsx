
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ShopifyStoresManager from '@/components/shopify/ShopifyStoresManager';
import { ShopifyTokenUpdater } from '@/components/shopify/ShopifyTokenUpdater';
import { useI18n } from '@/lib/i18n';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ShopifyStores: React.FC = () => {
  const { language } = useI18n();
  const navigate = useNavigate();
  
  // الحصول على اسم المتجر من localStorage
  const shop = localStorage.getItem('shopify_store') || 'astrem.myshopify.com';

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex-1 p-8">
        <div className="max-w-[800px] mx-auto">
          <Button 
            variant="ghost" 
            className="mb-6" 
            onClick={() => navigate('/dashboard')}
          >
            {language === 'ar' ? 'العودة إلى لوحة التحكم' : 'Back to Dashboard'}
          </Button>
          
          <h1 className="text-3xl font-bold mb-6">
            {language === 'ar' ? 'إدارة متاجر Shopify' : 'Shopify Stores Management'}
          </h1>
          
          <Tabs defaultValue="stores" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="stores">المتاجر المتصلة</TabsTrigger>
              <TabsTrigger value="token">تحديث رمز الوصول</TabsTrigger>
              <TabsTrigger value="help">التعليمات</TabsTrigger>
            </TabsList>
            
            <TabsContent value="stores" className="space-y-8">
              <ShopifyStoresManager />
            </TabsContent>
            
            <TabsContent value="token" className="space-y-8">
              <ShopifyTokenUpdater shop={shop || 'astrem.myshopify.com'} />
              
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mt-4">
                <h3 className="font-medium text-amber-800 mb-2">تعليمات إنشاء رمز وصول Admin API</h3>
                <ol className="list-decimal list-inside text-amber-700 space-y-2">
                  <li>قم بتسجيل الدخول إلى لوحة تحكم متجر Shopify الخاص بك</li>
                  <li>انتقل إلى الإعدادات (Settings) ثم Apps and sales channels</li>
                  <li>انقر على "Develop apps" ثم "Create an app"</li>
                  <li>أدخل اسمًا للتطبيق مثل "API Access" واختر حساب المطور</li>
                  <li>بعد إنشاء التطبيق، انتقل إلى "API credentials"</li>
                  <li>انقر على "Create Admin API access token"</li>
                  <li>اختر جميع الصلاحيات المطلوبة: write_products, read_products, write_orders, read_orders, write_script_tags, read_themes, write_themes, read_content, write_content</li>
                  <li>انسخ رمز الوصول (سيبدأ بـ "shpat_") والصقه في النموذج أعلاه</li>
                </ol>
              </div>
            </TabsContent>
            
            <TabsContent value="help" className="space-y-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">
                  {language === 'ar' ? 'تعليمات إدارة المتاجر' : 'Store Management Instructions'}
                </h2>
                
                <div className="space-y-3 text-gray-700">
                  <p>
                    {language === 'ar' 
                      ? '• يمكنك الاتصال بعدة متاجر Shopify واستخدامها في تطبيقك.'
                      : '• You can connect to multiple Shopify stores and use them in your application.'}
                  </p>
                  <p>
                    {language === 'ar'
                      ? '• المتجر النشط هو المتجر الذي سيتم استخدامه افتراضيًا في جميع العمليات.'
                      : '• The active store is the one that will be used by default in all operations.'}
                  </p>
                  <p>
                    {language === 'ar'
                      ? '• يمكنك تبديل المتجر النشط في أي وقت من هذه الصفحة.'
                      : '• You can switch the active store at any time from this page.'}
                  </p>
                  <p>
                    {language === 'ar'
                      ? '• إذا قمت بإزالة متجر، لن يتم حذف أي بيانات من متجرك الفعلي، ولكن سيتم حذف الاتصال فقط.'
                      : '• If you remove a store, no data will be deleted from your actual store, only the connection will be removed.'}
                  </p>
                </div>
                
                <div className="mt-6">
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/shopify')}
                  >
                    {language === 'ar' ? 'اتصال بمتجر جديد' : 'Connect New Store'}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ShopifyStores;
