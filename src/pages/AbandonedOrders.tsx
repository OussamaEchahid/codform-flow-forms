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
  ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// بيانات فارغة للطلبات المتروكة (سيتم استبدالها ببيانات حقيقية)
const sampleAbandonedCarts = [];

const AbandonedOrders = () => {
  const { user, shopifyConnected, shop } = useAuth();
  const { language } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const [abandonedCarts, setAbandonedCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  
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
        const { data, error } = await supabase.functions.invoke('abandoned-carts', {
          body: { action: 'list-abandoned-carts' }
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

    if (actualHasAccess) {
      fetchAbandonedCarts();
    }
  }, [actualHasAccess]);

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
              placeholder={language === 'ar' ? 'بحث عن طلب متروك...' : 'Search abandoned carts...'}
              className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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
                  <TableHead>{language === 'ar' ? 'رقم المرجع' : 'Reference ID'}</TableHead>
                  <TableHead>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</TableHead>
                  <TableHead>{language === 'ar' ? 'آخر نشاط' : 'Last Activity'}</TableHead>
                  <TableHead>{language === 'ar' ? 'قيمة السلة' : 'Cart Value'}</TableHead>
                  <TableHead>{language === 'ar' ? 'المنتجات' : 'Items'}</TableHead>
                  <TableHead>{language === 'ar' ? 'خيارات' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCarts.length > 0 ? (
                  filteredCarts.map((cart) => (
                    <TableRow key={cart.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{cart.id}</TableCell>
                      <TableCell>{cart.customer_email || cart.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-gray-50">
                          {getTimeSince(cart.last_activity || cart.lastActivity)} {language === 'ar' ? 'مضت' : 'ago'}
                        </Badge>
                      </TableCell>
                      <TableCell>{cart.total_value ? `${cart.total_value} ${cart.currency}` : cart.cartValue}</TableCell>
                      <TableCell>{Array.isArray(cart.cart_items) ? cart.cart_items.length : cart.items}</TableCell>
                      <TableCell>
                        <Button variant="default" size="sm" className="bg-purple-600 hover:bg-purple-700">
                          {language === 'ar' ? 'استرداد' : 'Recover'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
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
    </div>
  );
};

export default AbandonedOrders;
