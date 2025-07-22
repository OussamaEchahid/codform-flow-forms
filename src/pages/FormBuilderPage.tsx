
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/lib/auth';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { useI18n } from '@/lib/i18n';
import { useSimpleShopify } from '@/hooks/useSimpleShopify';
import FormBuilderDashboard from '@/components/form/builder/FormBuilderDashboard';
import FormBuilderEditor from '@/components/form/builder/FormBuilderEditor';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { shopifySupabase } from '@/lib/shopify/supabase-client';

const FormBuilderPage = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useI18n();
  const { fetchForms } = useFormTemplates();
  const { activeStore, isConnected, tokenError } = useSimpleShopify();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'editor'>(formId ? 'editor' : 'dashboard');
  const [associatedProducts, setAssociatedProducts] = useState<Array<{id: string, title: string}>>([]);

  // النظام المبسط - الوصول المسموح إذا كان هناك اتصال
  const hasAccess = !!user || isConnected;

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
      
      {/* تحذير بسيط عند وجود خطأ في token */}
      {tokenError && (
        <div className="absolute top-0 left-0 right-0 z-50 px-4 py-2">
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">
              {language === 'ar' ? 'مشكلة في الاتصال' : 'Connection Issue'}
            </AlertTitle>
            <AlertDescription className="text-red-700">
              {language === 'ar' 
                ? 'هناك مشكلة في اتصال المتجر. يرجى التحقق من الاتصال.' 
                : 'There is an issue with store connection. Please check connection.'}
            </AlertDescription>
          </Alert>
        </div>
      )}
      
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
