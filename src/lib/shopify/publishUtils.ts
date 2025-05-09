
import { shopifySupabase } from './supabase-client';
import { useShopifySettings } from './ShopifySettingsProvider';

export interface PublishPageParams {
  shop: string;
  accessToken: string;
  title?: string;
  content?: string;
  metaobjects?: any;
  pageId?: string;
  formId?: string;
  shouldUseProductMethod?: boolean;
  debugMode?: boolean;
  ignoreMetaobjectErrors?: boolean; // إضافة خيار تجاهل أخطاء metaobject
}

/**
 * نشر صفحة في متجر Shopify
 */
export const publishShopifyPage = async (params: PublishPageParams) => {
  const { 
    shop, 
    accessToken, 
    title, 
    content, 
    metaobjects, 
    pageId,
    formId,
    shouldUseProductMethod,
    debugMode,
    ignoreMetaobjectErrors, // استخدام الخيار الجديد
  } = params;

  // أولاً، تحقق من صلاحية الرمز المميز مع التوجيه للتجاهل
  const { data: tokenTestData, error: tokenTestError } = await shopifySupabase.functions.invoke(
    'shopify-test-connection', 
    {
      body: { 
        shop, 
        accessToken, 
        checkPermissions: true,
        ignoreMetaobjectErrors, // تمرير الخيار إلى الاختبار
      }
    }
  );

  // إذا فشل اختبار الرمز، ارفع استثناء
  if (tokenTestError || !tokenTestData?.success) {
    console.error('Token validation failed before publishing:', tokenTestError || tokenTestData);
    throw new Error('فشل في التحقق من صلاحية الرمز المميز قبل النشر');
  }

  // التحقق من صلاحيات metaobject
  const hasMetaobjectPermission = tokenTestData.permissions?.hasMetaobjectPermission;
  
  // إذا تم تفعيل وضع استخدام طريقة المنتج أو لا نملك صلاحيات metaobject، استخدم طريقة المنتج كبديل
  const useProductMethod = shouldUseProductMethod || (!hasMetaobjectPermission && !ignoreMetaobjectErrors);
  
  // اضبط المعلومات التشخيصية إذا كان وضع التصحيح مفعل
  const debugInfo = debugMode ? {
    mode: useProductMethod ? 'product_method' : 'page_method',
    hasMetaobjectPermission,
    ignoreMetaobjectErrors,
    token: { success: tokenTestData.success },
    permissions: tokenTestData.permissions
  } : undefined;

  try {
    const { data, error } = await shopifySupabase.functions.invoke('shopify-publish-page', {
      body: {
        shop,
        accessToken,
        title,
        content,
        metaobjects,
        pageId,
        formId,
        useProductMethod,
        debugMode,
        ignoreMetaobjectErrors, // تمرير الخيار إلى دالة النشر
        debugInfo
      }
    });

    if (error) {
      console.error('Error publishing page:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in publishShopifyPage:', error);
    throw error;
  }
};

/**
 * Hook للاستفادة من تلميحات مخصصة عند نشر الصفحات
 */
export const usePublishUtils = () => {
  const { settings } = useShopifySettings();

  const publishLandingPage = async (params: Omit<PublishPageParams, 'shouldUseProductMethod' | 'debugMode' | 'ignoreMetaobjectErrors'>) => {
    return await publishShopifyPage({
      ...params,
      shouldUseProductMethod: settings.fallbackModeOnly,
      debugMode: settings.debugMode,
      ignoreMetaobjectErrors: settings.ignoreMetaobjectErrors
    });
  };

  return {
    publishLandingPage,
    fallbackModeEnabled: settings.fallbackModeOnly,
    debugModeEnabled: settings.debugMode,
    ignoreMetaobjectErrorsEnabled: settings.ignoreMetaobjectErrors
  };
};
