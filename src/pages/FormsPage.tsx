
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
import { AlertCircle } from 'lucide-react';
import ShopifyConnectionStatus from '@/components/form/builder/ShopifyConnectionStatus';
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';
import { supabase } from '@/integrations/supabase/client';
import FormList from '@/components/form/FormList';

const FormsPage: React.FC = () => {
  const { language } = useI18n();
  const [forms, setForms] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newFormName, setNewFormName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadAttempted, setHasLoadAttempted] = useState(false);
  
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

  const handleCreateForm = useCallback(async () => {
    if (!newFormName.trim()) {
      toast.error(language === 'ar' ? 'يرجى إدخال اسم للنموذج' : 'Please enter a form name');
      return;
    }

    setIsSaving(true);
    
    try {
      // Use the shopDomain from our central connection or fail gracefully
      const currentShopId = shopDomain || localStorage.getItem('shopify_store');
      
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

      const { data, error: saveError } = await supabase
        .from('forms')
        .insert(formData)
        .select()
        .single();

      if (saveError) {
        throw saveError;
      }

      toast.success(language === 'ar' ? 'تم إنشاء النموذج بنجاح' : 'Form created successfully');
      setForms(prev => [...prev, data]);
      setIsCreating(false);
      setNewFormName('');
      
    } catch (err) {
      console.error('Error creating form:', err);
      toast.error(language === 'ar' ? 'حدث خطأ أثناء إنشاء النموذج' : 'Error creating form');
    } finally {
      setIsSaving(false);
    }
  }, [newFormName, language, shopDomain]);

  const loadForms = useCallback(async () => {
    if (hasLoadAttempted) {
      console.log('FormsPage: Already attempted to load forms, skipping');
      return;
    }
    
    setIsLoading(true);
    setHasLoadAttempted(true);
    
    try {
      // Use the shopDomain or fallback to localStorage
      const currentShopId = shopDomain || localStorage.getItem('shopify_store');
      
      if (!currentShopId) {
        setForms([]);
        setError(language === 'ar' ? 'لم يتم العثور على متجر متصل' : 'No connected shop found');
        return;
      }
      
      console.log('FormsPage: Loading forms for shop:', currentShopId);
      
      // Load forms for the current shop
      const { data, error: loadError } = await supabase
        .from('forms')
        .select('*')
        .eq('shop_id', currentShopId)
        .order('created_at', { ascending: false });
      
      if (loadError) {
        throw loadError;
      }
      
      console.log(`FormsPage: Loaded ${data?.length || 0} forms`);
      setForms(data || []);
      setError(null);
      
    } catch (err) {
      console.error('Error loading forms:', err);
      setError(language === 'ar' ? 'حدث خطأ أثناء تحميل النماذج' : 'Error loading forms');
      setForms([]);
    } finally {
      setIsLoading(false);
    }
  }, [language, shopDomain, hasLoadAttempted]);

  // Load forms once when component mounts or when shopDomain changes
  useEffect(() => {
    const shopId = shopDomain || localStorage.getItem('shopify_store');
    if (shopId && !hasLoadAttempted) {
      loadForms();
    } else if (!hasLoadAttempted) {
      setIsLoading(false);
      setHasLoadAttempted(true);
      setError(language === 'ar' ? 'لم يتم العثور على متجر متصل' : 'No connected shop found');
    }
  }, [shopDomain, loadForms, hasLoadAttempted, language]);

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
        
        <div className="mt-4 md:mt-0">
          <ShopifyConnectionStatus />
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
      />
    </div>
  );
};

export default FormsPage;
