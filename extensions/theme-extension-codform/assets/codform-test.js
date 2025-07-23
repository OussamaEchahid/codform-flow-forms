
/**
 * CODFORM Test Suite - اختبار النظام
 * هذا الملف لاختبار عمل النظام الجديد
 */

window.CODFORM_TEST = (function() {
  'use strict';

  // اختبار الاتصال بـ API
  async function testApiConnection(shopDomain, productId) {
    console.log('🧪 CODFORM TEST: Testing API connection...');
    
    try {
      const response = await fetch(`https://trlklwixfeaexhydzaue.supabase.co/functions/v1/forms-product?shop=${shopDomain}&product=${productId}`);
      const data = await response.json();
      
      console.log('✅ API Response:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ API Test Failed:', error);
      return { success: false, error: error.message };
    }
  }

  // اختبار عرض النموذج
  function testFormRendering() {
    console.log('🧪 CODFORM TEST: Testing form rendering...');
    
    const testData = {
      success: true,
      form: {
        id: 'test-form',
        title: 'Test Form',
        data: [{
          id: '1',
          title: 'Test Step',
          fields: [
            {
              id: '1',
              type: 'form-title',
              label: 'نموذج اختبار',
              helpText: 'هذا نموذج للاختبار'
            },
            {
              id: '2',
              type: 'text',
              label: 'الاسم الكامل',
              placeholder: 'أدخل اسمك الكامل',
              required: true
            },
            {
              id: '3',
              type: 'email',
              label: 'البريد الإلكتروني',
              placeholder: 'أدخل بريدك الإلكتروني'
            },
            {
              id: '4',
              type: 'submit',
              label: 'إرسال الطلب'
            }
          ]
        }],
        style: {
          primaryColor: '#3b82f6',
          borderRadius: '8px'
        }
      },
      quantity_offers: {
        offers: [
          {
            id: '1',
            text: 'اشترِ قطعة واحدة',
            tag: 'عادي',
            quantity: 1,
            discountType: 'none',
            discountValue: 0
          },
          {
            id: '2',
            text: 'اشترِ قطعتين',
            tag: 'الأفضل',
            quantity: 2,
            discountType: 'percentage',
            discountValue: 15
          }
        ],
        styling: {
          backgroundColor: '#ffffff',
          textColor: '#1f2937',
          tagColor: '#22c55e',
          priceColor: '#ef4444'
        }
      },
      product: {
        id: 'test-product',
        title: 'منتج تجريبي',
        price: 100,
        currency: 'SAR',
        image: null
      }
    };

    // إنشاء حاوية اختبار
    const testContainer = document.createElement('div');
    testContainer.id = 'codform-test-container';
    testContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 80%;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      z-index: 9999;
    `;

    document.body.appendChild(testContainer);

    // إضافة زر إغلاق
    const closeButton = document.createElement('button');
    closeButton.textContent = 'إغلاق الاختبار';
    closeButton.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: #ef4444;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
    `;
    closeButton.onclick = () => document.body.removeChild(testContainer);
    testContainer.appendChild(closeButton);

    // اختبار العرض
    if (window.CODFORM && window.CODFORM.renderForm) {
      window.CODFORM.renderForm(testContainer, testData, 'test');
      console.log('✅ CODFORM TEST: Form rendered successfully');
      return true;
    } else {
      console.error('❌ CODFORM TEST: CODFORM not available');
      return false;
    }
  }

  // اختبار شامل
  async function runFullTest() {
    console.log('🧪 CODFORM TEST: Running full test suite...');
    
    const results = {
      apiTest: await testApiConnection('codmagnet.com', '7597766344806'),
      renderTest: testFormRendering()
    };

    console.log('📊 CODFORM TEST: Test Results:', results);
    return results;
  }

  return {
    testApi: testApiConnection,
    testRender: testFormRendering,
    runFullTest: runFullTest
  };
})();

// إضافة دالة للاختبار السريع
window.testCodform = () => {
  return window.CODFORM_TEST.runFullTest();
};

console.log('🧪 CODFORM TEST: Test suite loaded. Run window.testCodform() to test.');
