import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFormFetch } from '@/lib/hooks/form/useFormFetch';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import FormBuilder from '@/components/form/FormBuilder';
import { ArrowLeft, Save, Eye, AlertCircle, RefreshCcw } from 'lucide-react';
import FormBuilderShopify from '@/components/form/builder/FormBuilderShopify';
import ShopifyConnectionManager from '@/components/form/builder/ShopifyConnectionManager';
import { ShopifyFormData } from '@/lib/shopify/types';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Extract FormInfo section to its own component
const FormInfo = ({ 
  title, 
  setTitle, 
  description, 
  setDescription, 
  setIsFormModified,
  language 
}: {
  title: string;
  setTitle: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  setIsFormModified: (val: boolean) => void;
  language: string;
}) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h2 className="font-medium mb-4">
      {language === 'ar' ? 'معلومات النموذج' : 'Form Information'}
    </h2>
    
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          {language === 'ar' ? 'العنوان' : 'Title'}
        </label>
        <Input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setIsFormModified(true);
          }}
          placeholder={language === 'ar' ? 'أدخل عنوان النموذج' : 'Enter form title'}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">
          {language === 'ar' ? 'الوصف' : 'Description'}
        </label>
        <Textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setIsFormModified(true);
          }}
          placeholder={language === 'ar' ? 'أدخل وصف النموذج (اختياري)' : 'Enter form description (optional)'}
          rows={3}
        />
      </div>
    </div>
  </div>
);

