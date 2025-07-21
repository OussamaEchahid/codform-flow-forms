
import React, { useState, useEffect } from 'react';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
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

// بيانات فارغة للطلبات (سيتم استبدالها ببيانات حقيقية من قاعدة البيانات)
const sampleOrders = [];

const OrdersList = () => {
  const { user, shopifyConnected, shop } = useAuth();
  const { language } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Allow access if either authenticated with user or connected with Shopify
  const hasAccess = !!user || shopifyConnected;
  
  // Check localStorage as fallback
  const localStorageConnected = localStorage.getItem('shopify_connected') === 'true';
  const actualHasAccess = hasAccess || localStorageConnected;
  const actualShop = shop || localStorage.getItem('shopify_store');

  // Fetch orders from database
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // Only fetch orders if we have a shop
        if (!actualShop) {
          console.log('No shop available, skipping orders fetch');
          setOrders([]);
          setLoading(false);
          return;
        }

        // Use orders-management function with GET method and shop_id filter
        const response = await fetch(
          `https://trlklwixfeaexhydzaue.supabase.co/functions/v1/orders-management?action=list-orders&shop_id=${encodeURIComponent(actualShop)}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setOrders(data?.orders || []);
        } else {
          console.error('Error fetching orders: HTTP', response.status);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    if (actualHasAccess && actualShop) {
      fetchOrders();
    } else if (actualHasAccess && !actualShop) {
      setOrders([]);
      setLoading(false);
    }
  }, [actualHasAccess, actualShop]);

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

  // Use real orders or sample data as fallback
  const ordersData = orders.length > 0 ? orders : sampleOrders;

  // Filter orders based on search term
  const filteredOrders = ordersData.filter(order => 
    (order.customer_name || order.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (order.order_number || order.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.customer_phone || order.phone || '').includes(searchTerm)
  );

  // Summary counts for status cards
  const pendingCount = ordersData.filter(order => order.status === 'pending').length;
  const processingCount = ordersData.filter(order => order.status === 'processing').length;
  const deliveredCount = ordersData.filter(order => order.status === 'delivered').length;
  const cancelledCount = ordersData.filter(order => order.status === 'cancelled').length;

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
                      <TableCell className="font-medium">{order.order_number || order.id}</TableCell>
                      <TableCell>{order.customer_name || order.customerName}</TableCell>
                      <TableCell>{order.customer_phone || order.phone}</TableCell>
                      <TableCell>{new Date(order.created_at || order.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</TableCell>
                      <TableCell className="text-center">{Array.isArray(order.items) ? order.items.length : order.items || 0}</TableCell>
                      <TableCell className="font-medium">
                        {order.total_amount !== undefined ? 
                          `${order.total_amount} ${order.currency || 'USD'}` : 
                          (order.total || `0 ${order.currency || 'USD'}`)
                        }
                      </TableCell>
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
