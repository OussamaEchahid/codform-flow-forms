import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Zap } from "lucide-react";
import SettingsLayout from "@/components/layout/SettingsLayout";
import { useI18n } from "@/lib/i18n";

const PlansSettings = () => {
  const { t } = useI18n();

  return (
    <SettingsLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Crown className="h-8 w-8" />
              {t('plansSettings')}
            </h1>
            <p className="text-muted-foreground">{t('plansSettingsDescription')}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  {t('basicPlan')}
                </CardTitle>
                <Badge variant="secondary">{t('currentPlan')}</Badge>
              </div>
              <CardDescription>For small projects and getting started / للمشاريع الصغيرة والبداية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-2xl font-bold">Free / مجاني</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Up to 5 forms / حتى 5 نماذج</li>
                <li>• 100 orders/month / 100 طلب شهرياً</li>
                <li>• Basic support / دعم أساسي</li>
                <li>• 1GB storage / تخزين 1GB</li>
              </ul>
              <Button className="w-full" disabled>
                {t('currentPlan')}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  {t('advancedPlan')}
                </CardTitle>
                <Badge>{t('mostPopular')}</Badge>
              </div>
              <CardDescription>For medium and growing businesses / للشركات المتوسطة والمتنامية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-2xl font-bold">$29/month / شهر</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Unlimited forms / نماذج غير محدودة</li>
                <li>• 10,000 orders/month / 10,000 طلب شهرياً</li>
                <li>• Advanced support / دعم متقدم</li>
                <li>• 50GB storage / تخزين 50GB</li>
                <li>• Advanced analytics / تحليلات متقدمة</li>
              </ul>
              <Button className="w-full">
                {t('upgradeNow')}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                {t('professionalPlan')}
              </CardTitle>
              <CardDescription>For large companies and enterprises / للشركات الكبيرة والمؤسسات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-2xl font-bold">$99/month / شهر</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Unlimited forms / نماذج غير محدودة</li>
                <li>• Unlimited orders / طلبات غير محدودة</li>
                <li>• 24/7 support / دعم 24/7</li>
                <li>• 500GB storage / تخزين 500GB</li>
                <li>• Advanced analytics / تحليلات متقدمة</li>
                <li>• Custom API / API مخصص</li>
              </ul>
              <Button className="w-full" variant="outline">
                {t('contactUs')}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('currentSubscription')}</CardTitle>
            <CardDescription>{t('currentSubscription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">{t('formsUsed')}</div>
                <div className="text-2xl font-bold">3/5</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">{t('ordersThisMonth')}</div>
                <div className="text-2xl font-bold">47/100</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">{t('storageUsed')}</div>
                <div className="text-2xl font-bold">0.3/1 GB</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">{t('renewalDate')}</div>
                <div className="text-2xl font-bold">--</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  );
};

export default PlansSettings;