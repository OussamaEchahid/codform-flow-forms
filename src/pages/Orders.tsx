
import React from 'react';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/lib/auth';

const Orders = () => {
  const { user } = useAuth();

  if (!user) {
    return <div className="text-center py-8">يرجى تسجيل الدخول للوصول إلى صفحة الطلبات</div>;
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-[1400px] mx-auto">
          <h1 className="text-3xl font-bold mb-6">الطلبات</h1>
          {/* Orders table will be implemented here */}
          <div className="text-center text-gray-500 py-12">
            لا توجد طلبات بعد
          </div>
        </div>
      </main>
    </div>
  );
};

export default Orders;
