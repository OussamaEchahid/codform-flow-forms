
import { supabase } from '@/integrations/supabase/client';
import { FormData } from '@/lib/hooks/useFormTemplates';
import { toast } from 'sonner';

export class FormManagementService {
  private static instance: FormManagementService;
  
  public static getInstance(): FormManagementService {
    if (!FormManagementService.instance) {
      FormManagementService.instance = new FormManagementService();
    }
    return FormManagementService.instance;
  }

  // Helper function for retrying failed requests
  private async fetchWithRetry<T>(
    fetchFn: () => Promise<T>, 
    maxRetries = 3, 
    delay = 1000
  ): Promise<T> {
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fetchFn();
      } catch (error) {
        console.warn(`Attempt ${attempt + 1}/${maxRetries} failed:`, error);
        lastError = error;
        
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
        }
      }
    }
    
    throw lastError;
  }

  // Get current active shop ID
  private getActiveShopId(): string | null {
    return localStorage.getItem('shopify_store');
  }

  // Fetch all forms from database
  async fetchForms(): Promise<FormData[]> {
    const shopId = this.getActiveShopId();
    
    if (!shopId) {
      console.error('No active shop ID found');
      throw new Error('لم يتم العثور على متجر نشط');
    }

    try {
      const { data, error } = await this.fetchWithRetry(async () => {
        return await supabase
          .from('forms')
          .select('*')
          .eq('shop_id', shopId)
          .order('created_at', { ascending: false });
      });
      
      if (error) {
        console.error('Error fetching forms:', error);
        throw new Error('خطأ في جلب النماذج');
      }
      
      // Transform data to match FormData interface
      const formattedData = data.map(form => ({
        ...form,
        isPublished: form.is_published
      }));
      
      // Clear any cached data since we have fresh data
      localStorage.removeItem('cached_forms');
      
      return formattedData;
    } catch (error) {
      console.error('Failed to fetch forms after retries:', error);
      throw error;
    }
  }

  // Publish or unpublish a form
  async toggleFormPublication(formId: string, publish: boolean): Promise<FormData | null> {
    console.log(`🔄 ${publish ? 'نشر' : 'إلغاء نشر'} النموذج:`, formId);
    
    try {
      // Update form in database first
      const { data, error } = await this.fetchWithRetry(async () => {
        return await supabase
          .from('forms')
          .update({ is_published: publish })
          .eq('id', formId)
          .select('*')
          .single();
      });
      
      if (error) {
        console.error('Error updating form publication status:', error);
        throw new Error(publish ? 'خطأ في نشر النموذج' : 'خطأ في إلغاء نشر النموذج');
      }
      
      if (!data) {
        throw new Error('لم يتم العثور على النموذج');
      }
      
      console.log(`✅ تم ${publish ? 'نشر' : 'إلغاء نشر'} النموذج بنجاح في قاعدة البيانات`);
      
      // Transform data
      const updatedForm: FormData = {
        ...data,
        isPublished: data.is_published
      };
      
      toast.success(publish ? 'تم نشر النموذج بنجاح' : 'تم إلغاء نشر النموذج بنجاح');
      
      return updatedForm;
    } catch (error) {
      console.error('Error toggling form publication:', error);
      toast.error(error instanceof Error ? error.message : 'خطأ في تغيير حالة نشر النموذج');
      throw error;
    }
  }

  // Delete a form completely
  async deleteForm(formId: string): Promise<boolean> {
    console.log('🗑️ بدء عملية حذف النموذج:', formId);
    
    try {
      // Step 1: Delete product associations first
      console.log('🔄 حذف ارتباطات المنتجات...');
      try {
        const { error: assocError } = await this.fetchWithRetry(async () => {
          return await supabase
            .from('shopify_product_settings')
            .delete()
            .eq('form_id', formId);
        });
        
        if (assocError) {
          console.warn('Warning removing product associations:', assocError);
          // Continue with form deletion even if this fails
        } else {
          console.log('✅ تم حذف ارتباطات المنتجات');
        }
      } catch (error) {
        console.warn('Failed to remove product associations:', error);
        // Continue with form deletion
      }

      // Step 2: Delete form from database
      console.log('🔄 حذف النموذج من قاعدة البيانات...');
      const { error: formError, data } = await this.fetchWithRetry(async () => {
        return await supabase
          .from('forms')
          .delete()
          .eq('id', formId)
          .select('*');
      });
      
      if (formError) {
        console.error('❌ خطأ في حذف النموذج:', formError);
        throw new Error('خطأ في حذف النموذج من قاعدة البيانات');
      }
      
      if (!data || data.length === 0) {
        throw new Error('النموذج غير موجود أو تم حذفه مسبقاً');
      }
      
      console.log('✅ تم حذف النموذج بنجاح من قاعدة البيانات');
      
      toast.success('تم حذف النموذج بنجاح');
      return true;
    } catch (error) {
      console.error('Error deleting form:', error);
      toast.error(error instanceof Error ? error.message : 'خطأ في حذف النموذج');
      throw error;
    }
  }

  // Save form changes
  async saveForm(formId: string, formData: Partial<FormData>): Promise<FormData | null> {
    try {
      // Convert isPublished to is_published for database
      const dbData: any = { ...formData };
      if (dbData.isPublished !== undefined) {
        dbData.is_published = dbData.isPublished;
        delete dbData.isPublished;
      }
      
      // Update form in Supabase
      const { data, error } = await this.fetchWithRetry(async () => {
        return await supabase
          .from('forms')
          .update(dbData)
          .eq('id', formId)
          .select('*')
          .single();
      });
      
      if (error) {
        console.error('Error updating form:', error);
        throw new Error('خطأ في تحديث النموذج');
      }
      
      if (!data) {
        throw new Error('لم يتم العثور على النموذج');
      }
      
      // Transform data
      const updatedForm: FormData = {
        ...data,
        isPublished: data.is_published
      };
      
      return updatedForm;
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error(error instanceof Error ? error.message : 'خطأ في حفظ النموذج');
      throw error;
    }
  }

  // Load a specific form by ID
  async loadForm(formId: string): Promise<FormData | null> {
    if (!formId || formId === 'new') {
      return null;
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(formId)) {
      console.error(`Invalid UUID format: "${formId}"`);
      throw new Error('معرف النموذج غير صالح');
    }
    
    try {
      const { data, error } = await this.fetchWithRetry(async () => {
        return await supabase
          .from('forms')
          .select('*')
          .eq('id', formId)
          .single();
      });
      
      if (error) {
        console.error('Error loading form:', error);
        throw new Error('خطأ في تحميل النموذج');
      }
      
      if (!data) {
        throw new Error('النموذج غير موجود');
      }
      
      // Format data for form state
      const formData: FormData = {
        ...data,
        isPublished: data.is_published
      };
      
      return formData;
    } catch (error) {
      console.error('Error loading form:', error);
      toast.error(error instanceof Error ? error.message : 'خطأ في تحميل النموذج');
      throw error;
    }
  }
}

export const formManagementService = FormManagementService.getInstance();
