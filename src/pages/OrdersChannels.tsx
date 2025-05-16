
import React, { useState } from 'react';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { Globe, MessageSquare, ShoppingBag, Phone, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

// Sample channel data
const channelData = [
  {
    id: 'website',
    name: {
      en: 'Website',
      ar: 'الموقع الإلكتروني'
    },
    description: {
      en: 'Orders received through your website',
      ar: 'الطلبات المستلمة من خلال الموقع الإلكتروني'
    },
    isActive: true,
    icon: Globe,
    color: 'bg-blue-100 text-blue-600',
    stats: {
      orders: 124,
      revenue: '4,250 SAR',
      conversionRate: '3.2%'
    }
  },
  {
    id: 'whatsapp',
    name: {
      en: 'WhatsApp',
      ar: 'واتساب'
    },
    description: {
      en: 'Orders received through WhatsApp messages',
      ar: 'الطلبات المستلمة من خلال رسائل الواتساب'
    },
    isActive: true,
    icon: MessageSquare,
    color: 'bg-green-100 text-green-600',
    stats: {
      orders: 87,
      revenue: '2,980 SAR',
      conversionRate: '5.6%'
    }
  },
  {
    id: 'pos',
    name: {
      en: 'Point of Sale',
      ar: 'نقاط البيع'
    },
    description: {
      en: 'In-store orders through the POS system',
      ar: 'الطلبات من داخل المتجر عبر نظام نقاط البيع'
    },
    isActive: false,
    icon: ShoppingBag,
    color: 'bg-purple-100 text-purple-600',
    stats: {
      orders: 0,
      revenue: '0 SAR',
      conversionRate: '0%'
    }
  },
  {
    id: 'phone',
    name: {
      en: 'Phone Orders',
      ar: 'الطلبات الهاتفية'
    },
    description: {
      en: 'Orders received through phone calls',
      ar: 'الطلبات المستلمة من خلال المكالمات الهاتفية'
    },
    isActive: true,
    icon: Phone,
    color: 'bg-amber-100 text-amber-600',
    stats: {
      orders: 42,
      revenue: '1,850 SAR',
      conversionRate: '7.1%'
    }
  }
];

const OrdersChannels = () => {
  const { user, shopifyConnected, shop } = useAuth();
  const { language } = useI18n();
  const [channels, setChannels] = useState(channelData);
  
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
            ? 'يرجى تسجيل الدخول أو الاتصال بمتجر Shopify للوصول إلى قنوات الطلبات' 
            : 'Please login or connect a Shopify store to access order channels'}
        </div>
      </div>
    );
  }

  // Toggle channel activation
  const handleToggleChannel = (id) => {
    setChannels(channels.map(channel => {
      if (channel.id === id) {
        const newState = !channel.isActive;
        
        // Show toast notification
        if (newState) {
          toast.success(
            language === 'ar' 
              ? `تم تفعيل قناة ${channel.name.ar} بنجاح` 
              : `${channel.name.en} channel activated successfully`
          );
        } else {
          toast.info(
            language === 'ar' 
              ? `تم إلغاء تفعيل قناة ${channel.name.ar}` 
              : `${channel.name.en} channel deactivated`
          );
        }
        
        return { ...channel, isActive: newState };
      }
      return channel;
    }));
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {language === 'ar' ? 'قنوات الطلبات' : 'Order Channels'}
          </h1>
          
          <Button variant="default" size="sm">
            {language === 'ar' ? 'إضافة قناة جديدة' : 'Add New Channel'}
          </Button>
        </div>

        {/* Overview Card */}
        <div className="bg-white p-5 rounded-lg shadow mb-6 flex items-center">
          <div className="bg-primary/10 p-3 rounded-full mr-5">
            <BarChart className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-1">
              {language === 'ar' ? 'نظرة عامة على القنوات' : 'Channels Overview'}
            </h2>
            <p className="text-gray-500">
              {language === 'ar' 
                ? 'قم بإدارة قنوات استقبال الطلبات وتتبع أدائها' 
                : 'Manage your order receiving channels and track performance'}
            </p>
          </div>
        </div>

        {/* Channels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {channels.map((channel) => (
            <div key={channel.id} className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
              <div className="p-5 flex justify-between items-center border-b">
                <div className="flex items-center">
                  <div className={`rounded-full p-2.5 mr-3 ${channel.color}`}>
                    <channel.icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">
                      {language === 'ar' ? channel.name.ar : channel.name.en}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {language === 'ar' ? channel.description.ar : channel.description.en}
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={channel.isActive} 
                  onCheckedChange={() => handleToggleChannel(channel.id)}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-600">
                    {language === 'ar' ? 'الحالة:' : 'Status:'}
                  </h4>
                  {channel.isActive ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {language === 'ar' ? 'نشط' : 'Active'}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                      {language === 'ar' ? 'غير نشط' : 'Inactive'}
                    </Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-5">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">
                      {language === 'ar' ? 'الطلبات' : 'Orders'}
                    </p>
                    <p className="font-semibold">{channel.stats.orders}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">
                      {language === 'ar' ? 'الإيرادات' : 'Revenue'}
                    </p>
                    <p className="font-semibold">{channel.stats.revenue}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">
                      {language === 'ar' ? 'معدل التحويل' : 'Conv. Rate'}
                    </p>
                    <p className="font-semibold">{channel.stats.conversionRate}</p>
                  </div>
                </div>
                
                <div className="mt-4 text-right">
                  <Button variant="outline" size="sm">
                    {language === 'ar' ? 'إعدادات' : 'Settings'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrdersChannels;
