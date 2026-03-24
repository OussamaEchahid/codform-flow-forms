
import React, { useState, useEffect } from 'react';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { isAdminBypassEnabled } from '@/utils/admin-mode';
import OrderDetailsDialog from '@/components/orders/OrderDetailsDialog';
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
  ShoppingBag,
  Trash2,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// بيانات فارغة للطلبات (سيتم استبدالها ببيانات حقيقية من قاعدة البيانات)
const sampleOrders = [];

const OrdersList = () => {
  const { user, shopifyConnected, shop } = useAuth();
  const { language } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  
  // Allow access if either authenticated with user or connected with Shopify
  const hasAccess = !!user || shopifyConnected;
  
  // Check localStorage as fallback
  const localStorageConnected = localStorage.getItem('shopify_connected') === 'true';
  const actualHasAccess = hasAccess || localStorageConnected;
  const actualShop = shop || localStorage.getItem('shopify_store');

  // Fetch orders from database with auto-refresh
  useEffect(() => {
    let isMounted = true;
    
    const fetchOrders = async (forceRefresh = false) => {
      try {
        // Only fetch orders if we have a shop
        if (!actualShop) {
          console.log('No shop available, skipping orders fetch');
          if (isMounted) {
            setOrders([]);
            setLoading(false);
          }
          return;
        }

        if (forceRefresh) {
          console.log('🔄 Force refreshing orders for shop:', actualShop);
        }

        // Use orders-management function with GET method and shop_id filter
        const response = await fetch(
          `https://nnwnuurkcmuvprirsfho.supabase.co/functions/v1/orders-management?action=list-orders&shop_id=${encodeURIComponent(actualShop)}&refresh=${forceRefresh}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ud251dXJrY211dnByaXJzZmhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTMwMjcsImV4cCI6MjA4OTY2OTAyN30.u91K1NfUkhYiIPOVGNb3CepK0F8WfjPhGcG1T63KDOc`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (isMounted) {
            setOrders(data?.orders || []);
            console.log('✅ Orders loaded:', data?.orders?.length || 0);
          }
        } else {
          console.error('Error fetching orders: HTTP', response.status);
          // Try to refresh connection after a delay
          setTimeout(() => {
            if (isMounted) {
              fetchOrders(true);
            }
          }, 2000);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        // Retry with refresh after error
        setTimeout(() => {
          if (isMounted && actualShop) {
            fetchOrders(true);
          }
        }, 3000);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (actualHasAccess && actualShop) {
      setLoading(true);
      fetchOrders();
      
      // Auto-refresh every 30 seconds
      const refreshInterval = setInterval(() => {
        if (isMounted && actualShop) {
          fetchOrders(false);
        }
      }, 30000);

      return () => {
        isMounted = false;
        clearInterval(refreshInterval);
      };
    } else if (actualHasAccess && !actualShop) {
      setOrders([]);
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [actualHasAccess, actualShop]);

  // Listen for storage changes to refresh data
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'current_shopify_store' || e.key === 'shopify_store' || e.key === 'shopify_connected') {
        // Delay to allow state to update
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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

  // Filter orders based on search term, status, and date
  const filteredOrders = ordersData.filter(order => {
    // Search filter
    const matchesSearch = searchTerm === '' ||
      (order.customer_name || order.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.order_number || order.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customer_phone || order.phone || '').includes(searchTerm);

    // Status filter
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    // Date filter
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const orderDate = new Date(order.created_at || order.date);
      const today = new Date();
      const daysDiff = Math.floor((today.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));

      switch (dateFilter) {
        case 'today':
          matchesDate = daysDiff === 0;
          break;
        case 'week':
          matchesDate = daysDiff <= 7;
          break;
        case 'month':
          matchesDate = daysDiff <= 30;
          break;
        default:
          matchesDate = true;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Summary counts for status cards
  const pendingCount = ordersData.filter(order => order.status === 'pending').length;
  const processingCount = ordersData.filter(order => order.status === 'processing').length;
  const deliveredCount = ordersData.filter(order => order.status === 'delivered').length;
  const cancelledCount = ordersData.filter(order => order.status === 'cancelled').length;

  // Handle opening order details
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };

  // Handle closing order details
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedOrder(null);
  };

  // Handle individual order selection
  const handleSelectOrder = (orderId, checked) => {
    const newSelected = new Set(selectedOrders);
    if (checked) {
      newSelected.add(orderId);
    } else {
      newSelected.delete(orderId);
    }
    setSelectedOrders(newSelected);
  };

  // Handle select all orders
  const handleSelectAll = (checked) => {
    if (checked) {
      const allOrderIds = new Set(filteredOrders.map(order => order.id));
      setSelectedOrders(allOrderIds);
    } else {
      setSelectedOrders(new Set());
    }
  };

  // Handle single order delete
  const handleDeleteOrder = async (orderId: string) => {
    try {
      setLoading(true);

      // Use admin function to delete single order
      const { data, error } = await supabase.rpc('delete_orders_admin' as any, {
        order_ids: [orderId]
      });

      if (error) {
        console.error('Error deleting order:', error);
        alert(`خطأ في حذف الطلب: ${error.message}`);
      } else if (data) {
        console.log('Delete result:', data);
        if (data.success) {
          alert(`تم حذف الطلب بنجاح`);
          // Refresh orders list
          window.location.reload();
        } else {
          alert(`خطأ في حذف الطلب: ${data.error}`);
        }
      }

    } catch (error) {
      console.error('Error deleting order:', error);
      alert(`خطأ غير متوقع: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedOrders.size === 0) return;

    try {
      setLoading(true);

      // Delete selected orders using admin function that bypasses RLS
      const orderIds = Array.from(selectedOrders);
      const { data, error } = await supabase.rpc('delete_orders_admin' as any, {
        order_ids: orderIds
      });

      if (error) {
        console.error('Error deleting orders:', error);
        alert(`خطأ في حذف الطلبات: ${error.message}`);
      } else if (data) {
        console.log('Delete result:', data);
        if (data.success) {
          alert(`تم حذف ${data.deleted_count} طلب بنجاح`);
          // Refresh orders list
          window.location.reload();
        } else {
          alert(`خطأ في حذف الطلبات: ${data.error}`);
        }
      }

      // Clear selection
      setSelectedOrders(new Set());
      setShowDeleteConfirm(false);

    } catch (error) {
      console.error('Error deleting orders:', error);
      alert(`خطأ غير متوقع: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle export functionality
  const handleExport = () => {
    try {
      const dataToExport = selectedOrders.size > 0
        ? filteredOrders.filter(order => selectedOrders.has(order.id))
        : filteredOrders;

      // Create CSV content
      const headers = ['Order ID', 'Customer', 'Phone', 'Date', 'Total', 'Currency', 'Status'];
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(order => [
          order.order_number || order.id,
          `"${order.customer_name || order.customerName || ''}"`,
          order.customer_phone || order.phone || '',
          new Date(order.created_at || order.date).toLocaleDateString(),
          extractOrderPrice(order),
          order.currency || 'USD',
          order.status || 'pending'
        ].join(','))
      ].join('\n');

      // Download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log(`Exported ${dataToExport.length} orders to CSV`);
    } catch (error) {
      console.error('Error exporting orders:', error);
    }
  };

  // Extract real price from order data and convert to USD
  const extractOrderPrice = (order) => {
    let amount = 0;

    // First priority: use total_amount (this is the final price after discounts)
    if (order.total_amount && parseFloat(order.total_amount) > 0) {
      amount = parseFloat(order.total_amount);
    }
    // Second priority: try to get price from items
    else if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      const firstItem = order.items[0];
      if (firstItem.price && parseFloat(firstItem.price) > 0) {
        amount = parseFloat(firstItem.price);
      }
    }
    // Last fallback - check if there's form data with converted price
    else if (order.form_data) {
      const formData = typeof order.form_data === 'string' ?
        JSON.parse(order.form_data) : order.form_data;

      if (formData.extractedPrice && parseFloat(formData.extractedPrice) > 0) {
        amount = parseFloat(formData.extractedPrice);
      }
    }

    // ✅ تحويل إلى USD إذا كانت العملة المحفوظة ليست USD
    const orderCurrency = order.currency || 'USD';
    if (orderCurrency !== 'USD' && amount > 0) {
      const rates = { 'USD': 1.0, 'SAR': 3.75, 'AED': 3.67, 'MAD': 10.0, 'EUR': 0.85 };
      const fromRate = rates[orderCurrency] || 1;
      amount = amount / fromRate; // تحويل إلى USD
    }

    return amount > 0 ? amount.toFixed(2) : "0.00";
  };

  // Handle saving order changes
  const handleSaveOrder = async (updatedOrder) => {
    try {
      // Update the order in the local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === updatedOrder.id ? { ...order, ...updatedOrder } : order
        )
      );

      // Refresh orders list to get latest data
      window.location.reload();

      console.log('Order updated successfully:', updatedOrder);
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

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
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={language === 'ar' ? 'بحث عن طلب...' : 'Search orders...'}
                className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              {selectedOrders.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  {language === 'ar' ? `حذف (${selectedOrders.size})` : `Delete (${selectedOrders.size})`}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={handleExport}
              >
                <Download className="h-4 w-4" />
                {language === 'ar' ? 'تصدير' : 'Export'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <ListFilter className="h-4 w-4" />
                {language === 'ar' ? 'تصفية' : 'Filter'}
              </Button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'تصفية حسب الحالة' : 'Filter by Status'}
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">{language === 'ar' ? 'جميع الحالات' : 'All Status'}</option>
                    <option value="pending">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</option>
                    <option value="processing">{language === 'ar' ? 'قيد المعالجة' : 'Processing'}</option>
                    <option value="delivered">{language === 'ar' ? 'تم التسليم' : 'Delivered'}</option>
                    <option value="cancelled">{language === 'ar' ? 'ملغي' : 'Cancelled'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'ar' ? 'تصفية حسب التاريخ' : 'Filter by Date'}
                  </label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">{language === 'ar' ? 'جميع التواريخ' : 'All Dates'}</option>
                    <option value="today">{language === 'ar' ? 'اليوم' : 'Today'}</option>
                    <option value="week">{language === 'ar' ? 'هذا الأسبوع' : 'This Week'}</option>
                    <option value="month">{language === 'ar' ? 'هذا الشهر' : 'This Month'}</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all');
                    setDateFilter('all');
                  }}
                >
                  {language === 'ar' ? 'إعادة تعيين' : 'Reset Filters'}
                </Button>
              </div>
            </div>
          )}

          {/* Selection info */}
          {selectedOrders.size > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                {language === 'ar'
                  ? `تم اختيار ${selectedOrders.size} من ${filteredOrders.length} طلب`
                  : `${selectedOrders.size} of ${filteredOrders.length} orders selected`
                }
              </div>
            </div>
          )}
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
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                      onCheckedChange={handleSelectAll}
                      aria-label={language === 'ar' ? 'تحديد الكل' : 'Select all'}
                    />
                  </TableHead>
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
                      <TableCell>
                        <Checkbox
                          checked={selectedOrders.has(order.id)}
                          onCheckedChange={(checked) => handleSelectOrder(order.id, checked)}
                          aria-label={language === 'ar' ? 'اختيار الطلب' : 'Select order'}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{order.order_number || order.id}</TableCell>
                      <TableCell>{order.customer_name || order.customerName}</TableCell>
                      <TableCell>{order.customer_phone || order.phone}</TableCell>
                      <TableCell>{new Date(order.created_at || order.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</TableCell>
                      <TableCell className="text-center">
                        {Array.isArray(order.items)
                          ? order.items.reduce((total, item) => total + (item.quantity || 1), 0)
                          : order.items || 0}
                      </TableCell>
                      <TableCell className="font-medium">
                        ${extractOrderPrice(order)}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title={language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                            onClick={() => handleViewOrder(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            className="flex items-center gap-1 bg-[#9b87f5] hover:bg-[#8b77e5]"
                            onClick={() => handleViewOrder(order)}
                          >
                            {language === 'ar' ? 'عرض' : 'View'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-6">
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

      {/* Order Details Dialog */}
      <OrderDetailsDialog
        order={selectedOrder}
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSaveOrder}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar'
                ? `هل أنت متأكد من حذف ${selectedOrders.size} طلب؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete ${selectedOrders.size} order(s)? This action cannot be undone.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {language === 'ar' ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrdersList;
