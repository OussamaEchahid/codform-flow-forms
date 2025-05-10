
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
    
    // IMPROVED: Enhanced error checking and transaction support
    try {
      // Start a transaction for better data consistency
      const transactionResult = await supabase.rpc('handle_product_settings_transaction', {
        p_shop_id: shopId,
        p_product_id: requestBody.productId,
        p_form_id: requestBody.formId,
        p_block_id: requestBody.blockId || `codform-${Math.random().toString(36).substring(2, 10)}`,
        p_enabled: requestBody.enabled ?? true
      });
      
      if (transactionResult.error) {
        console.error('Transaction error:', transactionResult.error);
        return {
          error: `Error handling product settings: ${transactionResult.error.message}`
        };
      }
      
      // As a fallback, if transaction isn't available, do a direct upsert
      if (!transactionResult.data) {
        // Build the data object carefully
        const settingsData: any = {
          shop_id: shopId,
          product_id: requestBody.productId,
          form_id: requestBody.formId,
          enabled: requestBody.enabled ?? true
        };
        
        // Add block_id if specified
        if (requestBody.blockId !== undefined && requestBody.blockId !== null && requestBody.blockId !== '') {
          settingsData.block_id = requestBody.blockId;
        } else {
          // Generate default block ID
          const defaultBlockId = `codform-${Math.random().toString(36).substring(2, 10)}`;
          settingsData.block_id = defaultBlockId;
          console.log(`No block_id provided, using default: ${defaultBlockId}`);
        }
        
        console.log('Performing direct upsert with data:', settingsData);
        
        const result = await supabase.from('shopify_product_settings').upsert(
          settingsData,
          { 
            onConflict: 'shop_id,product_id',
            ignoreDuplicates: false
          }
        );
        
        if (result.error) {
          console.error('Database error during direct upsert:', result.error);
          return { 
            error: `خطأ في قاعدة البيانات: ${result.error.message || 'خطأ غير معروف'}`
          };
        }
        
        console.log('Direct upsert successful');
      } else {
        console.log('Transaction successful:', transactionResult.data);
      }

      console.log('Product settings saved successfully');
      return { 
        success: true,
        productId: requestBody.productId,
        formId: requestBody.formId,
        blockId: requestBody.blockId || transactionResult.data?.block_id
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
