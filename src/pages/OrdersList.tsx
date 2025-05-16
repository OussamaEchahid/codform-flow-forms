
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
  ListFilter,
  Eye,
  Calendar,
  User,
  Phone,
  ShoppingBag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Enhanced sample orders data with more professional details
const sampleOrders = [
  {
    id: 'ORD-001',
    customerName: 'أحمد محمد',
    phone: '+966 50 123 4567',
    date: '2025-05-14',
    status: 'pending',
    total: '320 SAR',
    paymentMethod: 'COD',
    items: 3,
    address: 'الرياض، حي النزهة',
    products: [
      { name: 'سماعات بلوتوث', quantity: 1, price: '150 SAR' },
      { name: 'حافظة هاتف', quantity: 2, price: '85 SAR' }
    ]
  },
  {
    id: 'ORD-002',
    customerName: 'سارة عبدالله',
    phone: '+966 55 234 5678',
    date: '2025-05-14',
    status: 'processing',
    total: '145 SAR',
    paymentMethod: 'COD',
    items: 1,
    address: 'جدة، حي الروضة',
    products: [
      { name: 'ساعة ذكية', quantity: 1, price: '145 SAR' }
    ]
  },
  {
    id: 'ORD-003',
    customerName: 'فيصل العتيبي',
    phone: '+966 54 345 6789',
    date: '2025-05-13',
    status: 'delivered',
    total: '560 SAR',
    paymentMethod: 'COD',
    items: 4,
    address: 'الدمام، حي الشاطئ',
    products: [
      { name: 'جهاز لوحي', quantity: 1, price: '450 SAR' },
      { name: 'حافظة جهاز', quantity: 1, price: '60 SAR' },
      { name: 'واقي شاشة', quantity: 2, price: '25 SAR' }
    ]
  },
  {
    id: 'ORD-004',
    customerName: 'نورة الشمري',
    phone: '+966 56 456 7890',
    date: '2025-05-13',
    status: 'cancelled',
    total: '99 SAR',
    paymentMethod: 'COD',
    items: 1,
    address: 'المدينة المنورة، حي القبلتين',
    products: [
      { name: 'شاحن سريع', quantity: 1, price: '99 SAR' }
    ]
  },
  {
    id: 'ORD-005',
    customerName: 'خالد الدوسري',
    phone: '+966 50 567 8901',
    date: '2025-05-12',
    status: 'delivered',
    total: '275 SAR',
    paymentMethod: 'COD',
    items: 2,
    address: 'الرياض، حي الملز',
    products: [
      { name: 'سماعات سلكية', quantity: 1, price: '120 SAR' },
      { name: 'مسكة هاتف', quantity: 1, price: '155 SAR' }
    ]
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

  // Summary counts for status cards
  const pendingCount = sampleOrders.filter(order => order.status === 'pending').length;
  const processingCount = sampleOrders.filter(order => order.status === 'processing').length;
  const deliveredCount = sampleOrders.filter(order => order.status === 'delivered').length;
  const cancelledCount = sampleOrders.filter(order => order.status === 'cancelled').length;

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

        {/* Order status summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'قيد الانتظار' : 'Pending'}
                  </p>
                  <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
                </div>
                <div className="p-2 bg-amber-50 rounded-full">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'قيد المعالجة' : 'Processing'}
                  </p>
                  <p className="text-2xl font-bold text-blue-600">{processingCount}</p>
                </div>
                <div className="p-2 bg-blue-50 rounded-full">
                  <PackageOpen className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'تم التوصيل' : 'Delivered'}
                  </p>
                  <p className="text-2xl font-bold text-green-600">{deliveredCount}</p>
                </div>
                <div className="p-2 bg-green-50 rounded-full">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'ملغاة' : 'Cancelled'}
                  </p>
                  <p className="text-2xl font-bold text-red-600">{cancelledCount}</p>
                </div>
                <div className="p-2 bg-red-50 rounded-full">
                  <PackageCheck className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
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
          
          {/* Orders table with enhanced fields */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">{language === 'ar' ? 'رقم الطلب' : 'Order ID'}</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {language === 'ar' ? 'اسم العميل' : 'Customer'}
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {language === 'ar' ? 'الهاتف' : 'Phone'}
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {language === 'ar' ? 'التاريخ' : 'Date'}
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <ShoppingBag className="h-4 w-4" />
                      {language === 'ar' ? 'المنتجات' : 'Items'}
                    </div>
                  </TableHead>
                  <TableHead>{language === 'ar' ? 'المبلغ' : 'Total'}</TableHead>
                  <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                  <TableHead className="text-right">{language === 'ar' ? 'خيارات' : 'Actions'}</TableHead>
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
                      <TableCell className="text-center">{order.items}</TableCell>
                      <TableCell className="font-medium">{order.total}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title={language === 'ar' ? 'عرض التفاصيل' : 'View Details'}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="flex items-center gap-1 bg-[#9b87f5] hover:bg-[#8b77e5]"
                          >
                            {language === 'ar' ? 'عرض' : 'View'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6">
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
