
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ShopifyDebugPanel } from '@/components/shopify/ShopifyDebugPanel';
import { ShopifyTokenUpdater } from '@/components/shopify/ShopifyTokenUpdater';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { shopifyConnectionService } from '@/services/ShopifyConnectionService';
import { useShopify, clearShopifyCache } from '@/hooks/useShopify'; 
import { toast } from 'sonner';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useShopifyConnection } from '@/lib/shopify/ShopifyConnectionProvider';

const Settings = () => {
  const { shop, shopifyConnected } = useAuth();
  const [hasPlaceholderToken, setHasPlaceholderToken] = useState(false);
  const { emergencyReset } = useShopify();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { reload } = useShopifyConnection();
  
  // التحقق من وجود رمز وصول مؤقت عند تحميل الصفحة
  useEffect(() => {
    const checkTokenStatus = async () => {
      if (shop) {
        try {
          const token = await shopifyConnectionService.getAccessToken(shop);
          setHasPlaceholderToken(token === 'placeholder_token');
        } catch (error) {
          console.error('Error checking token status:', error);
        }
      }
    };
    
    checkTokenStatus();
  }, [shop]);
  
  // وظيفة إعادة تعيين بيانات الشوبيفاي
  const handleEmergencyReset = useCallback(() => {
    try {
      // إعادة تعيين حالة الاتصال
      emergencyReset();
      
      // مسح أي بيانات مخزنة محليًا
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_token');
      localStorage.removeItem('shopify_failsafe');
      localStorage.removeItem('pending_form_syncs');
      localStorage.removeItem('shopify_recovery_mode');
      localStorage.removeItem('shopify_last_url_shop');
      
      // مسح الذاكرة المؤقتة
      clearShopifyCache();
      
      // إغلاق مربع الحوار
      setIsDialogOpen(false);
      
      // إظهار رسالة نجاح
      toast.success('تم إعادة تعيين بيانات الاتصال بنجاح');
      
      // إعادة تحميل البيانات
      setTimeout(() => {
        reload();
      }, 500);
      
      // إعادة تحميل الصفحة بعد فترة قصيرة
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error during emergency reset:', error);
      toast.error('حدث خطأ أثناء إعادة التعيين');
    }
  }, [emergencyReset, reload]);
  
  // وظيفة تحديث الاتصال
  const refreshConnection = useCallback(async () => {
    try {
      toast.info('جاري تحديث الاتصال...');
      
      // مسح الذاكرة المؤقتة أولًا
      clearShopifyCache();
      
      // إعادة تحميل البيانات
      await reload();
      
      // انتظر لحظة
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // التحقق من الاتصال باستخدام API
      try {
        if (shop) {
          const response = await fetch(`/api/shopify-test-connection?shop=${encodeURIComponent(shop)}&force=true`);
          const result = await response.json();
          
          if (result.success) {
            toast.success('تم تحديث الاتصال بنجاح');
          } else {
            toast.warning('تم التحديث لكن هناك مشكلة في الاتصال، يرجى التحقق من رمز الوصول');
          }
        }
      } catch (error) {
        console.error('Error checking connection via API:', error);
      }
    } catch (error) {
      console.error('Error refreshing connection:', error);
      toast.error('حدث خطأ أثناء تحديث الاتصال');
    }
  }, [shop, reload]);
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">الإعدادات</h1>
      
      {shopifyConnected && hasPlaceholderToken && (
        <Alert variant="warning" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>تم اكتشاف مشكلة في اتصال Shopify</AlertTitle>
          <AlertDescription>
            يستخدم متجرك حاليًا رمز وصول مؤقت ("placeholder_token") وهذا يعني أنه لن يمكن الوصول إلى بيانات متجرك. 
            يرجى استخدام قسم "تحديث رمز وصول Shopify" أدناه لإدخال رمز وصول حقيقي.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-6">
        <Tabs defaultValue="general">
          <TabsList className="mb-4">
            <TabsTrigger value="general">عام</TabsTrigger>
            <TabsTrigger value="shopify">Shopify</TabsTrigger>
            <TabsTrigger value="advanced">متقدم</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>الإعدادات العامة</CardTitle>
                <CardDescription>
                  إعدادات عامة للتطبيق
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dark-mode">الوضع الداكن</Label>
                    <Switch id="dark-mode" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notifications">الإشعارات</Label>
                    <Switch id="notifications" defaultChecked />
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div>
                    <Button variant="destructive">حذف الحساب</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="shopify" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات Shopify</CardTitle>
                <CardDescription>
                  إدارة اتصال متجر Shopify الخاص بك
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">حالة الاتصال</p>
                      <p className="text-sm text-gray-500">
                        {shopifyConnected ? `متصل بـ ${shop}` : 'غير متصل'}
                      </p>
                    </div>
                    <div className="space-x-2 flex">
                      <Button
                        variant={shopifyConnected ? "outline" : "default"}
                        onClick={() => window.location.href = '/shopify'}
                      >
                        {shopifyConnected ? 'إدارة الاتصال' : 'اتصل الآن'}
                      </Button>
                      
                      {shopifyConnected && (
                        <Button
                          variant="outline"
                          onClick={refreshConnection}
                        >
                          <RefreshCw className="ml-2 h-4 w-4" />
                          تحديث الاتصال
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-sync">المزامنة التلقائية للطلبات</Label>
                      <Switch id="auto-sync" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-badge">عرض شارة التطبيق على صفحات المتجر</Label>
                      <Switch id="show-badge" defaultChecked />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 mt-4">
                <div className="w-full">
                  <Button 
                    variant="outline" 
                    className="border-red-300 text-red-600 hover:bg-red-50 w-full"
                    onClick={() => setIsDialogOpen(true)}
                  >
                    إعادة تعيين بيانات الاتصال بالكامل
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    سيؤدي هذا إلى مسح جميع بيانات الاتصال والذاكرة المؤقتة. استخدم هذا الخيار فقط إذا كنت تواجه مشاكل في الاتصال لا يمكن حلها بالطرق الأخرى.
                  </p>
                </div>
              </CardFooter>
            </Card>
            
            {/* مكون تحديث رمز الوصول مع تمييز واضح إذا كان هناك مشكلة */}
            <Card className={hasPlaceholderToken ? "border-yellow-300 shadow-yellow-100" : ""}>
              <CardHeader className={hasPlaceholderToken ? "bg-yellow-50" : ""}>
                <CardTitle>
                  {hasPlaceholderToken ? (
                    <span className="flex items-center text-yellow-700">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      تحديث رمز وصول Shopify (مطلوب)
                    </span>
                  ) : (
                    "تحديث رمز وصول Shopify"
                  )}
                </CardTitle>
                <CardDescription className={hasPlaceholderToken ? "text-yellow-700" : ""}>
                  {hasPlaceholderToken 
                    ? "هام جداً: تم اكتشاف رمز مؤقت (placeholder_token). يجب عليك تحديث الرمز لاستخدام ميزات Shopify."
                    : "هام: إذا واجهتك أخطاء في الاتصال أو ظهرت رسالة \"placeholder token\"، استخدم هذا النموذج لتحديث رمز الوصول يدويًا"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ShopifyTokenUpdater />
              </CardContent>
            </Card>
            
            {/* لوحة تصحيح Shopify */}
            <Card>
              <CardHeader>
                <CardTitle>معلومات تصحيح Shopify</CardTitle>
                <CardDescription>
                  عرض معلومات تفصيلية حول اتصال Shopify
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ShopifyDebugPanel />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>الإعدادات المتقدمة</CardTitle>
                <CardDescription>
                  إعدادات متقدمة للمستخدمين ذوي الخبرة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="debug-mode">وضع التصحيح</Label>
                    <Switch id="debug-mode" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="api-access">وصول API</Label>
                    <Switch id="api-access" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="legacy-mode">وضع الدعم القديم</Label>
                    <Switch id="legacy-mode" />
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full">
                      تصدير البيانات
                    </Button>
                    
                    <Button variant="outline" className="w-full">
                      استيراد البيانات
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* مربع حوار تأكيد إعادة تعيين الاتصال */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيؤدي هذا الإجراء إلى مسح جميع بيانات الاتصال والذاكرة المؤقتة. قد تحتاج إلى إعادة الاتصال بمتجرك مرة أخرى.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEmergencyReset}
              className="bg-red-600 hover:bg-red-700"
            >
              نعم، إعادة التعيين
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
