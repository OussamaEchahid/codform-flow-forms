
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
    console.log('Processing product settings request:', {
      shopId,
      productId: requestBody.productId,
      formId: requestBody.formId,
      blockId: requestBody.blockId,
      enabled: requestBody.enabled
    });
    
    // التحقق من وجود البيانات المطلوبة
    if (!shopId || shopId.trim() === '') {
      console.error('معرف المتجر غير موجود');
      return { error: 'معرف المتجر غير موجود' };
    }
    
    if (!requestBody.productId || !requestBody.formId) {
      console.error('البيانات المطلوبة غير موجودة: productId أو formId');
      return { 
        error: 'البيانات المطلوبة غير موجودة: productId أو formId'
      };
    }

    console.log('Using shop ID:', shopId);
    
    try {
      // بناء كائن البيانات بعناية
      const settingsData: any = {
        shop_id: shopId,
        product_id: requestBody.productId,
        form_id: requestBody.formId,
        enabled: requestBody.enabled ?? true
      };
      
      // إضافة block_id فقط إذا كان محدداً
      if (requestBody.blockId !== undefined && requestBody.blockId !== null && requestBody.blockId !== '') {
        settingsData.block_id = requestBody.blockId;
      } else {
        // إنشاء معرف افتراضي إذا لم يتم توفيره
        const defaultBlockId = `codform-${Math.random().toString(36).substring(2, 10)}`;
        settingsData.block_id = defaultBlockId;
        console.log(`No block_id provided, using default: ${defaultBlockId}`);
      }
      
      console.log('Preparing to insert/update settings with data:', settingsData);

      // استخدام supabase للإدراج/التحديث
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
        formId: requestBody.formId,
        blockId: settingsData.block_id
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
