
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
  
  useEffect(() => {
    if (formId) {
      setActiveTab('editor');
    } else {
      fetchForms();
      setActiveTab('dashboard');
    }
  }, [formId, fetchForms]);

  if (!hasAccess) {
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
    </div>
  );
};

export default FormBuilderPage;
