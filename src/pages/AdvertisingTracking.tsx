import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import SettingsLayout from '@/components/layout/SettingsLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { 
  Target, 
  Facebook, 
  Eye, 
  BarChart3, 
  Activity, 
  AlertCircle,
  CheckCircle,
  Copy,
  ExternalLink,
  Zap
} from 'lucide-react';

interface PixelSettings {
  enabled: boolean;
  pixelId: string;
  accessToken?: string;
}

interface TrackingEvent {
  name: string;
  enabled: boolean;
  description: string;
}

const AdvertisingTracking = () => {
  const { t, language } = useI18n();
  
  // Pixel Settings State
  const [facebookPixel, setFacebookPixel] = useState<PixelSettings>({
    enabled: false,
    pixelId: '',
    accessToken: ''
  });
  
  const [snapchatPixel, setSnapchatPixel] = useState<PixelSettings>({
    enabled: false,
    pixelId: ''
  });
  
  const [tiktokPixel, setTiktokPixel] = useState<PixelSettings>({
    enabled: false,
    pixelId: ''
  });

  // Tracking Events
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([
    {
      name: 'PageView',
      enabled: true,
      description: language === 'ar' ? 'تتبع زيارات الصفحات' : 'Track page visits'
    },
    {
      name: 'ViewContent',
      enabled: true,
      description: language === 'ar' ? 'تتبع عرض المنتجات' : 'Track product views'
    },
    {
      name: 'AddToCart',
      enabled: true,
      description: language === 'ar' ? 'تتبع إضافة المنتجات للسلة' : 'Track add to cart events'
    },
    {
      name: 'InitiateCheckout',
      enabled: true,
      description: language === 'ar' ? 'تتبع بدء عملية الشراء' : 'Track checkout initiation'
    },
    {
      name: 'Purchase',
      enabled: true,
      description: language === 'ar' ? 'تتبع عمليات الشراء المكتملة' : 'Track completed purchases'
    },
    {
      name: 'Lead',
      enabled: true,
      description: language === 'ar' ? 'تتبع تسجيل العملاء المحتملين' : 'Track lead generation'
    }
  ]);

  const handleSave = () => {
    // Save logic here
    toast({
      title: language === 'ar' ? 'تم الحفظ بنجاح' : 'Settings Saved',
      description: language === 'ar' ? 'تم حفظ إعدادات التتبع الإعلاني' : 'Advertising tracking settings have been saved',
    });
  };

  const copyPixelCode = (platform: string, pixelId: string) => {
    let code = '';
    
    switch (platform) {
      case 'facebook':
        code = `<!-- Facebook Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"
/></noscript>
<!-- End Facebook Pixel Code -->`;
        break;
      case 'snapchat':
        code = `<!-- Snapchat Pixel Code -->
<script type='text/javascript'>
(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function()
{a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
a.queue=[];var s='script';r=t.createElement(s);r.async=!0;
r.src=n;var u=t.getElementsByTagName(s)[0];
u.parentNode.insertBefore(r,u);})(window,document,
'https://sc-static.net/scevent.min.js');
snaptr('init', '${pixelId}', {
'user_email': '__INSERT_USER_EMAIL__'
});
snaptr('track', 'PAGE_VIEW');
</script>
<!-- End Snapchat Pixel Code -->`;
        break;
      case 'tiktok':
        code = `<!-- TikTok Pixel Code -->
<script>
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
  ttq.load('${pixelId}');
  ttq.page();
}(window, document, 'ttq');
</script>
<!-- End TikTok Pixel Code -->`;
        break;
    }
    
    navigator.clipboard.writeText(code);
    toast({
      title: language === 'ar' ? 'تم النسخ' : 'Code Copied',
      description: language === 'ar' ? `تم نسخ كود ${platform} Pixel` : `${platform} Pixel code copied to clipboard`,
    });
  };

  const toggleEvent = (eventName: string) => {
    setTrackingEvents(prev => 
      prev.map(event => 
        event.name === eventName 
          ? { ...event, enabled: !event.enabled }
          : event
      )
    );
  };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Target className="h-8 w-8 text-primary" />
              {language === 'ar' ? 'التتبع الإعلاني' : 'Advertising Tracking'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {language === 'ar' 
                ? 'إعداد وإدارة بكسلات التتبع الإعلاني لتحسين حملاتك التسويقية'
                : 'Set up and manage advertising tracking pixels to optimize your marketing campaigns'
              }
            </p>
          </div>
          <Button onClick={handleSave} className="gap-2">
            <CheckCircle className="h-4 w-4" />
            {language === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Facebook className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Facebook Pixel</p>
                  <Badge variant={facebookPixel.enabled ? 'default' : 'secondary'}>
                    {facebookPixel.enabled ? 
                      (language === 'ar' ? 'نشط' : 'Active') : 
                      (language === 'ar' ? 'غير نشط' : 'Inactive')
                    }
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">S</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Snapchat Pixel</p>
                  <Badge variant={snapchatPixel.enabled ? 'default' : 'secondary'}>
                    {snapchatPixel.enabled ? 
                      (language === 'ar' ? 'نشط' : 'Active') : 
                      (language === 'ar' ? 'غير نشط' : 'Inactive')
                    }
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 bg-black rounded-sm flex items-center justify-center">
                  <span className="text-xs font-bold text-white">T</span>
                </div>
                <div>
                  <p className="text-sm font-medium">TikTok Pixel</p>
                  <Badge variant={tiktokPixel.enabled ? 'default' : 'secondary'}>
                    {tiktokPixel.enabled ? 
                      (language === 'ar' ? 'نشط' : 'Active') : 
                      (language === 'ar' ? 'غير نشط' : 'Inactive')
                    }
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">
                    {language === 'ar' ? 'الأحداث النشطة' : 'Active Events'}
                  </p>
                  <Badge variant="default">
                    {trackingEvents.filter(e => e.enabled).length}/{trackingEvents.length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="pixels" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pixels">
              {language === 'ar' ? 'إعداد البكسلات' : 'Pixel Setup'}
            </TabsTrigger>
            <TabsTrigger value="events">
              {language === 'ar' ? 'تتبع الأحداث' : 'Event Tracking'}
            </TabsTrigger>
          </TabsList>

          {/* Pixels Setup Tab */}
          <TabsContent value="pixels" className="space-y-6">
            {/* Facebook Pixel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Facebook className="h-6 w-6 text-blue-600" />
                  Facebook Pixel
                  <Badge variant={facebookPixel.enabled ? 'default' : 'secondary'}>
                    {facebookPixel.enabled ? 
                      (language === 'ar' ? 'نشط' : 'Active') : 
                      (language === 'ar' ? 'غير نشط' : 'Inactive')
                    }
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {language === 'ar' 
                    ? 'تتبع زوار موقعك وتحسين إعلانات فيسبوك وإنستجرام'
                    : 'Track website visitors and optimize Facebook & Instagram ads'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={facebookPixel.enabled}
                    onCheckedChange={(checked) => 
                      setFacebookPixel(prev => ({ ...prev, enabled: checked }))
                    }
                  />
                  <Label>
                    {language === 'ar' ? 'تفعيل Facebook Pixel' : 'Enable Facebook Pixel'}
                  </Label>
                </div>
                
                {facebookPixel.enabled && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="facebook-pixel-id">
                          {language === 'ar' ? 'معرف البكسل' : 'Pixel ID'}
                        </Label>
                        <Input
                          id="facebook-pixel-id"
                          placeholder="123456789012345"
                          value={facebookPixel.pixelId}
                          onChange={(e) => 
                            setFacebookPixel(prev => ({ ...prev, pixelId: e.target.value }))
                          }
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="facebook-access-token">
                          {language === 'ar' ? 'رمز الوصول (اختياري)' : 'Access Token (Optional)'}
                        </Label>
                        <Input
                          id="facebook-access-token"
                          placeholder="Access Token"
                          type="password"
                          value={facebookPixel.accessToken || ''}
                          onChange={(e) => 
                            setFacebookPixel(prev => ({ ...prev, accessToken: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                    
                    {facebookPixel.pixelId && (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyPixelCode('facebook', facebookPixel.pixelId)}
                          className="gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          {language === 'ar' ? 'نسخ الكود' : 'Copy Code'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          asChild
                        >
                          <a 
                            href="https://www.facebook.com/events_manager" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            {language === 'ar' ? 'إدارة الأحداث' : 'Events Manager'}
                          </a>
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Snapchat Pixel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="h-6 w-6 bg-yellow-400 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-white">S</span>
                  </div>
                  Snapchat Pixel
                  <Badge variant={snapchatPixel.enabled ? 'default' : 'secondary'}>
                    {snapchatPixel.enabled ? 
                      (language === 'ar' ? 'نشط' : 'Active') : 
                      (language === 'ar' ? 'غير نشط' : 'Inactive')
                    }
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {language === 'ar' 
                    ? 'تتبع التحويلات وتحسين إعلانات سناب شات'
                    : 'Track conversions and optimize Snapchat ads'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={snapchatPixel.enabled}
                    onCheckedChange={(checked) => 
                      setSnapchatPixel(prev => ({ ...prev, enabled: checked }))
                    }
                  />
                  <Label>
                    {language === 'ar' ? 'تفعيل Snapchat Pixel' : 'Enable Snapchat Pixel'}
                  </Label>
                </div>
                
                {snapchatPixel.enabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="snapchat-pixel-id">
                        {language === 'ar' ? 'معرف البكسل' : 'Pixel ID'}
                      </Label>
                      <Input
                        id="snapchat-pixel-id"
                        placeholder="12345678-1234-1234-1234-123456789012"
                        value={snapchatPixel.pixelId}
                        onChange={(e) => 
                          setSnapchatPixel(prev => ({ ...prev, pixelId: e.target.value }))
                        }
                      />
                    </div>
                    
                    {snapchatPixel.pixelId && (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyPixelCode('snapchat', snapchatPixel.pixelId)}
                          className="gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          {language === 'ar' ? 'نسخ الكود' : 'Copy Code'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          asChild
                        >
                          <a 
                            href="https://ads.snapchat.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            {language === 'ar' ? 'إدارة الإعلانات' : 'Ads Manager'}
                          </a>
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* TikTok Pixel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="h-6 w-6 bg-black rounded-sm flex items-center justify-center">
                    <span className="text-sm font-bold text-white">T</span>
                  </div>
                  TikTok Pixel
                  <Badge variant={tiktokPixel.enabled ? 'default' : 'secondary'}>
                    {tiktokPixel.enabled ? 
                      (language === 'ar' ? 'نشط' : 'Active') : 
                      (language === 'ar' ? 'غير نشط' : 'Inactive')
                    }
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {language === 'ar' 
                    ? 'تتبع الأحداث وتحسين إعلانات تيك توك'
                    : 'Track events and optimize TikTok ads'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={tiktokPixel.enabled}
                    onCheckedChange={(checked) => 
                      setTiktokPixel(prev => ({ ...prev, enabled: checked }))
                    }
                  />
                  <Label>
                    {language === 'ar' ? 'تفعيل TikTok Pixel' : 'Enable TikTok Pixel'}
                  </Label>
                </div>
                
                {tiktokPixel.enabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="tiktok-pixel-id">
                        {language === 'ar' ? 'معرف البكسل' : 'Pixel ID'}
                      </Label>
                      <Input
                        id="tiktok-pixel-id"
                        placeholder="C123456789012345ABCD"
                        value={tiktokPixel.pixelId}
                        onChange={(e) => 
                          setTiktokPixel(prev => ({ ...prev, pixelId: e.target.value }))
                        }
                      />
                    </div>
                    
                    {tiktokPixel.pixelId && (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyPixelCode('tiktok', tiktokPixel.pixelId)}
                          className="gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          {language === 'ar' ? 'نسخ الكود' : 'Copy Code'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          asChild
                        >
                          <a 
                            href="https://ads.tiktok.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            {language === 'ar' ? 'إدارة الإعلانات' : 'Ads Manager'}
                          </a>
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tracking Tab */}
          <TabsContent value="events" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Activity className="h-6 w-6 text-primary" />
                  {language === 'ar' ? 'أحداث التتبع' : 'Tracking Events'}
                </CardTitle>
                <CardDescription>
                  {language === 'ar' 
                    ? 'تحديد الأحداث التي تريد تتبعها عبر جميع المنصات الإعلانية'
                    : 'Configure which events to track across all advertising platforms'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trackingEvents.map((event) => (
                    <div key={event.name} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Switch 
                          checked={event.enabled}
                          onCheckedChange={() => toggleEvent(event.name)}
                        />
                        <div>
                          <h4 className="font-medium">{event.name}</h4>
                          <p className="text-sm text-muted-foreground">{event.description}</p>
                        </div>
                      </div>
                      <Badge variant={event.enabled ? 'default' : 'secondary'}>
                        {event.enabled ? 
                          (language === 'ar' ? 'نشط' : 'Active') : 
                          (language === 'ar' ? 'غير نشط' : 'Inactive')
                        }
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Implementation Guide */}
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                <strong>
                  {language === 'ar' ? 'دليل التنفيذ:' : 'Implementation Guide:'}
                </strong>
                <br />
                {language === 'ar' 
                  ? 'بعد حفظ الإعدادات، ستحتاج إلى إضافة أكواد البكسل إلى موقعك. يمكنك نسخ الأكواد من الأعلى ولصقها في قسم <head> في موقعك، أو استخدام Google Tag Manager لإدارة جميع البكسلات.'
                  : 'After saving settings, you\'ll need to add the pixel codes to your website. You can copy the codes above and paste them in the <head> section of your site, or use Google Tag Manager to manage all pixels.'
                }
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </div>
    </SettingsLayout>
  );
};

export default AdvertisingTracking;