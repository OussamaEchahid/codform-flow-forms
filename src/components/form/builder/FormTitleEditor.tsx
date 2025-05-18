
import React from 'react';
import { FormField } from '@/lib/form-utils';

interface FormTitleEditorProps {
  formTitle: string;
  formDescription: string;
  onFormTitleChange: (title: string) => void;
  onFormDescriptionChange: (description: string) => void;
  onAddTitleField: () => void;
  formTitleField: FormField | undefined;
  onUpdateTitleField: (field: FormField) => void;
  isDraggable?: boolean;
}

// This component has been completely disabled and will not render anything
const FormTitleEditor: React.FC<FormTitleEditorProps> = () => {
  return null;
};

export default FormTitleEditor;
