// مساعد المصادقة وإدارة المستخدمين المبسط
import { supabase } from '@/integrations/supabase/client';

export class AuthHelper {
  // المستخدم الافتراضي للنظام (fallback فقط)
  private static readonly DEFAULT_USER_ID = 'a7a96524-0208-441b-845b-5e30640d003d';
  private static readonly CACHE_KEY = 'last_authenticated_user_id';

  /**
   * نسخة متوافقة متزامنة - تحاول استخدام آخر معرف مستخدم معروف من localStorage
   * ثم fallback إلى DEFAULT_USER_ID إذا لم يتوفر.
   */
  static getCurrentUserId(): string {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached && cached !== 'null' && cached.length > 10) {
        return cached;
      }
      return this.DEFAULT_USER_ID;
    } catch (_) {
      return this.DEFAULT_USER_ID;
    }
  }

  /**
   * النسخة الموثوقة (مفضلة): تجلب session من Supabase بشكل صحيح وتحدّث الكاش.
   */
  static async getCurrentUserIdAsync(): Promise<string> {
    try {
      const { data } = await supabase.auth.getUser();
      const userId = data?.user?.id;
      if (userId) {
        try { localStorage.setItem(this.CACHE_KEY, userId); } catch (_) {}
        return userId;
      }
      // fallback إلى آخر قيمة مخزنة
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached && cached !== 'null' && cached.length > 10) return cached;
      return this.DEFAULT_USER_ID;
    } catch (error) {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached && cached !== 'null' && cached.length > 10) return cached;
      return this.DEFAULT_USER_ID;
    }
  }

  /**
   * إنشاء بيانات الإدراج الصحيحة
   */
  static getInsertData(additionalData: any = {}) {
    const userId = this.getCurrentUserId();
    return {
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...additionalData
    };
  }

  /**
   * الحصول على معايير الاستعلام
   */
  static getQueryFilters() {
    const userId = this.getCurrentUserId();
    return { user_id: userId };
  }

  /**
   * معلومات التشخيص
   */
  static getDiagnosticInfo() {
    const cached = (() => { try { return localStorage.getItem(this.CACHE_KEY); } catch(_) { return null; } })();
    return {
      currentUserId: cached || this.DEFAULT_USER_ID,
      defaultUserId: this.DEFAULT_USER_ID,
      userEmail: ((): string | null => { try { return localStorage.getItem('shopify_user_email'); } catch(_) { return null; } })(),
      isUsingDefault: (cached || this.DEFAULT_USER_ID) === this.DEFAULT_USER_ID
    };
  }
}

// دعم التصدير الافتراضي مع بقاء التصدير المسمّى من تعريف الصنف أعلاه
export default AuthHelper;