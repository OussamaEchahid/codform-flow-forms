
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
import { AlertCircle, RefreshCw } from 'lucide-react';
import ShopifyConnectionStatus from '@/components/form/builder/ShopifyConnectionStatus';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';
import { supabase } from '@/integrations/supabase/client';
import FormList from '@/components/form/FormList';
import { resetShopifyConnection } from '@/utils/diagnostics';

// Adding interface for component props to fix type errors
interface FormsPageProps {
  shopId?: string;
}

const FormsPage: React.FC<FormsPageProps> = ({ shopId }) => {
  const { language } = useI18n();
  const [forms, setForms] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newFormName, setNewFormName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadAttempted, setHasLoadAttempted] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  // Set a timeout to cancel loading state after 10 seconds
  useEffect(() => {
    if (isLoading) {
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          console.log('FormsPage: Forcing loading state to complete after timeout');
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
  const { isConnected, shopDomain } = useShopifyConnection();
  const navigate = useNavigate();

  // Define loadForms before it's used
  const loadForms = useCallback(async (forceRefresh = false) => {
    if (hasLoadAttempted && !forceRefresh) {
      console.log('FormsPage: Already attempted to load forms, skipping');
      return;
    }
    
    setIsLoading(true);
    if (!forceRefresh) {
      setHasLoadAttempted(true);
    }
    
    try {
      // Use the shopId prop, or fallback to shopDomain or localStorage
      const currentShopId = shopId || shopDomain || localStorage.getItem('shopify_store');
      
      console.log('FormsPage: Loading forms for shop:', currentShopId);
      
      if (!currentShopId) {
        console.error('FormsPage: No shop ID found to load forms');
        setForms([]);
        setError(language === 'ar' ? 'لم يتم العثور على متجر متصل' : 'No connected shop found');
        setIsLoading(false);
        return;
      }
      
      // Log detailed diagnostic information
      console.log('FormsPage: Load attempt with details:', {
        shopId,
        shopDomain,
        localStorage: localStorage.getItem('shopify_store'),
        useShopId: currentShopId
      });
      
      // Load forms with no shop filter first - this is for debugging
      const { data: allForms, error: allFormsError } = await supabase
        .from('forms')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      console.log(`FormsPage: All available forms in database:`, 
        allForms?.map(f => ({ id: f.id, title: f.title, shop_id: f.shop_id })) || 'none');
      
      if (allFormsError) {
        console.error('Error fetching all forms:', allFormsError);
      }
      
      // Load forms for the current shop
      const { data, error: loadError } = await supabase
        .from('forms')
        .select('*')
        .eq('shop_id', currentShopId)
        .order('created_at', { ascending: false });
      
      if (loadError) {
        console.error('FormsPage: Error loading forms:', loadError);
        throw loadError;
      }
      
      console.log(`FormsPage: Loaded ${data?.length || 0} forms for shop ${currentShopId}:`, data);

      // If no forms are returned, try again without shop_id filter as a fallback
      if (!data || data.length === 0) {
        console.log('FormsPage: No forms found for shop, trying fallback query');
        
        // Fallback query without shop_id filter
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('forms')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50); // Limit to prevent loading too many forms
        
        if (fallbackError) {
          console.error('FormsPage: Error in fallback query:', fallbackError);
        } else if (fallbackData && fallbackData.length > 0) {
          console.log(`FormsPage: Fallback found ${fallbackData.length} forms`);
          setForms(fallbackData);
          setError(null);
          setIsLoading(false);
          return;
        }
      }
      
      setForms(data || []);
      setError(null);
      
    } catch (err) {
      console.error('Error loading forms:', err);
      setError(language === 'ar' ? 'حدث خطأ أثناء تحميل النماذج' : 'Error loading forms');
      setForms([]);
    } finally {
      setIsLoading(false);
    }
  }, [language, shopDomain, hasLoadAttempted, shopId]);

  const handleCreateForm = useCallback(async () => {
    if (!newFormName.trim()) {
      toast.error(language === 'ar' ? 'يرجى إدخال اسم للنموذج' : 'Please enter a form name');
      return;
    }

    setIsSaving(true);
    console.log('Creating new form with name:', newFormName);
    
    try {
      // Use the shopDomain from our central connection or fail gracefully
      const currentShopId = shopId || shopDomain || localStorage.getItem('shopify_store');
      
      console.log('Current shop ID for form creation:', currentShopId);
      
      if (!currentShopId) {
        throw new Error(language === 'ar' ? 'لم يتم العثور على متجر متصل' : 'No connected shop found');
      }

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
          ],
          settings: {
            direction: language === 'ar' ? 'rtl' : 'ltr',
            theme: 'light',
            primaryColor: '#4F46E5',
            borderRadius: 'medium',
            showStepIndicator: true
          }
        },
        shop_id: currentShopId,
        is_published: false
      };

      console.log('Sending form data to create:', formData);

      const { data, error: saveError } = await supabase
        .from('forms')
        .insert(formData)
        .select()
        .single();

      if (saveError) {
        console.error('Error creating form:', saveError);
        throw saveError;
      }

      console.log('Form created successfully:', data);
      toast.success(language === 'ar' ? 'تم إنشاء النموذج بنجاح' : 'Form created successfully');
      setForms(prev => [data, ...prev]);
      setIsCreating(false);
      setNewFormName('');
      
      // Force reload forms to ensure we see the new form
      setTimeout(() => {
        loadForms(true);
      }, 500);
      
    } catch (err) {
      console.error('Error creating form:', err);
      toast.error(language === 'ar' ? 'حدث خطأ أثناء إنشاء النموذج' : 'Error creating form');
    } finally {
      setIsSaving(false);
    }
  }, [newFormName, language, shopDomain, shopId, loadForms]);

  // Add refresh handler that resets load state and forces a refresh
  const handleRefresh = useCallback(() => {
    console.log('FormsPage: Manually refreshing forms list');
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
      console.error('Error during reset:', err);
      toast.error(language === 'ar' ? 'فشل في إعادة تعيين الاتصال' : 'Failed to reset connection');
      setIsResetting(false);
    }
  }, [language]);

  // Load forms once when component mounts or when shopDomain changes
  useEffect(() => {
    const shopIdToUse = shopId || shopDomain || localStorage.getItem('shopify_store');
    console.log('FormsPage initial load with shopId:', shopIdToUse);
    
    if (shopIdToUse) {
      loadForms();
    } else if (!hasLoadAttempted) {
      console.log('No shop ID found, setting error state');
      setIsLoading(false);
      setHasLoadAttempted(true);
      setError(language === 'ar' ? 'لم يتم العثور على متجر متصل' : 'No connected shop found');
    }
  }, [shopDomain, loadForms, hasLoadAttempted, language, shopId]);

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
              {language === 'ar' ? 'إعادة تهيئة الاتصال' : 'Reset Connection'}
            </Button>
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
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <FormList 
        forms={forms} 
        isLoading={isLoading} 
        onSelectForm={handleEditForm} 
        onRefresh={handleRefresh}
        maxAttempts={5} // Increase max attempts for processing
      />
    </div>
  );
};

export default FormsPage;
