
import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FormData } from '@/lib/hooks/form/types';

// FormCrud hook to perform CRUD operations on forms
export const useFormCrud = () => {
  const publishForm = async (formId: string, isPublished: boolean) => {
    try {
      const { data, error } = await supabase
        .from('forms')
        .update({ is_published: isPublished })
        .eq('id', formId)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      toast.success(
        isPublished 
          ? 'Form published successfully' 
          : 'Form unpublished successfully'
      );
      
      return data;
    } catch (error) {
      console.error('Error updating form publish status:', error);
      toast.error('Failed to update form status');
      throw error;
    }
  };
  
  const deleteForm = async (formId: string) => {
    try {
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', formId);
      
      if (error) {
        throw error;
      }
      
      toast.success('Form deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting form:', error);
      toast.error('Failed to delete form');
      throw error;
    }
  };
  
  return {
    publishForm,
    deleteForm
  };
};
