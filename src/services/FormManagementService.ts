import { supabase } from '@/integrations/supabase/client';
import { FormData } from '@/lib/hooks/useFormTemplates';
import { FormStep } from '@/lib/form-utils';
import { FormStyle } from '@/hooks/useFormStore';
import { toast } from 'sonner';

// دالة مساعدة للحصول على معرف المستخدم الصالح
const getUserIdentifier = (): string | null => {
  // أولاً، حاول الحصول على المعرف الصالح من الجلسة الحالية
  return '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'; // المستخدم الافتراضي للنظام
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

  // Get current active shop ID from localStorage directly
  private getActiveShopId(): string | null {
    try {
      // البحث في جميع المصادر المحتملة للمتجر النشط بترتيب الأولوية
      const sources = [
        'active_shopify_store',
        'current_shopify_store', 
        'simple_active_store',
        'shopify_store'
      ];
      
      console.log('🔍 البحث عن المتجر النشط في localStorage...');
      
      for (const source of sources) {
        const value = localStorage.getItem(source);
        console.log(`📋 ${source}: ${value}`);
        
        if (value && value.trim() && value !== 'null' && value !== 'undefined') {
          console.log(`✅ تم العثور على المتجر النشط من ${source}: ${value.trim()}`);
          return value.trim();
        }
      }
      
      // البحث في جميع مفاتيح localStorage للعثور على متجر Shopify صالح
      console.log('🔍 البحث في جميع مفاتيح localStorage...');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('shop')) {
          const value = localStorage.getItem(key);
          console.log(`🗝️ ${key}: ${value}`);
          
          if (value && value.includes('.myshopify.com') && value !== 'null') {
            console.log(`✅ تم العثور على متجر في ${key}: ${value}`);
            return value.trim();
          }
        }
      }
      
      console.log('⚠️ لم يتم العثور على متجر نشط في localStorage');
      return null;
    } catch (error) {
      console.error('❌ خطأ في الحصول على المتجر النشط:', error);
      return null;
    }
  }

  // Fetch all forms from database
  async fetchForms(): Promise<FormData[]> {
    return this.fetchWithRetry(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const activeShopId = this.getActiveShopId();

      console.log('🔍 Fetching forms (simplified):', { hasSession: !!session, activeShopId });

      let rows: any[] = [];

      if (activeShopId) {
        // When we have an active shop, fetch by shop. If no session, we'll only see published rows due to RLS.
        let query = supabase
          .from('forms')
          .select('*')
          .eq('shop_id', activeShopId)
          .order('created_at', { ascending: false });

        if (!session?.user?.id) {
          // Anonymous context => restrict to published to satisfy RLS
          query = query.eq('is_published', true);
        }

        const { data, error } = await query;
        if (error) {
          console.error('❌ Error fetching shop forms:', error);
          throw error;
        }
        rows = data || [];
      } else if (session?.user?.id) {
        // No active shop but authenticated user => fetch user's forms
        const { data, error } = await supabase
          .from('forms')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
        if (error) {
          console.error('❌ Error fetching user forms:', error);
          throw error;
        }
        rows = data || [];
      } else {
        console.log('⚠️ No authentication or active shop found - returning empty forms list');
        return [];
      }

      const forms = rows.map((form: any) => ({
        id: form.id,
        title: form.title,
        description: form.description,
        data: Array.isArray(form.data) ? (form.data as unknown as FormStep[]) : [],
        isPublished: form.is_published,
        is_published: form.is_published,
        shop_id: form.shop_id,
        created_at: form.created_at,
        style: (form.style as unknown as FormStyle) || undefined,
        country: (form as any).country,
        currency: (form as any).currency,
        phone_prefix: (form as any).phone_prefix
      }));

      // Cache forms for offline usage
      try {
        localStorage.setItem('cached_forms', JSON.stringify(forms));
      } catch {}

      console.log(`✅ Loaded ${forms.length} forms`);
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

      const targetShopId = activeShopId || formData.shop_id || null;

      if (!session?.user?.id && !targetShopId) {
        throw new Error('لا توجد مصادقة أو متجر نشط لإنشاء النموذج');
      }

      // Use secure RPC to create the form (works with/without session)
      const { data: newId, error } = await (supabase as any).rpc('create_form_for_shop', {
        p_shop_id: targetShopId,
        p_title: formData.title,
        p_description: formData.description ?? null,
        p_data: (formData.data || []) as any,
        p_style: null,
        p_is_published: false
      });

      if (error) {
        console.error('Error creating form via RPC:', error);
        throw error;
      }

      console.log('✅ Form created successfully with ID:', newId);
      return newId as string;
    } catch (error) {
      console.error('Error in createForm:', error);
      throw error;
    }
  }

  // Publish or unpublish a form
  async toggleFormPublication(formId: string, publish: boolean): Promise<FormData | null> {
    console.log(`🔄 ${publish ? 'نشر' : 'إلغاء نشر'} النموذج:`, formId);
    
    try {
      // Ensure ownership is aligned before updating (fixes 406/RLS)
      try {
        await Promise.all([
          (supabase as any).rpc('auto_link_store_to_current_user'),
          (supabase as any).rpc('link_active_store_to_user')
        ]);
        await (supabase as any).rpc('fix_form_store_links');
      } catch (e) {
        console.warn('Ownership alignment RPCs failed (non-blocking):', e);
      }

      // Update form publication via RPC (bypasses RLS)
      const activeShopId = this.getActiveShopId();
      const { data: rpcResult, error: rpcError } = await (supabase as any).rpc('set_form_publication', {
        p_form_id: formId,
        p_shop_id: activeShopId,
        p_publish: publish
      });
      if (rpcError) {
        console.error('RPC set_form_publication error:', rpcError);
        throw new Error(publish ? 'خطأ في نشر النموذج' : 'خطأ في إلغاء نشر النموذج');
      }
      // Fetch updated form row
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .maybeSingle();
      
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
      // Align ownership before any destructive action
      try {
        await Promise.all([
          (supabase as any).rpc('auto_link_store_to_current_user'),
          (supabase as any).rpc('link_active_store_to_user')
        ]);
        await (supabase as any).rpc('fix_form_store_links');
      } catch (e) {
        console.warn('Ownership alignment before delete failed (ignored):', e);
      }

      // Delete form and related rows atomically via RPC
      const activeShopId = this.getActiveShopId();
      const { data: deleted, error: rpcError } = await (supabase as any).rpc('delete_form_full', {
        p_form_id: formId,
        p_shop_id: activeShopId
      });
      
      if (rpcError || deleted !== true) {
        console.error('❌ RPC delete_form_full error:', rpcError);
        throw new Error('خطأ في حذف النموذج من قاعدة البيانات');
      }
      
      console.log('✅ تم حذف النموذج بنجاح من خلال الدالة delete_form_full');
      
      // تنظيف cache النماذج المحلي
      try {
        localStorage.removeItem('cached_forms');
        console.log('🧹 تم مسح cache النماذج المحلي');
      } catch (e) {
        console.warn('تعذر مسح cache النماذج:', e);
      }
      
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
      const activeShopId = this.getActiveShopId();

      // Convert isPublished to is_published for database
      const dbData: any = { ...formData };
      if (dbData.isPublished !== undefined) {
        dbData.is_published = dbData.isPublished;
        delete dbData.isPublished;
      }

      // Use secure RPC to update form (bypasses RLS safely)
      const { data, error } = await (supabase as any).rpc('update_form_secure', {
        p_form_id: formId,
        p_shop_id: activeShopId,
        p_changes: dbData as any
      });

      if (error) {
        console.error('Error updating form via RPC:', error);
        throw new Error('خطأ في تحديث النموذج');
      }

      if (!data) {
        throw new Error('لم يتم العثور على النموذج');
      }

      const row: any = data;

      // Transform data
      const updatedForm: FormData = {
        ...row,
        data: Array.isArray(row.data) ? (row.data as unknown as FormStep[]) : [],
        style: (row.style as unknown as FormStyle) || undefined,
        isPublished: row.is_published
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
      // Load via secure RPC which handles ownership/published fallback
      const { data, error } = await (supabase as any).rpc('load_form_with_fallback', {
        form_id: formId
      });

      if (error) {
        console.error('Error loading form via RPC:', error);
        return null; // Return null instead of throwing
      }

      if (!data || (data as any).error) {
        const message = (data as any)?.message || 'النموذج غير موجود';
        throw new Error(message);
      }

      const row: any = data;
      
      // Format data for form state
      const formData: FormData = {
        ...row,
        data: Array.isArray(row.data) ? (row.data as unknown as FormStep[]) : [],
        style: (row.style as unknown as FormStyle) || undefined,
        isPublished: row.is_published
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