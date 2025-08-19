import React, { useState, useEffect } from 'react';
import { Copy, Download, TestTube, Shield, AlertCircle, CheckCircle, Code, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/layout/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

const ShopifyProtectionSetup = () => {
  const { shop } = useAuth();
  const [protectionScript, setProtectionScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [shopDomain, setShopDomain] = useState(shop || '');

  useEffect(() => {
    if (shop) {
      setShopDomain(shop);
    }
  }, [shop]);

  const generateProtectionScript = async () => {
    if (!shopDomain) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال نطاق المتجر',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('shopify-protection-script', {
        body: {
          shop_domain: shopDomain,
          method: 'get_script'
        }
      });

      if (error) throw error;

      if (data.success) {
        setProtectionScript(data.script);
        toast({
          title: 'تم بنجاح',
          description: 'تم إنتاج سكريپت الحماية'
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error generating script:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إنتاج سكريپت الحماية',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const testProtection = async () => {
    if (!shopDomain) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال نطاق المتجر',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('shopify-protection-script', {
        body: {
          shop_domain: shopDomain,
          method: 'test_protection'
        }
      });

      if (error) throw error;

      setTestResult(data.test_result);
      
      if (data.success) {
        toast({
          title: 'تم الاختبار',
          description: 'تم فحص نظام الحماية بنجاح'
        });
      }
    } catch (error) {
      console.error('Error testing protection:', error);
      toast({
        title: 'خطأ في الاختبار',
        description: 'فشل في اختبار نظام الحماية',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(protectionScript);
      toast({
        title: 'تم النسخ',
        description: 'تم نسخ السكريپت إلى الحافظة'
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في نسخ السكريپت',
        variant: 'destructive'
      });
    }
  };

  const downloadScript = () => {
    const blob = new Blob([protectionScript], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codform-protection-${shopDomain}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">تفعيل الحماية على Shopify</h1>
          <p className="text-muted-foreground">قم بتفعيل نظام الحماية على متجرك في Shopify</p>
        </div>
      </div>

      {/* تحذير مهم */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>مهم:</strong> تأكد من إضافة عناوين IP أو دول إلى قائمة الحظر أولاً من صفحة إعدادات الأمان قبل تفعيل الحماية.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup">إعداد الحماية</TabsTrigger>
          <TabsTrigger value="script">السكريپت</TabsTrigger>
          <TabsTrigger value="test">اختبار النظام</TabsTrigger>
        </TabsList>

        {/* تبويب الإعداد */}
        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إعداد نظام الحماية</CardTitle>
              <CardDescription>
                قم بإدخال نطاق متجرك وإنتاج سكريپت الحماية المخصص
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="shop-domain">نطاق المتجر</Label>
                <Input
                  id="shop-domain"
                  placeholder="example.myshopify.com"
                  value={shopDomain}
                  onChange={(e) => setShopDomain(e.target.value)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  أدخل نطاق متجر Shopify (مثال: mystore.myshopify.com)
                </p>
              </div>

              <Button
                onClick={generateProtectionScript}
                disabled={loading || !shopDomain}
                className="w-full"
              >
                {loading ? 'جاري الإنتاج...' : 'إنتاج سكريپت الحماية'}
                <Code className="ml-2 h-4 w-4" />
              </Button>

              {/* تعليمات التطبيق */}
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-3">خطوات التطبيق:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>قم بإنتاج سكريپت الحماية أعلاه</li>
                  <li>انتقل إلى إعدادات الثيم في شوبيفاي</li>
                  <li>افتح ملف <code>theme.liquid</code></li>
                  <li>الصق السكريپت قبل إغلاق <code>&lt;/head&gt;</code></li>
                  <li>احفظ التغييرات</li>
                  <li>اختبر النظام من التبويب الثالث</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب السكريپت */}
        <TabsContent value="script" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>سكريپت الحماية</CardTitle>
                  <CardDescription>
                    انسخ السكريپت أدناه والصقه في ثيم شوبيفاي
                  </CardDescription>
                </div>
                {protectionScript && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                      <Copy className="h-4 w-4 mr-2" />
                      نسخ
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadScript}>
                      <Download className="h-4 w-4 mr-2" />
                      تحميل
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {protectionScript ? (
                <div className="space-y-4">
                  <Textarea
                    value={protectionScript}
                    readOnly
                    rows={20}
                    className="font-mono text-sm"
                  />
                  
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      تم إنتاج السكريپت بنجاح! يمكنك الآن نسخه ولصقه في ثيم شوبيفاي.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لم يتم إنتاج السكريپت بعد</p>
                  <p className="text-sm">انتقل إلى تبويب "إعداد الحماية" لإنتاج السكريپت</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب الاختبار */}
        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>اختبار نظام الحماية</CardTitle>
              <CardDescription>
                تحقق من حالة نظام الحماية وفعاليته
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={testProtection}
                disabled={loading || !shopDomain}
                className="w-full"
              >
                {loading ? 'جاري الاختبار...' : 'اختبار النظام'}
                <TestTube className="ml-2 h-4 w-4" />
              </Button>

              {testResult && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${testResult.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className="font-medium">حالة النظام</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {testResult.message}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" />
                          <span className="font-medium">عناصر محظورة</span>
                        </div>
                        <div className="flex gap-4 mt-2">
                          <Badge variant="outline">
                            IP: {testResult.blocked_ips_count || 0}
                          </Badge>
                          <Badge variant="outline">
                            الدول: {testResult.blocked_countries_count || 0}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {testResult.status === 'success' && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        نظام الحماية جاهز للعمل! تأكد من تطبيق السكريپت في ثيم شوبيفاي.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* رابط للاختبار المباشر */}
              {shopDomain && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">اختبار مباشر</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    افتح متجرك في نافذة جديدة لاختبار الحماية مباشرة:
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => window.open(`https://${shopDomain}`, '_blank')}
                  >
                    فتح المتجر
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ShopifyProtectionSetup;