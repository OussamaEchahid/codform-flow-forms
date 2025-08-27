// مساعد المصادقة وإدارة المستخدمين المبسط
import { supabase } from '@/integrations/supabase/client';

export class AuthHelper {
  // المستخدم الافتراضي للنظام (fallback فقط)
  private static readonly DEFAULT_USER_ID = 'a7a96524-0208-441b-845b-5e30640d003d';
  private static readonly CACHE_KEY = 'last_authenticated_user_id';
  private static isStrictEnabled() {
    try {
      // Prefer explicit env flag if provided
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const v: any = (typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined);
      const raw = v?.VITE_STRICT_AUTH_HELPER ?? (typeof process !== 'undefined' ? process.env?.VITE_STRICT_AUTH_HELPER : undefined);
      if (typeof raw !== 'undefined') return String(raw).toLowerCase() === 'true';
      // Default behavior: STRICT in non-development builds
      const mode = v?.MODE ?? (typeof process !== 'undefined' ? process.env?.NODE_ENV : 'production');
      return String(mode).toLowerCase() !== 'development';
    } catch {
      // Fail closed (strict) on any error
      return true;
    }
  }

  /**
   * نسخة متوافقة متزامنة - تحاول استخدام آخر معرف مستخدم معروف من localStorage
   * ثم fallback إلى DEFAULT_USER_ID إذا لم يتوفر.
   */
  static getCurrentUserId(): string | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached && cached !== 'null' && cached.length > 10) return cached;
      return null;
    } catch {
      return null;
    }
  }

  /**
   * النسخة الموثوقة (مفضلة): تجلب session من Supabase بشكل صحيح وتحدّث الكاش.
   */
  static async getCurrentUserIdAsync(): Promise<string | null> {
    try {
      const { data } = await supabase.auth.getUser();
      const userId = data?.user?.id;
      if (userId) {
        try { localStorage.setItem(this.CACHE_KEY, userId); } catch (_) {}
        return userId;
      }
      return null;
    } catch {
      return null;
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
    const current = (cached && cached !== 'null' && cached.length > 10) ? cached : null;
    return {
      currentUserId: current,
      userEmail: ((): string | null => { try { return localStorage.getItem('shopify_user_email'); } catch(_) { return null; } })(),
      isUsingDefault: false
    };
  }
}

// دعم التصدير الافتراضي مع بقاء التصدير المسمّى من تعريف الصنف أعلاه
export default AuthHelper;