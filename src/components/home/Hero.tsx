import React from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
const getPreviewHtml = (lang: 'en' | 'ar') => {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const t = {
    heading: lang === 'ar' ? 'الرجاء تعبئة الاستمارة لإرسال طلبكم' : 'Please fill the form to submit your order',
    name: lang === 'ar' ? 'الاسم الكامل' : 'Full name',
    phone: lang === 'ar' ? 'رقم الهاتف' : 'Phone number',
    address: lang === 'ar' ? 'العنوان' : 'Address',
    namePh: lang === 'ar' ? 'أدخل الاسم الكامل' : 'Enter your full name',
    phonePh: lang === 'ar' ? 'مثال: +966 5xxxxxxxx' : 'e.g. +1 555 123 4567',
    addressPh: lang === 'ar' ? 'أدخل العنوان الكامل' : 'Enter full address',
    submit: lang === 'ar' ? 'إرسال الطلب' : 'Submit order',
  };

  // Demo pricing data for preview (updates with language)
  const currencySymbol = lang === 'ar' ? 'ر.س' : '$';
  const basePrice = 49;
  const subtotal = basePrice;
  const discount = Math.round(basePrice * 0.1); // 10%
  const shipping = 0;
  const total = subtotal - discount + shipping;

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
  <div data-form-preview-id="form-preview-stable" style="background-color:#F9FAFB;border:2px solid #9b87f5;border-radius:1.2rem;padding:20px;box-shadow:rgba(0,0,0,0.05) 0 4px 6px;max-width:520px;margin:0;font-family:inherit;direction:${dir};box-sizing:border-box;gap:16px;position:relative;overflow:hidden;">
    <div style="text-align:center;margin-bottom:12px;">
      <div style="color:#111827;font-size:22px;font-weight:700;line-height:1.4;">${t.heading}</div>
    </div>
    <form style="display:flex;flex-direction:column;gap:10px;background:transparent;margin:0;padding:0;">
      <div style="margin-bottom:2px;">
        <label style="display:block;color:#334155;font-size:14px;font-weight:500;margin:${dir==='rtl'?'0 0 4px 0':'0 0 4px 0'};">${t.name}<span style="color:#EF4444;${dir==='rtl'?'margin-right:4px;':'margin-left:4px;'}">*</span></label>
        <input type="text" placeholder="${t.namePh}" style="width:100%;background:#FFFFFF;border:1px solid #D1D5DB;border-radius:8px;padding:10px 12px;font-size:14px;color:#1F2937;outline:none;transition:all .2s;box-shadow:rgba(0,0,0,0.05) 0 1px 2px;min-height:44px;direction:${dir};text-align:${dir==='rtl'?'right':'left'};" />
      </div>
      <div style="margin-bottom:2px;">
        <label style="display:block;color:#334155;font-size:14px;font-weight:500;margin:${dir==='rtl'?'0 0 4px 0':'0 0 4px 0'};">${t.phone}<span style="color:#EF4444;${dir==='rtl'?'margin-right:4px;':'margin-left:4px;'}">*</span></label>
        <input type="tel" placeholder="${t.phonePh}" style="width:100%;background:#FFFFFF;border:1px solid #D1D5DB;border-radius:8px;padding:10px 12px;font-size:14px;color:#1F2937;outline:none;transition:all .2s;box-shadow:rgba(0,0,0,0.05) 0 1px 2px;min-height:44px;direction:${dir};text-align:${dir==='rtl'?'right':'left'};" />
      </div>
      <div style="margin-bottom:2px;">
        <label style="display:block;color:#334155;font-size:14px;font-weight:500;margin:${dir==='rtl'?'0 0 4px 0':'0 0 4px 0'};">${t.address}</label>
        <textarea rows="3" placeholder="${t.addressPh}" style="width:100%;background:#FFFFFF;border:1px solid #D1D5DB;border-radius:8px;padding:10px 12px;font-size:14px;color:#1F2937;outline:none;transition:all .2s;box-shadow:rgba(0,0,0,0.05) 0 1px 2px;resize:none;min-height:80px;direction:${dir};text-align:${dir==='rtl'?'right':'left'};"></textarea>
      </div>
      <button type="button" style="background-color:#9b87f5;color:#ffffff;font-size:16px;font-weight:600;padding:11px 24px;border:none;border-radius:8px;cursor:pointer;transition:opacity .2s;width:100%;display:inline-flex;align-items:center;justify-content:center;gap:8px;">${t.submit}</button>
    </form>

    <!-- Quantity Offers Preview -->
    <div style="margin-top:14px;padding:12px;background:#fff;border:1px solid #E5E7EB;border-radius:10px;">
      <div style="font-weight:700;color:#111827;margin-bottom:8px;text-align:${dir==='rtl'?'right':'left'};">${labels.offersTitle}</div>
      <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px;">
        <li style="display:flex;justify-content:space-between;align-items:center;padding:10px;border:1px solid #E5E7EB;border-radius:8px;background:#F9FAFB;">
          <span style="color:#334155;font-size:14px;">${labels.offer1}</span>
          <span style="color:#111827;font-weight:700;">${currencySymbol}${basePrice}</span>
        </li>
        <li style="display:flex;justify-content:space-between;align-items:center;padding:10px;border:1px solid #E5E7EB;border-radius:8px;background:#F3F4F6;">
          <span style="color:#334155;font-size:14px;">${labels.offer2}</span>
          <span style="color:#16A34A;font-weight:700;">${currencySymbol}${Math.round(basePrice*2*0.9)}</span>
        </li>
        <li style="display:flex;justify-content:space-between;align-items:center;padding:10px;border:1px solid #E5E7EB;border-radius:8px;background:#EEF2FF;">
          <span style="color:#334155;font-size:14px;">${labels.offer3}</span>
          <span style="color:#7C3AED;font-weight:700;">${currencySymbol}${Math.round(basePrice*3*0.8)}</span>
        </li>
      </ul>
    </div>

    <!-- Cart Summary Preview -->
    <div style="margin-top:12px;padding:12px;background:#fff;border:1px solid #E5E7EB;border-radius:10px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <span style="color:#334155;">${labels.subtotal}</span>
        <span style="color:#111827;font-weight:600;">${currencySymbol}${subtotal}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <span style="color:#334155;">${labels.discount}</span>
        <span style="color:#16A34A;font-weight:600;">-${currencySymbol}${discount}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <span style="color:#334155;">${labels.shipping}</span>
        <span style="color:#111827;font-weight:600;">${shipping === 0 ? labels.free : currencySymbol + shipping}</span>
      </div>
      <div style="height:1px;background:#E5E7EB;margin:8px 0;"></div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="color:#111827;font-weight:800;">${labels.total}</span>
        <span style="color:#111827;font-weight:800;">${currencySymbol}${total}</span>
      </div>
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