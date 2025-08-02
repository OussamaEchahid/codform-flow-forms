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
  const endDate = fieldStyle.endDate || null;
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
            <div class="countdown-number" data-unit="days" style="
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
            <div class="countdown-number" data-unit="hours" style="
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
            <div class="countdown-number" data-unit="minutes" style="
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
            <div class="countdown-number" data-unit="seconds" style="
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
      
      <script>
        (function() {
          console.log('🕐 CODFORM: Starting countdown script for ${fieldId}');
          
          // Calculate end time immediately
          let endTime;
          const endDateValue = '${endDate || ''}';
          
          if (endDateValue && endDateValue !== 'null' && endDateValue !== 'undefined' && endDateValue !== '' && endDateValue.length > 5) {
            try {
              endTime = new Date(endDateValue).getTime();
              if (isNaN(endTime)) {
                throw new Error('Invalid date');
              }
            } catch (e) {
              endTime = Date.now() + (2 * 24 * 60 * 60 * 1000) + (23 * 60 * 60 * 1000) + (59 * 60 * 1000) + (5 * 1000);
            }
          } else {
            endTime = Date.now() + (2 * 24 * 60 * 60 * 1000) + (23 * 60 * 60 * 1000) + (59 * 60 * 1000) + (5 * 1000);
          }
          
          function updateCountdown() {
            const now = Date.now();
            let timeLeft = endTime - now;
            
            if (timeLeft <= 0) {
              endTime = Date.now() + (2 * 24 * 60 * 60 * 1000) + (23 * 60 * 60 * 1000) + (59 * 60 * 1000) + (5 * 1000);
              timeLeft = endTime - Date.now();
            }
            
            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            
            function padZero(num) {
              return num.toString().padStart(2, '0');
            }
            
            // Find elements in this specific countdown container
            const container = document.getElementById('${fieldId}');
            if (!container) {
              console.log('🕐 CODFORM: Container ${fieldId} not found');
              return;
            }
            
            const elements = container.querySelectorAll('.countdown-number');
            console.log('🕐 CODFORM: Found ' + elements.length + ' countdown elements');
            
            elements.forEach(function(element) {
              const unit = element.getAttribute('data-unit');
              console.log('🕐 CODFORM: Processing unit:', unit);
              
              if (unit === 'days') {
                element.textContent = padZero(days);
                console.log('🕐 CODFORM: Set days to:', padZero(days));
              } else if (unit === 'hours') {
                element.textContent = padZero(hours);
                console.log('🕐 CODFORM: Set hours to:', padZero(hours));
              } else if (unit === 'minutes') {
                element.textContent = padZero(minutes);
                console.log('🕐 CODFORM: Set minutes to:', padZero(minutes));
              } else if (unit === 'seconds') {
                element.textContent = padZero(seconds);
                console.log('🕐 CODFORM: Set seconds to:', padZero(seconds));
              }
            });
          }
          
          // Start countdown immediately
          updateCountdown();
          
          // Update every second
          setInterval(updateCountdown, 1000);
          
          console.log('🕐 CODFORM: Countdown initialized with end time:', new Date(endTime));
        })();
      </script>
    </div>
  `;
};

console.log('🕐 CODFORM: Countdown field renderer loaded');