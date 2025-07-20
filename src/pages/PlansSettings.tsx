import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Zap } from "lucide-react";

const PlansSettings = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Crown className="h-8 w-8" />
            الخطط
          </h1>
          <p className="text-muted-foreground">إدارة خطط الاشتراك والترقية</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="relative">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                الخطة الأساسية
              </CardTitle>
              <Badge variant="secondary">الحالية</Badge>
            </div>
            <CardDescription>للمشاريع الصغيرة والبداية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-2xl font-bold">مجاني</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• حتى 5 نماذج</li>
              <li>• 100 طلب شهرياً</li>
              <li>• دعم أساسي</li>
              <li>• تخزين 1GB</li>
            </ul>
            <Button className="w-full" disabled>
              الخطة الحالية
            </Button>
          </CardContent>
        </Card>

        <Card className="border-primary relative">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                الخطة المتقدمة
              </CardTitle>
              <Badge>الأكثر شعبية</Badge>
            </div>
            <CardDescription>للشركات المتوسطة والمتنامية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-2xl font-bold">$29/شهر</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• نماذج غير محدودة</li>
              <li>• 10,000 طلب شهرياً</li>
              <li>• دعم متقدم</li>
              <li>• تخزين 50GB</li>
              <li>• تحليلات متقدمة</li>
            </ul>
            <Button className="w-full">
              ترقية الآن
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              الخطة الاحترافية
            </CardTitle>
            <CardDescription>للشركات الكبيرة والمؤسسات</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-2xl font-bold">$99/شهر</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• نماذج غير محدودة</li>
              <li>• طلبات غير محدودة</li>
              <li>• دعم 24/7</li>
              <li>• تخزين 500GB</li>
              <li>• تحليلات متقدمة</li>
              <li>• API مخصص</li>
            </ul>
            <Button className="w-full" variant="outline">
              اتصل بنا
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>معلومات الاشتراك الحالي</CardTitle>
          <CardDescription>تفاصيل خطتك الحالية والاستخدام</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">النماذج المستخدمة</div>
              <div className="text-2xl font-bold">3/5</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">الطلبات هذا الشهر</div>
              <div className="text-2xl font-bold">47/100</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">التخزين المستخدم</div>
              <div className="text-2xl font-bold">0.3/1 GB</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">تاريخ التجديد</div>
              <div className="text-2xl font-bold">--</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlansSettings;