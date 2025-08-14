/**
 * CODFORM - نظام تتبع النماذج المتروكة
 * يتتبع تفاعل المستخدمين مع النماذج وحفظ البيانات المتروكة
 */

class CodformAbandonedTracking {
  constructor() {
    this.abandonedCartId = null;
    this.formTrackingData = {};
    this.lastActivity = new Date();
    this.debounceTimer = null;
    this.isInitialized = false;
    
    // تهيئة النظام عند تحميل الصفحة
    this.init();
  }

  /**
   * تهيئة نظام التتبع
   */
  init() {
    if (this.isInitialized) {
      console.log('⚠️ Abandoned tracking already initialized');
      return;
    }

    console.log('🔄 Initializing abandoned cart tracking...');
    
    // انتظار تحميل النموذج ثم بدء التتبع
    this.waitForForm();
    this.isInitialized = true;
  }

  /**
   * انتظار تحميل النموذج
   */
  waitForForm() {
    const checkForm = () => {
      const form = this.getForm();
      if (form) {
        console.log('✅ Form found, setting up tracking');
        this.setupFormTracking(form);
      } else {
        console.log('⏳ Waiting for form to load...');
        setTimeout(checkForm, 1000);
      }
    };
    
    checkForm();
  }

  /**
   * الحصول على النموذج
   */
  getForm() {
    // البحث عن النموذج في جميع الأماكن المحتملة
    return document.querySelector('form[data-form-id]') || 
           document.querySelector('form') || 
           document.querySelector('[data-form-preview-id] form') ||
           document.querySelector('.codform-container form') ||
           document.querySelector('#codform-form') ||
           document.getElementById('order-form');
  }

  /**
   * إعداد تتبع النموذج
   */
  setupFormTracking(form) {
    if (!form) return;

    console.log('🔍 Setting up form tracking...');

    // إضافة مستمعين للحقول المهمة - تحسين البحث عن الحقول العربية
    const importantFields = form.querySelectorAll(`
      input[name*="email"], 
      input[name*="phone"], 
      input[name*="name"], 
      input[type="email"], 
      input[type="tel"], 
      input[type="text"],
      textarea,
      input[name*="customerEmail"],
      input[name*="customerPhone"],
      input[name*="customerName"],
      input[id*="email"],
      input[id*="phone"],
      input[id*="name"],
      input[placeholder*="بريد"],
      input[placeholder*="هاتف"],
      input[placeholder*="اسم"],
      input[placeholder*="Email"],
      input[placeholder*="Phone"],
      input[placeholder*="Name"]
    `);
    
    console.log(`🔍 Found ${importantFields.length} important fields in form`);
    
    importantFields.forEach((field, index) => {
      console.log(`📝 Setting up tracking for field ${index + 1}:`, {
        name: field.name,
        type: field.type,
        id: field.id,
        placeholder: field.placeholder
      });
      
      field.addEventListener('input', (e) => {
        console.log(`⌨️ Input detected in field: ${e.target.name || e.target.id}`);
        this.handleFieldChange(form, e.target);
      });
      
      field.addEventListener('blur', (e) => {
        console.log(`👁️ Blur detected in field: ${e.target.name || e.target.id}`);
        this.handleFieldChange(form, e.target);
      });
    });

    console.log(`✅ Form tracking setup complete for ${importantFields.length} fields`);
  }

  /**
   * معالجة تغيير الحقل
   */
  handleFieldChange(form, field) {
    console.log(`🔄 Field changed: ${field.name || field.id}, value: ${field.value}`);
    
    // إلغاء المؤقت السابق
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // تأخير المعالجة لتجنب الكثرة
    this.debounceTimer = setTimeout(() => {
      console.log('⏰ Processing form data after debounce...');
      this.processFormData(form);
    }, 1000); // تقليل الوقت إلى ثانية واحدة للاختبار
  }

  /**
   * معالجة بيانات النموذج
   */
  processFormData(form) {
    const currentData = this.extractFormData(form);
    console.log('🔍 Extracted current data:', currentData);
    
    // التحقق من وجود بيانات مهمة
    const hasImportant = this.hasImportantData(currentData);
    console.log('❓ Has important data:', hasImportant);
    console.log('❓ Already has cart ID:', !!this.abandonedCartId);
    
    if (hasImportant && !this.abandonedCartId) {
      console.log('✅ Creating abandoned cart with data:', currentData);
      this.saveAbandonedCart(currentData);
    } else if (hasImportant && this.abandonedCartId) {
      console.log('🔄 Cart already exists, updating activity:', this.abandonedCartId);
      this.updateLastActivity();
    } else {
      console.log('⏭️ No important data found, skipping save');
    }
    
    this.formTrackingData = currentData;
    this.lastActivity = new Date();
  }

  /**
   * استخراج بيانات النموذج
   */
  extractFormData(form) {
    const data = {};
    
    form.querySelectorAll('input, textarea, select').forEach(field => {
      const fieldName = field.name || field.id || field.getAttribute('data-field') || '';
      const fieldValue = field.value ? field.value.trim() : '';
      const fieldPlaceholder = field.placeholder || '';
      
      console.log(`🔍 Processing field:`, {
        name: fieldName,
        value: fieldValue,
        placeholder: fieldPlaceholder,
        type: field.type
      });
      
      if (fieldValue) {
        if (fieldName) {
          data[fieldName] = fieldValue;
        }
        
        // تحديد نوع الحقل بناءً على الاسم أو placeholder
        if (fieldName.toLowerCase().includes('email') || fieldPlaceholder.toLowerCase().includes('email') || fieldPlaceholder.includes('بريد')) {
          data.email = fieldValue;
        }
        if (fieldName.toLowerCase().includes('phone') || fieldPlaceholder.toLowerCase().includes('phone') || fieldPlaceholder.includes('هاتف')) {
          data.phone = fieldValue;
        }
        if (fieldName.toLowerCase().includes('name') || fieldPlaceholder.toLowerCase().includes('name') || fieldPlaceholder.includes('اسم')) {
          data.name = fieldValue;
        }
      }
    });
    
    console.log('📊 Final extracted form data:', data);
    return data;
  }

  /**
   * التحقق من وجود بيانات مهمة
   */
  hasImportantData(data) {
    // البحث عن البيانات المهمة بطرق مختلفة
    const hasDirectData = data.email || data.phone || data.name;
    const hasCustomerData = data.customerEmail || data.customerPhone || data.customerName;
    
    // البحث في جميع المفاتيح
    const hasKeywordData = Object.keys(data).some(key => {
      const lowerKey = key.toLowerCase();
      return lowerKey.includes('email') || 
             lowerKey.includes('phone') || 
             lowerKey.includes('name') ||
             lowerKey.includes('بريد') ||
             lowerKey.includes('هاتف') ||
             lowerKey.includes('اسم');
    });
    
    // التحقق من وجود قيم فعلية
    const hasValues = Object.values(data).some(value => 
      value && typeof value === 'string' && value.trim().length > 2
    );
    
    const hasData = (hasDirectData || hasCustomerData || hasKeywordData) && hasValues;
    
    console.log('🤔 Has important data analysis:', {
      hasDirectData,
      hasCustomerData, 
      hasKeywordData,
      hasValues,
      finalResult: hasData,
      dataKeys: Object.keys(data),
      dataValues: Object.values(data)
    });
    
    return hasData;
  }

  /**
   * حفظ السلة المتروكة
   */
  async saveAbandonedCart(data) {
    try {
      console.log('💾 Attempting to save abandoned cart with data:', data);
      
      // استخراج البيانات المهمة
      let customerEmail = data.email || data.customerEmail || '';
      let customerPhone = data.phone || data.customerPhone || '';  
      let customerName = data.name || data.customerName || '';
      
      // العثور على أي بيانات مهمة في الحقول الأخرى
      Object.keys(data).forEach(key => {
        const lowerKey = key.toLowerCase();
        const value = data[key];
        
        // البحث عن البريد الإلكتروني
        if ((lowerKey.includes('email') || lowerKey.includes('بريد')) && !customerEmail && value) {
          customerEmail = value;
        }
        // البحث عن رقم الهاتف
        if ((lowerKey.includes('phone') || lowerKey.includes('هاتف') || lowerKey.includes('mobile')) && !customerPhone && value) {
          customerPhone = value;
        }
        // البحث عن الاسم
        if ((lowerKey.includes('name') || lowerKey.includes('اسم') || lowerKey.includes('full')) && !customerName && value) {
          customerName = value;
        }
      });
      
      // إذا لم نجد بيانات محددة، نأخذ أول قيمة مفيدة
      if (!customerEmail && !customerPhone && !customerName) {
        const values = Object.values(data).filter(v => v && v.length > 2);
        if (values.length > 0) {
          customerName = values[0]; // نأخذ أول قيمة كاسم
          if (values.length > 1) {
            customerPhone = values[1]; // القيمة الثانية كهاتف
          }
        }
      }

      console.log('👤 Extracted customer info:', {
        email: customerEmail,
        phone: customerPhone,
        name: customerName
      });

      const cartData = {
        customer_email: customerEmail,
        customer_phone: customerPhone,
        customer_name: customerName,
        cart_items: [{
          product_id: window.codformProductId || 'unknown',
          quantity: data.quantity || 1,
          title: document.title || 'منتج'
        }],
        total_value: 1, // قيمة افتراضية
        currency: window.CodformFormData?.currency || 'SAR',
        form_id: window.codformProductId || 'default',
        shop_id: window.codformShopDomain || this.getShopDomain(),
        form_data: data // حفظ جميع بيانات النموذج
      };

      console.log('📦 Final cart data to be saved:', cartData);

      const response = await fetch('https://trlklwixfeaexhydzaue.supabase.co/functions/v1/abandoned-carts?action=create-abandoned-cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M'
        },
        body: JSON.stringify(cartData)
      });

