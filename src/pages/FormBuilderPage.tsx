
import React from 'react';
import { useParams } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import FormBuilderDashboard from '@/components/form/builder/FormBuilderDashboard';
import FormBuilderEditor from '@/components/form/builder/FormBuilderEditor';
import FormBuilderAccess from '@/components/form/builder/FormBuilderAccess';
import { ConnectionAlert, ProductsAlert } from '@/components/form/builder/FormBuilderAlerts';
import { useFormBuilderShopify } from '@/hooks/useFormBuilderShopify';
import { useFormAssociatedProducts } from '@/hooks/useFormAssociatedProducts';
import { useFormInitialization } from '@/hooks/useFormInitialization';

const FormBuilderPage = () => {
  const { formId } = useParams();
  const { user, shopifyConnected } = useAuth();
  const { language } = useI18n();
  
  // Use our new custom hooks
  const { tokenError, failSafeMode, bypassEnabled, enableBypass } = useFormBuilderShopify();
  const { associatedProducts } = useFormAssociatedProducts(formId);
  const { activeTab } = useFormInitialization(formId);
  
  // Allow access if either authenticated with user or connected with Shopify
  const hasAccess = !!user || shopifyConnected;
  
  // Check localStorage as fallback
  const localStorageConnected = localStorage.getItem('shopify_connected') === 'true';
  const actualHasAccess = hasAccess || localStorageConnected || bypassEnabled;

  if (!actualHasAccess) {
    return <FormBuilderAccess enableBypass={enableBypass} />;
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      
      {/* Connection issue and products alerts */}
      <ConnectionAlert tokenError={tokenError} failSafeMode={failSafeMode} />
      <ProductsAlert associatedProducts={associatedProducts} activeTab={activeTab} />
      
      <div className="flex-1 overflow-x-hidden">
        {activeTab === 'dashboard' ? (
          <FormBuilderDashboard />
        ) : (
          formId && formId !== 'new' && <FormBuilderEditor formId={formId} />
        )}
      </div>
    </div>
  );
};

export default FormBuilderPage;
