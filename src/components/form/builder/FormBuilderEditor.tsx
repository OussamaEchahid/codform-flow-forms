import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Settings, Eye, Palette, Plus, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { useShopify } from '@/hooks/useShopify';
import { useFormStore } from '@/hooks/useFormStore';
import { FormField, deepCloneField } from '@/lib/form-utils';
import FormElementList from './FormElementList';
import FormElementEditor from './FormElementEditor';
import FormPreviewPanel from '../FormPreviewPanel';
import FormSettingsTab from './FormSettingsTab';
import FormStylingEditor from './FormStylingEditor';
import ShopifyIntegration from './ShopifyIntegration';
import { shopifySupabase } from '@/lib/shopify/supabase-client';

interface FormBuilderEditorProps {
  formId: string;
  shopId: string;
}

interface FormSettings {
  title: string;
  description: string;
  fields: FormField[];
}

const FormBuilderEditor: React.FC<FormBuilderEditorProps> = ({ formId, shopId }) => {
  const { language } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { shop, failSafeMode } = useShopify();
  const { formData, formStyle, updateFormData, updateFormStyle } = useFormStore();
  
  // Basic form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(1);
  
  // تم تحديث القيم الافتراضية لتكون فارغة - سيتم تحميلها من قاعدة البيانات
  const [formCountry, setFormCountry] = useState('');
  const [formCurrency, setFormCurrency] = useState('');
  const [formPhonePrefix, setFormPhonePrefix] = useState('');

  // Form creation logic
  useEffect(() => {
    if (!formData) return;
    
    setFormTitle(formData.title || '');
    setFormDescription(formData.description || '');
    setFields(formData.fields || []);
  }, [formData]);

  // Auto-save functionality
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastAutoSaveRef = useRef<Date | null>(null);
  
  const debouncedAutoSave = useCallback(async () => {
    if (!formId || formId === 'new' || !fields.length) return;
    
    const now = new Date();
    if (lastAutoSaveRef.current && (now.getTime() - lastAutoSaveRef.current.getTime()) < 5000) {
      return;
    }
    
    try {
      await saveForm();
      lastAutoSaveRef.current = now;
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [formId, fields, formTitle, formDescription, formStyle, formCountry, formCurrency, formPhonePrefix]);

  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      debouncedAutoSave();
    }, 15000);
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [debouncedAutoSave, fields, formTitle, formDescription, formStyle, formCountry, formCurrency, formPhonePrefix]);

  const loadForm = async () => {
    if (!formId || formId === 'new') return;
    
    setIsLoading(true);
    
    try {
      console.log('Loading form:', formId);
      
      const { data: form, error } = await shopifySupabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();
      
      if (error) {
        console.error('Error loading form:', error);
        toast.error(language === 'ar' ? 'خطأ في تحميل النموذج' : 'Error loading form');
        return;
      }
      
      if (form) {
        console.log('Loaded form data:', form);
        
        // تحميل البيانات الأساسية
        setFormTitle(form.title || '');
        setFormDescription(form.description || '');
        
        // تحميل إعدادات النموذج بالقيم الافتراضية الصحيحة
        const loadedCountry = form.country || 'SA';
        const loadedCurrency = form.currency || (loadedCountry === 'MA' ? 'MAD' : 'SAR');
        const loadedPhonePrefix = form.phone_prefix || (loadedCountry === 'MA' ? '+212' : '+966');
        
        console.log('Loading form settings:', { 
          country: loadedCountry, 
          currency: loadedCurrency, 
          phonePrefix: loadedPhonePrefix 
        });
        
        setFormCountry(loadedCountry);
        setFormCurrency(loadedCurrency);
        setFormPhonePrefix(loadedPhonePrefix);
        
        // تحميل عناصر النموذج
        if (form.data && Array.isArray(form.data)) {
          const processedFields = form.data.map((field: any) => ({
            ...field,
            id: field.id || `field-${Date.now()}-${Math.random()}`
          }));
          setFields(processedFields);
        }
        
        // تحميل الأنماط
        if (form.style) {
          updateFormStyle(form.style);
        }
        
        updateFormData({
          title: form.title || '',
          description: form.description || '',
          fields: form.data || []
        });
        
        console.log('Form loaded successfully with currency:', loadedCurrency);
      }
    } catch (error) {
      console.error('Error loading form:', error);
      toast.error(language === 'ar' ? 'خطأ في تحميل النموذج' : 'Error loading form');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadForm();
  }, [formId, language]);

  const saveForm = async () => {
    if (!formId || formId === 'new') return;
    
    // التأكد من أن العملة صحيحة قبل الحفظ
    const currencyToSave = formCurrency || (formCountry === 'MA' ? 'MAD' : 'SAR');
    const countryToSave = formCountry || 'SA';
    const phonePrefixToSave = formPhonePrefix || (formCountry === 'MA' ? '+212' : '+966');
    
    console.log('Saving form with settings:', {
      country: countryToSave,
      currency: currencyToSave,
      phonePrefix: phonePrefixToSave
    });
    
    try {
      setIsSaving(true);
      
      const formDataToSave = {
        title: formTitle,
        description: formDescription,
        data: fields,
        style: formStyle,
        country: countryToSave,
        currency: currencyToSave,
        phone_prefix: phonePrefixToSave,
        shop_id: shopId || shop,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await shopifySupabase
        .from('forms')
        .update(formDataToSave)
        .eq('id', formId);
      
      if (error) {
        console.error('Error saving form:', error);
        toast.error(language === 'ar' ? 'خطأ في حفظ النموذج' : 'Error saving form');
        return;
      }
      
      setLastSaved(new Date());
      console.log('Form saved successfully with currency:', currencyToSave);
      
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error(language === 'ar' ? 'خطأ في حفظ النموذج' : 'Error saving form');
    } finally {
      setIsSaving(false);
    }
  };

  const addField = (field: Omit<FormField, 'id'>) => {
    const newField: FormField = {
      ...field,
      id: `field-${Date.now()}-${Math.random()}`
    };
    setFields([...fields, newField]);
    setRefreshKey(refreshKey + 1);
  };

  const updateField = (updatedField: FormField) => {
    const updatedFields = fields.map(field =>
      field.id === updatedField.id ? updatedField : field
    );
    setFields(updatedFields);
    setRefreshKey(refreshKey + 1);
  };

  const moveField = (fromIndex: number, toIndex: number) => {
    const newFields = [...fields];
    const element = newFields.splice(fromIndex, 1)[0];
    newFields.splice(toIndex, 0, element);
    setFields(newFields);
    setRefreshKey(refreshKey + 1);
  };

  const deleteField = (fieldId: string) => {
    const updatedFields = fields.filter(field => field.id !== fieldId);
    setFields(updatedFields);
    setSelectedField(null);
    setRefreshKey(refreshKey + 1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-4">
      <div className="flex justify-between items-center mb-4">
        <Button variant="ghost" onClick={() => navigate('/form-builder')}>
          <ArrowLeft className="w-5 h-5 mr-2" />
          {language === 'ar' ? 'العودة للوحة التحكم' : 'Back to Dashboard'}
        </Button>
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            onClick={saveForm}
            disabled={isSaving}
            className="flex items-center"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'حفظ' : 'Save'}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Tabs defaultValue="elements" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="elements" className="text-sm">
                <Plus className="w-4 h-4 mr-1" />
                {language === 'ar' ? 'العناصر' : 'Elements'}
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-sm">
                <Settings className="w-4 h-4 mr-1" />
                {language === 'ar' ? 'الإعدادات' : 'Settings'}
              </TabsTrigger>
              <TabsTrigger value="styling" className="text-sm">
                <Palette className="w-4 h-4 mr-1" />
                {language === 'ar' ? 'التصميم' : 'Styling'}
              </TabsTrigger>
              <TabsTrigger value="shopify" className="text-sm">
                <Eye className="w-4 h-4 mr-1" />
                Shopify
              </TabsTrigger>
            </TabsList>

            <TabsContent value="elements" className="space-y-4">
              <FormElementList
                onAddField={addField}
                selectedField={selectedField}
                onSelectField={setSelectedField}
                fields={fields}
                onMoveField={moveField}
                onDeleteField={deleteField}
              />
              
              {selectedField && (
                <FormElementEditor
                  field={selectedField}
                  onUpdateField={updateField}
                  onClose={() => setSelectedField(null)}
                />
              )}
            </TabsContent>

            <TabsContent value="settings">
              <FormSettingsTab
                formTitle={formTitle}
                setFormTitle={setFormTitle}
                formDescription={formDescription}
                setFormDescription={setFormDescription}
                formCountry={formCountry}
                setFormCountry={(country) => {
                  setFormCountry(country);
                  // تحديث العملة ومفتاح الهاتف تلقائياً عند تغيير البلد
                  if (country === 'MA') {
                    setFormCurrency('MAD');
                    setFormPhonePrefix('+212');
                  } else if (country === 'SA') {
                    setFormCurrency('SAR');
                    setFormPhonePrefix('+966');
                  }
                }}
                formCurrency={formCurrency}
                setFormCurrency={setFormCurrency}
                formPhonePrefix={formPhonePrefix}
                setFormPhonePrefix={setFormPhonePrefix}
                onSave={saveForm}
                isSaving={isSaving}
              />
            </TabsContent>

            <TabsContent value="styling">
              <FormStylingEditor
                formStyle={formStyle}
                onStyleChange={updateFormStyle}
                onSave={saveForm}
                isSaving={isSaving}
              />
            </TabsContent>

            <TabsContent value="shopify">
              <ShopifyIntegration
                formId={formId}
                shopId={shopId || shop || ''}
                onSave={saveForm}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:sticky lg:top-4">
          <FormPreviewPanel
            formId={formId}
            formTitle={formTitle}
            formDescription={formDescription}
            currentStep={currentStep}
            totalSteps={totalSteps}
            formStyle={formStyle}
            fields={fields}
            onPreviousStep={() => setCurrentStep(Math.max(1, currentStep - 1))}
            onNextStep={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
            refreshKey={refreshKey}
            onStyleChange={updateFormStyle}
            formCountry={formCountry}
            formPhonePrefix={formPhonePrefix}
          />
        </div>
      </div>
    </div>
  );
};

export default FormBuilderEditor;
