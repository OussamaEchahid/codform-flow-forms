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
      
      console.log('🔍 البيانات المحفوظة في currentData:', currentData.extractedPrice, currentData.extractedCurrency);
      
      // إعطاء الأولوية القصوى للسعر المحول المحفوظ في currentData
      let finalPrice = null;
      let finalCurrency = 'SAR';
      
      // الأولوية الأولى: السعر المحول المحفوظ في currentData
      if (currentData.extractedPrice && currentData.extractedPrice > 1) {
        finalPrice = currentData.extractedPrice;
        finalCurrency = currentData.extractedCurrency || 'SAR';
        console.log('🎯 استخدام السعر المحول المحفوظ في currentData:', finalPrice, finalCurrency);
      } else {
        // الأولوية الثانية: استخراج من ملخص السلة مباشرة
        const { price, currency } = extractPriceAndCurrency();
        console.log('🔍 السعر المستخرج حالياً من ملخص السلة:', price, currency);
        
        if (price && price > 1) {
          finalPrice = price;
          finalCurrency = currency;
          console.log('💰 استخدام السعر المستخرج من ملخص السلة:', finalPrice, finalCurrency);
        }
      }
      
      // التأكد من وجود سعر صالح
      if (!finalPrice || finalPrice <= 1) {
        console.log('⚠️ لا يوجد سعر محول صالح، إيقاف الحفظ');
        return;
      }
      
      const cartData = {
        customer_email: data.email || '',
        customer_phone: data.phone || '', 
        customer_name: data.name || '',
        cart_items: [{
          product_id: window.codformProductId || 'unknown',
          quantity: 1,
          title: document.title || 'منتج',
          price: finalPrice
        }],
        total_value: finalPrice,
        currency: finalCurrency,
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
  
  // إنشاء نظام ملخص طلب خفي في الخلفية
  function createHiddenCartSummary() {
    // التحقق من وجود ملخص طلب مرئي
    const existingCartSummary = document.querySelector('.cart-summary-field');
    if (existingCartSummary) {
      console.log('✅ يوجد ملخص طلب مرئي، سيتم استخدامه');
      return existingCartSummary;
    }
    
    console.log('🔄 إنشاء نظام ملخص طلب خفي في الخلفية');
    
    // إنشاء عنصر ملخص طلب خفي
    const hiddenSummary = document.createElement('div');
    hiddenSummary.className = 'cart-summary-field hidden-cart-summary';
    hiddenSummary.style.display = 'none';
    hiddenSummary.style.position = 'absolute';
    hiddenSummary.style.left = '-9999px';
    hiddenSummary.style.top = '-9999px';
    hiddenSummary.style.opacity = '0';
    hiddenSummary.style.pointerEvents = 'none';
    
    // إضافة العناصر المطلوبة لملخص السلة
    hiddenSummary.innerHTML = `
      <div class="subtotal-row">
        <span class="subtotal-label">المجموع الفرعي:</span>
        <span class="subtotal-value" data-amount="0">0</span>
      </div>
      <div class="discount-row" style="display: none;">
        <span class="discount-label">الخصم:</span>
        <span class="discount-value" data-amount="0">0</span>
      </div>
      <div class="shipping-row">
        <span class="shipping-label">الشحن:</span>
        <span class="shipping-value" data-amount="0">مجاني</span>
      </div>
      <div class="total-row">
        <span class="total-label">المجموع:</span>
        <span class="total-value" data-amount="0">0</span>
      </div>
    `;
    
    // إضافة العنصر للصفحة
    document.body.appendChild(hiddenSummary);
    
    // تطبيق نظام ملخص السلة عليه
    initializeHiddenCartSummary(hiddenSummary);
    
    return hiddenSummary;
  }
  
  // تهيئة نظام ملخص السلة الخفي
  function initializeHiddenCartSummary(summaryElement) {
    console.log('🔧 تهيئة نظام ملخص السلة الخفي');
    
    // الحصول على معرف المنتج ودومين المتجر
    const productId = window.codformProductId || extractProductId();
    const shopDomain = window.location.hostname;
    
    if (!productId) {
      console.warn('⚠️ لم يتم العثور على معرف المنتج');
      return;
    }
    
    // استخدام نفس نظام تحميل البيانات من Cart Summary
    loadProductDataForHiddenSummary(productId, shopDomain, summaryElement);
  }
  
  // تحميل بيانات المنتج للملخص الخفي
  async function loadProductDataForHiddenSummary(productId, shopDomain, summaryElement) {
    try {
      console.log('📡 تحميل بيانات المنتج للملخص الخفي:', productId);
      
      // استخدام نفس API المستخدم في Cart Summary
      const apiUrl = `https://trlklwixfeaexhydzaue.supabase.co/functions/v1/forms-product?shop=${encodeURIComponent(shopDomain)}&product=${encodeURIComponent(productId)}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.product && data.currency) {
        const price = parseFloat(data.product.price) || 0;
        const currency = data.currency;
        
        console.log('✅ تم تحميل بيانات المنتج:', { price, currency });
        
        // تطبيق نظام التحويل والتنسيق
        updateHiddenCartSummary(summaryElement, price, currency);
      }
    } catch (error) {
      console.error('❌ خطأ في تحميل بيانات المنتج:', error);
    }
  }
  
  // تحديث ملخص السلة الخفي
  function updateHiddenCartSummary(summaryElement, basePrice, currency) {
    console.log('🔄 تحديث ملخص السلة الخفي:', { basePrice, currency });

    // استخدام نظام التحويل
    let convertedPrice = basePrice;
    const targetCurrency = getTargetCurrency();

    // تحويل العملة إذا كانت مختلفة
    if (targetCurrency && targetCurrency !== currency) {
      // استخدام Currency Manager إذا كان متاحاً
      if (window.CodformCurrencyManager && typeof window.CodformCurrencyManager.convertCurrency === 'function') {
        convertedPrice = window.CodformCurrencyManager.convertCurrency(basePrice, currency, targetCurrency);
      } else if (window.convertCurrency) {
        // استخدام دالة التحويل من codform-currency-rates.js
        convertedPrice = window.convertCurrency(basePrice, currency, targetCurrency);
      } else {
        // تحويل احتياطي باستخدام معدلات ثابتة
        convertedPrice = convertCurrencyFallback(basePrice, currency, targetCurrency);
      }
      currency = targetCurrency;

      console.log('💱 تم تحويل العملة:', {
        originalPrice: basePrice,
        convertedPrice,
        fromCurrency: currency,
        toCurrency: targetCurrency
      });
    }
    
    // تطبيق نظام التنسيق
    let formattedPrice = convertedPrice.toString();
    if (window.CodformCurrencyManager && typeof window.CodformCurrencyManager.formatCurrency === 'function') {
      formattedPrice = window.CodformCurrencyManager.formatCurrency(convertedPrice, currency, 'ar');
    } else {
      formattedPrice = formatCurrencyFallback(convertedPrice, currency);
    }
    
    // تحديث عناصر الملخص
    const subtotalElement = summaryElement.querySelector('.subtotal-value');
    const totalElement = summaryElement.querySelector('.total-value');
    
    if (subtotalElement) {
      subtotalElement.textContent = formattedPrice;
      subtotalElement.setAttribute('data-amount', convertedPrice);
    }
    
    if (totalElement) {
      totalElement.textContent = formattedPrice;
      totalElement.setAttribute('data-amount', convertedPrice);
    }
    
    console.log('✅ تم تحديث ملخص السلة الخفي بالسعر المحول:', formattedPrice);
  }
  
  // الحصول على العملة المستهدفة - SINGLE SOURCE OF TRUTH
  function getTargetCurrency() {
    // 🛡️ ONLY use Form API data
    if (window.CodformFormData?.currency) {
      return window.CodformFormData.currency;
    }

    // 🚫 Do NOT use fallbacks that might contain wrong currency
    console.warn('⚠️ Abandoned Tracking: No Form API currency found, skipping tracking');
    return null; // Return null instead of wrong default
  }
  
  // تحويل العملة الاحتياطي
  function convertCurrencyFallback(amount, fromCurrency, toCurrency) {
    // معدلات التحويل الأساسية (نفس المعدلات في codform-currency-rates.js)
    const rates = {
      'USD': 1.0,
      'SAR': 3.75,
      'AED': 3.67,
      'EGP': 30.85,
      'MAD': 10.0,
      'EUR': 0.92,
      'GBP': 0.79  // ✅ تصحيح المعدل من 0.75 إلى 0.79
    };

    if (fromCurrency === toCurrency) return amount;

    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[toCurrency] || 1;

    // تحويل إلى USD أولاً، ثم إلى العملة المطلوبة
    const usdAmount = amount / fromRate;
    const convertedAmount = usdAmount * toRate;

    console.log(`🔄 Fallback currency conversion: ${amount} ${fromCurrency} -> ${convertedAmount.toFixed(2)} ${toCurrency}`);
    return convertedAmount;
  }

  // تنسيق العملة الاحتياطي
  function formatCurrencyFallback(amount, currency) {
    const symbols = {
      'SAR': 'ر.س',
      'MAD': 'د.م',
      'AED': 'د.إ',
      'USD': '$',
      'EUR': '€'
    };

    const symbol = symbols[currency] || currency;
    const formattedAmount = Math.round(amount * 10) / 10; // رقم واحد بعد العلامة العشرية

    return `${formattedAmount.toFixed(1)} ${symbol}`;
  }
  
  // استخراج معرف المنتج
  function extractProductId() {
    // البحث في النموذج
    const productIdField = document.querySelector('input[name="product-id"], input[id*="product"]');
    if (productIdField && productIdField.value) {
      return productIdField.value;
    }
    
    // البحث في URL
    const urlParams = new URLSearchParams(window.location.search);
    const productFromUrl = urlParams.get('product') || urlParams.get('productId');
    if (productFromUrl) {
      return productFromUrl;
    }
    
    return null;
  }
  
  // دالة استخراج السعر النهائي المحول من ملخص السلة
  function extractPriceAndCurrency() {
    let price = 1;
    // ✅ استخدام عملة النموذج بدلاً من العملة الافتراضية
    let currency = window.CodformFormData?.currency || 'SAR';
    
    // التأكد من وجود ملخص السلة (مرئي أو خفي)
    let cartSummary = document.querySelector('.cart-summary-field');
    if (!cartSummary) {
      // إنشاء ملخص السلة الخفي إذا لم يكن موجود
      cartSummary = createHiddenCartSummary();
      // انتظار أطول للسماح بتحديث البيانات - 8 ثوانٍ
      setTimeout(() => {
        const updatedData = extractPriceAndCurrency();
        if (updatedData.price > 1) {
          currentData.extractedPrice = updatedData.price;
          currentData.extractedCurrency = updatedData.currency;
          console.log('🔄 تم تحديث السعر المحول:', updatedData.price, updatedData.currency);
        }
      }, 8000);
      
      // انتظار إضافي للتأكد من التحديث
      setTimeout(() => {
        const finalData = extractPriceAndCurrency();
        if (finalData.price > 1 && finalData.price !== currentData.extractedPrice) {
          currentData.extractedPrice = finalData.price;
          currentData.extractedCurrency = finalData.currency;
          console.log('✅ تم التحديث النهائي للسعر:', finalData.price, finalData.currency);
        }
      }, 12000);
    }
    
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
        
        // استخراج العملة من النص (مع الحفاظ على عملة النموذج كأولوية)
        const formCurrency = window.CodformFormData?.currency;
        if (formCurrency) {
          currency = formCurrency; // استخدام عملة النموذج دائماً
        } else {
          // فحص النص فقط إذا لم تكن عملة النموذج متاحة
          if (totalText.includes('USD') || totalText.includes('$')) currency = 'USD';
          else if (totalText.includes('SAR') || totalText.includes('ر.س')) currency = 'SAR';
          else if (totalText.includes('EUR') || totalText.includes('€')) currency = 'EUR';
          else if (totalText.includes('GBP') || totalText.includes('£')) currency = 'GBP';
          else if (totalText.includes('AED') || totalText.includes('د.إ')) currency = 'AED';
          else if (totalText.includes('MAD') || totalText.includes('د.م')) currency = 'MAD';
        }
        
        if (price > 1) {
          console.log('✅ تم استخراج السعر النهائي من ملخص السلة:', price, currency);
          return { price, currency };
        }
      }
    }
    
    // البحث الاحتياطي في عناصر السعر الأخرى
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
      
      // البحث عن العملة (مع إعطاء الأولوية لعملة النموذج)
      const formCurrency = window.CodformFormData?.currency;
      if (formCurrency) {
        currency = formCurrency; // استخدام عملة النموذج دائماً
      } else {
        // فحص النص فقط إذا لم تكن عملة النموذج متاحة
        if (text.includes('USD') || text.includes('$')) currency = 'USD';
        else if (text.includes('SAR') || text.includes('ر.س')) currency = 'SAR';
        else if (text.includes('EUR') || text.includes('€')) currency = 'EUR';
        else if (text.includes('GBP') || text.includes('£')) currency = 'GBP';
        else if (text.includes('AED') || text.includes('د.إ')) currency = 'AED';
        else if (text.includes('MAD') || text.includes('د.م')) currency = 'MAD';
      }
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
    
    // ✅ إضافة بيانات المنتج للإرسال مع النموذج
    if (window.CodformProductData) {
      data.productData = {
        price: window.CodformProductData.price,
        currency: window.CodformProductData.currency,
        title: window.CodformProductData.title || 'Product'
      };
      console.log('📦 تم إضافة بيانات المنتج:', data.productData);
    }

    // إضافة بيانات عروض الكمية إذا كانت متاحة
    if (window.CodformStateManager) {
      const state = window.CodformStateManager.getState();
      if (state && state.selectedOffer) {
        data.selectedOffer = state.selectedOffer;
        // ✅ CRITICAL FIX: إضافة الكمية بشكل صريح
        data.quantity = state.selectedOffer.quantity || state.currentQuantity || 1;
        console.log('🎯 تم إضافة بيانات العرض المختار:', data.selectedOffer);
        console.log('🔢 تم إضافة الكمية:', data.quantity);
      } else if (state && state.currentQuantity) {
        // إذا لم يكن هناك عرض محدد، استخدم الكمية الحالية
        data.quantity = state.currentQuantity;
        console.log('🔢 تم إضافة الكمية الحالية:', data.quantity);
      }
    }

    console.log('🔍 البيانات المستخرجة الكاملة:', data);
    return data;
  }
  
  // دالة تحديث السعر المحول
  function updateExtractedPrice() {
    const { price, currency } = extractPriceAndCurrency();
    if (price && price > 1) {
      currentData.extractedPrice = price;
      currentData.extractedCurrency = currency;
      console.log('🔄 تم تحديث السعر المحول في currentData:', price, currency);
      return true;
    }
    return false;
  }
  
  // دالة المعالجة المحسنة عند تغيير الحقول
  function handleInput() {
    console.log('⌨️ تم اكتشاف إدخال في النموذج');
    
    const newData = extractData();
    
    // التحقق من وجود تغيير مهم
    const hasImportantData = newData.name || newData.email || newData.phone;
    
    if (hasImportantData && !cartId) {
      // الحفاظ على السعر المحول المحفوظ مسبقاً
      const preservedPrice = currentData.extractedPrice;
      const preservedCurrency = currentData.extractedCurrency;
      
      // دمج البيانات الجديدة مع الحفاظ على السعر المحول
      currentData = {
        ...currentData,
        ...newData,
        // إعادة إدراج السعر المحول إذا كان موجوداً وصالحاً
        ...(preservedPrice && preservedPrice > 1 && {
          extractedPrice: preservedPrice,
          extractedCurrency: preservedCurrency || 'SAR'
        })
      };
      
      console.log('📋 البيانات المحدثة مع الحفاظ على السعر:', currentData);
      
      // تحديث فوري للسعر إذا لم يكن موجوداً
      if (!currentData.extractedPrice || currentData.extractedPrice <= 1) {
        updateExtractedPrice();
      }
      
      // إلغاء المؤقت السابق
      if (saveTimer) {
        clearTimeout(saveTimer);
      }
      
      // تأخير الحفظ لـ 8 ثوانٍ مع تحديثات دورية للسعر
      saveTimer = setTimeout(() => {
        console.log('⏰ حان وقت الحفظ بعد انتظار 8 ثوانٍ');
        
        // محاولة أخيرة لتحديث السعر قبل الحفظ
        if (!currentData.extractedPrice || currentData.extractedPrice <= 1) {
          const updated = updateExtractedPrice();
          if (!updated) {
            console.log('⚠️ لم يتم العثور على سعر محول صالح، ستتم محاولة الحفظ');
          }
        }
        
        saveAbandonedCart(currentData);
      }, 8000);
    }
  }
  
  // إضافة فحص دوري لتحديث السعر المحول
  function startPeriodicPriceUpdate() {
    setInterval(() => {
      if (isTracking && currentData && (currentData.name || currentData.email || currentData.phone)) {
        const { price, currency } = extractPriceAndCurrency();
        if (price && price > 1 && price !== currentData.extractedPrice) {
          currentData.extractedPrice = price;
          currentData.extractedCurrency = currency;
          console.log('🔄 تحديث دوري للسعر المحول:', price, currency);
        }
      }
    }, 5000); // فحص كل 5 ثوانٍ
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
    startPeriodicPriceUpdate();
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      startTracking();
      startPeriodicPriceUpdate();
    });
  }
  
  // تشغيل احتياطي بعد ثانيتين
  setTimeout(() => {
    startTracking();
    startPeriodicPriceUpdate();
  }, 2000);
  
  // إضافة دالة عامة للحصول على البيانات مع السعر المحول
  window.getCodformDataWithPrice = function() {
    console.log('📋 طلب البيانات مع السعر المحول');
    
    // التأكد من تحديث البيانات
    const latestData = extractData();
    currentData = { ...currentData, ...latestData };
    
    // التأكد من وجود السعر المحول
    if (!currentData.extractedPrice || currentData.extractedPrice <= 1) {
      const { price, currency } = extractPriceAndCurrency();
      if (price > 1) {
        currentData.extractedPrice = price;
        currentData.extractedCurrency = currency;
        console.log('✅ تم تحديث السعر المحول:', price, currency);
      }
    }
    
    console.log('📤 إرجاع البيانات مع السعر:', currentData);
    return currentData;
  };
  
  // إضافة دالة لضمان إرسال السعر مع البيانات النهائية
  window.enhanceFormDataWithPrice = function(formData) {
    console.log('🔧 تحسين بيانات النموذج بالسعر المحول');
    console.log('📥 البيانات الواردة:', formData);

    // ✅ CRITICAL DEBUG: فحص حالة CodformStateManager
    console.log('🔍 CRITICAL DEBUG - CodformStateManager availability:', !!window.CodformStateManager);
    if (window.CodformStateManager) {
      const state = window.CodformStateManager.getState();
      console.log('🔍 CRITICAL DEBUG - Full CodformStateManager state:', state);
    }

    // الحصول على البيانات المحدثة مع السعر
    const enhancedData = window.getCodformDataWithPrice();

    // إضافة بيانات عروض الكمية إذا كانت متاحة
    let selectedOfferData = null;
    let offerQuantity = 1; // الكمية الافتراضية

    if (window.CodformStateManager) {
      const state = window.CodformStateManager.getState();
      console.log('🔍 Current CodformStateManager state:', state);
      if (state && state.selectedOffer) {
        selectedOfferData = state.selectedOffer;
        // ✅ CRITICAL FIX: استخدام الكمية من العرض المحدد
        offerQuantity = selectedOfferData.quantity || state.currentQuantity || 1;
        console.log('🎯 تم إضافة بيانات العرض المختار إلى البيانات المحسنة:', selectedOfferData);
        console.log('🔢 الكمية من العرض المحدد:', offerQuantity);
      } else if (state && state.currentQuantity) {
        // إذا لم يكن هناك عرض محدد، استخدم الكمية الحالية
        offerQuantity = state.currentQuantity;
        console.log('🔢 الكمية من الحالة الحالية:', offerQuantity);
      } else {
        console.log('⚠️ No selectedOffer found in CodformStateManager state');
      }
    } else {
      console.log('⚠️ CodformStateManager not available');
    }

    // ✅ CRITICAL DEBUG: فحص مصادر الكمية المختلفة
    console.log('🔍 QUANTITY SOURCES DEBUG:');
    console.log('  - offerQuantity:', offerQuantity);
    console.log('  - formData.quantity:', formData.quantity);
    console.log('  - selectedOfferData:', selectedOfferData);

    // تحديد الكمية الصحيحة بالأولوية
    let finalQuantity = 1; // القيمة الافتراضية

    if (offerQuantity && offerQuantity > 1) {
      finalQuantity = offerQuantity;
      console.log('✅ Using offerQuantity:', finalQuantity);
    } else if (formData.quantity && parseInt(formData.quantity) > 1) {
      finalQuantity = parseInt(formData.quantity);
      console.log('✅ Using formData.quantity:', finalQuantity);
    } else if (selectedOfferData && selectedOfferData.quantity) {
      finalQuantity = parseInt(selectedOfferData.quantity);
      console.log('✅ Using selectedOfferData.quantity:', finalQuantity);
    } else {
      console.log('⚠️ Using default quantity 1');
    }

    console.log('🎯 FINAL QUANTITY DETERMINED:', finalQuantity);

    // دمج البيانات
    const finalData = {
      ...formData,
      extractedPrice: enhancedData.extractedPrice,
      extractedCurrency: enhancedData.extractedCurrency,
      // ✅ CRITICAL FIX: إضافة الكمية الصحيحة إلى البيانات المرسلة
      quantity: finalQuantity
    };

    // إضافة بيانات العرض المختار إذا كانت متاحة
    if (selectedOfferData) {
      finalData.selectedOffer = selectedOfferData;
      // ✅ تأكيد إضافة الكمية من العرض
      finalData.quantityOffer = {
        quantity: finalQuantity, // استخدام الكمية المحددة نهائياً
        finalPrice: selectedOfferData.finalPrice || enhancedData.extractedPrice,
        text: selectedOfferData.text,
        tag: selectedOfferData.tag
      };
      console.log('✅ Added selectedOffer to final data:', selectedOfferData);
      console.log('✅ Added quantityOffer with quantity:', finalQuantity);
    } else {
      console.log('❌ No selectedOffer data to add');
      // حتى لو لم يكن هناك عرض، أضف الكمية
      console.log('📝 Adding quantity without offer:', offerQuantity);
    }

    console.log('📤 البيانات المحسنة النهائية:', finalData);

    // ✅ CRITICAL DEBUG: تأكيد أن الدالة تعمل وترجع البيانات
    console.log('🎯 ENHANCE FUNCTION COMPLETED - Returning enhanced data with quantity:', finalData.quantity);
    console.log('🔍 FINAL DATA STRUCTURE:', {
      quantity: finalData.quantity,
      selectedOffer: finalData.selectedOffer,
      quantityOffer: finalData.quantityOffer,
      extractedPrice: finalData.extractedPrice,
      extractedCurrency: finalData.extractedCurrency
    });

    return finalData;
  };
  
  console.log('🏁 تم تحميل نظام تتبع السلال المتروكة مع المراقبة الدورية للأسعار وإضافات الإرسال');
})();