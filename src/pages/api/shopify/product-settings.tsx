
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
      // التحقق من وجود جميع الأعمدة في الجدول
      const { data: tableInfo, error: tableError } = await supabase
        .from('shopify_product_settings')
        .select('*')
        .limit(1);
      
      if (tableError) {
        console.error('خطأ في التحقق من بنية الجدول:', tableError);
        return {
          error: `خطأ في التحقق من بنية الجدول: ${tableError.message || 'خطأ غير معروف'}`
        };
      }

      // بناء كائن البيانات بعناية
      const settingsData: any = {
        shop_id: shopId,
        product_id: requestBody.productId,
        form_id: requestBody.formId,
        enabled: requestBody.enabled ?? true
      };
      
      // إضافة block_id فقط إذا كان محدداً
      if (requestBody.blockId !== undefined && requestBody.blockId !== null) {
        settingsData.block_id = requestBody.blockId;
      }

      const result = await supabase.from('shopify_product_settings').upsert(
        settingsData,
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
