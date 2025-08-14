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
      
      // استخراج السعر والعملة
      const { price, currency } = extractPriceAndCurrency();
      
      const cartData = {
        customer_email: data.email || '',
        customer_phone: data.phone || '', 
        customer_name: data.name || '',
        cart_items: [{
          product_id: window.codformProductId || 'unknown',
          quantity: 1,
          title: document.title || 'منتج',
          price: price
        }],
        total_value: price,
        currency: currency,
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
  
  // دالة استخراج السعر النهائي المحول من ملخص السلة
  function extractPriceAndCurrency() {
    let price = 1;
    let currency = 'SAR';
    
    // أولاً: البحث في ملخص السلة للحصول على السعر النهائي المحول
    const cartSummary = document.querySelector('.cart-summary-field');
    if (cartSummary) {
      // البحث عن المجموع النهائي في ملخص السلة
      const totalValueElement = cartSummary.querySelector('.total-value, .total-row .summary-value');
      if (totalValueElement) {
        const totalText = totalValueElement.textContent || totalValueElement.innerText || '';
        const dataAmount = totalValueElement.getAttribute('data-amount');
        
        // استخراج السعر من data-amount (الأولوية) أو النص
        if (dataAmount && !isNaN(dataAmount) && parseFloat(dataAmount) > 0) {
          price = parseFloat(dataAmount);
          console.log('💰 تم العثور على السعر من data-amount:', price);
        } else {
          const numbers = totalText.match(/[\d,]+\.?\d*/g);
          if (numbers && numbers.length > 0) {
            const foundPrice = parseFloat(numbers[numbers.length - 1].replace(/,/g, ''));
            if (foundPrice > 0) {
              price = foundPrice;
              console.log('💰 تم العثور على السعر من النص:', price);
            }
          }
        }
        
        // استخراج العملة من النص
        if (totalText.includes('USD') || totalText.includes('$')) currency = 'USD';
        else if (totalText.includes('SAR') || totalText.includes('ر.س')) currency = 'SAR';
        else if (totalText.includes('EUR') || totalText.includes('€')) currency = 'EUR';
        else if (totalText.includes('AED') || totalText.includes('د.إ')) currency = 'AED';
        else if (totalText.includes('MAD') || totalText.includes('د.م')) currency = 'MAD';
        
        if (price > 1) {
          console.log('✅ تم استخراج السعر النهائي من ملخص السلة:', price, currency);
          return { price, currency };
        }
      }
    }
    
    // ثانياً: البحث الاحتياطي في عناصر السعر الأخرى
    const priceElements = document.querySelectorAll('[class*="total"], [class*="price"], [data-amount], .summary-value, .price, .amount');
    
    for (const element of priceElements) {
      const text = element.textContent || element.innerText || '';
      const dataAmount = element.getAttribute('data-amount');
      
      // إعطاء أولوية لـ data-amount
      if (dataAmount && !isNaN(dataAmount)) {
        const foundPrice = parseFloat(dataAmount);
        if (foundPrice > price) {
          price = foundPrice;
        }
      } else {
        // البحث عن رقم في النص
        const numbers = text.match(/[\d,]+\.?\d*/g);
        if (numbers && numbers.length > 0) {
          const foundPrice = parseFloat(numbers[numbers.length - 1].replace(/,/g, ''));
          if (foundPrice > price) {
            price = foundPrice;
          }
        }
      }
      
      // البحث عن العملة
      if (text.includes('USD') || text.includes('$')) currency = 'USD';
      else if (text.includes('SAR') || text.includes('ر.س')) currency = 'SAR';
      else if (text.includes('EUR') || text.includes('€')) currency = 'EUR';
      else if (text.includes('AED') || text.includes('د.إ')) currency = 'AED';
      else if (text.includes('MAD') || text.includes('د.م')) currency = 'MAD';
    }
    
    console.log('💰 السعر النهائي المستخرج:', price, currency);
    return { price, currency };
  }

  // دالة استخراج البيانات المحسنة
  function extractData() {
    const data = {};
    
    // البحث عن جميع حقول الإدخال
    document.querySelectorAll('input, textarea, select').forEach(field => {
      if (!field.value || !field.value.trim()) return;
      
      const value = field.value.trim();
      const name = (field.name || field.id || '').toLowerCase();
      const placeholder = (field.placeholder || '').toLowerCase();
      const type = field.type || '';
      
      // تحديد نوع البيانات بدقة أكبر
      if (name.includes('name') || name.includes('اسم') || placeholder.includes('name') || placeholder.includes('اسم')) {
        if (!name.includes('phone') && !name.includes('email')) {
          data.name = value;
        }
      } else if (name.includes('email') || name.includes('بريد') || type === 'email' || value.includes('@')) {
        data.email = value;
      } else if (name.includes('phone') || name.includes('هاتف') || name.includes('mobile') || type === 'tel') {
        // التأكد من أنه رقم هاتف حقيقي وليس id أو name
        if (/^[\+]?[\d\s\-\(\)]{7,15}$/.test(value) && !value.includes('template') && !value.includes('main')) {
          data.phone = value;
        }
      } else if (name.includes('city') || name.includes('مدينة') || placeholder.includes('city') || placeholder.includes('مدينة')) {
        data.city = value;
      } else if (name.includes('address') || name.includes('عنوان') || placeholder.includes('address') || placeholder.includes('عنوان')) {
        data.address = value;
      }
      
      // حفظ جميع البيانات مع التحقق
      if (field.name && !field.name.includes('template') && !field.name.includes('section')) {
        data[field.name] = value;
      }
      if (field.id && !field.name && !field.id.includes('template') && !field.id.includes('section')) {
        data[field.id] = value;
      }
    });
    
    // البحث عن رقم الهاتف في حقول مخصصة لـ phone
    if (!data.phone) {
      const phoneInputs = document.querySelectorAll('input[placeholder*="phone"], input[placeholder*="هاتف"], input[placeholder*="Phone"], input[class*="phone"]');
      phoneInputs.forEach(input => {
        const value = input.value?.trim();
        if (value && /^[\+]?[\d\s\-\(\)]{7,15}$/.test(value) && !value.includes('template')) {
          data.phone = value;
        }
      });
    }
    
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