
import { supabase } from '@/integrations/supabase/client';
import { ProductSettingsRequest, ProductSettingsResponse } from '@/lib/shopify/types';

/**
 * حامل إعدادات المنتج
 * تم تحويله من Next.js API route إلى وظيفة عادية
 */
export async function saveProductSettings(
  shopId: string,
  requestBody: ProductSettingsRequest
): Promise<ProductSettingsResponse> {
  try {
    console.log('Processing product settings request');
    console.log('Request body:', requestBody);
    
    if (!requestBody.productId || !requestBody.formId) {
      console.error('البيانات المطلوبة غير موجودة: productId أو formId');
      return { 
        error: 'البيانات المطلوبة غير موجودة: productId أو formId'
      };
    }

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
        return { 
          error: `خطأ في قاعدة البيانات: ${result.error.message || 'خطأ غير معروف'}`
        };
      }

      console.log('Product settings saved successfully');
      return { 
        success: true,
        productId: requestBody.productId,
        formId: requestBody.formId
      };
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      return { 
        error: `خطأ في قاعدة البيانات: ${dbError.message || 'خطأ غير معروف'}`
      };
    }
  } catch (error: any) {
    console.error('Settings error:', error);
    return { 
      error: error.message || 'خطأ في حفظ إعدادات المنتج'
    };
  }
}
