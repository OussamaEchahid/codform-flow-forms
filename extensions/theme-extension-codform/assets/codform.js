
/* 
 * CODFORM - Form Display Engine
 * النظام الجديد لعرض النماذج مع عروض الكمية
 */

window.CODFORM = (function() {
  'use strict';

  console.log("🚀 CODFORM v2.0 - Form Display Engine Loaded");

  // دالة إنشاء حقول النموذج
  function createFormField(field, formStyle = {}) {
    const fieldContainer = document.createElement('div');
    fieldContainer.className = 'codform-field-container';
    fieldContainer.style.cssText = `
      margin-bottom: 16px;
      font-family: ${formStyle.fontFamily || 'Cairo, Arial, sans-serif'};
    `;

    switch (field.type) {
      case 'form-title':
        return createTitleField(field, formStyle);
      
      case 'text':
      case 'email':
      case 'phone':
        return createInputField(field, formStyle);
      
      case 'textarea':
        return createTextareaField(field, formStyle);
      
      case 'submit':
        return createSubmitButton(field, formStyle);
      
      case 'text/html':
        return createHtmlField(field, formStyle);
      
      default:
        console.warn('Unsupported field type:', field.type);
        return fieldContainer;
    }
  }

  // دالة إنشاء حقل العنوان
  function createTitleField(field, formStyle) {
    const titleContainer = document.createElement('div');
    titleContainer.style.cssText = `
      text-align: center;
      margin-bottom: 24px;
      padding: 20px;
    `;

    if (field.label) {
      const title = document.createElement('h2');
      title.textContent = field.label;
      title.style.cssText = `
        font-size: ${formStyle.fontSize || '24px'};
        font-weight: bold;
        color: ${formStyle.primaryColor || '#1f2937'};
        margin: 0 0 8px 0;
      `;
      titleContainer.appendChild(title);
    }

    if (field.helpText) {
      const description = document.createElement('p');
      description.textContent = field.helpText;
      description.style.cssText = `
        font-size: 16px;
        color: #6b7280;
        margin: 0;
        line-height: 1.5;
      `;
      titleContainer.appendChild(description);
    }

    return titleContainer;
  }

  // دالة إنشاء حقول الإدخال
  function createInputField(field, formStyle) {
    const container = document.createElement('div');
    container.style.cssText = `
      margin-bottom: 16px;
    `;

    if (field.label) {
      const label = document.createElement('label');
      label.textContent = field.label + (field.required ? ' *' : '');
      label.style.cssText = `
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: ${formStyle.primaryColor || '#1f2937'};
        font-size: 14px;
      `;
      container.appendChild(label);
    }

    const input = document.createElement('input');
    input.type = field.type === 'phone' ? 'tel' : field.type;
    input.placeholder = field.placeholder || '';
    input.required = field.required || false;
    input.style.cssText = `
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: ${formStyle.borderRadius || '8px'};
      font-size: 16px;
      font-family: inherit;
      transition: border-color 0.2s;
      background: white;
    `;

    input.addEventListener('focus', function() {
      this.style.borderColor = formStyle.primaryColor || '#3b82f6';
      this.style.outline = 'none';
    });

    input.addEventListener('blur', function() {
      this.style.borderColor = '#e5e7eb';
    });

    container.appendChild(input);

    if (field.helpText) {
      const helpText = document.createElement('div');
      helpText.textContent = field.helpText;
      helpText.style.cssText = `
        font-size: 12px;
        color: #6b7280;
        margin-top: 4px;
      `;
      container.appendChild(helpText);
    }

    return container;
  }

  // دالة إنشاء حقل النص المتعدد الأسطر
  function createTextareaField(field, formStyle) {
    const container = document.createElement('div');
    container.style.cssText = `
      margin-bottom: 16px;
    `;

    if (field.label) {
      const label = document.createElement('label');
      label.textContent = field.label + (field.required ? ' *' : '');
      label.style.cssText = `
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: ${formStyle.primaryColor || '#1f2937'};
        font-size: 14px;
      `;
      container.appendChild(label);
    }

    const textarea = document.createElement('textarea');
    textarea.placeholder = field.placeholder || '';
    textarea.required = field.required || false;
    textarea.rows = field.rows || 4;
    textarea.style.cssText = `
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: ${formStyle.borderRadius || '8px'};
      font-size: 16px;
      font-family: inherit;
      transition: border-color 0.2s;
      background: white;
      resize: vertical;
    `;

    textarea.addEventListener('focus', function() {
      this.style.borderColor = formStyle.primaryColor || '#3b82f6';
      this.style.outline = 'none';
    });

    textarea.addEventListener('blur', function() {
      this.style.borderColor = '#e5e7eb';
    });

    container.appendChild(textarea);

    if (field.helpText) {
      const helpText = document.createElement('div');
      helpText.textContent = field.helpText;
      helpText.style.cssText = `
        font-size: 12px;
        color: #6b7280;
        margin-top: 4px;
      `;
      container.appendChild(helpText);
    }

    return container;
  }

  // دالة إنشاء زر الإرسال
  function createSubmitButton(field, formStyle) {
    const button = document.createElement('button');
    button.type = 'submit';
    button.textContent = field.label || 'إرسال الطلب';
    button.style.cssText = `
      width: 100%;
      padding: 16px 24px;
      background-color: ${formStyle.primaryColor || '#3b82f6'};
      color: white;
      border: none;
      border-radius: ${formStyle.borderRadius || '8px'};
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
      margin-top: 8px;
    `;

    button.addEventListener('mouseenter', function() {
      this.style.opacity = '0.9';
      this.style.transform = 'translateY(-1px)';
    });

    button.addEventListener('mouseleave', function() {
      this.style.opacity = '1';
      this.style.transform = 'translateY(0)';
    });

    button.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('📋 Form submitted');
      
      // يمكن إضافة منطق الإرسال هنا
      alert('تم إرسال الطلب بنجاح!');
    });

    return button;
  }

  // دالة إنشاء حقل HTML
  function createHtmlField(field, formStyle) {
    const container = document.createElement('div');
    container.innerHTML = field.content || '';
    container.style.cssText = `
      margin-bottom: 16px;
    `;
    return container;
  }

  // دالة عرض عروض الكمية
  function displayQuantityOffers(offers, styling, productData, currency = 'SAR') {
    const container = document.createElement('div');
    container.style.cssText = `
      margin-bottom: 20px;
      padding: 16px;
      background: #f9fafb;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    `;

    if (!offers || offers.length === 0) {
      return container;
    }

    const title = document.createElement('h3');
    title.textContent = 'عروض الكمية';
    title.style.cssText = `
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 16px 0;
      text-align: center;
    `;
    container.appendChild(title);

    const offersContainer = document.createElement('div');
    offersContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
    `;

    offers.forEach((offer, index) => {
      const offerElement = createOfferElement(offer, index, styling, productData, currency);
      offersContainer.appendChild(offerElement);
    });

    container.appendChild(offersContainer);
    return container;
  }

  // دالة إنشاء عنصر العرض
  function createOfferElement(offer, index, styling, productData, currency) {
    const isHighlighted = index === 1;
    const basePrice = productData?.price || 150;
    
    let totalPrice = basePrice * offer.quantity;
    let originalPrice = totalPrice;
    let savingsPercentage = 0;

    if (offer.discountType === 'percentage' && offer.discountValue > 0) {
      const discount = (originalPrice * offer.discountValue) / 100;
      totalPrice = originalPrice - discount;
      savingsPercentage = offer.discountValue;
    } else if (offer.discountType === 'fixed' && offer.discountValue > 0) {
      totalPrice = originalPrice - offer.discountValue;
      savingsPercentage = Math.round((offer.discountValue / originalPrice) * 100);
    }

    const offerElement = document.createElement('div');
    offerElement.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      background: ${isHighlighted ? '#f0fdf4' : styling?.backgroundColor || '#ffffff'};
      border: 2px solid ${isHighlighted ? '#22c55e' : '#e5e7eb'};
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-family: 'Cairo', Arial, sans-serif;
    `;

    offerElement.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
      this.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
    });

    offerElement.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    });

    // الجزء الأيسر: المعلومات
    const leftSection = document.createElement('div');
    leftSection.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    `;

    // صورة المنتج
    const imageContainer = document.createElement('div');
    imageContainer.style.cssText = `
      width: 50px;
      height: 50px;
      background: #f3f4f6;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    `;

    if (productData?.image) {
      const img = document.createElement('img');
      img.src = productData.image;
      img.alt = productData.title || 'المنتج';
      img.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
      `;
      imageContainer.appendChild(img);
    } else {
      const icon = document.createElement('div');
      icon.innerHTML = '📦';
      icon.style.fontSize = '20px';
      imageContainer.appendChild(icon);
    }

    leftSection.appendChild(imageContainer);

    // معلومات النص
    const textContainer = document.createElement('div');
    
    const offerText = document.createElement('div');
    offerText.textContent = offer.text || `اشترِ ${offer.quantity} قطعة`;
    offerText.style.cssText = `
      font-weight: 600;
      font-size: 15px;
      color: ${styling?.textColor || '#1f2937'};
      margin-bottom: 4px;
    `;
    textContainer.appendChild(offerText);

    const tagsContainer = document.createElement('div');
    tagsContainer.style.cssText = `
      display: flex;
      gap: 8px;
      align-items: center;
    `;

    if (offer.tag) {
      const tag = document.createElement('span');
      tag.textContent = offer.tag;
      tag.style.cssText = `
        background: ${styling?.tagColor || '#22c55e'};
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
      `;
      tagsContainer.appendChild(tag);
    }

    if (savingsPercentage > 0) {
      const savings = document.createElement('span');
      savings.textContent = `وفر ${savingsPercentage}%`;
      savings.style.cssText = `
        background: #ef4444;
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
      `;
      tagsContainer.appendChild(savings);
    }

    textContainer.appendChild(tagsContainer);
    leftSection.appendChild(textContainer);

    // الجزء الأيمن: السعر
    const priceSection = document.createElement('div');
    priceSection.style.cssText = `
      text-align: right;
      min-width: 80px;
    `;

    if (savingsPercentage > 0) {
      const originalPriceElement = document.createElement('div');
      originalPriceElement.textContent = `${originalPrice.toFixed(2)} ${currency}`;
      originalPriceElement.style.cssText = `
        font-size: 12px;
        color: #6b7280;
        text-decoration: line-through;
        margin-bottom: 2px;
      `;
      priceSection.appendChild(originalPriceElement);
    }

    const finalPrice = document.createElement('div');
    finalPrice.textContent = `${totalPrice.toFixed(2)} ${currency}`;
    finalPrice.style.cssText = `
      font-size: 16px;
      font-weight: bold;
      color: ${styling?.priceColor || '#ef4444'};
    `;
    priceSection.appendChild(finalPrice);

    if (offer.quantity > 1) {
      const perItem = document.createElement('div');
      perItem.textContent = `${basePrice.toFixed(2)} ${currency} × ${offer.quantity}`;
      perItem.style.cssText = `
        font-size: 10px;
        color: #6b7280;
        margin-top: 2px;
      `;
      priceSection.appendChild(perItem);
    }

    offerElement.appendChild(leftSection);
    offerElement.appendChild(priceSection);

    return offerElement;
  }

  // دالة عرض النموذج الرئيسية
  function renderForm(container, data, blockId) {
    console.log('🎨 CODFORM: Rendering form with data:', data);
    
    if (!container || !data) {
      console.error('❌ CODFORM: Invalid container or data');
      return;
    }

    // مسح المحتوى السابق
    container.innerHTML = '';

    // إنشاء النموذج الرئيسي
    const form = document.createElement('form');
    form.style.cssText = `
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      font-family: 'Cairo', Arial, sans-serif;
    `;

    const formStyle = data.form?.style || {};
    const fields = data.form?.data?.[0]?.fields || [];

    // عرض عروض الكمية في الأعلى إذا كانت موجودة
    if (data.quantity_offers && data.quantity_offers.offers && data.quantity_offers.offers.length > 0) {
      const offersElement = displayQuantityOffers(
        data.quantity_offers.offers,
        data.quantity_offers.styling,
        data.product,
        data.form?.currency || 'SAR'
      );
      form.appendChild(offersElement);
    }

    // عرض حقول النموذج
    fields.forEach(field => {
      const fieldElement = createFormField(field, formStyle);
      form.appendChild(fieldElement);
    });

    // إضافة النموذج إلى الحاوية
    container.appendChild(form);

    // إضافة تأثير الظهور
    setTimeout(() => {
      form.style.opacity = '0';
      form.style.transform = 'translateY(20px)';
      form.style.transition = 'all 0.5s ease-out';
      
      setTimeout(() => {
        form.style.opacity = '1';
        form.style.transform = 'translateY(0)';
      }, 100);
    }, 50);

    console.log('✅ CODFORM: Form rendered successfully');
  }

  // Public API
  return {
    renderForm: renderForm,
    version: '2.0.0'
  };
})();

// جعل الكود متاحاً عالمياً
window.codform = window.CODFORM;

console.log('✅ CODFORM: Ready to render forms');
