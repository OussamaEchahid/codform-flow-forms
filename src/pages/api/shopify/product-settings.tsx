
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
    
    // التحقق من وجود إعدادات سابقة لهذا المنتج
    const { data: existingSettings, error: fetchError } = await supabase
      .from('shopify_product_settings')
      .select('*')
      .eq('product_id', requestBody.productId)
      .eq('shop_id', shopId)
      .maybeSingle();
    
    if (fetchError) {
      console.error('خطأ في التحقق من الإعدادات الموجودة:', fetchError);
      return {
        error: `خطأ في التحقق من الإعدادات الموجودة: ${fetchError.message || 'خطأ غير معروف'}`
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
    if (requestBody.blockId !== undefined && requestBody.blockId !== null && requestBody.blockId !== '') {
      settingsData.block_id = requestBody.blockId;
    } else if (existingSettings?.block_id) {
      // استخدام block_id الموجود إذا كان متوفراً
      settingsData.block_id = existingSettings.block_id;
    } else {
      // إنشاء معرف افتراضي إذا لم يتم توفيره
      const defaultBlockId = `codform-${Math.random().toString(36).substring(2, 10)}`;
      settingsData.block_id = defaultBlockId;
      console.log(`No block_id provided, using default: ${defaultBlockId}`);
    }
    
    console.log('Preparing to insert/update settings with data:', settingsData);

    // إذا كانت الإعدادات موجودة بالفعل، قم بالتحديث، وإلا قم بالإضافة
    let result;
    if (existingSettings) {
      result = await supabase
        .from('shopify_product_settings')
        .update(settingsData)
        .eq('id', existingSettings.id);
    } else {
      result = await supabase
        .from('shopify_product_settings')
        .insert([settingsData]);
    }

    if (result?.error) {
      console.error('Database error:', result.error);
      return { 
        error: `خطأ في قاعدة البيانات: ${result.error.message || 'خطأ غير معروف'}`
      };
    }

    // تحديث جدول Forms بمعرف المنتج
    try {
      const formUpdateResult = await supabase
        .from('forms')
        .update({ productId: requestBody.productId })
        .eq('id', requestBody.formId);
        
      if (formUpdateResult?.error) {
        console.warn('Warning: Could not update form with product ID:', formUpdateResult.error);
      }
    } catch (formUpdateError) {
      console.warn('Error updating form with product ID:', formUpdateError);
    }

    console.log('Product settings saved successfully');
    return { 
      success: true,
      productId: requestBody.productId,
      formId: requestBody.formId,
      blockId: settingsData.block_id
    };
  } catch (error: any) {
    console.error('Settings error:', error);
    return { 
      error: error.message || 'خطأ في حفظ إعدادات المنتج'
    };
  }
}

/**
 * دالة للحصول على معرّف النموذج المرتبط بمنتج معين
 */
export async function getFormIdForProduct(
  shopId: string,
  productId: string
): Promise<string | null> {
  try {
    if (!shopId || !productId) {
      return null;
    }
    
    const { data, error } = await supabase
      .from('shopify_product_settings')
      .select('form_id')
      .eq('shop_id', shopId)
      .eq('product_id', productId)
      .eq('enabled', true)
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching form ID for product:', error);
      return null;
    }
    
    return data?.form_id || null;
  } catch (error) {
    console.error('Error in getFormIdForProduct:', error);
    return null;
  }
}
