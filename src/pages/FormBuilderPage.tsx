
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/lib/auth';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { useI18n } from '@/lib/i18n';
import { useShopify } from '@/hooks/useShopify';
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
  const { user, shopifyConnected, shop } = useAuth();
  const { t, language } = useI18n();
  const { fetchForms } = useFormTemplates();
  const { tokenError, failSafeMode, toggleFailSafeMode, getDefaultForm } = useShopify();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'editor'>(formId ? 'editor' : 'dashboard');
  const [bypassEnabled, setBypassEnabled] = useState(false);
  const [isCheckingDefaultForm, setIsCheckingDefaultForm] = useState(false);
  const [associatedProducts, setAssociatedProducts] = useState<Array<{id: string, title: string}>>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Allow access if either authenticated with user or connected with Shopify
  const hasAccess = !!user || shopifyConnected;
  
  // Check localStorage as fallback
  const localStorageConnected = localStorage.getItem('shopify_connected') === 'true';
  const actualHasAccess = hasAccess || localStorageConnected || bypassEnabled;
  
  // Handle connection issues automatically
  useEffect(() => {
    if (tokenError) {
      console.log("Token error detected, enabling bypass");
      setBypassEnabled(true);
      
      if (!failSafeMode) {
        toggleFailSafeMode(true);
        console.log("Enabling fail-safe mode automatically");
      }
    }
  }, [tokenError, failSafeMode, toggleFailSafeMode]);
  
  // Check for default form
  useEffect(() => {
    async function checkForDefaultForm() {
      if (!shop || isCheckingDefaultForm) return;
      
      setIsCheckingDefaultForm(true);
      try {
        const defaultForm = await getDefaultForm(shop);
        
        if (!defaultForm) {
          console.log('No default form found, will create one when needed');
        } else {
          console.log('Default form found:', defaultForm.id);
        }
      } catch (error) {
        console.error('Error checking for default form:', error);
      } finally {
        setIsCheckingDefaultForm(false);
      }
    }
    
    checkForDefaultForm();
  }, [shop, getDefaultForm]);

  // Fetch associated products for current form
  useEffect(() => {
    async function fetchAssociatedProducts() {
      if (!formId || formId === 'new' || !shop) return;
      
      try {
        // Get product settings for this form
        const { data: productSettings, error } = await shopifySupabase
          .from('shopify_product_settings')
          .select('*')
          .eq('form_id', formId);
          
        if (error) {
          console.error('Error fetching product settings:', error);
          return;
        }
        
        // If no associated products, exit early
        if (!productSettings || productSettings.length === 0) {
          setAssociatedProducts([]);
          return;
        }
        
        const productIds = productSettings.map(s => s.product_id);
        
        // Fetch product details from cached products table
        const { data: cachedProducts } = await shopifySupabase
          .from('shopify_cached_products')
          .select('products')
          .eq('shop', shop)
          .single();
          
        if (cachedProducts?.products) {
          const shopifyProducts = cachedProducts.products;
          const matchedProducts = shopifyProducts
            .filter((product: any) => productIds.includes(product.id))
            .map((product: any) => ({ 
              id: product.id, 
              title: product.title 
            }));
            
          setAssociatedProducts(matchedProducts);
        }
      } catch (error) {
        console.error('Error fetching associated products:', error);
      }
    }
    
    fetchAssociatedProducts();
  }, [formId, shop]);
  
  useEffect(() => {
    async function handleFormInit() {
      setIsLoading(true);
      
      try {
        if (formId) {
          // Handle the "new" form ID case - redirect to dashboard instead of creating a form
          if (formId === 'new') {
            console.log('New form requested, redirecting to dashboard');
            navigate('/form-builder', { replace: true });
            return;
          }
          
          // For existing forms, set to editor mode
          setActiveTab('editor');
          await fetchForms();
        } else {
          await fetchForms();
          setActiveTab('dashboard');
        }
      } catch (error) {
        console.error("Error initializing form:", error);
        toast.error(language === 'ar' 
          ? 'حدث خطأ أثناء تحميل النموذج' 
          : 'Error loading form');
      } finally {
        setIsLoading(false);
      }
    }
    
    handleFormInit();
  }, [formId, fetchForms, navigate, language]);

  // Always enable bypass access in development mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setBypassEnabled(true);
    }
  }, []);
  
  const enableBypass = () => {
    setBypassEnabled(true);
    localStorage.setItem('bypass_auth', 'true');
    toast.success(language === 'ar' 
      ? 'تم تفعيل وضع التجاوز. يمكنك الاستمرار في إدارة النماذج' 
      : 'Bypass mode activated. You can continue managing forms.');
  };

  if (!actualHasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="max-w-md w-full p-6 bg-white rounded shadow-md">
          <div className="text-center py-4">
            <h2 className="text-xl font-bold mb-4">
              {language === 'ar' 
                ? 'الوصول مقيد' 
                : 'Access Restricted'}
            </h2>
            <p className="mb-6">
              {language === 'ar' 
                ? 'يرجى تسجيل الدخول أو الاتصال بمتجر Shopify للوصول إلى منشئ النماذج' 
                : 'Please login or connect a Shopify store to access the form builder'}
            </p>
            
            <div className="flex flex-col space-y-2">
              <Button 
                onClick={() => navigate('/shopify')}
                className="w-full"
              >
                {language === 'ar' ? 'الاتصال بمتجر Shopify' : 'Connect Shopify Store'}
              </Button>
              
              <Button
                variant="outline"
                onClick={enableBypass}
                className="w-full"
              >
                {language === 'ar' ? 'متابعة على أي حال' : 'Continue Anyway'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#F8F9FB]">
        <AppSidebar />
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
          <span className="mr-3">
            {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      
      {/* Connection issue warning banner */}
      {(tokenError || failSafeMode) && (
        <div className="absolute top-0 left-0 right-0 z-50 px-4 py-2">
          <Alert variant="warning" className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">
              {language === 'ar' ? 'تحذير اتصال' : 'Connection Warning'}
            </AlertTitle>
            <AlertDescription className="text-amber-700">
              {language === 'ar' 
                ? 'هناك مشكلة في اتصال Shopify، تم تفعيل وضع الدعم الاحتياطي. يمكنك الاستمرار في إدارة النماذج ولكن بعض الوظائف قد لا تعمل بشكل صحيح.' 
                : 'There is an issue with the Shopify connection. Fail-safe mode has been activated. You can continue managing forms but some features may not work properly.'}
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {/* Display associated products banner when editing an existing form */}
      {activeTab === 'editor' && associatedProducts.length > 0 && (
        <div className="absolute top-0 left-0 right-0 z-40 px-4 py-2 mt-16">
          <Alert className="bg-blue-50 border-blue-200">
            <ShoppingBag className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">
              {language === 'ar' ? 'منتجات مرتبطة' : 'Associated Products'}
            </AlertTitle>
            <AlertDescription className="text-blue-700">
              {language === 'ar' 
                ? `هذا النموذج مرتبط بـ ${associatedProducts.length} منتج: ${associatedProducts.map(p => p.title).join(', ')}` 
                : `This form is associated with ${associatedProducts.length} product(s): ${associatedProducts.map(p => p.title).join(', ')}`}
            </AlertDescription>
          </Alert>
        </div>
      )}
      
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