// Extract FormActions component
const FormActions = ({ 
  handleSave, 
  isSaving, 
  handlePreviewInShopify,
  showPreview,
  language 
}: {
  handleSave: () => void;
  isSaving: boolean;
  handlePreviewInShopify: () => void;
  showPreview: boolean;
  language: string;
}) => (
  <div className="flex justify-between">
    <Button
      onClick={handleSave}
      disabled={isSaving}
      className="flex items-center"
    >
      {isSaving ? (
        <>
          <div className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-current rounded-full"></div>
          {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
        </>
      ) : (
        <>
          <Save className="h-4 w-4 mr-2" />
          {language === 'ar' ? 'حفظ النموذج' : 'Save Form'}
        </>
      )}
    </Button>
    
    {showPreview && (
      <Button
        variant="outline"
        onClick={handlePreviewInShopify}
      >
        <Eye className="h-4 w-4 mr-2" />
        {language === 'ar' ? '����عاينة في Shopify' : 'Preview in Shopify'}
      </Button>
    )}
  </div>
);

// Extract StatusNotices component
const StatusNotices = ({ 
  isFormModified,
  connectionError,
  language
}: {
  isFormModified: boolean;
  connectionError: boolean;
  language: string;
}) => (
  <>
    {isFormModified && (
      <Alert variant="default" className="bg-blue-50 border-blue-100">
        <AlertCircle className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-blue-700">
          {language === 'ar' 
            ? 'لديك تغييرات غير محفوظة. سيتم حفظها تلقائيًا كل دقيقة أو يمكنك الضغط على "حفظ النموذج" للحفظ الآن.' 
            : 'You have unsaved changes. They will be auto-saved every minute or you can press "Save Form" to save now.'}
        </AlertDescription>
      </Alert>
    )}
    
    {connectionError && (
      <Alert variant="default" className="bg-yellow-50 border-yellow-100">
        <AlertCircle className="h-4 w-4 text-yellow-500" />
        <AlertDescription className="text-yellow-700">
          {language === 'ar' 
            ? 'أنت تعمل في الوضع غير المتصل. سيتم حفظ التغييرات محليًا حتى يتم استعادة الاتصال.' 
            : 'You are working in offline mode. Changes will be saved locally until connection is restored.'}
        </AlertDescription>
      </Alert>
    )}
  </>
);

const FormBuilderPage = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { language } = useI18n();
  const { user, shopifyConnected, shop } = useAuth();
  const { getFormById } = useFormFetch();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [formData, setFormData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<boolean>(false);
  const [hasInitialFormData, setHasInitialFormData] = useState<boolean>(false);
  const [isFormModified, setIsFormModified] = useState<boolean>(false);
  const [renderKey, setRenderKey] = useState<number>(Date.now());
  
  // Reference for tracking changes
  const formDataRef = useRef(formData);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track changes in form data
  useEffect(() => {
    formDataRef.current = formData;
    setIsFormModified(true);
    
    // Auto-save to localStorage after changes
    if (formId) {
      try {
        localStorage.setItem(`form_draft_${formId}`, JSON.stringify({
          title,
          description, 
          data: formData,
          lastModified: new Date().toISOString()
        }));
      } catch (err) {
        console.error('Error saving form draft to localStorage:', err);
      }
    }
  }, [formData, title, description, formId]);

  // Set up auto-save
  useEffect(() => {
    if (isFormModified && !isSaving) {
      // Cancel any existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      // Set up new timer
      autoSaveTimerRef.current = setTimeout(() => {
        // Only attempt auto-save if there are changes and it's not a new form
        if (formId && formId !== 'new') {
          handleSave(true);
        }
      }, 60000); // Auto-save after 60 seconds of inactivity
    }
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [isFormModified, isSaving, formId]);

  // Handle loading form data with improvements for error handling and caching
  useEffect(() => {
    const loadForm = async () => {
      setIsLoading(true);
      setLoadError(null);
      
      try {
        console.log(`FormBuilderPage: Loading form with ID: ${formId}`);
        let form;
        let usingCachedData = false;
        
        // Check for unsaved data in localStorage
        const draftKey = `form_draft_${formId}`;
        const cachedDraft = localStorage.getItem(draftKey);
        
        // Add short delay to avoid continuous loading
        await new Promise(resolve => setTimeout(resolve, 300));
        
        try {
          // Try loading data from server
          if (formId === 'new') {
            // Create a new empty form for 'new' formId
            form = {
              id: 'new',
              title: language === 'ar' ? 'نموذج جديد' : 'New Form',
              description: '',
              data: [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              user_id: user?.id || '',
              is_published: false
            };
          } else {
            // Load existing form
            form = await getFormById(formId || '');
            
            // Ensure valid data exists
            if (!form || (!form.id && formId !== 'new')) {
              throw new Error('No valid form data received');
            }
          }
        } catch (fetchError) {
          console.error('Error fetching form:', fetchError);
          setConnectionError(true);
          usingCachedData = true;
          
          // Try retrieving unsaved draft first
          if (cachedDraft) {
            try {
              const draftData = JSON.parse(cachedDraft);
              console.log('Found unsaved draft:', draftData);
              toast.info(language === 'ar' 
                ? 'تم العثور على مسودة غير محفوظة. استخدام البيانات المحلية.' 
                : 'Found unsaved draft. Using local data.');
                
              // Use unsaved draft
              form = {
                id: formId || 'new',
                title: draftData.title || '',
                description: draftData.description || '',
                data: Array.isArray(draftData.data) ? draftData.data : [],
                created_at: new Date().toISOString(),
                updated_at: draftData.lastModified || new Date().toISOString(),
                user_id: user?.id || '',
                is_published: false
              };
            } catch (draftError) {
              console.error('Error parsing draft data:', draftError);
            }
          }
          
          // Try retrieving locally cached version
          if (!form) {
            try {
              const cachedForm = localStorage.getItem(`form_${formId}`);
              if (cachedForm) {
                form = JSON.parse(cachedForm);
                console.log('Using cached form data:', form);
              }
            } catch (cacheError) {
              console.error('Error retrieving cached form:', cacheError);
            }
          }
          
          // Create default form if there's a connection issue
          if (!form) {
            form = {
              id: formId || 'new',
              title: formId === 'new' ? (language === 'ar' ? 'نموذج جديد' : 'New Form') : '',
              description: '',
              data: [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              user_id: user?.id || '',
              is_published: false
            };
          }
        }
        
        if (form) {
          console.log('Form loaded successfully:', form);
          setTitle(form.title || '');
          setDescription(form.description || '');
          // Ensure data is always an array
          const formDataArray = Array.isArray(form.data) ? form.data : [];
          setFormData(formDataArray);
          setHasInitialFormData(true);
          setRenderKey(Date.now()); // Force re-render with new key
          
          // Show appropriate notification to user
          if (usingCachedData) {
            toast.info(language === 'ar' 
              ? 'جاري استخدام بيانات محلية نظرًا لمشكلة في الاتصال' 
              : 'Using local data due to connection issue');
          }
          
          // Reset modification state after initial load
          setIsFormModified(false);
        } else {
          console.error('Form not found');
          toast.error(language === 'ar' ? 'النموذج غير موجود' : 'Form not found');
          navigate('/forms');
        }
      } catch (error) {
        console.error('Error loading form:', error);
        const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء تحميل النموذج';
        setLoadError(errorMessage);
        toast.error(language === 'ar' ? 'خطأ في تحميل النموذج' : 'Error loading form');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadForm();
  }, [formId, getFormById, language, navigate, user?.id]);
  
  // Fix for the UUID error in the handleSave function
  const handleSave = async (isAutoSave = false) => {
    if (!title.trim() && !isAutoSave) {
      toast.error(language === 'ar' ? 'يرجى إدخال عنوان النموذج' : 'Please enter a form title');
      return;
    }
    
    // Don't show notification for auto-save
    if (!isAutoSave) {
      setIsSaving(true);
    }
    
    try {
      console.log('Saving form...');
      
      // FIX: Create a proper form payload with user_id as a UUID or null, not a string
      // This will fix the "invalid input syntax for type uuid" error
      let userIdValue = null;
      
      // Only use user.id if it's a valid UUID format, otherwise keep it null
      if (user?.id) {
        // Check if user.id is a valid UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(user.id)) {
          userIdValue = user.id;
        } else {
          console.log('User ID is not a valid UUID format:', user.id);
        }
      }
      
      const formPayload = {
        title: title || (language === 'ar' ? 'نموذج جديد' : 'New Form'),
        description: description || null,
        data: formData,
        user_id: userIdValue, // Changed to userIdValue which is either a valid UUID or null
        shop_id: null, // Keep shop_id as null to avoid UUID syntax error
        is_published: true
      };
      
      // Update draft storage
      if (formId) {
        try {
          localStorage.setItem(`form_draft_${formId}`, JSON.stringify({
            ...formPayload,
            lastModified: new Date().toISOString()
          }));
        } catch (cacheError) {
          console.error('Error updating draft cache:', cacheError);
        }
      }
      
      // Check connection
      const isOnline = navigator.onLine;
      if (!isOnline || connectionError) {
        console.log('Saving form in offline mode');
        
        if (!isAutoSave) {
          // Show notification to user that form will be saved when connection is restored
          toast.warning(
            language === 'ar' 
              ? 'الاتصال غير متاح حاليًا. تم حفظ النموذج محليًا وسيتم مزامنته عند استعادة الاتصال.' 
              : 'Connection unavailable. Form saved locally and will be synced when connection is restored.'
          );
        }
        
        // Store form locally for later saving
        const offlineForms = JSON.parse(localStorage.getItem('offline_forms') || '[]');
        const existingFormIndex = offlineForms.findIndex(f => f.id === formId);
        
        if (existingFormIndex >= 0) {
          offlineForms[existingFormIndex] = {
            id: formId,
            ...formPayload,
            pendingSave: true,
            lastModified: new Date().toISOString()
          };
        } else {
          offlineForms.push({
            id: formId === 'new' ? `new-${Date.now()}` : formId,
            ...formPayload,
            pendingSave: true,
            lastModified: new Date().toISOString()
          });
        }
        
        localStorage.setItem('offline_forms', JSON.stringify(offlineForms));
        
        // Save current form also
        localStorage.setItem(`form_${formId || 'new'}`, JSON.stringify({
          id: formId || 'new',
          ...formPayload
        }));
        
        // Reset modification state
        if (!isAutoSave) {
          setIsFormModified(false);
          
          // Direct user to forms page if it's a new form
          if (formId === 'new') {
            toast.success(
              language === 'ar' 
                ? 'تم حفظ النموذج مؤقتًا. سيتم مزامنته عند استعادة الاتصال.' 
                : 'Form saved temporarily. It will be synced when connection is restored.'
            );
            navigate('/forms');
          }
        }
        
        return;
      }
      
      let response;
      
      // Save to server
      if (formId && formId !== 'new') {
        // Update existing form
        console.log('Updating existing form:', formId);
        response = await supabase
          .from('forms')
          .update(formPayload)
          .eq('id', formId)
          .select()
          .single();
      } else {
        // Create new form
        console.log('Creating new form');
        response = await supabase
          .from('forms')
          .insert(formPayload)
          .select()
          .single();
      }
      
      if (response.error) {
        console.error('Supabase error:', response.error);
        throw response.error;
      }
      
      console.log('Form saved successfully:', response.data);
      
      // Update local cache
      try {
        localStorage.setItem(`form_${response.data.id}`, JSON.stringify(response.data));
        // Remove draft after successful save
        localStorage.removeItem(`form_draft_${formId}`);
      } catch (cacheError) {
        console.error('Error updating localStorage cache:', cacheError);
      }
      
      // Reset modification state
      setIsFormModified(false);
      
      // Show notification for regular save only, not auto-save
      if (!isAutoSave) {
        toast.success(
          language === 'ar' 
            ? 'تم حفظ النموذج بنجاح' 
            : 'Form saved successfully'
        );
        
        // If it's a new form, navigate to edit form page using the new ID
        if (!formId || formId === 'new') {
          navigate(`/form-builder/${response.data.id}`);
        }
      }
      
    } catch (error) {
      console.error('Error saving form:', error);
      
      // Temporary cache in case of connection failure
      if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('network'))) {
        setConnectionError(true);
        
        if (!isAutoSave) {
          toast.warning(
            language === 'ar' 
              ? 'فشل الاتصال. تم حفظ النموذج مؤقتًا محليًا.' 
              : 'Connection failed. Form saved locally temporarily.'
          );
        }
        
        // Store form locally
        try {
          localStorage.setItem(`form_${formId || 'new'}`, JSON.stringify({
            id: formId || `new-${Date.now()}`,
            title, 
            description, 
            data: formData,
            lastModified: new Date().toISOString()
          }));
        } catch (cacheError) {
          console.error('Error saving to localStorage:', cacheError);
        }
      } else if (!isAutoSave) {
        toast.error(
          language === 'ar' 
            ? 'خطأ في حفظ النموذج: ' + (error.message || '')
            : 'Error saving form: ' + (error.message || '')
        );
      }
    } finally {
      if (!isAutoSave) {
        setIsSaving(false);
      }
    }
  };
  
  // Preview form in Shopify
  const handlePreviewInShopify = () => {
    if (shopifyConnected && shop && formId && formId !== 'new') {
      const shopifyUrl = `https://${shop}/apps/codform/?form=${formId}`;
      window.open(shopifyUrl, '_blank');
    } else {
      toast.error(
        language === 'ar' 
          ? 'يجب حفظ النموذج أولاً والاتصال بـ Shopify' 
          : 'Save the form first and connect to Shopify'
      );
    }
  };

  // Handle Shopify integration
  const handleShopifyIntegration = async (settings: ShopifyFormData): Promise<void> => {
    try {
      setIsSyncing(true);
      
      if (!formId || formId === 'new') {
        toast.error(language === 'ar' 
          ? 'يجب حفظ النموذج أولاً قبل تكوين تكامل Shopify'
          : 'Please save the form first before configuring Shopify integration');
        return;
      }
      
      // Simple implementation for saving form settings in Shopify
      const { data, error } = await supabase
        .from('shopify_product_settings')
        .upsert({
          form_id: formId,
          product_id: settings.product_id || 'all',
          shop_id: shop || '',
          block_id: settings.settings?.blockId || 'codform-default',
          enabled: settings.settings?.enabled || true,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      toast.success(language === 'ar' 
        ? 'تم حفظ إعدادات التكامل مع Shopify بنجاح'
        : 'Shopify integration settings saved successfully');
        
    } catch (error) {
      console.error('Error saving Shopify integration:', error);
      toast.error(language === 'ar' 
        ? 'حدث خطأ أثناء حفظ إعدادات التكامل'
        : 'Error saving integration settings');
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Retry loading the form
  const handleRetry = () => {
    setLoadError(null);
    setConnectionError(false);
    setIsLoading(true);
    setRenderKey(Date.now()); // Force re-render with new key
    window.location.reload();
  };
  
  // Display loading state
  if (isLoading && !hasInitialFormData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-purple-500 rounded-full mx-auto mb-4"></div>
          <p>{language === 'ar' ? 'جاري تحميل النموذج...' : 'Loading form...'}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-4" key={renderKey}>
      <div className="max-w-6xl mx-auto">
        {/* Shopify connection status - now optimized to prevent excessive requests */}
        <ShopifyConnectionManager formId={formId !== 'new' ? formId : null} />
        
        {/* Show warning when there's a loading error */}
        {(loadError || connectionError) && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {language === 'ar' 
                ? 'حدث خطأ في الاتصال. يمكنك متابعة العمل والمحاولة مرة أخرى لاحقًا.' 
                : 'Connection error occurred. You can continue working and try again later.'}
              <Button 
                variant="outline"
                size="sm"
                className="ml-2"
                onClick={handleRetry}
              >
                <RefreshCcw className="h-4 w-4 mr-1" />
                {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/forms')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'عودة إلى النماذج' : 'Back to Forms'}
          </Button>
          
          <h1 className="text-2xl font-bold">
            {language === 'ar' ? 'منشئ النماذج' : 'Form Builder'}
          </h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Form information */}
            <FormInfo 
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
              setIsFormModified={setIsFormModified}
              language={language}
            />
            
            {/* Form builder */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="font-medium mb-4">
                {language === 'ar' ? 'حقول النموذج' : 'Form Fields'}
              </h2>
              
              <FormBuilder
                formData={formData}
                onChange={(newData) => {
                  setFormData(newData);
                  setIsFormModified(true);
                }}
                isOfflineMode={connectionError}
              />
            </div>
            
            {/* Action buttons */}
            <FormActions
              handleSave={() => handleSave(false)}
              isSaving={isSaving}
              handlePreviewInShopify={handlePreviewInShopify}
              showPreview={shopifyConnected && !!formId && formId !== 'new' && !connectionError}
              language={language}
            />
          </div>
          
          {/* Settings and integration */}
          <div className="space-y-6">
            {/* Shopify integration */}
            <div className="bg-white p-6 rounded-lg shadow">
              <FormBuilderShopify 
                isSyncing={isSyncing}
                formId={formId !== 'new' ? formId : null}
                onShopifyIntegration={handleShopifyIntegration}
              />
            </div>
            
            {/* Status notices */}
            <StatusNotices
              isFormModified={isFormModified}
              connectionError={connectionError}
              language={language}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormBuilderPage;
