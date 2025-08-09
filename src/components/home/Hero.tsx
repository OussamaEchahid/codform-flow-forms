
import React from 'react';
import { Button } from '@/components/ui/button';

const FORM_PREVIEW_HTML = `<div data-form-preview-id="form-preview-stable" class="codform-arabic-form" data-form-loaded="true" style="background-color: rgb(249, 250, 251); border: 2px solid rgb(155, 135, 245); border-radius: 1.2rem; padding: 20px; box-shadow: rgba(0, 0, 0, 0.05) 0px 4px 6px; max-width: 500px; margin: 20px auto; font-family: inherit; direction: rtl; box-sizing: border-box; gap: 16px; position: relative; overflow: hidden;">
            <div class="codform-dynamic-form">
              <div id="quantity-offers-before-ASFhDTFBYRlN3VDNFK__codform_cod_forms_codform_form_8071462355131" style="display: none;"></div>
          <div id="quantity-offers-before-form" class="quantity-offers-container" style="margin: 16px 0px; display: block;"><div data-offer="0" style="background: rgb(255, 255, 255); border: 2px solid rgb(229, 231, 235); border-radius: 8px; padding: 12px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; font-family: Cairo, Arial, sans-serif; cursor: pointer; direction: rtl; text-align: right; box-shadow: rgba(0, 0, 0, 0.1) 0px 2px 4px; transition: 0.3s; transform: translateY(0px);">
          <div style="display: flex; align-items: center; gap: 12px; flex-direction: row;">
            <div style="width: 48px; height: 48px; background: #f3f4f6; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; overflow: hidden;">
              
                <img src="https://cdn.shopify.com/s/files/1/0656/4085/7787/files/O1CN01IhObpx1dJyY3bgREb__379793716_jpg.webp?v=1746645898" alt="njhygfjuygfujk" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                <svg style="width: 32px; height: 32px; color: #9ca3af; display: none;" fill="currentColor" viewBox="0 0 20 20">
                  <path fillrule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" cliprule="evenodd"></path>
                </svg>
              
            </div>
            
            <div style="flex: 1;">
              <div style="font-weight: 600; color: #1f2937; text-align: right;">
                اشتر 3 واحصل على 1 مجانًا
              </div>
              <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px; justify-content: flex-start; direction: rtl;">
                
                  <div style="background: #22c55e; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; text-align: center;">
                    هدية مجانية
                  </div>
                
                
              </div>
            </div>
          </div>

        <div style="text-align: left; direction: rtl;">
          
          <div style="font-weight: 700; font-size: 18px; color: #059669;">
            MAD 60.0
          </div>
          
            <div style="font-size: 12px; color: #6b7280; margin-top: 2px;"></div>
          
        </div>
      </div><div data-offer="1" style="background: rgb(255, 255, 255); border: 2px solid rgb(34, 197, 94); border-radius: 8px; padding: 12px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; font-family: Cairo, Arial, sans-serif; cursor: pointer; direction: rtl; text-align: right; box-shadow: rgba(0, 0, 0, 0.1) 0px 2px 4px; transition: 0.3s; transform: translateY(0px);">
          <div style="display: flex; align-items: center; gap: 12px; flex-direction: row;">
            <div style="width: 48px; height: 48px; background: #f3f4f6; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; overflow: hidden;">
              
                <img src="https://cdn.shopify.com/s/files/1/0656/4085/7787/files/O1CN01IhObpx1dJyY3bgREb__379793716_jpg.webp?v=1746645898" alt="njhygfjuygfujk" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                <svg style="width: 32px; height: 32px; color: #9ca3af; display: none;" fill="currentColor" viewBox="0 0 20 20">
                  <path fillrule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" cliprule="evenodd"></path>
                </svg>
              
            </div>
            
            <div style="flex: 1;">
              <div style="font-weight: 600; color: #1f2937; text-align: right;">
                اشتر 5 واحصل على 2 مجانًا
              </div>
              <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px; justify-content: flex-start; direction: rtl;">
                
                  <div style="background: #22c55e; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; text-align: center;">
                    هدية مجانية
                  </div>
                
                
              </div>
            </div>
          </div>

        <div style="text-align: left; direction: rtl;">
          
          <div style="font-weight: 700; font-size: 18px; color: #059669;">
            MAD 100.0
          </div>
          
            <div style="font-size: 12px; color: #6b7280; margin-top: 2px;"></div>
          
        </div>
      </div></div>
          <form class="codform-form-fields" style="background: transparent; margin: 0; padding: 0;" id="codform-main-form" onsubmit="handleFormSubmission(event)">
            
      <div class="form-title-field w-full" style="
        color: #000000;
        font-size: 24px;
        font-weight: bold;
        font-family: Cairo, Tajawal, Arial, sans-serif;
        text-align: center;
        margin: 0px;
        line-height: 1.4;
        direction: rtl;
        padding: 0px 0px 24px 0px;
        width: 100%;
        display: block;
        background: none;
        border: none;
      ">
        الرجاء تعبئة الاستمارة كاملةً لإرسال طلبكم
      </div>
    
      <div class="codform-field-wrapper" style="margin-bottom: 4px; direction: rtl;">
        
          <label for="text-1754764992869-1" style="
            display: block;
            color: #333333;
            font-size: 15px;
            font-weight: 500;
            margin-bottom: 4px;
            font-family: 'Cairo', sans-serif;
          ">
            الاسم الكامل<span style="color: #EF4444; margin-left: 4px;">*</span>
          </label>
        
        
        <div style="position: relative;">
          
        <div style="
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #6b7280;
          pointer-events: none;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
      <circle cx="12" cy="7" r="4" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></circle>
    </svg>
        </div>
      
          
          <input type="text" id="text-1754764992869-1" name="text-1754764992869-1" placeholder="أدخل الاسم الكامل" required="" style="
              width: 100%;
              background-color: #FFFFFF;
              border: 1px solid rgb(209, 213, 219);
              border-radius: 8px;
              padding-top: 10px;
              padding-bottom: 10px;
              padding-left: 12px;
              padding-right: 40px;
              font-size: 13px;
              color: rgb(31, 41, 55);
              font-family: inherit;
              outline: none;
              transition: all 0.2s ease;
              box-shadow: rgba(0, 0, 0, 0.05) 0px 1px 2px;
              min-height: 44px;
              box-sizing: border-box;
              direction: rtl;
              text-align: right;
            " onfocus="this.style.borderColor='#3b82f6'; this.style.boxShadow='0 0 0 3px #3b82f620'" onblur="this.style.borderColor='rgb(209, 213, 219)'; this.style.boxShadow='rgba(0, 0, 0, 0.05) 0px 1px 2px'">
        </div>
        
      </div>
    
      <div class="codform-field-wrapper" style="margin-bottom: 4px; direction: rtl;">
        
          <label for="phone-1754764992869-2" style="
            display: block;
            color: #333333;
            font-size: 15px;
            font-weight: 500;
            margin-bottom: 4px;
            font-family: 'Cairo', sans-serif;
          ">
            رقم الهاتف<span style="color: #EF4444; margin-left: 4px;">*</span>
          </label>
        
        
        <div style="position: relative;">
          
        <div style="
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #6b7280;
          pointer-events: none;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>
        </div>
      
          
          <input type="tel" id="phone-1754764992869-2" name="phone-1754764992869-2" placeholder="أدخل رقم الهاتف" required="" style="
              width: 100%;
              background-color: #FFFFFF;
              border: 1px solid rgb(209, 213, 219);
              border-radius: 8px;
              padding-top: 10px;
              padding-bottom: 10px;
              padding-left: 12px;
              padding-right: 40px;
              font-size: 13px;
              color: rgb(31, 41, 55);
              font-family: inherit;
              outline: none;
              transition: all 0.2s ease;
              box-shadow: rgba(0, 0, 0, 0.05) 0px 1px 2px;
              min-height: 44px;
              box-sizing: border-box;
              direction: rtl;
              text-align: right;
            " onfocus="this.style.borderColor='#3b82f6'; this.style.boxShadow='0 0 0 3px #3b82f620'" onblur="this.style.borderColor='rgb(209, 213, 219)'; this.style.boxShadow='rgba(0, 0, 0, 0.05) 0px 1px 2px'">
        </div>
        
      </div>
    
      <div class="codform-field-wrapper" style="margin-bottom: 4px; direction: rtl;">
        
          <label for="city-1754764992869" style="
            display: block;
            color: #333333;
            font-size: 15px;
            font-weight: 500;
            margin-bottom: 4px;
            font-family: 'Cairo', sans-serif;
          ">
            المدينة<span style="color: #EF4444; margin-left: 4px;">*</span>
          </label>
        
        
        <div style="position: relative;">
          
        <div style="
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #6b7280;
          pointer-events: none;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
      <circle cx="12" cy="10" r="3" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></circle>
    </svg>
        </div>
      
          
          <input type="text" id="city-1754764992869" name="city-1754764992869" placeholder="أدخل المدينة" required="" style="
              width: 100%;
              background-color: #FFFFFF;
              border: 1px solid rgb(209, 213, 219);
              border-radius: 8px;
              padding-top: 10px;
              padding-bottom: 10px;
              padding-left: 12px;
              padding-right: 40px;
              font-size: 13px;
              color: rgb(31, 41, 55);
              font-family: inherit;
              outline: none;
              transition: all 0.2s ease;
              box-shadow: rgba(0, 0, 0, 0.05) 0px 1px 2px;
              min-height: 44px;
              box-sizing: border-box;
              direction: rtl;
              text-align: right;
            " onfocus="this.style.borderColor='#3b82f6'; this.style.boxShadow='0 0 0 3px #3b82f620'" onblur="this.style.borderColor='rgb(209, 213, 219)'; this.style.boxShadow='rgba(0, 0, 0, 0.05) 0px 1px 2px'">
        </div>
        
      </div>
    
        <div class="codform-field-wrapper" style="
          margin-bottom: 10px;
          direction: rtl;
        ">
          
            <label for="textarea-1754764992869" style="
              display: block;
              color: rgb(51, 65, 85);
              font-size: 15px;
              font-weight: 500;
                  margin-bottom: 4px;
              font-family: 'Cairo', sans-serif;
            ">
              العنوان<span style="color: #EF4444; margin-left: 4px;">*</span>
            </label>
          
          
          <div style="position: relative;">
            
          <textarea id="textarea-1754764992869" name="textarea-1754764992869" placeholder="أدخل العنوان الكامل" required="" rows="4" style="
              width: 100%;
              background-color: #FFFFFF;
              border: 1px solid rgb(209, 213, 219);
              border-radius: 8px;
              padding: 10px 12px;
              font-size: 13px;
              color: rgb(31, 41, 55);
              font-family: inherit;
              outline: none;
              transition: all 0.2s ease;
              box-shadow: rgba(0, 0, 0, 0.05) 0px 1px 2px;
              resize: none;
              min-height: 80px;
              height: 80px;
              box-sizing: border-box;
              direction: rtl;
              text-align: right;
            " onfocus="this.style.borderColor='#3b82f6'; this.style.boxShadow='0 0 0 3px #3b82f620'" onblur="this.style.borderColor='rgb(209, 213, 219)'; this.style.boxShadow='rgba(0, 0, 0, 0.05) 0px 1px 2px'"></textarea>
          </div>
          
          
        </div>
      
        <div class="cart-summary-field" data-currency="MAD" style="background: rgb(255, 255, 255); border: 1px solid rgb(229, 231, 235); border-radius: 8px; padding: 16px; margin: 16px 0px; direction: rtl; font-family: Cairo;">
          <div class="summary-row" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #6b7280;">المجموع الفرعي:</span>
            <span class="subtotal-value" data-amount="100" style="color: rgb(55, 65, 81); font-size: 14px; font-family: Cairo;">100.0 MAD</span>
          </div>
          
          <div class="summary-row discount-row" style="display: none; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #ef4444;">الخصم:</span>
            <span class="discount-value" data-amount="0" style="color: rgb(55, 65, 81); font-size: 14px; font-family: Cairo;">-0.00 MAD</span>
          </div>
          
          <div class="summary-row" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #6b7280;">الشحن:</span>
            <span class="shipping-value" data-amount="0" style="color: rgb(55, 65, 81); font-size: 14px; font-family: Cairo;">مجاني</span>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 12px 0;">
          
          <div class="summary-row" style="display: flex; justify-content: space-between; font-weight: 600; font-size: 18px;">
            <span style="color: #1f2937;">المجموع الكامل:</span>
            <span class="total-value" data-amount="100" style="color: rgb(22, 163, 74); font-size: 14px; font-weight: 600;">100.0 MAD</span>
          </div>
        </div>
      
        <div class="codform-submit-wrapper" style="
          margin-top: 20px;
          text-align: center;
        ">
          <button type="submit" class="codform-submit-btn shake-animation" onclick="handleFormSubmit(event); if(window.CodformAdvertisingTracking &amp;&amp; window.CodformAdvertisingTracking.track) { window.CodformAdvertisingTracking.track(); }" style="
              background-color: #9b87f5 !important;
              color: #ffffff !important;
              font-size: 19px !important;
              font-weight: 500 !important;
              padding: 11px 24px !important;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              width: 100%;
              min-height: auto;
              font-family: 'Cairo', 'Noto Sans Arabic', 'Amiri', sans-serif;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              box-shadow: none;
              transform: translateY(0);
              position: relative;
              overflow: hidden;
              text-align: center;
            " onmouseover="this.style.opacity='0.9';" onmouseout="this.style.opacity='1';">
            <span style="margin-right: 8px; display: inline-flex; align-items: center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="21" r="1" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></circle>
      <circle cx="20" cy="21" r="1" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></circle>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg></span>إرسال الطلب
          </button>
        </div>
      
          </form>
          <div id="quantity-offers-after-form" class="quantity-offers-container" style="margin: 16px 0; border: 2px solid blue;"></div>
        
            </div>
          </div>`;

const Hero = () => {
  return (
    <section className="bg-gradient-to-br from-codform-light-purple to-white py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row-reverse items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <div className="text-right">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                أنشئ نماذج الدفع عند الاستلام بسهولة
              </h1>
              <p className="text-xl text-gray-700 mb-8">
                منصة متكاملة لإنشاء نماذج مخصصة للدفع عند الاستلام تتكامل مع متاجر Shopify بكل سهولة
              </p>
              <div className="flex justify-end space-x-4 rtl:space-x-reverse">
                <Button variant="outline">معرفة المزيد</Button>
                <Button>ابدأ الآن مجانًا</Button>
              </div>
            </div>
          </div>
          
          <div className="md:w-1/2">
            <div className="rounded-lg p-0 bg-transparent max-h-[560px] md:max-h-[640px] overflow-y-auto max-w-[520px] md:max-w-[560px] mx-auto">
              <div dangerouslySetInnerHTML={{ __html: FORM_PREVIEW_HTML }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