      console.log('🌐 Response status:', response.status);
      console.log('🌐 Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const result = await response.text();
        console.log('📄 Raw response:', result);
        
        try {
          const jsonResult = JSON.parse(result);
          this.abandonedCartId = jsonResult.cart?.id;
          console.log('✅ Abandoned cart saved successfully:', this.abandonedCartId);
          console.log('📊 Full result:', jsonResult);
          
          // تحديث النشاط الأخير للسلة المحفوظة
          this.updateLastActivity();
        } catch (parseError) {
          console.error('❌ Error parsing response:', parseError);
          console.log('📄 Response text:', result);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to save abandoned cart:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Error saving abandoned cart:', error);
      console.error('❌ Error details:', error.message, error.stack);
    }
  }

  /**
   * تحديث آخر نشاط
   */
  async updateLastActivity() {
    if (!this.abandonedCartId) return;
    
    try {
      await fetch('https://trlklwixfeaexhydzaue.supabase.co/functions/v1/abandoned-carts?action=update-recovery-attempt', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M'
        },
        body: JSON.stringify({
          cart_id: this.abandonedCartId
        })
      });
    } catch (error) {
      console.error('❌ Error updating last activity:', error);
    }
  }

  /**
   * الحصول على دومين المتجر
   */
  getShopDomain() {
    return window.location.hostname || 'unknown';
  }

  /**
   * إيقاف التتبع
   */
  destroy() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.isInitialized = false;
    console.log('🛑 Abandoned tracking destroyed');
  }
}

// تهيئة النظام عند تحميل الصفحة
if (typeof window !== 'undefined') {
  console.log('🔧 Setting up abandoned tracking initialization...');
  
  // دالة تهيئة محسنة
  function initializeTracking() {
    try {
      console.log('🚀 Starting abandoned tracking initialization...');
      console.log('📄 Document ready state:', document.readyState);
      
      if (window.CodformAbandonedTracking && window.CodformAbandonedTracking.isInitialized) {
        console.log('⚠️ Tracking already initialized, skipping...');
        return;
      }
      
      if (window.CodformAbandonedTracking) {
        console.log('⚠️ Destroying old instance...');
        window.CodformAbandonedTracking.destroy();
      }
      
      console.log('🔄 Creating new tracking instance...');
      window.CodformAbandonedTracking = new CodformAbandonedTracking();
      console.log('✅ Abandoned tracking instance created successfully');
      
    } catch (error) {
      console.error('❌ Error initializing abandoned tracking:', error);
    }
  }
  
  // تهيئة فورية إذا كانت الصفحة جاهزة
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('📄 Document already ready, initializing immediately...');
    setTimeout(initializeTracking, 1000);
  } else {
    // انتظار تحميل الصفحة
    console.log('⏳ Waiting for document to load...');
    document.addEventListener('DOMContentLoaded', () => {
      console.log('📄 DOMContentLoaded event fired');
      setTimeout(initializeTracking, 1000);
    });
    
    // احتياطي إضافي للتأكد
    window.addEventListener('load', () => {
      console.log('📄 Window load event fired');
      if (!window.CodformAbandonedTracking || !window.CodformAbandonedTracking.isInitialized) {
        console.log('🔄 Backup initialization triggered');
        setTimeout(initializeTracking, 500);
      }
    });
  }
  
  // محاولة إضافية بعد 5 ثوان
  setTimeout(() => {
    if (!window.CodformAbandonedTracking || !window.CodformAbandonedTracking.isInitialized) {
      console.log('🔄 Final backup initialization after 5 seconds...');
      initializeTracking();
    }
  }, 5000);
}