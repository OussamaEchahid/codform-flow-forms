
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/lib/auth';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { useI18n } from '@/lib/i18n';
import FormBuilderDashboard from '@/components/form/builder/FormBuilderDashboard';
import FormBuilderEditor from '@/components/form/builder/FormBuilderEditor';

const FormBuilderPage = () => {
  const { formId } = useParams();
  const { user, shopifyConnected, shop } = useAuth();
  const { t, language } = useI18n();
  const { fetchForms } = useFormTemplates();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'editor'>(formId ? 'editor' : 'dashboard');
  
  // Allow access if either authenticated with user or connected with Shopify
  const hasAccess = !!user || shopifyConnected;
  
  // Check localStorage as fallback
  const localStorageConnected = localStorage.getItem('shopify_connected') === 'true';
  const actualHasAccess = hasAccess || localStorageConnected;
  
  useEffect(() => {
    if (formId) {
      setActiveTab('editor');
    } else {
      fetchForms();
      setActiveTab('dashboard');
    }
  }, [formId, fetchForms]);

  if (!actualHasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-center py-8">
          {language === 'ar' 
            ? 'يرجى تسجيل الدخول أو الاتصال بمتجر Shopify للوصول إلى منشئ النماذج' 
            : 'Please login or connect a Shopify store to access the form builder'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      
      {activeTab === 'dashboard' ? (
        <FormBuilderDashboard />
      ) : (
        <FormBuilderEditor formId={formId} />
      )}
      
      {/* Debug info */}
      {process.env.NODE_ENV !== 'production' && !formId && (
        <div className="fixed bottom-2 right-2 p-2 bg-gray-100 text-xs rounded opacity-70 hover:opacity-100">
          <div>User: {user?.id || 'None'}</div>
          <div>Shop: {shop || localStorage.getItem('shopify_store') || 'None'}</div>
          <div>AuthContext Connected: {shopifyConnected ? 'Yes' : 'No'}</div>
          <div>localStorage Connected: {localStorageConnected ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
};

export default FormBuilderPage;
