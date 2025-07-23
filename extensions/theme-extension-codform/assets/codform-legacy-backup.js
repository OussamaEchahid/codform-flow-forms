
/**
 * CODFORM Legacy Backup - النظام القديم
 * هذا الملف يحتوي على النظام القديم للمراجع
 */

// النظام القديم الذي كان يعمل
const CODFORM_LEGACY = {
  
  // دالة جلب النموذج القديمة
  async fetchForm(shopDomain, productId) {
    const apiUrl = `https://trlklwixfeaexhydzaue.supabase.co/functions/v1/forms-product?shop=${shopDomain}&product=${productId}`;
    
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching form:', error);
      return { error: error.message };
    }
  },

  // دالة عرض النموذج القديمة
  async renderLegacyForm(container, shopDomain, productId) {
    console.log('🔄 CODFORM: Using legacy rendering method');
    
    try {
      const data = await this.fetchForm(shopDomain, productId);
      
      if (data.error) {
        container.innerHTML = `
          <div style="padding: 20px; text-align: center; color: #dc2626;">
            <p>خطأ في تحميل النموذج: ${data.error}</p>
          </div>
        `;
        return;
      }

      // عرض النموذج بالطريقة القديمة
      container.innerHTML = `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="text-align: center; color: #1f2937; margin-bottom: 20px;">
            ${data.form?.title || 'نموذج الطلب'}
          </h2>
          <form>
            <div style="margin-bottom: 16px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 600;">الاسم الكامل *</label>
              <input type="text" required style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px;">
            </div>
            <div style="margin-bottom: 16px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 600;">رقم الهاتف *</label>
              <input type="tel" required style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px;">
            </div>
            <div style="margin-bottom: 16px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 600;">العنوان *</label>
              <textarea required style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; min-height: 80px;"></textarea>
            </div>
            <button type="submit" style="width: 100%; padding: 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer;">
              إرسال الطلب
            </button>
          </form>
        </div>
      `;
      
      console.log('✅ CODFORM: Legacy form rendered');
    } catch (error) {
      console.error('❌ CODFORM: Legacy rendering failed:', error);
    }
  }
};

// جعل النظام القديم متاحاً للاستخدام في حالة الضرورة
window.CODFORM_LEGACY = CODFORM_LEGACY;
