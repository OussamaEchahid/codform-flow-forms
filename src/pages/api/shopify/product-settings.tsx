
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
        // تسجيل بيانات الطلب المستلمة
        const requestBodyText = document.body.innerText;
        console.log('Raw request body:', requestBodyText);
        
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

        // استخدام SQL المباشر الذي يعمل مع أي إصدار من المخطط
        // هذا يتجنب أخطاء TypeScript مع وظائف RPC المضافة حديثًا
        let result;
        try {
          result = await supabase.rpc(
            'insert_product_setting', 
            {
              p_shop_id: shopId,
              p_product_id: requestBody.productId,
              p_form_id: requestBody.formId,
              p_enabled: requestBody.enabled,
              p_block_id: requestBody.blockId || null
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

  // هذا المكون يعمل كنقطة نهاية API، لذلك يعيد JSON
  useEffect(() => {
    if (!isLoading) {
      document.body.innerHTML = JSON.stringify(response, null, 2);
    }
  }, [isLoading, response]);

  return null;
}
