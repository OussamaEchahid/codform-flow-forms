// CodMagnet inline submit + currency init extracted from Liquid to reduce Liquid size
(function(){
  'use strict';

  // Smart Currency System init (second call) without Liquid
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
      try {
        var formId = window.codformProductId || 'auto';
        var shopId = window.codformShopDomain || 'auto';
        if (window.CodformSmartCurrency && !window.smartCurrencySystemActive) {
          window.CodformSmartCurrency.initialize(formId, shopId);
          console.log('✅ Smart Currency System initialized (asset)');
        }
        window.smartCurrencySystemActive = true;
      } catch(e) { console.warn('Currency init error:', e); }
    }, 1000);
  });

  // Submit handler (uses globals set by tiny inline script)
  window.handleFormSubmit = async function(event) {
    console.log('📋 Form submission detected');
    if (event) event.preventDefault();

    try {
      var form = (event && event.target && event.target.closest && event.target.closest('form')) || document.querySelector('form') || (event && event.target && event.target.closest && event.target.closest('[data-form-preview-id]'));
      if (!form) { console.error('❌ Form not found'); return false; }

      var submissionData = {};
      form.querySelectorAll('input, textarea, select').forEach(function(field){
        if (field.name && field.value) submissionData[field.name] = field.value;
      });
      console.log('📝 Form data collected:', submissionData);

      var enhancedSubmissionData = (window.enhanceFormDataWithPrice ? window.enhanceFormDataWithPrice(submissionData) : submissionData);

      var endpoint = 'https://trlklwixfeaexhydzaue.supabase.co/functions/v1/api-submissions';
      var res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M'
        },
        body: JSON.stringify({
          formId: window.codformProductId,
          shopDomain: window.codformShopDomain,
          data: enhancedSubmissionData
        })
      });

      if (res.ok) {
        var result = await res.json();
        console.log('✅ Submission successful:', result);

        try {
          if (window.CodformAdvertisingTracking && window.CodformAdvertisingTracking.track) {
            await window.CodformAdvertisingTracking.track();
          }
        } catch(_) {}

        var ev = new CustomEvent('formSubmitted', { detail: {
          formId: window.codformProductId,
          shopDomain: window.codformShopDomain,
          orderNumber: result.orderNumber,
          timestamp: new Date().toISOString()
        }});
        document.dispatchEvent(ev);

        await new Promise(function(r){ setTimeout(r, 500); });

        if (result.redirect || result.thankYouUrl) {
          window.location.href = result.redirect || result.thankYouUrl;
        } else {
          var url = new URL(window.location.href);
          url.searchParams.set('submitted', 'true');
          if (result.orderNumber) url.searchParams.set('order', result.orderNumber);
          window.location.href = url.toString();
        }

      } else {
        console.error('❌ Submission failed:', res.statusText);
        try {
          var err = await res.json();
          if (err.errorCode === 'OUT_OF_STOCK') alert(err.error || 'المنتج غير متوفر حالياً');
          else if (err.errorCode === 'DAILY_LIMIT_EXCEEDED') alert(err.error || 'تم تجاوز الحد اليومي للطلبات');
          else alert(err.error || 'حدث خطأ أثناء إرسال النموذج. يرجى المحاولة مرة أخرى.');
        } catch(_) {
          alert('حدث خطأ أثناء إرسال النموذج. يرجى المحاولة مرة أخرى.');
        }
      }

    } catch (e) {
      console.error('❌ Submission error:', e);
      alert('حدث خطأ أثناء إرسال النموذج. يرجى المحاولة مرة أخرى.');
    }
    return false;
  };
})();

