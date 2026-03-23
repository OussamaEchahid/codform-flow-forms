
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/components/layout/AuthProvider';
import AppSidebar from '@/components/layout/AppSidebar';
import FormBuilderDashboard from '@/components/form/builder/FormBuilderDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Plus, 
  AlertCircle, 
  CheckCircle,
  Store as StoreIcon
} from 'lucide-react';
import { getAdminBypassShopId, isAdminBypassEnabled } from '@/utils/admin-mode';

const Forms = () => {
  const navigate = useNavigate();
  const { language } = useI18n();
  const { shop: currentStore, isShopifyAuthenticated, loading } = useAuth();
  const isAdminMode = isAdminBypassEnabled();

  console.log('📄 Forms page - Current store:', currentStore, 'Authenticated:', isShopifyAuthenticated);

  // Use direct localStorage check as fallback
  const storeFromStorage = localStorage.getItem('current_shopify_store');
  const activeStore = currentStore || storeFromStorage || getAdminBypassShopId();
  const isValidStore = isAdminMode || (
    !!activeStore &&
    activeStore !== 'en' &&
    activeStore !== 'ar' &&
    activeStore.includes('.myshopify.com')
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل النماذج...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <AppSidebar />
      
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* العنوان الرئيسي */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {language === 'ar' ? 'إدارة النماذج' : 'Form Management'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'ar' 
                ? 'إنشاء وإدارة النماذج الخاصة بمنتجاتك' 
                : 'Create and manage forms for your products'}
            </p>
          </div>

          {/* حالة المتجر */}
          <div className="mb-6">
            {(() => {
              if (!isValidStore) {
                return (
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 flex items-center justify-between">
                      <span>
                        <strong>لا يوجد متجر نشط.</strong> يرجى ربط متجر Shopify لإدارة النماذج.
                      </span>
                      <Button 
                        size="sm" 
                        onClick={() => navigate('/my-stores')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <StoreIcon className="h-4 w-4 mr-2" />
                        إدارة المتاجر
                      </Button>
                    </AlertDescription>
                  </Alert>
                );
              }
            })()}
          </div>

          {/* المحتوى الرئيسي */}
          {(() => {
            return isValidStore ? (
            <FormBuilderDashboard 
              key={`dashboard-${activeStore}`} 
              initialForms={[]} 
              forceRefresh={false}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* بطاقة إنشاء نموذج جديد */}
              <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
                <CardHeader className="text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                    <Plus className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">إنشاء نموذج جديد</CardTitle>
                  <CardDescription>
                    ابدأ بإنشاء نموذج جديد لمنتجاتك
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button 
                    disabled
                    className="w-full bg-gray-400 cursor-not-allowed"
                  >
                    يتطلب ربط متجر أولاً
                  </Button>
                </CardContent>
              </Card>

              {/* بطاقة استيراد نموذج */}
              <Card className="border-2 border-dashed border-muted-foreground/25">
                <CardHeader className="text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">استيراد نموذج</CardTitle>
                  <CardDescription>
                    استيراد نموذج من قالب موجود
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button 
                    variant="outline" 
                    disabled
                    className="w-full cursor-not-allowed"
                  >
                    يتطلب ربط متجر أولاً
                  </Button>
                </CardContent>
              </Card>

              {/* بطاقة القوالب */}
              <Card className="border-2 border-dashed border-muted-foreground/25">
                <CardHeader className="text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">قوالب جاهزة</CardTitle>
                  <CardDescription>
                    اختر من مجموعة قوالب جاهزة
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button 
                    variant="outline" 
                    disabled
                    className="w-full cursor-not-allowed"
                  >
                    يتطلب ربط متجر أولاً
                  </Button>
                </CardContent>
              </Card>
            </div>
          );
          })()}

          {/* رسالة ترحيب للمستخدمين الجدد */}
          {(() => {
            return !isValidStore && (
            <Card className="mt-8 border-2 border-dashed border-muted-foreground/25">
              <CardHeader className="text-center">
                <StoreIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <CardTitle className="text-xl">ابدأ بربط متجر Shopify</CardTitle>
                <CardDescription className="text-base">
                  لإنشاء وإدارة النماذج، تحتاج لربط متجر Shopify أولاً
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="space-y-4">
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/my-stores')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <StoreIcon className="h-5 w-5 mr-2" />
                    إدارة المتاجر
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    بعد ربط المتجر، ستتمكن من إنشاء نماذج لمنتجاتك
                  </p>
                </div>
              </CardContent>
            </Card>
          );
          })()}
        </div>
      </div>
    </div>
  );
};

export default Forms;
