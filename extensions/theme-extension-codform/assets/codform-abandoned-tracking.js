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
  
  // دالة استخراج السعر النهائي الشاملة من جميع المصادر الممكنة
  function extractPriceAndCurrency() {
    let price = 1;
    let currency = 'SAR';
    let foundPrice = false;
    
    console.log('🔍 بدء البحث عن السعر في جميع العناصر...');
    
    // 1. البحث في ملخص السلة أولاً (إذا كان موجوداً)
    const cartSummary = document.querySelector('.cart-summary-field');
    if (cartSummary) {
      console.log('📦 تم العثور على ملخص السلة');
      const totalValueElement = cartSummary.querySelector('.total-value, .total-row .summary-value');
      if (totalValueElement) {
        const totalText = totalValueElement.textContent || totalValueElement.innerText || '';
        const dataAmount = totalValueElement.getAttribute('data-amount');
        
        if (dataAmount && !isNaN(dataAmount) && parseFloat(dataAmount) > 0) {
          price = parseFloat(dataAmount);
          foundPrice = true;
          console.log('✅ تم العثور على السعر من ملخص السلة (data-amount):', price);
        } else {
          const numbers = totalText.match(/[\d,]+\.?\d*/g);
          if (numbers && numbers.length > 0) {
            const foundPriceFromText = parseFloat(numbers[numbers.length - 1].replace(/,/g, ''));
            if (foundPriceFromText > 0) {
              price = foundPriceFromText;
              foundPrice = true;
              console.log('✅ تم العثور على السعر من ملخص السلة (النص):', price);
            }
          }
        }
        
        // استخراج العملة من ملخص السلة
        if (totalText.includes('USD') || totalText.includes('$')) currency = 'USD';
        else if (totalText.includes('SAR') || totalText.includes('ر.س')) currency = 'SAR';
        else if (totalText.includes('EUR') || totalText.includes('€')) currency = 'EUR';
        else if (totalText.includes('AED') || totalText.includes('د.إ')) currency = 'AED';
        else if (totalText.includes('MAD') || totalText.includes('د.م')) currency = 'MAD';
      }
    }
    
    // 2. البحث في عروض الكمية إذا لم نجد السعر
    if (!foundPrice) {
      console.log('🎯 البحث في عروض الكمية...');
      const quantityOffers = document.querySelectorAll('.quantity-offers-block, [class*="quantity"], [class*="offer"]');
      quantityOffers.forEach(offer => {
        const priceElements = offer.querySelectorAll('[class*="price"], [class*="total"], [data-price]');
        priceElements.forEach(element => {
          const text = element.textContent || element.innerText || '';
          const dataPrice = element.getAttribute('data-price');
          
          if (dataPrice && !isNaN(dataPrice)) {
            const foundOfferPrice = parseFloat(dataPrice);
            if (foundOfferPrice > price) {
              price = foundOfferPrice;
              foundPrice = true;
              console.log('✅ تم العثور على السعر من عروض الكمية:', price);
            }
          } else {
            const numbers = text.match(/[\d,]+\.?\d*/g);
            if (numbers && numbers.length > 0) {
              const foundOfferPrice = parseFloat(numbers[numbers.length - 1].replace(/,/g, ''));
              if (foundOfferPrice > price) {
                price = foundOfferPrice;
                foundPrice = true;
                console.log('✅ تم العثور على السعر من نص عروض الكمية:', price);
              }
            }
          }
        });
      });
    }
    
    // 3. البحث في معلومات المنتج
    if (!foundPrice) {
      console.log('🛍️ البحث في معلومات المنتج...');
      const productPrices = document.querySelectorAll('.product-price, .price, [class*="product"] [class*="price"], .money, [data-price]');
      productPrices.forEach(element => {
        const text = element.textContent || element.innerText || '';
        const dataPrice = element.getAttribute('data-price');
        
        if (dataPrice && !isNaN(dataPrice)) {
          const foundProductPrice = parseFloat(dataPrice);
          if (foundProductPrice > price) {
            price = foundProductPrice;
            foundPrice = true;
            console.log('✅ تم العثور على السعر من معلومات المنتج (data-price):', price);
          }
        } else {
          const numbers = text.match(/[\d,]+\.?\d*/g);
          if (numbers && numbers.length > 0) {
            const foundProductPrice = parseFloat(numbers[numbers.length - 1].replace(/,/g, ''));
            if (foundProductPrice > price) {
              price = foundProductPrice;
              foundPrice = true;
              console.log('✅ تم العثور على السعر من معلومات المنتج (النص):', price);
            }
          }
        }
      });
    }
    
    // 4. البحث العام في جميع عناصر السعر والمجموع
    if (!foundPrice) {
      console.log('🔎 البحث العام في جميع عناصر السعر...');
      const allPriceElements = document.querySelectorAll(
        '[class*="total"], [class*="price"], [class*="amount"], [class*="cost"], ' +
        '[id*="total"], [id*="price"], [id*="amount"], [data-amount], [data-price], ' +
        '.money, .currency, .sum, .subtotal'
      );
      
      allPriceElements.forEach(element => {
        const text = element.textContent || element.innerText || '';
        const dataAmount = element.getAttribute('data-amount') || element.getAttribute('data-price');
        
        // إعطاء أولوية للـ data attributes
        if (dataAmount && !isNaN(dataAmount)) {
          const foundGeneralPrice = parseFloat(dataAmount);
          if (foundGeneralPrice > price) {
            price = foundGeneralPrice;
            foundPrice = true;
            console.log('✅ تم العثور على السعر من البحث العام (data):', price);
          }
        } else {
          // البحث في النص
          const numbers = text.match(/[\d,]+\.?\d*/g);
          if (numbers && numbers.length > 0) {
            const foundGeneralPrice = parseFloat(numbers[numbers.length - 1].replace(/,/g, ''));
            if (foundGeneralPrice > price && foundGeneralPrice < 1000000) { // تجنب الأرقام الكبيرة جداً
              price = foundGeneralPrice;
              foundPrice = true;
              console.log('✅ تم العثور على السعر من البحث العام (النص):', price);
            }
          }
        }
        
        // البحث عن العملة في جميع العناصر
        if (text.includes('USD') || text.includes('$')) currency = 'USD';
        else if (text.includes('SAR') || text.includes('ر.س')) currency = 'SAR';
        else if (text.includes('EUR') || text.includes('€')) currency = 'EUR';
        else if (text.includes('AED') || text.includes('د.إ')) currency = 'AED';
        else if (text.includes('MAD') || text.includes('د.م')) currency = 'MAD';
      });
    }
    
    // 5. البحث في متغيرات JavaScript العامة
    if (!foundPrice && window.Shopify && window.Shopify.currency) {
      currency = window.Shopify.currency.active || currency;
      console.log('💱 تم العثور على العملة من Shopify:', currency);
    }
    
    console.log('💰 السعر النهائي المستخرج:', price, currency, 'تم العثور عليه:', foundPrice);
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