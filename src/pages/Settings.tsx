
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ShopifyDebugPanel } from '@/components/shopify/ShopifyDebugPanel';
import { ShopifyTokenUpdater } from '@/components/shopify/ShopifyTokenUpdater';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { shopifyConnectionService } from '@/services/ShopifyConnectionService';
import { useState, useEffect } from 'react';

const Settings = () => {
  const { shop, shopifyConnected } = useAuth();
  const [hasPlaceholderToken, setHasPlaceholderToken] = useState(false);
  
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
                    <Button
                      variant={shopifyConnected ? "outline" : "default"}
                      onClick={() => window.location.href = '/shopify'}
                    >
                      {shopifyConnected ? 'إدارة الاتصال' : 'اتصل الآن'}
                    </Button>
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
    </div>
  );
};

export default Settings;
