
/**
 * Helper functions for form navigation
 * These functions use direct window location changes when necessary
 * but avoid excessive page reloads
 */

import { toast } from 'sonner';

// تتبع آخر وقت تم فيه التنقل للتحكم في معدل التنقل
let lastNavigationTime = 0;
const NAVIGATION_THROTTLE = 1000; // 1 ثانية بين كل عملية تنقل

/**
 * التنقل إلى منشئ النماذج مع معرف النموذج المحدد
 */
export const navigateToFormBuilder = (formId?: string) => {
  try {
    // التحقق من معدل التنقل لمنع التنقلات المتكررة
    const now = Date.now();
    if (now - lastNavigationTime < NAVIGATION_THROTTLE) {
      console.log('Navigation throttled, too many requests');
      return;
    }
    
    lastNavigationTime = now;
    console.log(`Navigating to form builder with formId: ${formId || 'new'}`);
    
    // تخزين بيانات آخر تنقل في sessionStorage
    sessionStorage.setItem('last_form_navigation', JSON.stringify({
      destination: formId ? `form-builder/${formId}` : 'form-builder/new',
      timestamp: now
    }));
    
    // إعادة توجيه المستخدم
    if (formId) {
      // تحديث العنوان لتعديل نموذج موجود
      window.location.href = `/form-builder/${formId}`;
    } else {
      // تحديث العنوان لإنشاء نموذج جديد
      window.location.href = '/form-builder/new';
    }
  } catch (error) {
    console.error('Error navigating to form builder:', error);
    toast.error('حدث خطأ أثناء الانتقال إلى منشئ النماذج');
    
    // الإرجاع الاحتياطي
    window.location.href = formId 
      ? `/form-builder/${formId}` 
      : '/form-builder/new';
  }
};

/**
 * العودة إلى قائمة النماذج مع تجنب إعادة التحميل المتكرر
 */
export const navigateToFormsList = () => {
  try {
    // التحقق من معدل التنقل لمنع التنقلات المتكررة
    const now = Date.now();
    if (now - lastNavigationTime < NAVIGATION_THROTTLE) {
      console.log('Navigation to forms list throttled');
      return;
    }
    
    lastNavigationTime = now;
    console.log('Navigating to forms list');
    
    // مسح بيانات التنقل السابقة
    sessionStorage.removeItem('last_form_navigation');
    
    // إعادة توجيه المستخدم إلى صفحة قائمة النماذج
    window.location.href = '/forms';
  } catch (error) {
    console.error('Error navigating to forms list:', error);
    toast.error('حدث خطأ أثناء الانتقال إلى قائمة النماذج');
    
    // الإرجاع الاحتياطي
    window.location.href = '/forms';
  }
};
