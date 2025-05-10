
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
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
import { AlertCircle, Loader2 } from 'lucide-react';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';
import { supabase } from '@/integrations/supabase/client';
import FormList from '@/components/form/FormList';

// Adding interface for component props to fix type errors
interface FormsPageProps {
  shopId?: string;
  forceRefresh?: boolean;
}

const FormsPage: React.FC<FormsPageProps> = ({ shopId, forceRefresh }) => {
  const { language } = useI18n();
  const [forms, setForms] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newFormName, setNewFormName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Generate a unique STABLE instance ID for better debugging
  const instanceId = useRef(`forms-page-${Math.random().toString(36).substr(2, 8)}`);
  
  // Cache key for local storage
  const cacheKey = useRef(`forms_cache_${shopId || 'default'}`);
  
  // Shopify connection info
  const { shopDomain } = useShopifyConnection();
  const navigate = useNavigate();

  // Query database for forms
  const loadForms = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    
    try {
      // First try to get cached forms if not forcing refresh
      if (!forceRefresh) {
        try {
          const cachedForms = localStorage.getItem(cacheKey.current);
          if (cachedForms) {
            const parsedForms = JSON.parse(cachedForms);
            if (parsedForms && parsedForms.length > 0) {
              console.log(`[${instanceId.current}] Using ${parsedForms.length} cached forms`);
              setForms(parsedForms);
              setError(null);
              setIsLoading(false);
            }
          }
        } catch (err) {
          console.error(`[${instanceId.current}] Error reading from cache:`, err);
        }
      }
      
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
      
      // Direct database query for forms
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('shop_id', currentShopId);
      
      if (error) {
        throw error;
      }
      
      console.log(`[${instanceId.current}] Loaded ${data?.length || 0} forms from database`);
      
      if (data && data.length > 0) {
        setForms(data);
        setError(null);
        
        // Cache the results
        try {
          localStorage.setItem(cacheKey.current, JSON.stringify(data));
        } catch (cacheError) {
          console.error(`[${instanceId.current}] Error caching forms data:`, cacheError);
        }
      } else {
        // No forms found, but don't show error
        setForms([]);
      }
    } catch (err) {
      console.error(`[${instanceId.current}] Error loading forms:`, err);
      setError(language === 'ar' ? 'حدث خطأ أثناء تحميل النماذج' : 'Error loading forms');
    } finally {
      setIsLoading(false);
    }
  }, [language, shopDomain, shopId]);

  // Load forms when component mounts
  useEffect(() => {
    loadForms(false);
  }, [loadForms]);
  
  // React to forceRefresh prop changes
  useEffect(() => {
    if (forceRefresh) {
      console.log(`[${instanceId.current}] Force refreshing forms due to prop change`);
      loadForms(true);
    }
  }, [forceRefresh, loadForms]);

  // Create form with minimal processing
  const handleCreateForm = useCallback(async () => {
    if (!newFormName.trim()) {
      toast.error(language === 'ar' ? 'يرجى إدخال اسم للنموذج' : 'Please enter a form name');
      return;
    }

    setIsSaving(true);
    console.log(`[${instanceId.current}] Creating new form with name:`, newFormName);
    
    try {
      // Get shop ID
      const currentShopId = shopId || shopDomain || localStorage.getItem('shopify_store');
      
      if (!currentShopId) {
        throw new Error(language === 'ar' ? 'لم يتم العثور على متجر متصل' : 'No connected shop found');
      }

      // Create minimal but valid form structure
      const formData = {
        id: uuidv4(),
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

      // Insert form
      const { data, error: saveError } = await supabase
        .from('forms')
        .insert(formData)
        .select();

      if (saveError) {
        throw saveError;
      }

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
      
      // Force reload forms with delay
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
    toast.info(language === 'ar' ? 'جاري تحديث القائمة...' : 'Refreshing list...');
    return loadForms(true);
  }, [loadForms, language]);

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
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className="ml-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'تحديث' : 'Refresh'}
          </Button>
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
        instanceId={instanceId.current}
      />
    </div>
  );
};

export default FormsPage;
