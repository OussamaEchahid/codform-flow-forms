
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShopifyStoresManager } from '@/components/shopify/ShopifyStoresManager';
import { useI18n } from '@/lib/i18n';

const ShopifyStores: React.FC = () => {
  const { language } = useI18n();
  const navigate = useNavigate();

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
          
          <div className="space-y-8">
            <ShopifyStoresManager />
            
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopifyStores;
