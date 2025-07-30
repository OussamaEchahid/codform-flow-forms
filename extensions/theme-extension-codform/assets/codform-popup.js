/* ===============================================================================
   CODFORM POPUP - Popup functionality
   =============================================================================== */

// Popup button renderer
window.renderPopupButton = function(field, formStyle) {
  const buttonText = field.label || 'اطلب الآن';
  const buttonStyle = field.style || {};
  const backgroundColor = getStyleValue(buttonStyle, 'backgroundColor', '#9b87f5');
  const textColor = getStyleValue(buttonStyle, 'color', '#ffffff');
  const borderRadius = getStyleValue(buttonStyle, 'borderRadius', '50px');
  const fontSize = getStyleValue(buttonStyle, 'fontSize', '18px');
  const position = getStyleValue(buttonStyle, 'position', 'fixed');
  const bottom = getStyleValue(buttonStyle, 'bottom', '20px');
  const right = getStyleValue(buttonStyle, 'right', '20px');
  
  const animationClass = getStyleValue(buttonStyle, 'animation', 'pulse-animation');
  
  return `
    <button onclick="openFormPopup()" class="${animationClass}" style="
      position: ${position};
      bottom: ${bottom};
      ${formStyle.formDirection === 'rtl' ? 'left' : 'right'}: ${right};
      background-color: ${backgroundColor};
      color: ${textColor};
      border: none;
      border-radius: ${borderRadius};
      padding: 16px 24px;
      font-size: ${fontSize};
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      transition: all 0.3s ease;
      font-family: 'Cairo', sans-serif;
      white-space: nowrap;
    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
      ${buttonText}
    </button>
    
    <style>
      .pulse-animation {
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0% { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
        50% { box-shadow: 0 6px 20px rgba(155, 135, 245, 0.4); }
        100% { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
      }
    </style>
  `;
};

// Open popup function
window.openFormPopup = function() {
  // Create popup modal
  const popup = document.createElement('div');
  popup.id = 'codform-popup-modal';
  popup.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    animation: fadeIn 0.3s ease;
  `;
  
  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 24px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    position: relative;
    animation: slideIn 0.3s ease;
    direction: rtl;
    text-align: right;
    font-family: 'Cairo', 'Noto Sans Arabic', 'Amiri', sans-serif;
  `;
  
  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '✕';
  closeBtn.style.cssText = `
    position: absolute;
    top: 12px;
    right: 12px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
    line-height: 1;
    padding: 4px;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  closeBtn.onclick = function() {
    document.body.removeChild(popup);
  };
  
  // Get the original form and copy it
  const originalForm = document.querySelector('[data-form-preview-id="form-preview-stable"]');
  
  if (originalForm) {
    const clonedForm = originalForm.cloneNode(true);
    clonedForm.style.background = 'transparent';
    clonedForm.style.border = 'none';
    clonedForm.style.boxShadow = 'none';
    clonedForm.style.padding = '0';
    clonedForm.style.margin = '0';
    
    modalContent.appendChild(closeBtn);
    modalContent.appendChild(clonedForm);
  } else {
    modalContent.innerHTML = `
      <button onclick="document.body.removeChild(document.getElementById('codform-popup-modal'))" style="position: absolute; top: 12px; right: 12px; background: none; border: none; font-size: 24px; cursor: pointer;">✕</button>
      <div style="direction: rtl; text-align: right; font-family: 'Cairo', sans-serif; padding: 20px;">
        <h3>نموذج الطلب</h3>
        <form onsubmit="handlePopupFormSubmission(event)">
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">الاسم الكامل *</label>
            <input type="text" name="fullName" required style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 16px; font-family: 'Cairo', sans-serif;" />
          </div>
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">رقم الهاتف *</label>
            <input type="tel" name="phone" required style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 16px; font-family: 'Cairo', sans-serif;" />
          </div>
          <button type="submit" style="background-color: #9b87f5; color: white; padding: 12px 24px; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; width: 100%; font-family: 'Cairo', sans-serif;">إرسال الطلب</button>
        </form>
      </div>
    `;
  }
  
  popup.appendChild(modalContent);
  document.body.appendChild(popup);
  
  // Close on backdrop click
  popup.onclick = function(e) {
    if (e.target === popup) {
      closeBtn.onclick();
    }
  };
};

// Handle popup form submission
window.handlePopupFormSubmission = async function(event) {
  event.preventDefault();
  const form = event.target;
  const submitBtn = form.querySelector('.codform-submit-btn, button[type="submit"]');
  const popup = document.getElementById('codform-popup-modal');
  
  const formInputs = form.querySelectorAll('input, textarea, select');
  const formData = {};
  
  formInputs.forEach(input => {
    if (input.name || input.id) {
      const fieldKey = input.name || input.id;
      if (input.type === 'checkbox') {
        formData[fieldKey] = input.checked;
      } else if (input.type === 'radio') {
        if (input.checked) {
          formData[fieldKey] = input.value;
        }
      } else {
        formData[fieldKey] = input.value;
      }
    }
  });
  
  try {
    const productId = getProductId();
    const shopDomain = getShopDomain();
    
    const response = await fetch('https://trlklwixfeaexhydzaue.supabase.co/functions/v1/api-submissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        formId: productId,
        shopDomain: shopDomain,
        productId: productId,
        data: formData
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      if (submitBtn) {
        submitBtn.innerHTML = '✅ تم الإرسال بنجاح';
        submitBtn.style.backgroundColor = '#22c55e';
        
        setTimeout(() => {
          popup.style.animation = 'fadeOut 0.3s ease';
          setTimeout(() => {
            document.body.removeChild(popup);
          }, 300);
        }, 2000);
      }
      
      if (result.thankYouUrl) {
        setTimeout(() => {
          window.location.href = result.thankYouUrl;
        }, 2500);
      }
    } else {
      alert('خطأ في إرسال الطلب. يرجى المحاولة مرة أخرى.');
    }
    
  } catch (error) {
    console.error('❌ CODFORM: Popup submission error:', error);
    alert('خطأ في إرسال الطلب. يرجى المحاولة مرة أخرى.');
  }
};

// CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  
  @keyframes slideIn {
    from { transform: scale(0.9) translateY(-20px); opacity: 0; }
    to { transform: scale(1) translateY(0); opacity: 1; }
  }
`;
document.head.appendChild(style);