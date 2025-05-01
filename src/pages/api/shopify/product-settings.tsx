
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';

interface ProductSettings {
  productId: string;
  formId: string;
  enabled: boolean;
  blockId?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ضبط رؤوس CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // التعامل مع طلبات OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // التأكد من أن الطلب هو POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'طريقة غير مسموح بها' });
  }

  try {
    console.log('Processing product settings request');
    
    // قراءة بيانات الطلب
    let requestBody: ProductSettings;
    try {
      requestBody = req.body;
      console.log('Request body:', requestBody);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      return res.status(400).json({ 
        error: 'تنسيق البيانات غير صالح. يرجى التأكد من إرسال JSON صحيح.'
      });
    }
    
    if (!requestBody.productId || !requestBody.formId) {
      return res.status(400).json({ 
        error: 'البيانات المطلوبة غير موجودة: productId أو formId'
      });
    }

    // استخدام الـ shop ID من الطلب أو القيمة الافتراضية
    const shopId = req.headers['x-shop-id'] as string || 'default-shop';
    console.log('Using shop ID:', shopId);

    // استخدام Supabase للإدخال/التحديث
    try {
      const result = await supabase.from('shopify_product_settings').upsert(
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
        console.error('Database error:', result.error);
        return res.status(500).json({ 
          error: `خطأ في قاعدة البيانات: ${result.error.message || 'خطأ غير معروف'}`
        });
      }

      console.log('Product settings saved successfully');
      return res.status(200).json({ 
        success: true,
        productId: requestBody.productId,
        formId: requestBody.formId
      });
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      return res.status(500).json({ 
        error: `خطأ في قاعدة البيانات: ${dbError.message || 'خطأ غير معروف'}`
      });
    }
  } catch (error: any) {
    console.error('Settings error:', error);
    return res.status(500).json({ 
      error: error.message || 'خطأ في حفظ إعدادات المنتج'
    });
  }
}
