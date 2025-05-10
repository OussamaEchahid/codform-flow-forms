import React, { useState, useCallback, useEffect, useRef } from 'react';
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
import { AlertCircle, RefreshCw, Loader2, Database } from 'lucide-react';
import ShopifyConnectionStatus from '@/components/form/builder/ShopifyConnectionStatus';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';
import { supabase } from '@/integrations/supabase/client';
import FormList from '@/components/form/FormList';
import { resetShopifyConnection } from '@/utils/diagnostics';

// Adding interface for component props to fix type errors
interface FormsPageProps {
  shopId?: string;
  forceRefresh?: boolean;
  onReset?: () => void;
}

const FormsPage: React.FC<FormsPageProps> = ({ 
  shopId, 
  forceRefresh, 
  onReset 
}) => {
  const { language } = useI18n();
  const [forms, setForms] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newFormName, setNewFormName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadAttempted, setHasLoadAttempted] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isDbQueryRunning, setIsDbQueryRunning] = useState(false);
  const [loadTimestamp, setLoadTimestamp] = useState(Date.now());
  const [retryCount, setRetryCount] = useState(0);
  const initialLoadRef = useRef(false);
  
  // Generate a unique STABLE instance ID for better debugging that won't change on render
  const instanceId = useRef(`forms-page-${Math.random().toString(36).substr(2, 8)}`);
  
  // Cache key for local storage
  const cacheKey = useRef(`forms_cache_${shopId || 'default'}`);
  
  console.log(`[${instanceId.current}] FormsPage initialized with shopId: ${shopId}, forceRefresh: ${forceRefresh}`);
  
  // Set a timeout to cancel loading state after 5 seconds
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

  // Check for cached forms data
  useEffect(() => {
    if (!initialLoadRef.current) {
      try {
        const cachedForms = localStorage.getItem(cacheKey.current);
        if (cachedForms) {
          const parsedForms = JSON.parse(cachedForms);
          console.log(`[${instanceId.current}] Using cached forms data (${parsedForms.length} forms)`);
          setForms(parsedForms);
          setIsLoading(false);
          setError(null);
        }
      } catch (err) {
        console.error(`[${instanceId.current}] Error reading from cache:`, err);
      }
      initialLoadRef.current = true;
    }
  }, []);

  // Direct query database for forms - now used for initial load AND as fallback
  const queryDatabaseDirectly = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setIsDbQueryRunning(true);
      }
      
      const shopIdToUse = shopId || shopDomain || localStorage.getItem('shopify_store');
      
      if (!shopIdToUse) {
        if (!silent) {
          toast.error(language === 'ar' ? 'لم يتم العثور على متجر متصل' : 'No connected shop found');
        }
        return null;
      }
      
      // Direct basic query without processing
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('shop_id', shopIdToUse);
      
      if (error) {
        console.error(`[${instanceId.current}] Direct DB query error:`, error);
        if (!silent) {
          toast.error(language === 'ar' ? 'خطأ في الاستعلام المباشر من قاعدة البيانات' : 'Error in direct database query');
        }
        return null;
      }
      
      // Log raw data from database
      console.log(`[${instanceId.current}] Direct DB query found ${data?.length || 0} forms`);
      
      if (!silent && data && data.length > 0) {
        toast.success(language === 'ar' ? `تم العثور على ${data.length} نموذج` : `Found ${data.length} forms`);
      }
      
      if (data && data.length > 0) {
        // Update forms list directly
        setForms(data);
        setIsLoading(false);
        setError(null);
        
        // Cache the results
        try {
          localStorage.setItem(cacheKey.current, JSON.stringify(data));
          console.log(`[${instanceId.current}] Forms data cached (${data.length} forms)`);
        } catch (cacheError) {
          console.error(`[${instanceId.current}] Error caching forms data:`, cacheError);
        }
        
        return data;
      }
      
      return null;
    } catch (err) {
      console.error(`[${instanceId.current}] Error in direct DB query:`, err);
      if (!silent) {
        toast.error(language === 'ar' ? 'خطأ في الاستعلام المباشر' : 'Error in direct query');
      }
      return null;
    } finally {
      if (!silent) {
        setIsDbQueryRunning(false);
      }
    }
  }, [shopId, shopDomain, language]);

  // IMPROVED: Load forms with automatic caching and fallback
  const loadForms = useCallback(async (forceRefresh = false) => {
    // Skip if recently loaded (avoid hammering the DB)
    if (!forceRefresh && hasLoadAttempted && Date.now() - loadTimestamp < 10000) {
      console.log(`[${instanceId.current}] FormsPage: Skipping load, loaded recently`);
      return;
    }
    
    setIsLoading(true);
    setHasLoadAttempted(true);
    setLoadTimestamp(Date.now());
    
    try {
      // Get shop ID using multiple strategies
      const currentShopId = shopId || shopDomain || localStorage.getItem('shopify_store');
      
      console.log(`[${instanceId.current}] FormsPage: Loading forms for shop:`, currentShopId);
      
      if (!currentShopId) {
        console.error(`[${instanceId.current}] FormsPage: No shop ID found to load forms`);
        setForms([]);
        setError(language === 'ar' ? 'لم يتم العثور على متجر متصل' : 'No connected shop found');
        setIsLoading(false);
        return;
      }
      
      // IMPROVED: First try direct query as it's simplest and most reliable
      console.log(`[${instanceId.current}] FormsPage: Attempting direct query`);
      const directForms = await queryDatabaseDirectly(true);
      
      if (directForms && directForms.length > 0) {
        // Direct query successful, no need to continue
        console.log(`[${instanceId.current}] FormsPage: Direct query found ${directForms.length} forms`);
        setIsLoading(false);
        return;
      }
      
      // Clear error if we have forms data
      if (forms.length > 0) {
        setError(null);
      } else {
        // Only set error if not first load (to avoid confusion when there are no forms yet)
        if (retryCount > 0) {
          setError(language === 'ar' ? 'لم يتم العثور على نماذج لهذا المتجر' : 'No forms found for this shop');
        }
      }
    } catch (err) {
      console.error(`[${instanceId.current}] Error loading forms:`, err);
      setError(language === 'ar' ? 'حدث خطأ أثناء تحميل النماذج' : 'Error loading forms');
      
      // Try direct query as last resort if normal query fails
      await queryDatabaseDirectly(true);
    } finally {
      setIsLoading(false);
      setRetryCount(prev => prev + 1);
    }
  }, [language, shopDomain, hasLoadAttempted, shopId, loadTimestamp, retryCount, queryDatabaseDirectly, forms.length]);

  // IMPROVED: Create form with minimal processing
  const handleCreateForm = useCallback(async () => {
    if (!newFormName.trim()) {
      toast.error(language === 'ar' ? 'يرجى إدخال اسم للنموذج' : 'Please enter a form name');
      return;
    }

    setIsSaving(true);
    console.log(`[${instanceId.current}] Creating new form with name:`, newFormName);
    
    try {
      // Get shop ID using multiple strategies
      const currentShopId = shopId || shopDomain || localStorage.getItem('shopify_store');
      
      console.log(`[${instanceId.current}] Current shop ID for form creation:`, currentShopId);
      
      if (!currentShopId) {
        throw new Error(language === 'ar' ? 'لم يتم العثور على متجر متصل' : 'No connected shop found');
      }

      // Create minimal but valid form structure
      const formData = {
        id: uuidv4(), // Explicitly set ID to avoid any issues
        title: newFormName,
        description: '',
        data: {
          settings: {
            formStyle: {
              primaryColor: '#9b87f5',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              buttonStyle: 'rounded',
              submitButtonText: 'إرسال الطلب'
            }
          },
          steps: [
            {
              id: '1',
              title: 'خطوة 1',
              fields: []
            }
          ]
        },
        shop_id: currentShopId,
        is_published: false,
        submitbuttontext: 'إرسال الطلب',
        primaryColor: '#9b87f5',
        borderRadius: '0.5rem',
        fontSize: '1rem',
        buttonStyle: 'rounded'
      };

      // Insert with error handling
      const { data, error: saveError } = await supabase
        .from('forms')
        .insert(formData)
        .select();

      if (saveError) {
        console.error(`[${instanceId.current}] Error creating form:`, saveError);
        throw saveError;
      }

      console.log(`[${instanceId.current}] Form created successfully:`, data);
      toast.success(language === 'ar' ? 'تم إنشاء النموذج بنجاح' : 'Form created successfully');
      
      if (data && data.length > 0) {
        // Update forms list with the new form at the beginning
        const updatedForms = [data[0], ...forms];
        setForms(updatedForms);
        
        // Update cache
        try {
          localStorage.setItem(cacheKey.current, JSON.stringify(updatedForms));
        } catch (cacheError) {
          console.error(`[${instanceId.current}] Error updating cache:`, cacheError);
        }
      }
      
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
  }, [newFormName, language, shopDomain, shopId, loadForms, forms]);

  // Add refresh handler that resets load state and forces a refresh
  const handleRefresh = useCallback(() => {
    console.log(`[${instanceId.current}] FormsPage: Manually refreshing forms list`);
    toast.info(language === 'ar' ? 'جاري تحديث القائمة...' : 'Refreshing list...');
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

  // Load forms when component mounts or when shopDomain changes - but only once unless forced
  useEffect(() => {
    const shopIdToUse = shopId || shopDomain || localStorage.getItem('shopify_store');
    console.log(`[${instanceId.current}] FormsPage evaluating load with shopId:`, shopIdToUse, 'forceRefresh:', forceRefresh);
    
    // If forceRefresh is true, always load
    if (forceRefresh) {
      console.log(`[${instanceId.current}] FormsPage: Force refreshing forms`);
      loadForms(true);
      return;
    }
    
    // Otherwise, only load if we haven't loaded before
    if (!hasLoadAttempted && shopIdToUse) {
      console.log(`[${instanceId.current}] FormsPage: Initial forms load`);
      loadForms(false);
    } else if (!hasLoadAttempted) {
      console.log(`[${instanceId.current}] No shop ID found, setting error state`);
      setIsLoading(false);
      setHasLoadAttempted(true);
      setError(language === 'ar' ? 'لم يتم العثور على متجر متصل' : 'No connected shop found');
    }
  }, [shopDomain, loadForms, hasLoadAttempted, language, shopId, forceRefresh]);

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
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'تحديث' : 'Refresh'}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => queryDatabaseDirectly(false)}
              className="bg-blue-50"
              disabled={isDbQueryRunning}
            >
              {isDbQueryRunning ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              {language === 'ar' ? 'استعلام مباشر من القاعدة' : 'Direct DB Query'}
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
        maxAttempts={3} // Reduced to 3 for performance
        instanceId={instanceId.current}
      />
    </div>
  );
};

export default FormsPage;
