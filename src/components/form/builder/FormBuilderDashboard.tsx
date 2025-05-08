
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import FormTemplatesDialog from '@/components/form/FormTemplatesDialog';
import FormList from '@/components/form/FormList';
import { toast } from 'sonner';

interface FormBuilderDashboardProps {
  initialForms?: any[];
  forceRefresh?: boolean;
}

const FormBuilderDashboard: React.FC<FormBuilderDashboardProps> = ({ 
  initialForms = [],
  forceRefresh = false
}) => {
  const navigate = useNavigate();
  const { language } = useI18n();
  const { forms, isLoading, fetchForms, createFormFromTemplate, createDefaultForm } = useFormTemplates();
  
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [localForms, setLocalForms] = useState(initialForms || []);
  const [hasLoadedForms, setHasLoadedForms] = useState(false);
  const [isCreatingForm, setIsCreatingForm] = useState(false);

  // Fetch forms on component mount
  useEffect(() => {
    const loadForms = async () => {
      try {
        await fetchForms();
        setHasLoadedForms(true);
      } catch (error) {
        console.error("Error loading forms:", error);
        toast.error(
          language === 'ar' ? 'خطأ في تحميل النماذج' : 
          language === 'fr' ? 'Erreur lors du chargement des formulaires' : 
          'Error loading forms'
        );
      }
    };

    // If we have initial forms, use those first, then fetch
    if (initialForms && initialForms.length > 0) {
      setLocalForms(initialForms);
      if (forceRefresh) {
        loadForms();
      }
    } else {
      loadForms();
    }
  }, [forceRefresh]);

  // Update local forms when the forms from hook change
  useEffect(() => {
    if (hasLoadedForms && forms && forms.length > 0) {
      setLocalForms(forms);
    }
  }, [forms, hasLoadedForms]);

  const handleCreateForm = async () => {
    try {
      // Prevent multiple clicks
      if (isCreatingForm) {
        console.log("Form creation already in progress, ignoring click");
        return;
      }
      
      console.log("Starting form creation process...");
      setIsCreatingForm(true);
      toast.loading(
        language === 'ar' ? 'جاري إنشاء نموذج جديد...' : 
        language === 'fr' ? 'Création d\'un nouveau formulaire...' : 
        'Creating new form...'
      );
      
      const newForm = await createDefaultForm();
      console.log("Form creation result:", newForm);
      toast.dismiss();
      
      if (newForm && newForm.id) {
        console.log("Form created successfully, navigating to:", newForm.id);
        // Add a small delay to ensure the store is updated before navigating
        setTimeout(() => {
          navigate(`/form-builder/${newForm.id}`);
        }, 100);
      } else {
        console.error("Form creation failed, no ID returned");
        toast.error(
          language === 'ar' ? 'خطأ في إنشاء نموذج جديد' : 
          language === 'fr' ? 'Erreur lors de la création du formulaire' : 
          'Error creating new form'
        );
        setIsCreatingForm(false);
      }
    } catch (error) {
      console.error("Error creating form:", error);
      toast.dismiss();
      toast.error(
        language === 'ar' ? 'خطأ في إنشاء نموذج جديد' : 
        language === 'fr' ? 'Erreur lors de la création du formulaire' : 
        'Error creating new form'
      );
      setIsCreatingForm(false);
    }
  };

  const handleSelectForm = (formId: string) => {
    console.log("Selecting form:", formId);
    navigate(`/form-builder/${formId}`);
  };

  const handleSelectTemplate = async (templateId: number) => {
    try {
      setIsTemplateDialogOpen(false);
      toast.loading(
        language === 'ar' ? 'جاري إنشاء نموذج من القالب...' : 
        language === 'fr' ? 'Création d\'un formulaire à partir d\'un modèle...' : 
        'Creating form from template...'
      );
      
      console.log("Creating form from template:", templateId);
      const newForm = await createFormFromTemplate(templateId);
      console.log("Template form creation result:", newForm);
      
      toast.dismiss();
      
      if (newForm && newForm.id) {
        console.log("Template form created successfully, navigating to:", newForm.id);
        // Add a small delay to ensure the store is updated before navigating
        setTimeout(() => {
          navigate(`/form-builder/${newForm.id}`);
        }, 100);
      } else {
        console.error("Template form creation failed, no ID returned");
        toast.error(
          language === 'ar' ? 'خطأ في إنشاء نموذج من القالب' : 
          language === 'fr' ? 'Erreur lors de la création du formulaire à partir du modèle' : 
          'Error creating form from template'
        );
      }
    } catch (error) {
      console.error("Error creating form from template:", error);
      toast.dismiss();
      toast.error(
        language === 'ar' ? 'خطأ في إنشاء نموذج من القالب' : 
        language === 'fr' ? 'Erreur lors de la création du formulaire à partir du modèle' : 
        'Error creating form from template'
      );
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {language === 'ar' ? 'النماذج' : 
             language === 'fr' ? 'Formulaires' : 'Forms'}
          </h1>
          <p className="text-gray-500">
            {language === 'ar' ? 'إدارة نماذج الدفع عند الاستلام' : 
             language === 'fr' ? 'Gérer vos formulaires de paiement à la livraison' : 
             'Manage your Cash On Delivery forms'}
          </p>
        </div>
        
        <div className="flex space-x-3 rtl:space-x-reverse">
          <Button 
            variant="outline"
            onClick={() => setIsTemplateDialogOpen(true)}
          >
            {language === 'ar' ? 'استخدام قالب' : 
             language === 'fr' ? 'Utiliser un modèle' : 
             'Use Template'}
          </Button>
          
          <Button 
            onClick={handleCreateForm} 
            disabled={isLoading || isCreatingForm}
          >
            <Plus className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {language === 'ar' ? 'إنشاء نموذج جديد' : 
             language === 'fr' ? 'Créer un nouveau formulaire' : 
             'Create New Form'}
          </Button>
        </div>
      </div>
      
      <FormList 
        forms={localForms} 
        isLoading={isLoading && !localForms.length} 
        onSelectForm={handleSelectForm}
      />
      
      <FormTemplatesDialog
        open={isTemplateDialogOpen}
        onSelect={handleSelectTemplate}
        onClose={() => setIsTemplateDialogOpen(false)}
      />
    </div>
  );
};

export default FormBuilderDashboard;
