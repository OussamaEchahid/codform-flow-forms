
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

interface ProductSettings {
  productId: string;
  formId: string;
  enabled: boolean;
  blockId?: string;
}

export default function ProductSettingsAPI() {
  const [response, setResponse] = useState<{success?: boolean; error?: string}>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { shop } = useAuth();

  useEffect(() => {
    async function handleSettings() {
      try {
        console.log('Processing product settings request');
        
        // تحليل البيانات الواردة من النموذج
        let requestBodyText = '';
        try {
          requestBodyText = document.body.innerText;
          console.log('Raw request body:', requestBodyText);
        } catch (e) {
          console.error('Error reading request body:', e);
        }
        
        // محاولة تحليل البيانات
        let requestBody: ProductSettings;
        try {
          requestBody = JSON.parse(requestBodyText);
          console.log('Parsed request body:', requestBody);
        } catch (parseError) {
          console.error('Error parsing JSON:', parseError);
          throw new Error('تنسيق البيانات غير صالح. يرجى التأكد من إرسال JSON صحيح.');
        }
        
        if (!requestBody.productId || !requestBody.formId) {
          throw new Error('البيانات المطلوبة غير موجودة: productId أو formId');
        }

        // الحصول على متجر من سياق المصادقة أو استخدام القيمة الافتراضية
        const shopId = shop || 'default-shop';
        console.log('Using shop ID:', shopId);

        // استخدام Supabase للإدخال/التحديث
        let result;
        try {
          result = await supabase.from('shopify_product_settings').upsert(
            {
              shop_id: shopId,
              product_id: requestBody.productId,
              form_id: requestBody.formId,
              enabled: requestBody.enabled,
              block_id: requestBody.blockId || null
            },
            { 
              onConflict: 'shop_id,product_id',
              ignoreDuplicates: false
            }
          );

          if (result.error) {
            throw result.error;
          }

          console.log('Insert result:', result);
          console.log('Product settings saved successfully');
          setResponse({ success: true });
        } catch (dbError) {
          console.error('Database error:', dbError);
          throw new Error(`خطأ في قاعدة البيانات: ${dbError.message || 'خطأ غير معروف'}`);
        }
      } catch (error: any) {
        console.error('Settings error:', error);
        setResponse({ error: error.message || 'خطأ في حفظ إعدادات المنتج' });
      } finally {
        setIsLoading(false);
      }
    }

    if (document.body.innerText) {
      handleSettings();
    } else {
      setIsLoading(false);
      setResponse({ error: 'لم يتم توفير أي بيانات' });
    }
  }, [shop]);

  // تحويل الاستجابة إلى JSON وتعيين نوع المحتوى المناسب
  useEffect(() => {
    if (!isLoading) {
      // تعيين نوع المحتوى إلى application/json بشكل صريح
      document.querySelector('head')?.insertAdjacentHTML('beforeend', 
        `<meta http-equiv="Content-Type" content="application/json; charset=utf-8">`);
      
      // التأكد من أن الاستجابة هي JSON فقط
      document.body.innerHTML = '';
      const pre = document.createElement('pre');
      pre.textContent = JSON.stringify(response, null, 2);
      document.body.appendChild(pre);
    }
  }, [isLoading, response]);

  return null;
}
