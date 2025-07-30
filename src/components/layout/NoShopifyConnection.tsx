import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Store as StoreIcon, 
  Download, 
  ExternalLink, 
  ArrowRight, 
  CheckCircle,
  Smartphone,
  Globe,
  Settings,
  Zap
} from 'lucide-react';

const NoShopifyConnection = () => {
  const navigate = useNavigate();
  const { language, t } = useI18n();

  const steps = [
    {
      number: 1,
      icon: <Globe className="w-6 h-6" />,
      title: language === 'ar' ? 'افتح متجر Shopify الخاص بك' : 'Open Your Shopify Store',
      description: language === 'ar' 
        ? 'قم بتسجيل الدخول إلى لوحة تحكم Shopify الخاصة بك'
        : 'Log in to your Shopify admin dashboard',
      action: language === 'ar' ? 'الذهاب إلى Shopify' : 'Go to Shopify',
      link: 'https://admin.shopify.com'
    },
    {
      number: 2,
      icon: <Download className="w-6 h-6" />,
      title: language === 'ar' ? 'ابحث عن تطبيق CODmagnet' : 'Find CODmagnet App',
      description: language === 'ar' 
        ? 'اذهب إلى قسم التطبيقات وابحث عن "CODmagnet" أو قم بتثبيت التطبيق من الرابط'
        : 'Go to Apps section and search for "CODmagnet" or install from the link',
      action: language === 'ar' ? 'تثبيت التطبيق' : 'Install App',
      link: 'https://apps.shopify.com'
    },
    {
      number: 3,
      icon: <Zap className="w-6 h-6" />,
      title: language === 'ar' ? 'افتح التطبيق' : 'Launch the App',
      description: language === 'ar' 
        ? 'بعد التثبيت، انقر على التطبيق لفتحه والبدء في استخدامه'
        : 'After installation, click on the app to launch it and start using it',
      action: language === 'ar' ? 'تشغيل التطبيق' : 'Launch App'
    }
  ];

  const features = [
    {
      icon: <StoreIcon className="w-5 h-5 text-blue-600" />,
      title: language === 'ar' ? 'إدارة متكاملة للمتاجر' : 'Integrated Store Management',
      description: language === 'ar' 
        ? 'ربط وإدارة عدة متاجر Shopify من مكان واحد'
        : 'Connect and manage multiple Shopify stores from one place'
    },
    {
      icon: <Settings className="w-5 h-5 text-green-600" />,
      title: language === 'ar' ? 'نماذج قابلة للتخصيص' : 'Customizable Forms',
      description: language === 'ar' 
        ? 'إنشاء نماذج مخصصة للدفع عند الاستلام'
        : 'Create custom cash-on-delivery forms'
    },
    {
      icon: <CheckCircle className="w-5 h-5 text-purple-600" />,
      title: language === 'ar' ? 'تتبع الطلبات' : 'Order Tracking',
      description: language === 'ar' 
        ? 'متابعة وإدارة جميع طلباتك بسهولة'
        : 'Track and manage all your orders easily'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="max-w-4xl mx-auto w-full">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl">
                <StoreIcon className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {language === 'ar' ? 'مرحباً بك في CODmagnet' : 'Welcome to CODmagnet'}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {language === 'ar' 
                ? 'لبدء استخدام التطبيق، تحتاج لربطه بمتجر Shopify الخاص بك. اتبع الخطوات التالية للبدء'
                : 'To start using the app, you need to connect it to your Shopify store. Follow these steps to get started'}
            </p>
          </div>

          {/* Alert */}
          <Alert className="mb-8 border-amber-200 bg-amber-50">
            <Smartphone className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>{language === 'ar' ? 'مهم:' : 'Important:'}</strong>{' '}
              {language === 'ar' 
                ? 'يجب تثبيت التطبيق من داخل متجر Shopify للحصول على الاتصال الآمن والمعتمد'
                : 'The app must be installed from within your Shopify store for secure and authorized connection'}
            </AlertDescription>
          </Alert>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {steps.map((step, index) => (
              <Card key={step.number} className="relative overflow-hidden border-2 hover:border-blue-300 transition-all duration-300 hover:shadow-lg">
                <CardHeader className="text-center pb-4">
                  <div className="absolute top-4 right-4 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                    {step.number}
                  </div>
                  <div className="bg-gradient-to-r from-blue-100 to-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="text-blue-600">{step.icon}</div>
                  </div>
                  <CardTitle className="text-lg mb-2">{step.title}</CardTitle>
                  <CardDescription className="text-sm">{step.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  {step.link ? (
                    <Button
                      onClick={() => window.open(step.link, '_blank')}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {step.action}
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      disabled
                      className="w-full bg-gray-200 text-gray-500 cursor-not-allowed"
                    >
                      {step.action}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Features */}
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gray-900 mb-2">
                {language === 'ar' ? 'ماذا ستحصل عليه؟' : 'What You\'ll Get'}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {language === 'ar' 
                  ? 'تطبيق شامل لإدارة متجرك الإلكتروني بكفاءة'
                  : 'A comprehensive app to manage your online store efficiently'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3 rtl:space-x-reverse">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="text-center space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => window.open('https://admin.shopify.com', '_blank')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
              >
                <StoreIcon className="w-5 h-5 mr-2" />
                {language === 'ar' ? 'فتح متجر Shopify' : 'Open Shopify Store'}
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={() => window.open('https://apps.shopify.com', '_blank')}
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3"
              >
                <Download className="w-5 h-5 mr-2" />
                {language === 'ar' ? 'تصفح متجر التطبيقات' : 'Browse App Store'}
              </Button>
            </div>
            
            <p className="text-sm text-gray-500">
              {language === 'ar' 
                ? 'هل تحتاج مساعدة؟ راسلنا على support@codmagnet.com'
                : 'Need help? Contact us at support@codmagnet.com'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoShopifyConnection;