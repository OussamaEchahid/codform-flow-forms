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
  const [testResult, setTestResult] = useState<any>(null);
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
      // إنتاج السكريپت محلياً بدلاً من استخدام Edge Function
      const script = generateShopifyProtectionScript(shopDomain);
      setProtectionScript(script);

      toast({
        title: 'تم بنجاح',
        description: 'تم إنتاج سكريپت الحماية'
      });
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

  // دالة إنتاج السكريپت محلياً
  const generateShopifyProtectionScript = (shopDomain: string): string => {
    const supabaseUrl = 'https://trlklwixfeaexhydzaue.supabase.co';
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M';

    // تنظيف وحماية المتغيرات
    const cleanShopDomain = shopDomain.replace(/['"\\]/g, '').trim();

    return `<!-- CodForm Protection System - Generated for ${cleanShopDomain} -->
<script>
(function() {
  'use strict';

  // منع التشغيل المتعدد بشكل مطلق مع علامة عالمية قوية
  if (window.CodFormProtectionActive === true) {
    return;
  }
  window.CodFormProtectionActive = true;

  const SHOP_DOMAIN = '${cleanShopDomain}';
  const SECURITY_API = '${supabaseUrl}/functions/v1/store-security-check';
  const API_KEY = '${apiKey}';

  console.log('[CodForm] 🛡️ Protection system initialized for:', SHOP_DOMAIN);

  // حظر فوري وكامل للمحتوى
  function immediateBlock() {
    try {
      document.documentElement.style.cssText = 'visibility: hidden !important; opacity: 0 !important; pointer-events: none !important;';
      if (document.body) {
        document.body.style.cssText = 'display: none !important;';
      }
    } catch(e) {
      console.warn('[CodForm] Could not apply immediate block styles:', e);
    }
  }

  // حظر فوري عند التحميل
  immediateBlock();

  // تشغيل فحص الحماية
  async function activateProtection() {
    try {
      console.log('[CodForm] 🛡️ Activating store protection...');

      // الحصول على IP العنوان
      const visitorIP = await fetch('https://api.ipify.org?format=json')
        .then(r => r.json())
        .then(data => data.ip)
        .catch(() => null);

      if (!visitorIP) {
        console.warn('[CodForm] ⚠️ Could not get visitor IP - allowing access');
        allowAccess();
        return;
      }

      console.log('[CodForm] 🔍 Checking security for IP:', visitorIP);

      // فحص الحماية
      const response = await fetch(SECURITY_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + API_KEY
        },
        body: JSON.stringify({
          shop_id: SHOP_DOMAIN,
          visitor_ip: visitorIP,
          user_agent: navigator.userAgent,
          referer: document.referrer || window.location.href
        })
      });

      if (!response.ok) {
        throw new Error('Security check failed: ' + response.status);
      }

      const result = await response.json();
      console.log('[CodForm] 🔒 Security check result:', result);

      if (result.blocked) {
        console.warn('[CodForm] 🚫 Access BLOCKED:', result.reason);
        blockAccess(result);
      } else {
        console.log('[CodForm] ✅ Access ALLOWED');
        allowAccess();
      }

    } catch (error) {
      console.error('[CodForm] ❌ Protection error:', error);
      // في حالة الخطأ، إظهار المحتوى
      allowAccess();
    }
  }

  function allowAccess() {
    console.log('[CodForm] ✅ Allowing access - restoring page content');

    try {
      // إزالة جميع أنماط الحظر
      document.documentElement.style.cssText = '';
      if (document.body) {
        document.body.style.cssText = '';
      }

      // إعادة تفعيل التفاعل
      document.documentElement.style.visibility = 'visible';
      document.documentElement.style.opacity = '1';
      document.documentElement.style.pointerEvents = 'auto';

      if (document.body) {
        document.body.style.display = 'block';
        document.body.style.visibility = 'visible';
        document.body.style.opacity = '1';
      }

      console.log('[CodForm] ✅ Page content restored successfully');

    } catch(e) {
      console.error('[CodForm] Error restoring page content:', e);
      // fallback
      document.documentElement.style.cssText = 'visibility: visible !important; opacity: 1 !important; pointer-events: auto !important;';
      if (document.body) {
        document.body.style.cssText = 'display: block !important;';
      }
    }
  }

  function blockAccess(blockInfo) {
    console.log('[CodForm] 🚫 Blocking access with info:', blockInfo);

    // إزالة كل المحتوى والأحداث
    try {
      // مسح المحتوى بالكامل
      document.documentElement.innerHTML = '';

      // إنشاء صفحة الحظر
      const blockedHTML = createBlockedPageHTML(blockInfo);

      // استبدال الصفحة بالكامل
      document.open();
      document.write(blockedHTML);
      document.close();

    } catch(e) {
      console.error('[CodForm] Error during blocking process:', e);
      // fallback - إخفاء المحتوى على الأقل
      document.documentElement.style.cssText = 'display: none !important;';
      document.body.innerHTML = '<div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #f44336; color: white; display: flex; align-items: center; justify-content: center; font-family: Arial; z-index: 999999;"><h1>تم حظر الوصول - Access Blocked</h1></div>';
    }
  }

  function createBlockedPageHTML(blockInfo) {
    const reason = String(blockInfo.reason || 'تم حظر الوصول من موقعك').replace(/['"<>&]/g, function(match) {
      switch(match) {
        case '"': return '&quot;';
        case "'": return '&#39;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        default: return match;
      }
    });

    return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>تم حظر الوصول</title></head><body style="margin:0;padding:20px;font-family:Arial;background:#f44336;color:white;text-align:center;"><div style="max-width:500px;margin:50px auto;"><h1>🛡️ تم حظر الوصول</h1><p>عذراً، لا يمكنك الوصول إلى هذا المتجر في الوقت الحالي</p><div style="background:rgba(255,255,255,0.1);padding:20px;border-radius:10px;margin:20px 0;"><strong>السبب: ' + reason + '</strong></div><button onclick="window.location.reload()" style="background:white;color:#f44336;padding:10px 20px;border:none;border-radius:5px;cursor:pointer;">🔄 إعادة المحاولة</button></div></body></html>';
  }

  // تشغيل الحماية فوراً مع معالجة الأخطاء
  try {
    activateProtection().catch(function(error) {
      console.error('[CodForm] Protection activation failed:', error);
      // في حالة فشل التفعيل، إظهار المحتوى لتجنب حظر غير مقصود
      allowAccess();
    });
  } catch(error) {
    console.error('[CodForm] Critical protection error:', error);
    allowAccess();
  }

  // إضافة مراقب للتأكد من عدم تعطل الصفحة
  setTimeout(function() {
    if (document.documentElement.style.visibility === 'hidden') {
      console.warn('[CodForm] ⚠️ Page still hidden after timeout, forcing visibility');
      allowAccess();
    }
  }, 10000); // 10 ثوان timeout

})();
</script>`;
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

      setTestResult(data?.test_result);
      
      if (data?.success) {
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