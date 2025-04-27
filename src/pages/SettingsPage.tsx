
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { LogOut } from 'lucide-react';
import AppSidebar from '@/components/layout/AppSidebar';

const SettingsPage = () => {
  const { user, signOut } = useAuth();

  if (!user) {
    return <div className="text-center py-8">الرجاء تسجيل الدخول</div>;
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      <main className="flex-1 pr-64 p-8">
        <div className="max-w-[1400px] mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-right">الإعدادات</h1>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-right">معلومات الحساب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-right w-full">
                  <p className="font-medium">البريد الإلكتروني</p>
                  <p className="text-gray-600">{user.email}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <Button 
                  variant="destructive" 
                  onClick={signOut}
                  className="w-full"
                >
                  <LogOut className="ml-2" />
                  تسجيل الخروج
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
