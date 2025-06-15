
import React, { useState, useEffect, useRef } from 'react';
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
import { AlertCircle, ShoppingBag, ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';
import { shopifySupabase } from '@/lib/shopify/supabase-client';
import { useFormStore } from '@/hooks/useFormStore';

const FormBuilderPage = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { user, shopifyConnected, shop } = useAuth();
  const { t, language } = useI18n();
  const { fetchForms } = useFormTemplates();
  const { tokenError, failSafeMode, toggleFailSafeMode, getDefaultForm } = useShopify();
  const { formState, updateFormStyle } = useFormStore();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'editor'>(formId ? 'editor' : 'dashboard');
  const [bypassEnabled, setBypassEnabled] = useState(false);
  const [isCheckingDefaultForm, setIsCheckingDefaultForm] = useState(false);
  const [associatedProducts, setAssociatedProducts] = useState<Array<{id: string, title: string}>>([]);
  
  // Add a ref to track if we've already checked for the default form
  const defaultFormChecked = useRef(false);
  // Stop excessive API requests by tracking mount status
  const isMounted = useRef(false);
  // Add a ref to track the last check time to implement a cooldown
  const lastCheckTime = useRef(0);
  
  // Allow access if either authenticated with user or connected with Shopify
  const hasAccess = !!user || shopifyConnected;
  
  // Check localStorage as fallback
  const localStorageConnected = localStorage.getItem('shopify_connected') === 'true';
  const actualHasAccess = hasAccess || localStorageConnected || bypassEnabled;
  
  // زر تغيير الاتجاه
  const toggleDirection = () => {
    const currentDirection = formState.style?.formDirection || 'ltr';
    const newDirection = currentDirection === 'rtl' ? 'ltr' : 'rtl';
    updateFormStyle({ formDirection: newDirection });
    toast.success(language === 'ar' 
      ? `تم تغيير الاتجاه إلى ${newDirection === 'rtl' ? 'يمين-يسار' : 'يسار-يمين'}` 
      : `Direction changed to ${newDirection.toUpperCase()}`);
  };

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
  
  // Check for default form - Modified to prevent infinite loops and implement cooldown
  useEffect(() => {
    // Only run on first mount
    if (isMounted.current) return;
    isMounted.current = true;

    // Implement a function with cooldown to prevent excessive checks
    async function checkForDefaultForm() {
      // Skip check if:
      // 1. Already checked in this component lifecycle
      // 2. Currently checking (prevent concurrent checks)
      // 3. No shop available
      // 4. Less than 30 seconds since last check (cooldown)
      if (
        defaultFormChecked.current || 
        isCheckingDefaultForm || 
        !shop ||
        (Date.now() - lastCheckTime.current < 30000)
      ) {
        console.log('Skipping default form check due to conditions:', {
          alreadyChecked: defaultFormChecked.current,
          currentlyChecking: isCheckingDefaultForm,
          noShop: !shop,
          cooldown: (Date.now() - lastCheckTime.current < 30000)
        });
        return;
      }
      
      // Update last check time immediately to prevent multiple checks
      lastCheckTime.current = Date.now();
      setIsCheckingDefaultForm(true);
      
      try {
        console.log('Checking for default form once...');
        
        // Try to get default form from localStorage first to avoid API call
        const cachedDefaultForm = localStorage.getItem(`default_form_${shop}`);
        if (cachedDefaultForm) {
          try {
            const parsedForm = JSON.parse(cachedDefaultForm);
            const cacheTime = parsedForm.cacheTime || 0;
            
            // Use cached form if less than 5 minutes old
            if (Date.now() - cacheTime < 300000) {
              console.log('Using cached default form:', parsedForm.id);
              defaultFormChecked.current = true;
              setIsCheckingDefaultForm(false);
              return;
            }
          } catch (e) {
            console.error('Error parsing cached default form:', e);
          }
        }
        
        // If no valid cache, fetch from API
        const defaultForm = await getDefaultForm(shop);
        
        if (!defaultForm) {
          console.log('No default form found for shop:', shop);
        } else {
          console.log('Default form found:', defaultForm.id);
          
          // Cache the result
          localStorage.setItem(`default_form_${shop}`, JSON.stringify({
            ...defaultForm,
            cacheTime: Date.now()
          }));
        }
        
        // Mark that we've checked for the default form
        defaultFormChecked.current = true;
      } catch (error) {
        console.error('Error checking for default form:', error);
      } finally {
        setIsCheckingDefaultForm(false);
      }
    }
    
    // Add a small delay to prevent immediate check on mount
    const timeoutId = setTimeout(() => {
      checkForDefaultForm();
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [shop, getDefaultForm, isCheckingDefaultForm]);

  // Fetch associated products for current form
  useEffect(() => {
    let isCancelled = false;
    
    async function fetchAssociatedProducts() {
      if (!formId || formId === 'new' || !shop) return;
      
      try {
        // Get product settings for this form
        const { data: productSettings, error } = await shopifySupabase
          .from('shopify_product_settings')
          .select('*')
          .eq('form_id', formId);
          
        if (error || isCancelled) {
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
          
        if (cachedProducts?.products && !isCancelled) {
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
    
    return () => {
      isCancelled = true;
    };
  }, [formId, shop]);
  
  useEffect(() => {
    async function handleFormInit() {
      if (formId) {
        // Handle the "new" form ID case - redirect to dashboard instead of creating a form
        if (formId === 'new') {
          console.log('New form requested, redirecting to dashboard');
          navigate('/form-builder', { replace: true });
          return;
        }
        
        // For existing forms, set to editor mode
        setActiveTab('editor');
        fetchForms();
      } else {
        fetchForms();
        setActiveTab('dashboard');
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
          formId && formId !== 'new' && (
            <div className="relative">
              {/* زر تغيير الاتجاه فوق المعاينة - واضح ومرئي */}
              <div className="absolute top-4 right-4 z-10">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={toggleDirection}
                  className="bg-white shadow-md border-2 border-blue-200 hover:border-blue-400 transition-all"
                >
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'تغيير الاتجاه' : 'Toggle Direction'}: {formState.style?.formDirection?.toUpperCase() || 'LTR'}
                </Button>
              </div>
              <FormBuilderEditor formId={formId} shopId={shop || ''} />
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default FormBuilderPage;
