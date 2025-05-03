import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';

// استيراد لوحة تصحيح Shopify
import ShopifyDebugPanel from '@/components/shopify/ShopifyDebugPanel';

const Settings = () => {
  const { t, language } = useI18n();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex-1 p-8">
      <div className="max-w-[800px] mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {language === 'ar' ? 'الإعدادات' : 'Settings'}
          </h1>
          <p className="text-gray-600">
            {language === 'ar' ? 'تخصيص تجربة التطبيق' : 'Customize your app experience'}
          </p>
        </div>
        
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'المظهر' : 'Theme'}</CardTitle>
              <CardDescription>
                {language === 'ar' ? 'تخصيص مظهر التطبيق' : 'Customize the appearance of the app'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">{language === 'ar' ? 'اختر المظهر' : 'Choose Theme'}</Label>
                <Select value={theme} onValueChange={(value: any) => setTheme(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'ar' ? 'اختر المظهر' : 'Select a theme'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">{language === 'ar' ? 'فاتح' : 'Light'}</SelectItem>
                    <SelectItem value="dark">{language === 'ar' ? 'داكن' : 'Dark'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'اللغة' : 'Language'}</CardTitle>
              <CardDescription>
                {language === 'ar' ? 'تغيير لغة التطبيق' : 'Change the app language'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">{language === 'ar' ? 'اختر اللغة' : 'Choose Language'}</Label>
                <Select value={language} onValueChange={(value: any) => {
                  window.location.href = `/?lng=${value}`;
                  toast.success(language === 'ar' ? 'تم تغيير اللغة بنجاح' : 'Language changed successfully');
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'ar' ? 'اختر اللغة' : 'Select a language'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">{language === 'ar' ? 'العربية' : 'Arabic'}</SelectItem>
                    <SelectItem value="en">{language === 'ar' ? 'الإنجليزية' : 'English'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          {/* إضافة لوحة تصحيح Shopify */}
          <ShopifyDebugPanel />
          
          {/* ... keep existing code (مكونات إضافية إن وجدت) */}
        </div>
      </div>
    </div>
  );
};

export default Settings;
