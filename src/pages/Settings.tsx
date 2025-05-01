
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Settings = () => {
  return (
    <div className="container mx-auto py-12" dir="rtl">
      <h1 className="text-3xl font-bold mb-8">الإعدادات</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>إعدادات الحساب</CardTitle>
            <CardDescription>إدارة إعدادات حسابك الشخصي</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">قريبًا ستتمكن من تعديل إعدادات الحساب من هنا.</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>إعدادات المتجر</CardTitle>
            <CardDescription>تكوين إعدادات المتجر وتكامل Shopify</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">قريبًا ستتمكن من تعديل إعدادات المتجر من هنا.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
