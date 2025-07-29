
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/components/layout/AuthProvider';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { useI18n } from '@/lib/i18n';
import FormBuilderDashboard from '@/components/form/builder/FormBuilderDashboard';
import FormBuilderEditor from '@/components/form/builder/FormBuilderEditor';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

const FormBuilderPage = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { shop: currentStore, isShopifyAuthenticated } = useAuth();
  const { t, language } = useI18n();
  const { fetchForms } = useFormTemplates();
  
  // Use the same store detection logic as other pages
  const storeFromStorage = localStorage.getItem('current_shopify_store');
  const activeStore = currentStore || storeFromStorage;
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'editor'>(formId ? 'editor' : 'dashboard');
  const [associatedProducts, setAssociatedProducts] = useState<Array<{id: string, title: string}>>([]);

  // التحقق من الوصول بناءً على وجود متجر نشط
  const hasAccess = !!(activeStore && (isShopifyAuthenticated || storeFromStorage));

  // التبديل بين العلامات عند تغيير formId
  useEffect(() => {
    if (formId && formId !== 'new') {
      setActiveTab('editor');
    } else {
      setActiveTab('dashboard');
    }
  }, [formId]);

  // عرض صفحة محدودة الوصول إذا لم يكن هناك اتصال
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="max-w-md w-full p-6 bg-white rounded shadow-md">
          <div className="text-center py-4">
            <h2 className="text-xl font-bold mb-4">
              {language === 'ar' ? 'الوصول مقيد' : 'Access Restricted'}
            </h2>
            <p className="mb-6">
              {language === 'ar' 
                ? 'يرجى الاتصال بمتجر Shopify للوصول إلى منشئ النماذج' 
                : 'Please connect a Shopify store to access the form builder'}
            </p>
            
            <Button 
              onClick={() => navigate('/my-stores')}
              className="w-full"
            >
              {language === 'ar' ? 'إدارة المتاجر' : 'Manage Stores'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      
      <div className="flex-1 overflow-x-hidden">
        {activeTab === 'dashboard' ? (
          <FormBuilderDashboard />
        ) : (
          formId && formId !== 'new' && (
            <FormBuilderEditor formId={formId} shopId={activeStore || ''} />
          )
        )}
      </div>
    </div>
  );
};

export default FormBuilderPage;
