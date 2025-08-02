/*
 * CODFORM - Countdown Timer Field
 * Renders countdown timer fields for Shopify theme integration
 */

window.renderCountdownField = function(field, formStyle, formLanguage = 'en') {
  console.log('🕐 CODFORM: Rendering countdown field:', field);
  
  if (!field) return '';
  
  const fieldStyle = field.style || {};
  const fieldId = field.id || 'countdown-' + Math.random().toString(36).substr(2, 9);
  
  // Default values
  const defaultTitle = formLanguage === 'ar' || /[\u0600-\u06FF]/.test(field.label) ? 'المتبقي على العرض' : 'Remaining on offer';
  const defaultFontFamily = 'Cairo';
  const defaultTitleColor = '#ffffff';
  const defaultBackgroundColor = '#9b87f5';
  const defaultCounterColor = '#9b87f5';
  
          // Field configuration  
  const title = field.label || field.title || defaultTitle;
  const endDate = (field.style && field.style.endDate) ? field.style.endDate : null;
  const backgroundColor = fieldStyle.backgroundColor || defaultBackgroundColor;
  const titleColor = fieldStyle.titleColor || fieldStyle.color || defaultTitleColor;
  const titleSize = fieldStyle.titleSize || fieldStyle.fontSize || '18px';
  const titleWeight = fieldStyle.titleWeight || fieldStyle.fontWeight || '700';
  const counterColor = fieldStyle.counterColor || defaultCounterColor;
  const counterFontSize = fieldStyle.counterFontSize || '24px';
  const counterFontWeight = fieldStyle.counterFontWeight || '700';
  const counterLineHeight = fieldStyle.counterLineHeight || '1.1';
  const borderRadius = fieldStyle.borderRadius || '12px';
  const fontFamily = fieldStyle.fontFamily || defaultFontFamily;
  
  // Labels
  const daysLabel = fieldStyle.daysLabel || (formLanguage === 'ar' ? 'أيام' : 'Days');
  const hoursLabel = fieldStyle.hoursLabel || (formLanguage === 'ar' ? 'ساعات' : 'Hrs');
  const minutesLabel = fieldStyle.minutesLabel || (formLanguage === 'ar' ? 'دقائق' : 'Mins');
  const secondsLabel = fieldStyle.secondsLabel || (formLanguage === 'ar' ? 'ثواني' : 'Secs');
  
  // Direction for RTL support
  const direction = formLanguage === 'ar' ? 'rtl' : 'ltr';
  const flexDirection = formLanguage === 'ar' ? 'row-reverse' : 'row';
  
  return `
    <div class="countdown-timer-container" style="margin: 20px 0 24px 0;" id="${fieldId}">
      <div style="
        background: ${backgroundColor};
        border: 2px solid ${backgroundColor};
        border-radius: ${borderRadius};
        padding: 16px;
        font-family: ${fontFamily}, Arial, sans-serif;
        direction: ${direction};
        box-shadow: 0 8px 32px rgba(155, 135, 245, 0.15);
      ">
        <h3 style="
          color: ${titleColor};
          font-size: ${titleSize};
          font-weight: ${titleWeight};
          text-align: center;
          margin: 0 0 12px 0;
        ">${title}</h3>
        
        <div class="countdown-display" style="
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          max-width: 100%;
          overflow: hidden;
          padding: 0 8px;
          flex-direction: ${flexDirection};
          flex-wrap: nowrap;
        ">
          <!-- Days -->
          <div class="countdown-box" style="
            background-color: rgba(255, 255, 255, 0.9);
            border-radius: 8px;
            padding: 4px 3px;
            min-width: calc(20% - 6px);
            max-width: calc(25% - 6px);
            flex: 1;
            box-shadow: 0 4px 16px rgba(155, 135, 245, 0.15);
            border: 1px solid rgba(155, 135, 245, 0.2);
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            text-align: center;
          ">
            <div id="${fieldId}-days" style="
              color: ${counterColor};
              font-size: clamp(16px, ${counterFontSize}, 28px);
              font-weight: ${counterFontWeight};
              line-height: ${counterLineHeight};
              margin: 0;
            ">00</div>
            <div style="
              font-size: clamp(10px, 12px, 14px);
              color: #666666;
              margin-top: 4px;
              font-weight: 500;
            ">${daysLabel}</div>
          </div>

          <!-- Separator -->
          <div style="
            color: ${counterColor};
            font-size: clamp(16px, ${counterFontSize}, 28px);
            font-weight: bold;
            line-height: 1;
            flex-shrink: 0;
          ">:</div>

          <!-- Hours -->
          <div class="countdown-box" style="
            background-color: rgba(255, 255, 255, 0.9);
            border-radius: 8px;
            padding: 4px 3px;
            min-width: calc(20% - 6px);
            max-width: calc(25% - 6px);
            flex: 1;
            box-shadow: 0 4px 16px rgba(155, 135, 245, 0.15);
            border: 1px solid rgba(155, 135, 245, 0.2);
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            text-align: center;
          ">
            <div id="${fieldId}-hours" style="
              color: ${counterColor};
              font-size: clamp(16px, ${counterFontSize}, 28px);
              font-weight: ${counterFontWeight};
              line-height: ${counterLineHeight};
              margin: 0;
            ">00</div>
            <div style="
              font-size: clamp(10px, 12px, 14px);
              color: #666666;
              margin-top: 4px;
              font-weight: 500;
            ">${hoursLabel}</div>
          </div>

          <!-- Separator -->
          <div style="
            color: ${counterColor};
            font-size: clamp(16px, ${counterFontSize}, 28px);
            font-weight: bold;
            line-height: 1;
            flex-shrink: 0;
          ">:</div>

          <!-- Minutes -->
          <div class="countdown-box" style="
            background-color: rgba(255, 255, 255, 0.9);
            border-radius: 8px;
            padding: 4px 3px;
            min-width: calc(20% - 6px);
            max-width: calc(25% - 6px);
            flex: 1;
            box-shadow: 0 4px 16px rgba(155, 135, 245, 0.15);
            border: 1px solid rgba(155, 135, 245, 0.2);
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            text-align: center;
          ">
            <div id="${fieldId}-minutes" style="
              color: ${counterColor};
              font-size: clamp(16px, ${counterFontSize}, 28px);
              font-weight: ${counterFontWeight};
              line-height: ${counterLineHeight};
              margin: 0;
            ">00</div>
            <div style="
              font-size: clamp(10px, 12px, 14px);
              color: #666666;
              margin-top: 4px;
              font-weight: 500;
            ">${minutesLabel}</div>
          </div>

          <!-- Separator -->
          <div style="
            color: ${counterColor};
            font-size: clamp(16px, ${counterFontSize}, 28px);
            font-weight: bold;
            line-height: 1;
            flex-shrink: 0;
          ">:</div>

          <!-- Seconds -->
          <div class="countdown-box" style="
            background-color: rgba(255, 255, 255, 0.9);
            border-radius: 8px;
            padding: 4px 3px;
            min-width: calc(20% - 6px);
            max-width: calc(25% - 6px);
            flex: 1;
            box-shadow: 0 4px 16px rgba(155, 135, 245, 0.15);
            border: 1px solid rgba(155, 135, 245, 0.2);
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            text-align: center;
          ">
            <div id="${fieldId}-seconds" style="
              color: ${counterColor};
              font-size: clamp(16px, ${counterFontSize}, 28px);
              font-weight: ${counterFontWeight};
              line-height: ${counterLineHeight};
              margin: 0;
            ">00</div>
            <div style="
              font-size: clamp(10px, 12px, 14px);
              color: #666666;
              margin-top: 4px;
              font-weight: 500;
            ">${secondsLabel}</div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Initialize countdown after DOM is ready
  setTimeout(function() {
    console.log('🕐 COUNTDOWN: Starting for field', fieldId);
    
    var endDateValue = null;
    if (field && field.style && field.style.endDate) {
      endDateValue = field.style.endDate;
      console.log('🕐 COUNTDOWN: Found endDate:', endDateValue);
    }
    
    var endTime;
    if (endDateValue) {
      endTime = new Date(endDateValue).getTime();
      if (isNaN(endTime)) {
        console.log('🕐 COUNTDOWN: Invalid date, using default');
        endTime = Date.now() + (2 * 24 * 60 * 60 * 1000);
      } else {
        console.log('🕐 COUNTDOWN: Using custom endTime:', new Date(endTime));
      }
    } else {
      console.log('🕐 COUNTDOWN: No endDate found, using default');
      endTime = Date.now() + (2 * 24 * 60 * 60 * 1000);
    }
    
    function updateCountdown() {
      var now = Date.now();
      var timeLeft = endTime - now;
      
      if (timeLeft <= 0) {
        endTime = Date.now() + (2 * 24 * 60 * 60 * 1000);
        timeLeft = endTime - Date.now();
      }
      
      var days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      var hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      var minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      var seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
      
      function padZero(num) {
        return num < 10 ? '0' + num : num.toString();
      }
      
      var daysEl = document.getElementById(fieldId + '-days');
      var hoursEl = document.getElementById(fieldId + '-hours');
      var minutesEl = document.getElementById(fieldId + '-minutes');
      var secondsEl = document.getElementById(fieldId + '-seconds');
      
      if (daysEl) daysEl.textContent = padZero(days);
      if (hoursEl) hoursEl.textContent = padZero(hours);
      if (minutesEl) minutesEl.textContent = padZero(minutes);
      if (secondsEl) secondsEl.textContent = padZero(seconds);
      
      console.log('🕐 COUNTDOWN: Updated values:', days, hours, minutes, seconds);
    }
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
    console.log('🕐 COUNTDOWN: Timer started for field', fieldId);
  }, 100);
};

console.log('🕐 CODFORM: Countdown field renderer loaded');