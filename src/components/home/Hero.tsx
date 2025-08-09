import React from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
const getPreviewHtml = (lang: 'en' | 'ar') => {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const t = {
    heading: lang === 'ar' ? 'الرجاء تعبئة الاستمارة كاملةً لإرسال طلبكم' : 'Please complete the form to submit your order',
    name: lang === 'ar' ? 'الاسم الكامل' : 'Full name',
    phone: lang === 'ar' ? 'رقم الهاتف' : 'Phone number',
    address: lang === 'ar' ? 'العنوان' : 'Address',
    namePh: lang === 'ar' ? 'أدخل الاسم الكامل' : 'Enter your full name',
    phonePh: lang === 'ar' ? 'مثال: +966 5xxxxxxxx' : 'e.g. +1 555 123 4567',
    addressPh: lang === 'ar' ? 'أدخل العنوان الكامل' : 'Enter full address',
    submit: lang === 'ar' ? 'إرسال الطلب' : 'Submit order',
  };

  // Demo pricing data for preview (updates with language)
  const currencyCode = 'MAD';
  const subtotal: number = 100.0;
  const discount: number = 0;
  const shipping: number = 0;
  const total: number = subtotal - discount + shipping;

  const subtotalStr = `${subtotal.toFixed(1)} MAD`;
  const discountStr = `-${discount.toFixed(2)} MAD`;
  const shippingStr = shipping === 0 ? (lang === 'ar' ? 'مجاني' : 'Free') : `${shipping.toFixed(1)} MAD`;
  const totalStr = `${total.toFixed(1)} MAD`;

  const labels = {
    offersTitle: lang === 'ar' ? 'عروض الكمية' : 'Quantity offers',
    subtotal: lang === 'ar' ? 'المجموع' : 'Subtotal',
    discount: lang === 'ar' ? 'الخصم' : 'Discount',
    shipping: lang === 'ar' ? 'الشحن' : 'Shipping',
    total: lang === 'ar' ? 'الإجمالي' : 'Total',
    free: lang === 'ar' ? 'مجاني' : 'Free',
    offer1: lang === 'ar' ? 'قطعة واحدة' : '1 piece',
    offer2: lang === 'ar' ? 'قطعتان - خصم 10%' : '2 pieces - 10% off',
    offer3: lang === 'ar' ? '3 قطع - خصم 20%' : '3 pieces - 20% off',
  };

  return `
  <div data-form-preview-id="form-preview-stable" style="background:transparent;padding:0;margin:0;direction:${dir};box-sizing:border-box;">
    <div class="codform-dynamic-form">
      <div id="quantity-offers-before-form" class="quantity-offers-container" style="margin: 16px 0; display:block;">
        <div data-offer="0" style="background:#FFFFFF;border:2px solid #E5E7EB;border-radius:8px;padding:12px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;font-family:Cairo, Arial, sans-serif;cursor:pointer;direction:${dir};text-align:${dir==='rtl'?'right':'left'};box-shadow:rgba(0,0,0,0.1) 0 2px 4px;transition:0.3s;">
          <div style="display:flex;align-items:center;gap:12px;flex-direction:${dir==='rtl'?'row':'row'};">
            <div style="width:48px;height:48px;background:#f3f4f6;border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;overflow:hidden;"></div>
            <div style="flex:1;">
              <div style="font-weight:600;color:#1f2937;text-align:${dir==='rtl'?'right':'left'};">
                ${lang==='ar' ? 'اشتر 3 واحصل على 1 مجانًا' : 'Buy 3 get 1 free'}
              </div>
              <div style="display:flex;align-items:center;gap:8px;margin-top:4px;justify-content:${dir==='rtl'?'flex-start':'flex-start'};direction:${dir};">
                <div style="background:#22c55e;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:500;text-align:center;">
                  ${lang==='ar' ? 'هدية مجانية' : 'Free gift'}
                </div>
              </div>
            </div>
          </div>
          <div style="text-align:${dir==='rtl'?'left':'right'};direction:${dir};">
            <div style="font-weight:700;font-size:18px;color:#059669;">
              MAD 60.0
            </div>
          </div>
        </div>
        <div data-offer="1" style="background:#FFFFFF;border:2px solid #22C55E;border-radius:8px;padding:12px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;font-family:Cairo, Arial, sans-serif;cursor:pointer;direction:${dir};text-align:${dir==='rtl'?'right':'left'};box-shadow:rgba(0,0,0,0.1) 0 2px 4px;transition:0.3s;">
          <div style="display:flex;align-items:center;gap:12px;flex-direction:${dir==='rtl'?'row':'row'};">
            <div style="width:48px;height:48px;background:#f3f4f6;border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;overflow:hidden;"></div>
            <div style="flex:1;">
              <div style="font-weight:600;color:#1f2937;text-align:${dir==='rtl'?'right':'left'};">
                ${lang==='ar' ? 'اشتر 5 واحصل على 2 مجانًا' : 'Buy 5 get 2 free'}
              </div>
              <div style="display:flex;align-items:center;gap:8px;margin-top:4px;justify-content:${dir==='rtl'?'flex-start':'flex-start'};direction:${dir};">
                <div style="background:#22c55e;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:500;text-align:center;">
                  ${lang==='ar' ? 'هدية مجانية' : 'Free gift'}
                </div>
              </div>
            </div>
          </div>
          <div style="text-align:${dir==='rtl'?'left':'right'};direction:${dir};">
            <div style="font-weight:700;font-size:18px;color:#059669;">
              MAD 100.0
            </div>
          </div>
        </div>
      </div>

      <form class="codform-form-fields" style="background:transparent;margin:0;padding:0;" id="codform-main-form">
        <div class="form-title-field w-full" style="color:#000;font-size:24px;font-weight:bold;font-family:Cairo, Tajawal, Arial, sans-serif;text-align:center;margin:0;line-height:1.4;direction:${dir};padding:0 0 24px 0;width:100%;display:block;background:none;border:none;">
          ${lang==='ar' ? 'الرجاء تعبئة الاستمارة كاملةً لإرسال طلبكم' : 'Please complete the form to submit your order'}
        </div>

        <div class="codform-field-wrapper" style="margin-bottom:4px;direction:${dir};">
          <label style="display:block;color:#333333;font-size:15px;font-weight:500;margin-bottom:4px;font-family:'Cairo', sans-serif;">
            ${t.name}<span style="color:#EF4444;${dir==='rtl'?'margin-left:4px;':'margin-left:4px;'}">*</span>
          </label>
          <div style="position:relative;">
            <input type="text" placeholder="${t.namePh}" required style="width:100%;background-color:#FFFFFF;border:1px solid #D1D5DB;border-radius:8px;padding:10px 12px;font-size:13px;color:#1F2937;font-family:inherit;outline:none;transition:0.2s;box-shadow:rgba(0,0,0,0.05) 0 1px 2px;min-height:44px;box-sizing:border-box;direction:${dir};text-align:${dir==='rtl'?'right':'left'};" />
          </div>
        </div>

        <div class="codform-field-wrapper" style="margin-bottom:4px;direction:${dir};">
          <label style="display:block;color:#333333;font-size:15px;font-weight:500;margin-bottom:4px;font-family:'Cairo', sans-serif;">
            ${t.phone}<span style="color:#EF4444;${dir==='rtl'?'margin-left:4px;':'margin-left:4px;'}">*</span>
          </label>
          <div style="position:relative;">
            <input type="tel" placeholder="${t.phonePh}" required style="width:100%;background-color:#FFFFFF;border:1px solid #D1D5DB;border-radius:8px;padding:10px 12px;font-size:13px;color:#1F2937;font-family:inherit;outline:none;transition:all 0.2s ease;box-shadow:rgba(0,0,0,0.05) 0 1px 2px;min-height:44px;box-sizing:border-box;direction:${dir};text-align:${dir==='rtl'?'right':'left'};" />
          </div>
        </div>

        <div class="codform-field-wrapper" style="margin-bottom:10px;direction:${dir};">
          <label style="display:block;color:#334155;font-size:15px;font-weight:500;margin-bottom:4px;font-family:'Cairo', sans-serif;">
            ${t.address}<span style="color:#EF4444;${dir==='rtl'?'margin-left:4px;':'margin-left:4px;'}">*</span>
          </label>
          <div style="position:relative;">
            <textarea placeholder="${t.addressPh}" required rows="4" style="width:100%;background-color:#FFFFFF;border:1px solid #D1D5DB;border-radius:8px;padding:10px 12px;font-size:13px;color:#1F2937;font-family:inherit;outline:none;transition:all 0.2s ease;box-shadow:rgba(0,0,0,0.05) 0 1px 2px;resize:none;min-height:80px;height:80px;box-sizing:border-box;direction:${dir};text-align:${dir==='rtl'?'right':'left'};"></textarea>
          </div>
        </div>

        <div class="cart-summary-field" data-currency="MAD" style="background:#FFFFFF;border:1px solid #E5E7EB;border-radius:8px;padding:16px;margin:16px 0;direction:${dir};font-family:Cairo;">
          <div class="summary-row" style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span style="color:#6b7280;">${labels.subtotal}</span>
            <span class="subtotal-value" data-amount="${subtotal}" style="color:#374151;font-size:14px;font-family:Cairo;">${subtotal.toFixed(1)} MAD</span>
          </div>
          <div class="summary-row discount-row" style="display:${discount>0?'flex':'none'};justify-content:space-between;margin-bottom:8px;">
            <span style="color:#ef4444;">${labels.discount}</span>
            <span class="discount-value" data-amount="${discount}" style="color:#374151;font-size:14px;font-family:Cairo;">-${discount.toFixed(2)} MAD</span>
          </div>
          <div class="summary-row" style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span style="color:#6b7280;">${labels.shipping}</span>
            <span class="shipping-value" data-amount="${shipping}" style="color:#374151;font-size:14px;font-family:Cairo;">${shipping===0 ? (lang==='ar'?'مجاني':'Free') : (shipping.toFixed(1)+' MAD')}</span>
          </div>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:12px 0;" />
          <div class="summary-row" style="display:flex;justify-content:space-between;font-weight:600;font-size:18px;">
            <span style="color:#1f2937;">${labels.total}</span>
            <span class="total-value" data-amount="${total}" style="color:#16A34A;font-size:14px;font-weight:600;">${total.toFixed(1)} MAD</span>
          </div>
        </div>

        <div class="codform-submit-wrapper" style="margin-top:20px;text-align:center;">
          <button type="button" class="codform-submit-btn" style="border:none;border-radius:6px;cursor:pointer;transition:0.3s cubic-bezier(0.4,0,0.2,1);width:100%;min-height:auto;font-family:Cairo, 'Noto Sans Arabic', Amiri, sans-serif;display:inline-flex;align-items:center;justify-content:center;gap:8px;box-shadow:none;position:relative;overflow:hidden;text-align:center;background-color:#9b87f5 !important;color:#ffffff !important;font-size:19px !important;font-weight:500 !important;padding:11px 24px !important;">
            ${t.submit}
          </button>
        </div>
      </form>

      <div id="quantity-offers-after-form" class="quantity-offers-container" style="margin:16px 0;"></div>
    </div>
  </div>`;
};
const Hero = () => {
  const { language, isRTL } = useI18n();
  const t = {
    title: language === 'ar' ? 'أنشئ نماذج الدفع عند الاستلام بسهولة' : 'Build cash-on-delivery forms easily',
    subtitle:
      language === 'ar'
        ? 'منصة متكاملة لإنشاء نماذج مخصصة للدفع عند الاستلام تتكامل مع متاجر Shopify بكل سهولة'
        : 'An all‑in‑one platform to build custom COD forms that integrate seamlessly with Shopify.',
    learnMore: language === 'ar' ? 'معرفة المزيد' : 'Learn more',
    startFree: language === 'ar' ? 'ابدأ الآن مجانًا' : 'Start free',
  };

  return (
    <section className="bg-gradient-to-br from-codform-light-purple to-white py-8 mx-0 my-0 px-0 md:py-0">
      <div className="container mx-auto px-4">
        <div className={`flex flex-col ${isRTL ? 'md:flex-row-reverse' : 'md:flex-row'} items-center`}>
          <div className="md:w-1/2 mb-4 md:mb-0">
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <h1 className="text-4xl md:text-5xl font-bold mb-3 text-gray-900">{t.title}</h1>
              <p className="text-xl text-gray-700 mb-5">{t.subtitle}</p>
              <div className={`flex ${isRTL ? 'justify-end rtl:space-x-reverse' : 'justify-start'} space-x-3`}>
                <Button variant="outline">{t.learnMore}</Button>
                <Button>{t.startFree}</Button>
              </div>
            </div>
          </div>

          <div className="md:w-1/2">
            <div className="rounded-lg p-0 bg-transparent w-full md:flex md:justify-start mx-[180px]">
              <div className="inline-block transform origin-top-left scale-[0.92] md:scale-[0.95]">
                <div dangerouslySetInnerHTML={{ __html: getPreviewHtml(language) }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default Hero;