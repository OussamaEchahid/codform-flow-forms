
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { FormData } from '@/lib/hooks/form/types';
import FormListItem from './FormListItem';
import DeleteFormDialog from './DeleteFormDialog';
import EmptyFormList from './EmptyFormList';

// Prevent multiple actions
let isActionInProgress = false;

interface FormListProps {
  forms: FormData[];
  isLoading: boolean;
  onSelectForm: (formId: string) => void;
}

const FormList: React.FC<FormListProps> = ({ forms, isLoading, onSelectForm }) => {
  const [formToDelete, setFormToDelete] = useState<string | null>(null);
  const { publishForm, deleteForm } = useFormTemplates();

  const handlePublishToggle = async (formId: string, currentStatus: boolean) => {
    // Prevent multiple actions
    if (isActionInProgress) {
      return;
    }
    
    isActionInProgress = true;
    try {
      await publishForm(formId, !currentStatus);
    } finally {
      // Reset the flag after a short timeout
      setTimeout(() => {
        isActionInProgress = false;
      }, 1000);
    }
  };

  const handleDelete = async () => {
    // Prevent multiple actions
    if (isActionInProgress || !formToDelete) {
      return;
    }
    
    isActionInProgress = true;
    try {
      await deleteForm(formToDelete);
      setFormToDelete(null);
    } finally {
      // Reset the flag after a short timeout
      setTimeout(() => {
        isActionInProgress = false;
      }, 1000);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show empty state
  if (forms.length === 0) {
    return <EmptyFormList />;
  }

  // Show form list
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {forms.map((form) => (
        <FormListItem 
          key={form.id}
          form={form}
          onSelectForm={onSelectForm}
          onPublishToggle={handlePublishToggle}
          onDeleteRequest={(formId) => setFormToDelete(formId)}
          isActionInProgress={isActionInProgress}
        />
      ))}

      <DeleteFormDialog
        isOpen={!!formToDelete}
        onClose={() => setFormToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default FormList;
