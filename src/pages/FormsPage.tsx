import React, { useState, useCallback, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useI18n } from '@/lib/i18n';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import ShopifyConnectionStatus from '@/components/form/builder/ShopifyConnectionStatus';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';
import { supabase } from '@/integrations/supabase/client';
import FormList from '@/components/form/FormList';
import { resetShopifyConnection } from '@/utils/diagnostics';
import { normalizeFormData } from '@/lib/form-utils/standardizeFormData';

// Adding interface for component props to fix type errors
interface FormsPageProps {
  shopId?: string;
  forceRefresh?: boolean;
  onReset?: () => void;
}

const FormsPage: React.FC<FormsPageProps> = ({ shopId, forceRefresh, onReset }) => {
  const { language } = useI18n();
  const [forms, setForms] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newFormName, setNewFormName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadAttempted, setHasLoadAttempted] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [loadTimestamp, setLoadTimestamp] = useState(Date.now());
  const [retryCount, setRetryCount] = useState(0);
  
  // Generate a unique instance ID for better debugging
  const instanceId = React.useRef(`forms-page-${Math.random().toString(36).substr(2, 9)}`);
  
  console.log(`[${instanceId.current}] FormsPage initialized with shopId: ${shopId}, forceRefresh: ${forceRefresh}`);
  
  // Set a timeout to cancel loading state after 10 seconds
  useEffect(() => {
    if (isLoading) {
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          console.log(`[${instanceId.current}] FormsPage: Forcing loading state to complete after timeout`);
          setIsLoading(false);
          if (!hasLoadAttempted) {
            setError(language === 'ar' ? 'انتهت مهلة تحميل النماذج' : 'Forms loading timeout');
          }
        }
      }, 5000); // 5 second timeout
      
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [isLoading, hasLoadAttempted, language]);
  
  // Use the centralized Shopify connection
  const { isConnected, shopDomain, syncState } = useShopifyConnection();
  const navigate = useNavigate();

  // Define loadForms before it's used
  const loadForms = useCallback(async (forceRefresh = false) => {
    if (hasLoadAttempted && !forceRefresh) {
      console.log(`[${instanceId.current}] FormsPage: Already attempted to load forms, skipping`);
      return;
    }
    
    setIsLoading(true);
    if (!forceRefresh) {
      setHasLoadAttempted(true);
    }
    
    try {
      // IMPROVED: Use multiple strategies to find the shop ID
      let currentShopId = shopId || shopDomain || localStorage.getItem('shopify_store');
      
      console.log(`[${instanceId.current}] FormsPage: Loading forms for shop:`, currentShopId);
      
      if (!currentShopId) {
        console.error(`[${instanceId.current}] FormsPage: No shop ID found to load forms`);
        setForms([]);
        setError(language === 'ar' ? 'لم يتم العثور على متجر متصل' : 'No connected shop found');
        setIsLoading(false);
        return;
      }
      
      // CRITICAL FIX: Log detailed diagnostic information
      console.log(`[${instanceId.current}] FormsPage: Load attempt with details:`, {
        shopId,
        shopDomain,
        localStorage: localStorage.getItem('shopify_store'),
        useShopId: currentShopId,
        timestamp: loadTimestamp,
        retryCount
      });
      
      // IMPROVED: Try different query approaches for maximum reliability
      let data = null;
      let loadError = null;
      
      // First attempt - simple query
      const { data: formsData, error: formsError } = await supabase
        .from('forms')
        .select('*')
        .eq('shop_id', currentShopId)
        .order('created_at', { ascending: false });
      
      if (formsError) {
        console.error(`[${instanceId.current}] FormsPage: Error in first query:`, formsError);
        loadError = formsError;
      } else if (formsData && formsData.length > 0) {
        console.log(`[${instanceId.current}] FormsPage: First query found ${formsData.length} forms`);
        data = formsData;
      } else {
        // Second attempt - more flexible matching
        console.log(`[${instanceId.current}] FormsPage: First query returned no results, trying alternative query`);
        
        const { data: alternateData, error: alternateError } = await supabase
          .from('forms')
          .select('*')
          .ilike('shop_id', `%${currentShopId}%`) // More flexible matching
          .order('created_at', { ascending: false });
        
        if (alternateError) {
          console.error(`[${instanceId.current}] FormsPage: Error in second query:`, alternateError);
          loadError = alternateError;
        } else if (alternateData && alternateData.length > 0) {
          console.log(`[${instanceId.current}] FormsPage: Second query found ${alternateData.length} forms`);
          data = alternateData;
        } else {
          // Third attempt - fetch recent forms and filter client-side
          console.log(`[${instanceId.current}] FormsPage: Second query returned no results, fetching recent forms`);
          
          const { data: recentForms, error: recentError } = await supabase
            .from('forms')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
          
          if (recentError) {
            console.error(`[${instanceId.current}] FormsPage: Error fetching recent forms:`, recentError);
            loadError = recentError;
          } else if (recentForms && recentForms.length > 0) {
            console.log(`[${instanceId.current}] FormsPage: Found ${recentForms.length} recent forms, filtering`);
            
            // Look for forms matching this shop or with no shop_id
            const matchingForms = recentForms.filter(form => 
              !form.shop_id || 
              form.shop_id === currentShopId ||
              (typeof form.shop_id === 'string' && form.shop_id.includes(currentShopId))
            );
            
            if (matchingForms.length > 0) {
              console.log(`[${instanceId.current}] FormsPage: Found ${matchingForms.length} matching forms`);
              data = matchingForms;
            }
          }
        }
      }
      
      if (data) {
        // Normalize the data structure in each form before setting
        const normalizedForms = data.map(form => {
          // Keep all properties but normalize the data structure
          if (form.data) {
            // Check if we need to normalize
            if (!form.data.steps && !Array.isArray(form.data.steps)) {
              // Normalize the data structure
              const normalizedData = normalizeFormData(form.data);
              return {
                ...form,
                data: { steps: normalizedData }
              };
            }
          }
          return form;
        });
        
        console.log(`[${instanceId.current}] FormsPage: Setting ${normalizedForms.length} forms with normalized data`);
        setForms(normalizedForms);
        setError(null);
      } else {
        console.log(`[${instanceId.current}] FormsPage: No forms found in any query`);
        setForms([]);
        
        // Only set error if this isn't the first load (to avoid confusion when there are no forms yet)
        if (retryCount > 0) {
          setError(language === 'ar' ? 'لم يتم العثور على نماذج لهذا المتجر' : 'No forms found for this shop');
        }
      }
    } catch (err) {
      console.error(`[${instanceId.current}] Error loading forms:`, err);
      setError(language === 'ar' ? 'حدث خطأ أثناء تحميل النماذج' : 'Error loading forms');
      setForms([]);
    } finally {
      setIsLoading(false);
      setRetryCount(prev => prev + 1);
    }
  }, [language, shopDomain, hasLoadAttempted, shopId, loadTimestamp, retryCount]);

  const handleCreateForm = useCallback(async () => {
    if (!newFormName.trim()) {
      toast.error(language === 'ar' ? 'يرجى إدخال اسم للنموذج' : 'Please enter a form name');
      return;
    }

    setIsSaving(true);
    console.log(`[${instanceId.current}] Creating new form with name:`, newFormName);
    
    try {
      // CRITICAL FIX: Use multiple strategies to find shop ID
      const currentShopId = shopId || shopDomain || localStorage.getItem('shopify_store');
      
      console.log(`[${instanceId.current}] Current shop ID for form creation:`, currentShopId);
      
      if (!currentShopId) {
        throw new Error(language === 'ar' ? 'لم يتم العثور على متجر متصل' : 'No connected shop found');
      }

      // IMPROVED: Use consistent data structure format for new forms
      const formData = {
        title: newFormName,
        description: '',
        data: {
          steps: [
            {
              id: uuidv4(),
              title: language === 'ar' ? 'الخطوة الأولى' : 'First Step',
              fields: []
            }
          ]
        },
        shop_id: currentShopId,
        is_published: false
      };

      console.log(`[${instanceId.current}] Sending form data to create:`, formData);

      // IMPROVED: Insert with more reliable error handling
      const { data, error: saveError } = await supabase
        .from('forms')
        .insert(formData)
        .select()
        .single();

      if (saveError) {
        console.error(`[${instanceId.current}] Error creating form:`, saveError);
        throw saveError;
      }

      console.log(`[${instanceId.current}] Form created successfully:`, data);
      toast.success(language === 'ar' ? 'تم إنشاء النموذج بنجاح' : 'Form created successfully');
      setForms(prev => [data, ...prev]);
      setIsCreating(false);
      setNewFormName('');
      
      // Force reload forms with delay to ensure we see the new form
      setTimeout(() => {
        loadForms(true);
      }, 500);
      
    } catch (err) {
      console.error(`[${instanceId.current}] Error creating form:`, err);
      toast.error(language === 'ar' ? 'حدث خطأ أثناء إنشاء النموذج' : 'Error creating form');
    } finally {
      setIsSaving(false);
    }
  }, [newFormName, language, shopDomain, shopId, loadForms]);

  // Add refresh handler that resets load state and forces a refresh
  const handleRefresh = useCallback(() => {
    console.log(`[${instanceId.current}] FormsPage: Manually refreshing forms list`);
    toast.info(language === 'ar' ? 'جاري تحديث القائمة...' : 'Refreshing list...');
    setLoadTimestamp(Date.now()); // Update timestamp to force reload
    return loadForms(true);
  }, [loadForms, language]);

  // Handle emergency connection reset
  const handleEmergencyReset = useCallback(async () => {
    setIsResetting(true);
    try {
      resetShopifyConnection();
      toast.success(language === 'ar' ? 'تم إعادة تعيين حالة الاتصال' : 'Connection state reset');
      
      // Short delay to ensure localStorage changes are saved
      setTimeout(() => {
        window.location.href = '/shopify-connect';
      }, 500);
    } catch (err) {
      console.error(`[${instanceId.current}] Error during reset:`, err);
      toast.error(language === 'ar' ? 'فشل في إعادة تعيين الاتصال' : 'Failed to reset connection');
      setIsResetting(false);
    }
  }, [language]);

  // Load forms when component mounts or when shopDomain/forceRefresh changes
  useEffect(() => {
    const shopIdToUse = shopId || shopDomain || localStorage.getItem('shopify_store');
    console.log(`[${instanceId.current}] FormsPage initial load with shopId:`, shopIdToUse, 'forceRefresh:', forceRefresh);
    
    if (shopIdToUse) {
      loadForms(!!forceRefresh); // Convert forceRefresh to boolean to ensure correct type
    } else if (!hasLoadAttempted) {
      console.log(`[${instanceId.current}] No shop ID found, setting error state`);
      setIsLoading(false);
      setHasLoadAttempted(true);
      setError(language === 'ar' ? 'لم يتم العثور على متجر متصل' : 'No connected shop found');
    }
  }, [shopDomain, loadForms, hasLoadAttempted, language, shopId, forceRefresh]);

  // Also re-sync the connection state whenever forceRefresh changes
  useEffect(() => {
    if (forceRefresh && syncState) {
      console.log(`[${instanceId.current}] FormsPage: Force syncing connection state due to forceRefresh`);
      syncState().catch(err => {
        console.error(`[${instanceId.current}] Error during forced connection sync:`, err);
      });
    }
  }, [forceRefresh, syncState]);

  const handleEditForm = (formId: string) => {
    navigate(`/form-builder/${formId}`);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {language === 'ar' ? 'النماذج' : 'Forms'}
          </h1>
          <p className="text-gray-500">
            {language === 'ar' ? 'إدارة نماذج متجرك' : 'Manage your store forms'}
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-col md:flex-row md:items-center gap-2">
          <ShopifyConnectionStatus />
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'تحديث' : 'Refresh'}
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleEmergencyReset}
              disabled={isResetting}
            >
              {isResetting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {language === 'ar' ? 'إعادة تهيئة الاتصال' : 'Reset Connection'}
            </Button>
            {onReset && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={onReset}
                className="bg-red-700 hover:bg-red-800"
              >
                {language === 'ar' ? 'إعادة تعيين كاملة' : 'Full Reset'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button 
              className="bg-primary flex items-center gap-2"
            >
              <Plus size={16} />
              {language === 'ar' ? 'إنشاء نموذج جديد' : 'Create New Form'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === 'ar' ? 'إنشاء نموذج جديد' : 'Create New Form'}
              </DialogTitle>
              <DialogDescription>
                {language === 'ar' ? 'أدخل اسمًا للنموذج الجديد' : 'Enter a name for your new form'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {language === 'ar' ? 'اسم النموذج' : 'Form Name'}
                </Label>
                <Input
                  id="name"
                  placeholder={language === 'ar' ? 'أدخل اسم النموذج' : 'Enter form name'}
                  value={newFormName}
                  onChange={(e) => setNewFormName(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setNewFormName('');
                }}
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                onClick={handleCreateForm}
                disabled={isSaving || !newFormName.trim()}
              >
                {isSaving ? (
                  language === 'ar' ? 'جارٍ الإنشاء...' : 'Creating...'
                ) : (
                  language === 'ar' ? 'إنشاء' : 'Create'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {language === 'ar' ? 'خطأ' : 'Error'}
          </AlertTitle>
          <AlertDescription>
            {error}
            <div className="mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefresh}
              >
                {language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <FormList 
        forms={forms} 
        isLoading={isLoading} 
        onSelectForm={handleEditForm} 
        onRefresh={handleRefresh}
        maxAttempts={10} // Increased max attempts for processing
        instanceId={instanceId.current}
      />
    </div>
  );
};

export default FormsPage;
