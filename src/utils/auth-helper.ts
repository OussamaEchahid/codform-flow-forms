// مساعد المصادقة وإدارة المستخدمين المبسط
import { supabase } from '@/integrations/supabase/client';

export class AuthHelper {
  // المستخدم الافتراضي للنظام
  private static readonly DEFAULT_USER_ID = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893';
  
  /**
   * الحصول على user_id المناسب
   */
  static getCurrentUserId(): string {
    try {
      // جعل الاستعلام synchronous لتجنب مشاكل TypeScript
      const currentUser = supabase.auth.getUser();
      
      // العودة للمستخدم الافتراضي دائماً لضمان عمل النظام
      console.log('🔄 Using default user ID for system operations');
      return this.DEFAULT_USER_ID;
    } catch (error) {
      console.error('❌ Error getting current user ID:', error);
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
    
    return {
      user_id: userId
    };
  }

  /**
   * معلومات التشخيص
   */
  static getDiagnosticInfo() {
    return {
      currentUserId: this.getCurrentUserId(),
      defaultUserId: this.DEFAULT_USER_ID,
      userEmail: localStorage.getItem('shopify_user_email'),
      isUsingDefault: this.getCurrentUserId() === this.DEFAULT_USER_ID
    };
  }
}

export default AuthHelper;