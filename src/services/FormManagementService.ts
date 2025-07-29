import { supabase } from '@/integrations/supabase/client';
import { FormData } from '@/lib/hooks/useFormTemplates';
import { FormStep } from '@/lib/form-utils';
import { FormStyle } from '@/hooks/useFormStore';
import { toast } from 'sonner';

// دالة مساعدة للحصول على معرف المستخدم
const getUserIdentifier = () => {
  const activeStore = localStorage.getItem('current_shopify_store') || 
                     localStorage.getItem('shopify_store');
  const userEmail = localStorage.getItem('shopify_user_email');
  
  // في حالة Shopify، استخدم اسم المتجر كمعرف المستخدم
  return activeStore || userEmail || null;
};

// دالة للتحقق من وجود مصادقة صالحة
const isUserAuthenticated = () => {
  return !!getUserIdentifier();
};

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
    // Try multiple sources for the shop ID with better logging
    const sources = [
      'current_shopify_store',
      'simple_active_store',
      'shopify_store', 
      'active_shop'
    ];
    
    console.log('🔍 Checking localStorage for shop ID...');
    
    for (const source of sources) {
      const shopId = localStorage.getItem(source);
      if (shopId && shopId !== 'null' && shopId.trim() !== '') {
        console.log(`📍 Using active shop ID from ${source}: ${shopId}`);
        return shopId;
      }
    }
    
    return null;
  }

  // Fetch all forms from database
  async fetchForms(): Promise<FormData[]> {
    return this.fetchWithRetry(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const activeShopId = this.getActiveShopId();
      
      console.log('🔍 Fetching forms with context:', {
        hasSession: !!session,
        traditionalUserId: session?.user?.id,
        activeShopId,
        isAuthenticated: isUserAuthenticated(),
        timestamp: new Date().toISOString()
      });

      let query = supabase
        .from('forms')
        .select('*')
        .order('created_at', { ascending: false });

      if (session?.user?.id && activeShopId) {
        // User has both traditional auth AND active shop - get forms for both
        console.log(`🔄 Using hybrid auth - user_id: ${session.user.id} OR shop_id: ${activeShopId}`);
        query = query.or(`user_id.eq.${session.user.id},shop_id.eq.${activeShopId}`);
      } else if (session?.user?.id) {
        // Traditional authentication only - filter by user_id
        console.log(`🔑 Using traditional auth only - filtering by user_id: ${session.user.id}`);
        query = query.eq('user_id', session.user.id);
      } else if (activeShopId) {
        // Shopify authentication only - use default user with shop_id
        console.log(`🏪 Using Shopify auth only - default user with shop_id: ${activeShopId}`);
        query = query.eq('user_id', '36d7eb85-0c45-4b4f-bea1-a9cb732ca893').eq('shop_id', activeShopId);
      } else {
        console.log('⚠️ No authentication found - returning empty forms list');
        return [];
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching forms:', error);
        throw error;
      }

      const forms = (data || []).map(form => ({
        id: form.id,
        title: form.title,
        description: form.description,
        data: Array.isArray(form.data) ? form.data as unknown as FormStep[] : [],
        isPublished: form.is_published,
        is_published: form.is_published,
        shop_id: form.shop_id,
        created_at: form.created_at,
        style: (form.style as unknown as FormStyle) || undefined,
        country: (form as any).country,
        currency: (form as any).currency,
        phone_prefix: (form as any).phone_prefix
      }));

      const userIdentifierForLog = session?.user?.id || activeShopId || 'unknown';
      console.log(`✅ Successfully fetched ${forms.length} forms for user: ${userIdentifierForLog}`);
      
      // Cache forms for offline usage
      try {
        localStorage.setItem('cached_forms', JSON.stringify(forms));
      } catch (e) {
        console.warn('Failed to cache forms:', e);
      }

      return forms;
    });
  }

  // Create a new form
  async createForm(formData: {
    title: string;
    description?: string;
    data?: FormStep[];
    shop_id?: string;
  }): Promise<string> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const activeShopId = this.getActiveShopId();
      
      // Determine user identifier based on auth type
      let userIdForForm: string;
      let shopIdForForm: string | null = null;
      
      if (session?.user?.id && activeShopId) {
        // User has traditional auth AND active shop - use both
        userIdForForm = session.user.id;
        shopIdForForm = activeShopId;
        console.log('🔄 Creating form with traditional auth + shop:', { userId: userIdForForm, shopId: shopIdForForm });
      } else if (session?.user?.id) {
        // Traditional authentication only
        userIdForForm = session.user.id;
        shopIdForForm = null;
        console.log('🔑 Creating form with traditional auth only:', { userId: userIdForForm });
      } else if (activeShopId) {
        // Shopify authentication only - use default user ID but set shop_id
        userIdForForm = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893';
        shopIdForForm = activeShopId;
        console.log('🏪 Creating form with Shopify auth only:', { shopId: shopIdForForm });
      } else {
        throw new Error('No user authentication found');
      }

      const { data, error } = await supabase.from('forms').insert({
        title: formData.title,
        description: formData.description,
        data: (formData.data || []) as any,
        shop_id: shopIdForForm || formData.shop_id,
        user_id: userIdForForm,
        is_published: false
      }).select('id').single();

      if (error) {
        console.error('Error creating form:', error);
        throw error;
      }

      console.log('✅ Form created successfully with ID:', data.id);
      return data.id;
    } catch (error) {
      console.error('Error in createForm:', error);
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
        data: Array.isArray(data.data) ? data.data as unknown as FormStep[] : [],
        style: (data.style as unknown as FormStyle) || undefined,
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
        data: Array.isArray(data.data) ? data.data as unknown as FormStep[] : [],
        style: (data.style as unknown as FormStyle) || undefined,
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
      const { data: { session } } = await supabase.auth.getSession();
      const activeShopId = this.getActiveShopId();
      
      let query = supabase
        .from('forms')
        .select('*')
        .eq('id', formId);
      
      // Add proper filters based on auth type
      if (session?.user?.id) {
        query = query.eq('user_id', session.user.id);
      } else {
        // For Shopify stores, use default user
        query = query.eq('user_id', '36d7eb85-0c45-4b4f-bea1-a9cb732ca893');
      }
      
      const { data, error } = await this.fetchWithRetry(async () => {
        return await query.maybeSingle(); // Use maybeSingle instead of single
      });
      
      if (error) {
        console.error('Error loading form:', error);
        return null; // Return null instead of throwing
      }
      
      if (!data) {
        throw new Error('النموذج غير موجود');
      }
      
      // Format data for form state
      const formData: FormData = {
        ...data,
        data: Array.isArray(data.data) ? data.data as unknown as FormStep[] : [],
        style: (data.style as unknown as FormStyle) || undefined,
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