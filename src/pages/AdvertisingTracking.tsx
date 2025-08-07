import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/layout/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  Target, 
  Plus, 
  Trash2, 
  Edit, 
  Copy, 
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Store
} from 'lucide-react';

const AdvertisingTracking = () => {
  const navigate = useNavigate();
  const { language } = useI18n();
  const { shop, shopifyConnected, loading } = useAuth();

  // Check for active Shopify store (same as Forms page)
  const storeFromStorage = localStorage.getItem('current_shopify_store');
  const activeStore = shop || storeFromStorage;
  
  // التأكد من أن المتجر المتصل صحيح وليس "en" أو "ar"
  const isValidStore = activeStore && 
                       activeStore !== 'en' && 
                       activeStore !== 'ar' && 
                       activeStore.includes('.myshopify.com');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]" dir={language === 'ar' ? 'rtl' : 'ltr'}>      
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* العنوان الرئيسي */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {language === 'ar' ? 'تتبع الإعلانات' : 'Advertising Tracking'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'ar' 
                ? 'إدارة بيكسلات التتبع للمنصات الإعلانية' 
                : 'Manage tracking pixels for advertising platforms'}
            </p>
          </div>

          {/* حالة المتجر */}
          <div className="mb-6">
            {isValidStore ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>متصل بالمتجر:</strong> {activeStore}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 flex items-center justify-between">
                  <span>
                    <strong>لا يوجد متجر نشط.</strong> يرجى ربط متجر Shopify لإدارة بيكسلات التتبع.
                  </span>
                  <Button 
                    size="sm" 
                    onClick={() => navigate('/my-stores')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Store className="h-4 w-4 mr-2" />
                    إدارة المتاجر
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* المحتوى الرئيسي */}
          {!isValidStore ? (
            <Card className="border-2 border-dashed border-muted-foreground/25">
              <CardHeader className="text-center">
                <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <CardTitle className="text-xl">ابدأ بربط متجر Shopify</CardTitle>
                <CardDescription className="text-base">
                  لإدارة بيكسلات التتبع، تحتاج لربط متجر Shopify أولاً
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="space-y-4">
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/my-stores')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Store className="h-5 w-5 mr-2" />
                    إدارة المتاجر
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    بعد ربط المتجر، ستتمكن من إدارة بيكسلات التتبع
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* بطاقة إنشاء بيكسل جديد */}
              <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
                <CardHeader className="text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                    <Plus className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">إنشاء بيكسل جديد</CardTitle>
                  <CardDescription>
                    ابدأ بإنشاء بيكسل تتبع لمنصاتك الإعلانية
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    إنشاء بيكسل
                  </Button>
                </CardContent>
              </Card>

              {/* بطاقة Facebook */}
              <Card className="border-2 border-dashed border-muted-foreground/25">
                <CardHeader className="text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Facebook Pixel</CardTitle>
                  <CardDescription>
                    إدارة بيكسلات فيسبوك للتتبع
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button variant="outline" className="w-full">
                    إدارة Facebook
                  </Button>
                </CardContent>
              </Card>

              {/* بطاقة TikTok */}
              <Card className="border-2 border-dashed border-muted-foreground/25">
                <CardHeader className="text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-black flex items-center justify-center mb-4">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">TikTok Pixel</CardTitle>
                  <CardDescription>
                    إدارة بيكسلات TikTok للتتبع
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button variant="outline" className="w-full">
                    إدارة TikTok
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvertisingTracking;