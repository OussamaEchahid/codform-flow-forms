
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { useShopify } from '@/hooks/useShopify';
import { useI18n } from '@/lib/i18n';
import { ArrowLeft, Save } from 'lucide-react';
import FormBuilderShopify from './FormBuilderShopify';
import { ShopifyFormData } from '@/lib/shopify/types';
import FormBuilder from '@/components/form/FormBuilder';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

// مساعد لضمان عدم إهدار الموارد بكثرة التحديثات
const useDebounce = <T,>(value: T, delay: number = 500): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

const FormBuilderEditor: React.FC<{ formId?: string | 'new' }> = ({ formId = 'new' }) => {
  const { language } = useI18n();
  const navigate = useNavigate();
  const params = useParams();
  const resolvedFormId = formId !== 'new' ? formId : (params.formId === 'new' ? 'new' : params.formId);
  
  const { getFormById, saveForm, createNewForm } = useFormTemplates();
  const { syncFormWithShopify, isSyncing } = useShopify();
  
  // حالة النموذج
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [formData, setFormData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isNewForm, setIsNewForm] = useState(false);
  const [renderKey, setRenderKey] = useState<number>(Date.now());
  
  // متغيرات مرجعية للتتبع
  const hasLoadedRef = useRef(false);
  const formDataRef = useRef(formData);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // تأخير تحديثات FormData لمنع التحديثات المفرطة
  const debouncedFormData = useDebounce(formData, 300);
  
  // تتبع التغييرات في بيانات النموذج
  useEffect(() => {
    formDataRef.current = debouncedFormData;
    if (hasLoadedRef.current) {
      setIsDirty(true);
    }
    
    // حفظ تلقائي إلى التخزين المحلي بعد التغييرات
    if (resolvedFormId) {
      try {
        localStorage.setItem(`form_draft_${resolvedFormId}`, JSON.stringify({
          title,
          description, 
          data: debouncedFormData,
          lastModified: new Date().toISOString()
        }));
      } catch (err) {
        console.error('خطأ في حفظ مسودة النموذج في التخزين المحلي:', err);
      }
    }
  }, [debouncedFormData, title, description, resolvedFormId]);

  // تحميل بيانات النموذج عند بدء التشغيل
  useEffect(() => {
    const loadForm = async () => {
      setIsLoading(true);
      setSaveError(null);
      
      try {
        // معالجة حالة النموذج الجديد
        if (resolvedFormId === 'new') {
          console.log('FormBuilderEditor: إنشاء نموذج جديد');
          setIsNewForm(true);
          setTitle(language === 'ar' ? 'نموذج جديد' : 'New Form');
          setDescription('');
          setFormData([]);
        } 
        // تحميل نموذج موجود
        else if (resolvedFormId) {
          console.log(`FormBuilderEditor: تحميل النموذج ${resolvedFormId}`);
          const form = await getFormById(resolvedFormId);
          
          if (!form) {
            toast.error(language === 'ar' ? 'لم يتم العثور على النموذج' : 'Form not found');
            navigate('/forms', { replace: true });
            return;
          }
          
          setIsNewForm(false);
          setTitle(form.title || '');
          setDescription(form.description || '');
          setFormData(Array.isArray(form.data) ? form.data : []);
        } 
        // حالة خطأ - عدم وجود معرف للنموذج
        else {
          console.error('FormBuilderEditor: لم يتم توفير معرف النموذج');
          toast.error(language === 'ar' ? 'خطأ في تحميل النموذج' : 'Error loading form');
          navigate('/forms', { replace: true });
        }
      } catch (error) {
        console.error('خطأ في تحميل النموذج:', error);
        setSaveError(language === 'ar' 
          ? 'خطأ في تحميل النموذج' 
          : 'Error loading form');
        
        // محاولة التحميل من التخزين المحلي كنسخة احتياطية
        try {
          const cachedForm = localStorage.getItem(`form_${resolvedFormId}`);
          if (cachedForm) {
            const parsedForm = JSON.parse(cachedForm);
            setTitle(parsedForm.title || '');
            setDescription(parsedForm.description || '');
            setFormData(Array.isArray(parsedForm.data) ? parsedForm.data : []);
            
            toast.info(language === 'ar'
              ? 'تم استخدام بيانات محلية نظرًا لمشكلة في الاتصال'
              : 'Using local data due to connection issue');
          } else {
            // نموذج فارغ افتراضي
            setTitle(language === 'ar' ? 'نموذج جديد' : 'New Form');
            setDescription('');
            setFormData([]);
          }
        } catch (localError) {
          console.error('خطأ في التحميل من التخزين المحلي:', localError);
        }
      } finally {
        setIsLoading(false);
        setIsDirty(false); // إعادة تعيين حالة التعديل بعد التحميل
        setRenderKey(Date.now()); // فرض إعادة العرض بمفتاح جديد
        hasLoadedRef.current = true;
      }
    };

    loadForm();
  }, [resolvedFormId, getFormById, navigate, language]);

  // معالجة تغييرات منشئ النموذج - استخدام useCallback لتحسين الأداء
  const handleFormDataChange = useCallback((newFormData: any[]) => {
    setFormData(newFormData);
  }, []);

  // حفظ النموذج
  const handleSave = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      let savedForm;
      
      // التحقق من القيم المطلوبة
      if (!title.trim()) {
        toast.error(language === 'ar' ? 'عنوان النموذج مطلوب' : 'Form title is required');
        setIsSaving(false);
        return;
      }
      
      const formToSave = {
        title,
        description,
        data: formData,
      };

      // إنشاء نموذج جديد أو تحديث نموذج موجود
      if (isNewForm) {
        console.log('FormBuilderEditor: إنشاء نموذج جديد', formToSave);
        savedForm = await createNewForm(formToSave);
        
        if (savedForm) {
          toast.success(language === 'ar' 
            ? 'تم إنشاء النموذج بنجاح' 
            : 'Form created successfully');
          
          // الانتقال إلى النموذج الجديد
          navigate(`/form-builder/${savedForm.id}`, { replace: true });
          setIsNewForm(false);
        } else {
          throw new Error('فشل في إنشاء النموذج');
        }
      } 
      // تحديث النموذج الموجود
      else if (resolvedFormId && resolvedFormId !== 'new') {
        console.log(`FormBuilderEditor: تحديث النموذج ${resolvedFormId}`, formToSave);
        savedForm = await saveForm(resolvedFormId, formToSave);
        
        if (savedForm) {
          toast.success(language === 'ar' 
            ? 'تم حفظ النموذج بنجاح' 
            : 'Form saved successfully');
        } else {
          throw new Error('فشل في تحديث النموذج');
        }
      }
      
      // تحديث التخزين المؤقت المحلي
      try {
        if (savedForm) {
          localStorage.setItem(`form_${savedForm.id}`, JSON.stringify(savedForm));
          // حذف المسودة بعد الحفظ بنجاح
          localStorage.removeItem(`form_draft_${resolvedFormId}`);
        }
      } catch (cacheError) {
        console.error('خطأ في تحديث التخزين المحلي:', cacheError);
      }
      
      setIsDirty(false); // إعادة تعيين حالة التعديل بعد الحفظ
    } catch (error) {
      console.error('خطأ في حفظ النموذج:', error);
      setSaveError(language === 'ar' 
        ? 'خطأ في حفظ النموذج' 
        : 'Error saving form');
      
      toast.error(language === 'ar' 
        ? 'حدث خطأ أثناء حفظ النموذج' 
        : 'Error saving form');
      
      // محاولة الحفظ في التخزين المحلي في حالة فشل الحفظ على الخادم
      try {
        localStorage.setItem(`form_draft_${resolvedFormId || 'new'}`, JSON.stringify({
          title,
          description,
          data: formData,
          lastModified: new Date().toISOString()
        }));
        
        toast.info(language === 'ar'
          ? 'تم حفظ النموذج محليًا كنسخة احتياطية'
          : 'Form saved locally as backup');
      } catch (localError) {
        console.error('خطأ في الحفظ إلى التخزين المحلي:', localError);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // إدارة تكامل Shopify - منع الاستدعاءات المتكررة باستخدام useCallback
  const handleShopifyIntegration = useCallback(async (settings: ShopifyFormData) => {
    try {
      if (resolvedFormId === 'new') {
        toast.error(language === 'ar' 
          ? 'يرجى حفظ النموذج أولاً قبل تكوين تكامل Shopify' 
          : 'Please save the form first before configuring Shopify integration');
        return;
      }
      
      await syncFormWithShopify({
        ...settings,
        form_id: resolvedFormId
      });
      
      toast.success(language === 'ar' 
        ? 'تم تكوين تكامل Shopify بنجاح' 
        : 'Shopify integration configured successfully');
    } catch (error) {
      console.error('خطأ في تكوين تكامل Shopify:', error);
      toast.error(language === 'ar' 
        ? 'خطأ في تكوين تكامل Shopify' 
        : 'Error configuring Shopify integration');
    }
  }, [syncFormWithShopify, resolvedFormId, language]);

  // عرض حالة التحميل
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6" key={renderKey}>
      {/* رأس الصفحة مع أزرار الإجراءات */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/forms')}
            className="mr-3"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {language === 'ar' ? 'العودة' : 'Back'}
          </Button>
          <h1 className="text-2xl font-bold">
            {isNewForm 
              ? (language === 'ar' ? 'إنشاء نموذج جديد' : 'Create New Form') 
              : (language === 'ar' ? 'تعديل النموذج' : 'Edit Form')}
          </h1>
        </div>
        
        <Button 
          onClick={handleSave}
          disabled={isSaving || (!isDirty && !isNewForm)}
          className="flex items-center"
        >
          {isSaving ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
            </div>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'حفظ النموذج' : 'Save Form'}
            </>
          )}
        </Button>
      </div>
      
      {/* عرض الخطأ إذا كان موجودًا */}
      {saveError && (
        <Alert className="bg-red-50 border-red-300 mb-4">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-600">
            {saveError}
          </AlertDescription>
        </Alert>
      )}
      
      {/* تعديل النموذج */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* المحتوى الرئيسي - منشئ النماذج وإعدادات النموذج */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border p-4 shadow-sm">
            <h2 className="text-lg font-medium mb-4">{language === 'ar' ? 'تفاصيل النموذج' : 'Form Details'}</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'ar' ? 'عنوان النموذج' : 'Form Title'}*
                </label>
                <Input 
                  id="title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder={language === 'ar' ? 'أدخل عنوان النموذج' : 'Enter form title'}
                  className="w-full"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'ar' ? 'وصف النموذج' : 'Form Description'}
                </label>
                <Textarea 
                  id="description"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder={language === 'ar' ? 'أدخل وصفاً مختصراً للنموذج (اختياري)' : 'Enter a brief description (optional)'}
                  className="w-full"
                  rows={3}
                />
              </div>
            </div>
          </div>
          
          {/* منشئ النموذج */}
          <div className="bg-white rounded-lg border p-4 shadow-sm">
            <h2 className="text-lg font-medium mb-4">{language === 'ar' ? 'محتوى النموذج' : 'Form Content'}</h2>
            
            <FormBuilder 
              formData={formData}
              onChange={handleFormDataChange}
            />
          </div>
        </div>
        
        {/* الشريط الجانبي - التكاملات والإعدادات */}
        <div className="space-y-6">
          {/* تكامل Shopify */}
          <div className="bg-white rounded-lg border p-4 shadow-sm">
            <h2 className="text-lg font-medium mb-4">{language === 'ar' ? 'تكاملات' : 'Integrations'}</h2>
            
            <FormBuilderShopify 
              onShopifyIntegration={handleShopifyIntegration}
              isSyncing={isSyncing}
              formId={resolvedFormId !== 'new' ? resolvedFormId : null}
            />
          </div>
          
          {/* إعدادات النموذج - يمكن إضافة المزيد هنا */}
          <div className="bg-white rounded-lg border p-4 shadow-sm">
            <h2 className="text-lg font-medium mb-4">{language === 'ar' ? 'إعدادات النموذج' : 'Form Settings'}</h2>
            
            <div className="text-sm text-gray-600">
              {language === 'ar' 
                ? 'ستتمكن من تخصيص المزيد من الإعدادات بعد حفظ النموذج.' 
                : 'You will be able to customize more settings after saving the form.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormBuilderEditor;
