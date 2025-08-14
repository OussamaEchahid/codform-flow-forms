/**
 * CODFORM - نظام تتبع السلال المتروكة - إصدار محسن
 * نهج بسيط وموثوق لتتبع وحفظ البيانات المتروكة
 */

(function() {
  'use strict';
  
  console.log('🚀 بدء تشغيل نظام تتبع السلال المتروكة - الإصدار الجديد');
  
  let isTracking = false;
  let currentData = {};
  let saveTimer = null;
  let cartId = null;
  
  // دالة حفظ البيانات
  async function saveAbandonedCart(data) {
    try {
      console.log('💾 محاولة حفظ السلة المتروكة:', data);
      
      // التأكد من وجود بيانات مهمة
      if (!data.name && !data.email && !data.phone) {
        console.log('⚠️ لا توجد بيانات مهمة للحفظ');
        return;
      }
      
      const cartData = {
        customer_email: data.email || '',
        customer_phone: data.phone || '', 
        customer_name: data.name || '',
        cart_items: [{
          product_id: window.codformProductId || 'unknown',
          quantity: 1,
          title: document.title || 'منتج'
        }],
        total_value: 1,
        currency: 'SAR',
        form_id: window.codformProductId || 'default',
        shop_id: window.location.hostname,
        form_data: data
      };
      
      console.log('📦 بيانات السلة للحفظ:', cartData);
      
      const response = await fetch('https://trlklwixfeaexhydzaue.supabase.co/functions/v1/abandoned-carts?action=create-abandoned-cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cartData)
      });
      
      console.log('🌐 حالة الاستجابة:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        cartId = result.cart?.id;
        console.log('✅ تم حفظ السلة المتروكة بنجاح:', cartId);
        console.log('📊 النتيجة الكاملة:', result);
      } else {
        const errorText = await response.text();
        console.error('❌ فشل في حفظ السلة:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ خطأ في حفظ السلة:', error);
    }
  }
  
  // دالة استخراج البيانات
  function extractData() {
    const data = {};
    
    // البحث عن جميع حقول الإدخال
    document.querySelectorAll('input, textarea, select').forEach(field => {
      if (!field.value || !field.value.trim()) return;
      
      const value = field.value.trim();
      const name = (field.name || field.id || '').toLowerCase();
      const placeholder = (field.placeholder || '').toLowerCase();
      
      // تحديد نوع البيانات
      if (name.includes('name') || name.includes('اسم') || placeholder.includes('name') || placeholder.includes('اسم')) {
        data.name = value;
      } else if (name.includes('email') || name.includes('بريد') || value.includes('@')) {
        data.email = value;
      } else if (name.includes('phone') || name.includes('هاتف') || name.includes('mobile') || /[\d\+\-\s\(\)]{8,}/.test(value)) {
        data.phone = value;
      } else if (name.includes('city') || name.includes('مدينة')) {
        data.city = value;
      } else if (name.includes('address') || name.includes('عنوان')) {
        data.address = value;
      }
      
      // حفظ جميع البيانات
      if (field.name) data[field.name] = value;
      if (field.id && !field.name) data[field.id] = value;
    });
    
    console.log('🔍 البيانات المستخرجة:', data);
    return data;
  }
  
  // دالة المعالجة عند تغيير الحقول
  function handleInput() {
    console.log('⌨️ تم اكتشاف إدخال في النموذج');
    
    const newData = extractData();
    
    // التحقق من وجود تغيير مهم
    const hasImportantData = newData.name || newData.email || newData.phone;
    
    if (hasImportantData && !cartId) {
      currentData = newData;
      
      // إلغاء المؤقت السابق
      if (saveTimer) {
        clearTimeout(saveTimer);
      }
      
      // تأخير الحفظ لثانية واحدة
      saveTimer = setTimeout(() => {
        console.log('⏰ حان وقت الحفظ');
        saveAbandonedCart(currentData);
      }, 1000);
    }
  }
  
  // تشغيل النظام
  function startTracking() {
    if (isTracking) {
      console.log('⚠️ النظام يعمل بالفعل');
      return;
    }
    
    console.log('🔄 بدء تشغيل نظام التتبع');
    isTracking = true;
    
    // إضافة مستمعين لجميع حقول الإدخال
    document.addEventListener('input', function(e) {
      if (e.target.matches('input, textarea, select')) {
        console.log('📝 تم الكتابة في:', e.target.name || e.target.id || 'حقل بدون اسم');
        handleInput();
      }
    });
    
    document.addEventListener('change', function(e) {
      if (e.target.matches('input, textarea, select')) {
        console.log('🔄 تم تغيير:', e.target.name || e.target.id || 'حقل بدون اسم');
        handleInput();
      }
    });
    
    console.log('✅ تم تشغيل نظام التتبع بنجاح');
  }
  
  // تشغيل فوري إذا كانت الصفحة جاهزة
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    startTracking();
  } else {
    document.addEventListener('DOMContentLoaded', startTracking);
  }
  
  // تشغيل احتياطي بعد ثانيتين
  setTimeout(startTracking, 2000);
  
  console.log('🏁 تم تحميل نظام تتبع السلال المتروكة');
})();