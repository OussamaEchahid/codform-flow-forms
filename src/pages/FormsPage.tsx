
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useFormFetch } from '@/lib/hooks/form/useFormFetch';
import FormList from '@/components/form/FormList';
import { useI18n } from '@/lib/i18n';

const FormsPage = () => {
  const { language } = useI18n();
  const navigate = useNavigate();
  const { forms, isLoading, fetchForms } = useFormFetch();

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const handleSelectForm = (formId: string) => {
    navigate(`/form-builder/${formId}`);
  };

  const handleCreateNew = () => {
    navigate('/form-builder/new');
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {language === 'ar' ? 'النماذج' : 'Forms'}
        </h1>
        <Button onClick={handleCreateNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {language === 'ar' ? 'إنشاء نموذج جديد' : 'Create New Form'}
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <FormList 
          forms={forms} 
          isLoading={isLoading} 
          onSelectForm={handleSelectForm} 
        />
      </div>
    </div>
  );
};

export default FormsPage;
