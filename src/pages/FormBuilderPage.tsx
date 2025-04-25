
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import FormBuilder from '@/components/form/FormBuilder';
import FormList from '@/components/form/FormList';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFormTemplates, FormData } from '@/lib/hooks/useFormTemplates';
import { FormStep } from '@/lib/form-utils';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

const FormBuilderPage = () => {
  const { formId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(formId ? 'editor' : 'dashboard');
  const [currentForm, setCurrentForm] = useState<FormData | null>(null);
  const [isLoading, setIsLoading] = useState(formId ? true : false);
  
  const {
    forms,
    isLoading: areFormsLoading,
    fetchForms,
    createDefaultForm
  } = useFormTemplates();

  // جلب تفاصيل النموذج الحالي إذا كان هناك معرف للنموذج
  useEffect(() => {
    const fetchFormDetails = async () => {
      if (formId && user) {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('forms')
          .select('*')
          .eq('id', formId)
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching form details:', error);
          navigate('/form-builder');
          return;
        }
        
        // Transform the database data to match FormData type
        const formattedData: FormData = {
          ...data,
          data: data.data as unknown as FormStep[]
        };
        
        setCurrentForm(formattedData);
        setActiveTab('editor');
        setIsLoading(false);
      } else {
        setCurrentForm(null);
        if (!formId) {
          setActiveTab('dashboard');
        }
      }
    };

    fetchFormDetails();
  }, [formId, user, navigate]);
  
  // إنشاء نموذج افتراضي إذا لم يكن هناك نماذج
  useEffect(() => {
    const initializeDefaultForm = async () => {
      if (forms.length === 0 && !areFormsLoading && !formId && user) {
        const newForm = await createDefaultForm();
        if (newForm) {
          await fetchForms();
        }
      }
    };

    initializeDefaultForm();
  }, [forms, areFormsLoading, formId, user, createDefaultForm, fetchForms]);

  const handleSelectForm = (selectedFormId: string) => {
    navigate(`/form-builder/${selectedFormId}`);
  };

  const handleCreateNewForm = async () => {
    const newForm = await createDefaultForm();
    if (newForm) {
      navigate(`/form-builder/${newForm.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex-grow flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-gray-500" />
            <p className="mt-4 text-gray-600">جاري التحميل...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex-grow">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="dashboard" onClick={() => navigate('/form-builder')}>لوحة التحكم</TabsTrigger>
              {currentForm && (
                <TabsTrigger value="editor">تعديل النموذج</TabsTrigger>
              )}
            </TabsList>
            
            <div>
              {activeTab === 'dashboard' && (
                <Button onClick={handleCreateNewForm}>إنشاء نموذج جديد</Button>
              )}
            </div>
          </div>
          
          <TabsContent value="dashboard">
            <div className="mb-6 text-right">
              <h1 className="text-3xl font-bold">لوحة التحكم</h1>
              <p className="text-gray-600">قم بإدارة وتخصيص نماذج الطلب الخاصة بك للدفع عند الاستلام</p>
            </div>
            <FormList 
              forms={forms} 
              isLoading={areFormsLoading} 
              onSelectForm={handleSelectForm} 
            />
          </TabsContent>
          
          <TabsContent value="editor">
            {currentForm && (
              <>
                <div className="mb-8 text-right">
                  <h1 className="text-3xl font-bold">منشئ النماذج</h1>
                  <p className="text-gray-600">قم بإنشاء وتخصيص نماذج الطلب الخاصة بك للدفع عند الاستلام</p>
                </div>
                <FormBuilder initialFormData={currentForm} />
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default FormBuilderPage;
