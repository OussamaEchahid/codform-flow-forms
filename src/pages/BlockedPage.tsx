import React from 'react';
import { Shield, AlertTriangle, Home, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BlockedPageProps {
  reason?: string;
  blockType?: 'ip' | 'country';
  redirectUrl?: string;
  visitorCountry?: string;
  visitorIP?: string;
}

const BlockedPage: React.FC<BlockedPageProps> = ({
  reason = 'تم حظر الوصول إلى هذا المتجر',
  blockType = 'ip',
  redirectUrl,
  visitorCountry,
  visitorIP
}) => {
  // دالة لتطبيع عنوان URL للإعادة التوجيه
  const normalizeRedirectUrl = (url: string): string => {
    if (!url || url.trim() === '') {
      return '/';
    }

    const trimmedUrl = url.trim();

    // إذا كان URL يبدأ بـ http:// أو https://، استخدمه كما هو
    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
      return trimmedUrl;
    }

    // إذا كان URL يبدأ بـ www. أو يحتوي على نقطة ولا يبدأ بـ /، أضف https://
    if (trimmedUrl.startsWith('www.') || (trimmedUrl.includes('.') && !trimmedUrl.startsWith('/'))) {
      return 'https://' + trimmedUrl;
    }

    // إذا كان مسار نسبي، أبقه كما هو
    return trimmedUrl;
  };

  const handleRedirect = () => {
    const normalizedUrl = normalizeRedirectUrl(redirectUrl || '/');
    window.location.href = normalizedUrl;
  };

  const getBlockTypeLabel = () => {
    switch (blockType) {
      case 'ip':
        return 'عنوان IP';
      case 'country':
        return 'الموقع الجغرافي';
      default:
        return 'غير محدد';
    }
  };

  const getBlockTypeColor = () => {
    switch (blockType) {
      case 'ip':
        return 'destructive';
      case 'country':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* رأس الصفحة */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
            <Shield className="h-10 w-10 text-destructive" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              تم حظر الوصول
            </h1>
            <p className="text-muted-foreground text-lg">
              عذراً، لا يمكنك الوصول إلى هذا المتجر في الوقت الحالي
            </p>
          </div>
        </div>

        {/* بطاقة معلومات الحظر */}
        <Card className="border-destructive/20">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">معلومات الحظر</CardTitle>
            </div>
            <CardDescription className="text-base">
              {reason}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* تفاصيل الحظر */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">نوع الحظر</p>
                <Badge variant={getBlockTypeColor() as any} className="text-sm">
                  {getBlockTypeLabel()}
                </Badge>
              </div>
              
              {visitorIP && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">عنوان IP</p>
                  <p className="text-sm font-mono bg-muted p-2 rounded">
                    {visitorIP}
                  </p>
                </div>
              )}
              
              {visitorCountry && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">الموقع</p>
                  <p className="text-sm bg-muted p-2 rounded">
                    {visitorCountry}
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">الوقت</p>
                <p className="text-sm bg-muted p-2 rounded">
                  {new Date().toLocaleString('ar-SA')}
                </p>
              </div>
            </div>

            {/* رسالة إضافية */}
            <div className="bg-muted/50 p-4 rounded-lg border-l-4 border-primary">
              <h3 className="font-semibold text-primary mb-2">
                لماذا تم حظري؟
              </h3>
              <p className="text-sm text-muted-foreground">
                تم حظر الوصول إلى هذا المتجر بناءً على {getBlockTypeLabel()} الخاص بك. 
                هذا الإجراء قد يكون بسبب سياسات المتجر أو قيود جغرافية أو أسباب أمنية.
              </p>
            </div>

            {/* معلومات الاتصال */}
            <div className="bg-secondary/20 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">
                هل تعتقد أن هذا خطأ؟
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                إذا كنت تعتقد أنك تم حظرك بالخطأ، يمكنك التواصل مع إدارة المتجر لحل هذه المشكلة.
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• تأكد من أنك تستخدم اتصال إنترنت موثوق</p>
                <p>• قم بإيقاف أي VPN أو بروكسي قد تستخدمه</p>
                <p>• تواصل مع خدمة العملاء إذا استمر الحظر</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* أزرار الإجراءات */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            variant="outline" 
            onClick={handleRedirect}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {redirectUrl ? 'الانتقال إلى الصفحة المحددة' : 'العودة للرئيسية'}
          </Button>
          
          <Button
            variant="secondary"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            إعادة المحاولة
          </Button>
        </div>

        {/* تذييل الصفحة */}
        <div className="text-center text-xs text-muted-foreground border-t pt-4">
          <p>
            هذه الصفحة محمية بنظام أمان متقدم • 
            جميع محاولات الوصول يتم تسجيلها ومراقبتها
          </p>
        </div>
      </div>
    </div>
  );
};

export default BlockedPage;