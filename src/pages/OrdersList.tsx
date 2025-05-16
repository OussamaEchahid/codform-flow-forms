import React, { useState } from 'react';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Check,
  Clock, 
  Search,
  PackageCheck,
  PackageOpen,
  FileDown,
  ListFilter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Sample orders data (will be replaced with actual data from your API in production)
const sampleOrders = [
  {
    id: 'ORD-001',
    customerName: 'أحمد محمد',
    phone: '+966 50 123 4567',
    date: '2025-05-14',
    status: 'pending',
    total: '320 SAR',
    paymentMethod: 'COD',
    items: 3
  },
  {
    id: 'ORD-002',
    customerName: 'سارة عبدالله',
    phone: '+966 55 234 5678',
    date: '2025-05-14',
    status: 'processing',
    total: '145 SAR',
    paymentMethod: 'COD',
    items: 1
  },
  {
    id: 'ORD-003',
    customerName: 'فيصل العتيبي',
    phone: '+966 54 345 6789',
    date: '2025-05-13',
    status: 'delivered',
    total: '560 SAR',
    paymentMethod: 'COD',
    items: 4
  },
  {
    id: 'ORD-004',
    customerName: 'نورة الشمري',
    phone: '+966 56 456 7890',
    date: '2025-05-13',
    status: 'cancelled',
    total: '99 SAR',
    paymentMethod: 'COD',
    items: 1
  },
];

const OrdersList = () => {
  const { user, shopifyConnected, shop } = useAuth();
  const { language } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Allow access if either authenticated with user or connected with Shopify
  const hasAccess = !!user || shopifyConnected;
  
  // Check localStorage as fallback
  const localStorageConnected = localStorage.getItem('shopify_connected') === 'true';
  const actualHasAccess = hasAccess || localStorageConnected;
  const actualShop = shop || localStorage.getItem('shopify_store');

  if (!actualHasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-center py-8">
          {language === 'ar' 
            ? 'يرجى تسجيل الدخول أو الاتصال بمتجر Shopify للوصول إلى قسم الطلبات' 
            : 'Please login or connect a Shopify store to access orders'}
        </div>
      </div>
    );
  }

  // Status badge renderer
  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
          <Clock className="mr-1 h-3 w-3" />
          {language === 'ar' ? 'قيد الانتظار' : 'Pending'}
        </Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <PackageOpen className="mr-1 h-3 w-3" />
          {language === 'ar' ? 'قيد المعالجة' : 'Processing'}
        </Badge>;
      case 'delivered':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <Check className="mr-1 h-3 w-3" />
          {language === 'ar' ? 'تم التوصيل' : 'Delivered'}
        </Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <PackageCheck className="mr-1 h-3 w-3" />
          {language === 'ar' ? 'ملغي' : 'Cancelled'}
        </Badge>;
      default:
        return <Badge variant="outline">
          {status}
        </Badge>;
    }
  };

  // Filter orders based on search term
  const filteredOrders = sampleOrders.filter(order => 
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.phone.includes(searchTerm)
  );

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {language === 'ar' ? 'قائمة الطلبات' : 'Orders List'}
          </h1>
          
          <div className="flex space-x-2 rtl:space-x-reverse">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <FileDown className="h-4 w-4" />
              {language === 'ar' ? 'تصدير' : 'Export'}
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <ListFilter className="h-4 w-4" />
              {language === 'ar' ? 'تصفية' : 'Filter'}
            </Button>
          </div>
        </div>

        {/* Search and filters section */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder={language === 'ar' ? 'بحث عن طلب...' : 'Search orders...'}
              className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-medium text-lg">
              {language === 'ar' 
                ? `${filteredOrders.length} طلبات` 
                : `${filteredOrders.length} Orders`}
            </h2>
          </div>
          
          {/* Orders table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'ar' ? 'رقم الطلب' : 'Order ID'}</TableHead>
                  <TableHead>{language === 'ar' ? 'اسم العميل' : 'Customer Name'}</TableHead>
                  <TableHead>{language === 'ar' ? 'الهاتف' : 'Phone'}</TableHead>
                  <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                  <TableHead>{language === 'ar' ? 'المبلغ' : 'Total'}</TableHead>
                  <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                  <TableHead>{language === 'ar' ? 'خيارات' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{order.phone}</TableCell>
                      <TableCell>{new Date(order.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</TableCell>
                      <TableCell>{order.total}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          {language === 'ar' ? 'عرض' : 'View'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      {searchTerm ? 
                        (language === 'ar' ? 'لا توجد نتائج للبحث' : 'No search results found') : 
                        (language === 'ar' ? 'لا توجد طلبات حالياً' : 'No orders available yet')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersList;
