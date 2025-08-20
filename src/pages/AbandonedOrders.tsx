import React, { useState, useEffect } from 'react';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  FileDown,
  ListFilter,
  Clock,
  History,
  ShoppingCart,
  Trash2,
  Download,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

// بيانات فارغة للطلبات المتروكة (سيتم استبدالها ببيانات حقيقية)
const sampleAbandonedCarts = [];

const AbandonedOrders = () => {
  const { user, shopifyConnected, shop } = useAuth();
  const { language } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const [abandonedCarts, setAbandonedCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCarts, setSelectedCarts] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Allow access if either authenticated with user or connected with Shopify
  const hasAccess = !!user || shopifyConnected;
  
  // Check localStorage as fallback
  const localStorageConnected = localStorage.getItem('shopify_connected') === 'true';
  const actualHasAccess = hasAccess || localStorageConnected;
  const actualShop = shop || localStorage.getItem('shopify_store');

  // Fetch abandoned carts from database
  useEffect(() => {
    const fetchAbandonedCarts = async () => {
      try {
        // Only fetch if we have a shop
        if (!actualShop) {
          console.log('No shop available, skipping abandoned carts fetch');
          setAbandonedCarts([]);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.functions.invoke('abandoned-carts?action=list-abandoned-carts', {
          body: { 
            shop_id: actualShop
          }
        });

        if (error) {
          console.error('Error fetching abandoned carts:', error);
        } else {
          setAbandonedCarts(data?.carts || []);
        }
      } catch (error) {
        console.error('Error fetching abandoned carts:', error);
      } finally {
        setLoading(false);
      }
    };

    if (actualHasAccess && actualShop) {
      fetchAbandonedCarts();
    } else if (actualHasAccess && !actualShop) {
      setAbandonedCarts([]);
      setLoading(false);
    }
  }, [actualHasAccess, actualShop]);

  if (!actualHasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-center py-8">
          {language === 'ar' 
            ? 'يرجى تسجيل الدخول أو الاتصال بمتجر Shopify للوصول إلى قسم الطلبات المتروكة' 
            : 'Please login or connect a Shopify store to access abandoned orders'}
        </div>
      </div>
    );
  }

  // Calculate time since last activity
  const getTimeSince = (dateString: string) => {
    const lastDate = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - lastDate.getTime(); // Fixed: Using getTime() to get timestamps in milliseconds
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHrs < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return language === 'ar' ? `${diffMins} دقيقة` : `${diffMins}m`;
    } else if (diffHrs < 24) {
      return language === 'ar' ? `${diffHrs} ساعة` : `${diffHrs}h`;
    } else {
      const diffDays = Math.floor(diffHrs / 24);
      return language === 'ar' ? `${diffDays} يوم` : `${diffDays}d`;
    }
  };

  // Handle individual cart selection
  const handleSelectCart = (cartId, checked) => {
    const newSelected = new Set(selectedCarts);
    if (checked) {
      newSelected.add(cartId);
    } else {
      newSelected.delete(cartId);
    }
    setSelectedCarts(newSelected);
  };

  // Handle select all carts
  const handleSelectAll = (checked) => {
    if (checked) {
      const allCartIds = new Set(filteredCarts.map(cart => cart.id));
      setSelectedCarts(allCartIds);
    } else {
      setSelectedCarts(new Set());
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedCarts.size === 0) return;

    try {
      setLoading(true);

      // Delete selected carts from database
      for (const cartId of selectedCarts) {
        const { error } = await supabase
          .from('abandoned_carts')
          .delete()
          .eq('id', cartId);

        if (error) {
          console.error(`Failed to delete cart ${cartId}:`, error);
        }
      }

      // Refresh carts list
      window.location.reload();

      // Clear selection
      setSelectedCarts(new Set());
      setShowDeleteConfirm(false);

      console.log(`Successfully deleted ${selectedCarts.size} abandoned carts`);
    } catch (error) {
      console.error('Error deleting carts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle cart recovery
  const handleRecoverCart = async (cart) => {
    try {
      setLoading(true);

      // Create a new order from the abandoned cart
      const orderData = {
        customer_name: cart.customer_name || cart.customer_email,
        customer_email: cart.customer_email,
        customer_phone: cart.customer_phone,
        total_amount: cart.total_value || 0,
        currency: cart.currency || 'USD',
        status: 'pending',
        items: cart.cart_items || [],
        shop_id: actualShop,
        recovered_from_cart: cart.id,
        created_at: new Date().toISOString()
      };

      // Insert new order
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order from cart:', orderError);
        return;
      }

      // Mark cart as recovered (or delete it)
      const { error: updateError } = await supabase
        .from('abandoned_carts')
        .update({ status: 'recovered', recovered_at: new Date().toISOString() })
        .eq('id', cart.id);

      if (updateError) {
        console.error('Error updating cart status:', updateError);
      }

      // Refresh the page to show updated data
      window.location.reload();

      console.log('Cart recovered successfully:', newOrder);
    } catch (error) {
      console.error('Error recovering cart:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle export functionality
  const handleExport = () => {
    try {
      const dataToExport = selectedCarts.size > 0
        ? filteredCarts.filter(cart => selectedCarts.has(cart.id))
        : filteredCarts;

      // Create CSV content
      const headers = ['Customer', 'Email', 'Phone', 'Date', 'Items', 'Total', 'Currency', 'Status'];
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(cart => [
          `"${cart.customer_name || cart.customer_email || ''}"`,
          `"${cart.customer_email || ''}"`,
          cart.customer_phone || '',
          new Date(cart.created_at).toLocaleDateString(),
          Array.isArray(cart.cart_items) ? cart.cart_items.length : 1,
          cart.total_value || 0,
          cart.currency || 'USD',
          'Abandoned'
        ].join(','))
      ].join('\n');

      // Download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `abandoned_carts_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log(`Exported ${dataToExport.length} abandoned carts to CSV`);
    } catch (error) {
      console.error('Error exporting carts:', error);
    }
  };

  // Use real data or fallback to sample data
  const cartsData = abandonedCarts.length > 0 ? abandonedCarts : sampleAbandonedCarts;

  // Filter abandoned carts based on search term
  const filteredCarts = cartsData.filter(cart => 
    (cart.customer_email || cart.email || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (cart.id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {language === 'ar' ? 'الطلبات المتروكة' : 'Abandoned Orders'}
          </h1>
          
          <div className="flex space-x-2 rtl:space-x-reverse">
            {selectedCarts.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4" />
                {language === 'ar' ? `حذف (${selectedCarts.size})` : `Delete (${selectedCarts.size})`}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={handleExport}
            >
              <Download className="h-4 w-4" />
              {language === 'ar' ? 'تصدير' : 'Export'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => setShowFilters(!showFilters)}
            >
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
              placeholder={language === 'ar' ? 'بحث عن طلب متروك...' : 'Search abandoned carts...'}
              className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Selection info */}
          {selectedCarts.size > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                {language === 'ar'
                  ? `تم اختيار ${selectedCarts.size} من ${filteredCarts.length} سلة متروكة`
                  : `${selectedCarts.size} of ${filteredCarts.length} abandoned carts selected`
                }
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <div className="bg-purple-100 p-3 rounded-full mr-4">
              <ShoppingCart className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">
                {language === 'ar' ? 'مجموع السلال المتروكة' : 'Total Abandoned Carts'}
              </p>
              <h3 className="text-xl font-semibold">{cartsData.length}</h3>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <div className="bg-amber-100 p-3 rounded-full mr-4">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">
                {language === 'ar' ? 'معدل التخلي' : 'Abandonment Rate'}
              </p>
              <h3 className="text-xl font-semibold">0%</h3>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <div className="bg-green-100 p-3 rounded-full mr-4">
              <History className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">
                {language === 'ar' ? 'فرص الاسترداد' : 'Recovery Opportunities'}
              </p>
              <h3 className="text-xl font-semibold">{cartsData.length}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-medium text-lg">
              {language === 'ar' 
                ? `${filteredCarts.length} سلة متروكة` 
                : `${filteredCarts.length} Abandoned Carts`}
            </h2>
          </div>
          
          {/* Abandoned carts table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedCarts.size === filteredCarts.length && filteredCarts.length > 0}
                      onCheckedChange={handleSelectAll}
                      aria-label={language === 'ar' ? 'تحديد الكل' : 'Select all'}
                    />
                  </TableHead>
                  <TableHead>{language === 'ar' ? 'العميل' : 'Customer'}</TableHead>
                  <TableHead>{language === 'ar' ? 'الهاتف' : 'Phone'}</TableHead>
                  <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                  <TableHead>{language === 'ar' ? 'المنتجات' : 'Items'}</TableHead>
                  <TableHead>{language === 'ar' ? 'المجموع' : 'Total'}</TableHead>
                  <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                  <TableHead>{language === 'ar' ? 'خيارات' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCarts.length > 0 ? (
                  filteredCarts.map((cart) => (
                    <TableRow key={cart.id} className="hover:bg-muted/30">
                      <TableCell>
                        <Checkbox
                          checked={selectedCarts.has(cart.id)}
                          onCheckedChange={(checked) => handleSelectCart(cart.id, checked)}
                          aria-label={language === 'ar' ? 'اختيار السلة' : 'Select cart'}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{cart.customer_name || cart.customer_email || 'غير محدد'}</span>
                          <span className="text-xs text-gray-500">{cart.customer_email}</span>
                        </div>
                      </TableCell>
                      <TableCell>{cart.customer_phone || 'غير محدد'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{new Date(cart.created_at).toLocaleDateString()}</span>
                          <span className="text-xs text-gray-500">
                            {getTimeSince(cart.last_activity || cart.created_at)} {language === 'ar' ? 'مضت' : 'ago'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{Array.isArray(cart.cart_items) ? cart.cart_items.length : 1}</TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {cart.total_value || 0} {cart.currency || 'SAR'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
                          {language === 'ar' ? 'متروك' : 'Abandoned'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 flex items-center gap-1"
                          onClick={() => handleRecoverCart(cart)}
                          disabled={loading}
                        >
                          <RotateCcw className="h-4 w-4" />
                          {language === 'ar' ? 'استرداد' : 'Recover'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6">
                      {searchTerm ?
                        (language === 'ar' ? 'لا توجد نتائج للبحث' : 'No search results found') :
                        (language === 'ar' ? 'لا توجد سلات متروكة حالياً' : 'No abandoned carts available yet')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar'
                ? `هل أنت متأكد من حذف ${selectedCarts.size} سلة متروكة؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete ${selectedCarts.size} abandoned cart(s)? This action cannot be undone.`
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

export default AbandonedOrders;
