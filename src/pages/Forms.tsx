
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useFormFetch } from '@/lib/hooks/form/useFormFetch';
import { FormData } from '@/lib/hooks/form/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Eye, ArrowUpRight } from 'lucide-react';
import { ShopifyConnectionManager } from '@/components/shopify/ShopifyConnectionManager';

const Forms = () => {
  const { language } = useI18n();
  const navigate = useNavigate();
  const { shopifyConnected, shop, user } = useAuth();
  const { forms, isLoading, fetchForms } = useFormFetch();
  const [syncing, setSyncing] = useState(false);

  // جلب النماذج عند تحميل الصفحة
  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  // مشاهدة نموذج في متجر شوبيفاي
  const viewInShopify = (formId: string) => {
    if (shop) {
      // إنشاء عنوان URL للنموذج في متجر Shopify
      const shopifyUrl = `https://${shop}/apps/codform/?form=${formId}`;
      window.open(shopifyUrl, '_blank');
    }
  };

  // إنشاء نموذج جديد
  const createNewForm = () => {
    navigate('/form-builder/new');
  };

  // تحرير نموذج موجود
  const editForm = (formId: string) => {
    navigate(`/form-builder/${formId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {language === 'ar' ? 'النماذج' : 'Forms'}
          </h1>
          <Button onClick={createNewForm}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {language === 'ar' ? 'إنشاء نموذج جديد' : 'Create New Form'}
          </Button>
        </div>

        {/* Shopify الاتصال بـ */}
        {!shopifyConnected && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h2 className="font-medium mb-2">
              {language === 'ar' ? 'الاتصال بـ Shopify' : 'Connect to Shopify'}
            </h2>
            <p className="text-sm mb-4">
              {language === 'ar'
                ? 'قم بتوصيل متجر Shopify الخاص بك لتمكين نماذج Codform على متجرك.'
                : 'Connect your Shopify store to enable Codform forms on your store.'}
            </p>
            <ShopifyConnectionManager />
          </div>
        )}

        {/* قائمة النماذج */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="font-medium">
              {language === 'ar' ? 'نماذجي' : 'My Forms'}
            </h2>
          </div>
          
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin h-6 w-6 border-t-2 border-purple-500 border-r-2 rounded-full mx-auto mb-2"></div>
              <p>{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
            </div>
          ) : forms.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 mb-4">
                {language === 'ar'
                  ? 'ليس لديك أي نماذج بعد. أنشئ نموذجًا جديدًا للبدء.'
                  : 'You don\'t have any forms yet. Create a new form to get started.'}
              </p>
              <Button onClick={createNewForm}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {language === 'ar' ? 'إنشاء نموذج جديد' : 'Create New Form'}
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {forms.map((form: FormData) => (
                <div key={form.id} className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{form.title}</h3>
                    {form.description && (
                      <p className="text-sm text-gray-500">{form.description}</p>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(form.created_at || '').toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {shopifyConnected && (
                      <Button size="sm" variant="outline" onClick={() => viewInShopify(form.id)}>
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                        {language === 'ar' ? 'في Shopify' : 'In Shopify'}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => editForm(form.id)}>
                      <Edit className="h-4 w-4 mr-1" />
                      {language === 'ar' ? 'تعديل' : 'Edit'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* حالة المزامنة */}
        {shopifyConnected && (
          <div className="mt-4 p-4 bg-gray-50 border rounded-md">
            <h3 className="font-medium mb-2">
              {language === 'ar' ? 'حالة المزامنة' : 'Sync Status'}
            </h3>
            <div className="flex items-center">
              <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
              <p className="text-sm">
                {language === 'ar' 
                  ? `متصل بمتجر: ${shop}`
                  : `Connected to store: ${shop}`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Forms;
