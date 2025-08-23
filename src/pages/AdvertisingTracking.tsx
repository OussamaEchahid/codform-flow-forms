import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/layout/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import SettingsLayout from '@/components/layout/SettingsLayout';

// Type definition for advertising pixels
interface AdvertisingPixel {
  id: string;
  shop_id: string;
  name: string;
  platform: string;
  pixel_id: string;
  event_type: string;
  target_type: string;
  target_id: string | null;
  access_token: string | null;
  conversion_api_enabled: boolean;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Target, 
  Plus, 
  Trash2, 
  Edit, 
  Copy, 
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Store
} from 'lucide-react';
import ShopifyWebPixelActivator from '@/components/shopify/ShopifyWebPixelActivator';
import ShopifyReconnectButton from '@/components/shopify/ShopifyReconnectButton';

const AdvertisingTracking = () => {
  const navigate = useNavigate();
  const { language, t } = useI18n();
  const { shop, shopifyConnected, loading } = useAuth();
  
  // State for pixel management
  const [pixels, setPixels] = useState<AdvertisingPixel[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPixel, setNewPixel] = useState({
    name: '',
        platform: 'Facebook',
    pixel_id: '',
    event_type: 'Lead',
    target_type: 'All',
    target_id: '',
    access_token: '',
    conversion_api_enabled: false
  });
  const [shopifyProducts, setShopifyProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Check for active Shopify store (same as Forms page)
  const storeFromStorage = localStorage.getItem('current_shopify_store');
  const activeStore = shop || storeFromStorage;
  
  // التأكد من أن المتجر المتصل صحيح وليس "en" أو "ar"
  const isValidStore = activeStore && 
                       activeStore !== 'en' && 
                       activeStore !== 'ar' && 
                       activeStore.includes('.myshopify.com');

  // Load existing pixels
  useEffect(() => {
    if (isValidStore) {
      loadPixels();
      loadShopifyProducts();
    }
  }, [isValidStore]);

  const loadPixels = async () => {
    if (!activeStore) return;

    console.log('📥 Loading pixels for store (via edge func):', activeStore);

    try {
      const { data, error } = await supabase.functions.invoke('advertising-pixels', {
        body: { action: 'list', shop_id: activeStore },
      });

      if (error) {
        console.error('❌ Error loading pixels (edge):', error);
        toast.error(t('errorLoadingPixels'));
        return;
      }

      const rows = (data as any)?.records ?? [];
      console.log('✅ Loaded pixels:', rows);
      setPixels(rows);
    } catch (error) {
      console.error('❌ Error in loadPixels:', error);
      toast.error(t('errorLoadingPixels'));
    }
  };

  const loadShopifyProducts = async () => {
    if (!activeStore) return;
    
    setIsLoadingProducts(true);
    try {
      // Call Edge Function directly to avoid JWT-related 401
      const SUPABASE_URL = 'https://trlklwixfeaexhydzaue.supabase.co';
      const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M';
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/shopify-products-fixed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ shop: activeStore })
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        throw new Error(data?.message || data?.error || `HTTP ${resp.status}`);
      }
      // proceed with parsed data
      if (data?.success && data?.products) {
        setShopifyProducts(data.products);
        console.log('✅ Products loaded:', data.products.length);
      } else {
        throw new Error(data?.error || 'Failed to load products');
      }
    } catch (error) {
      console.error('Error loading Shopify products:', error);
      toast.error(t('errorLoadingProducts'));
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const createPixel = async () => {
    console.log('🚀 Starting createPixel function');
    console.log('📋 New pixel data:', newPixel);
    console.log('📋 Selected products:', selectedProducts);
    console.log('📋 Active store:', activeStore);

    if (!newPixel.name || !newPixel.pixel_id) {
      console.error('❌ Missing required fields:', { name: newPixel.name, pixel_id: newPixel.pixel_id });
      toast.error(t('pleaseFillPixelNameAndId'));
      return;
    }

    if (!activeStore) {
      console.error('❌ No active store found');
      toast.error('لم يتم العثور على متجر نشط');
      return;
    }

    try {
      console.log('📤 Preparing payload for edge function...');

      const payload = {
        name: newPixel.name.trim(),
        platform: newPixel.platform,
        pixel_id: newPixel.pixel_id.trim(),
        event_type: newPixel.event_type || 'Lead',
        target_type: newPixel.target_type || 'All',
        target_id: newPixel.target_type === 'Product' && selectedProducts.length > 0
          ? selectedProducts.join(',')
          : null,
        access_token: newPixel.access_token || null,
        conversion_api_enabled: newPixel.conversion_api_enabled || false,
      };

      const { data, error } = await supabase.functions.invoke('advertising-pixels', {
        body: {
          action: 'create',
          shop_id: activeStore,
          payload,
        },
      });

      if (error || !data?.success) {
        console.error('❌ Edge function error:', error || data);
        throw new Error((data as any)?.details || (data as any)?.error || (error as any)?.message || 'Failed');
      }

      console.log('✅ Pixel created successfully:', data);
      toast.success('تم إنشاء البيكسل بنجاح');

      // Reset form
      setIsCreateDialogOpen(false);
      setNewPixel({
        name: '',
        platform: 'Facebook',
        pixel_id: '',
        event_type: 'Lead',
        target_type: 'All',
        target_id: '',
        access_token: '',
        conversion_api_enabled: false,
      });
      setSelectedProducts([]);

      // Reload pixels
      await loadPixels();
    } catch (error: any) {
      console.error('❌ Error creating pixel:', error);
      const msg = error?.message || error?.details || '';
      toast.error(msg || 'خطأ في إنشاء البيكسل');
    }
  };

  const deletePixel = async (id: string) => {
    try {
      if (!activeStore) throw new Error('لا يوجد متجر نشط');

      const { data, error } = await supabase.functions.invoke('advertising-pixels', {
        body: { action: 'delete', id, shop_id: activeStore },
      });

      if (error || !data?.success) {
        throw new Error((data as any)?.details || (data as any)?.error || (error as any)?.message || 'Failed');
      }

      toast.success('تم حذف البيكسل بنجاح');
      loadPixels();
    } catch (error) {
      console.error('Error deleting pixel:', error);
      toast.error('خطأ في حذف البيكسل');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <SettingsLayout>
      <div className="p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto">
          {/* العنوان الرئيسي */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {t('advertisingTracking')}
            </h1>
            <p className="text-muted-foreground">
              {t('advertisingTrackingDescription')}
            </p>
          </div>

          {/* حالة المتجر */}
          <div className="mb-6">
            {isValidStore ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>متصل بالمتجر:</strong> {activeStore}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 flex items-center justify-between">
                  <span>
                    <strong>لا يوجد متجر نشط.</strong> يرجى ربط متجر Shopify لإدارة بيكسلات التتبع.
                  </span>
                  <Button 
                    size="sm" 
                    onClick={() => navigate('/my-stores')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Store className="h-4 w-4 mr-2" />
                    إدارة المتاجر
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* المحتوى الرئيسي */}
          {!isValidStore ? (
            <Card className="border-2 border-dashed border-muted-foreground/25">
              <CardHeader className="text-center">
                <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <CardTitle className="text-xl">ابدأ بربط متجر Shopify</CardTitle>
                <CardDescription className="text-base">
                  لإدارة بيكسلات التتبع، تحتاج لربط متجر Shopify أولاً
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="space-y-4">
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/my-stores')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Store className="h-5 w-5 mr-2" />
                    إدارة المتاجر
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    بعد ربط المتجر، ستتمكن من إدارة بيكسلات التتبع
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Shopify Web Pixel Activation */}
              <ShopifyWebPixelActivator shop={activeStore} defaultAccountId={"codmagnet.com"} />

              {/* Reauthorize app to accept new scopes if needed */}
              <div>
                <ShopifyReconnectButton shopDomain={activeStore || undefined} />
              </div>

              {/* Header with Add Button */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">{t('pixelSettings')}</h2>
                  <p className="text-muted-foreground">{t('advertisingTrackingDescription')}</p>
                </div>
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addNew')}
                </Button>
              </div>

              {/* Pixels Table */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Target className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-semibold">{t('allPixelsTitle')}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {pixels.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b text-sm text-muted-foreground">
                            <th className="text-right pb-3 font-medium">آخر تحديث</th>
                            <th className="text-right pb-3 font-medium">اسم البيكسل</th>
                            <th className="text-right pb-3 font-medium">المنصة</th>
                            <th className="text-right pb-3 font-medium">معرف البيكسل</th>
                            <th className="text-right pb-3 font-medium">نوع الحدث</th>
                            <th className="text-right pb-3 font-medium">الهدف</th>
                            <th className="text-right pb-3 font-medium">الإجراءات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pixels.map((pixel) => (
                            <tr key={pixel.id} className="border-b last:border-b-0">
                              <td className="py-3 text-sm text-muted-foreground">
                                {new Date(pixel.updated_at).toLocaleDateString('ar-SA')}
                              </td>
                              <td className="py-3 font-medium">{pixel.name}</td>
                              <td className="py-3">
                                <Badge 
                                  variant="outline" 
                                  className={`
                                    ${pixel.platform === 'Facebook' ? 'border-blue-500 text-blue-600' : ''}
                                    ${pixel.platform === 'TikTok' ? 'border-black text-black' : ''}
                                    ${pixel.platform === 'Snapchat' ? 'border-yellow-500 text-yellow-600' : ''}
                                  `}
                                >
                                  {pixel.platform}
                                </Badge>
                              </td>
                              <td className="py-3 text-sm text-blue-600">{pixel.pixel_id}</td>
                              <td className="py-3">{pixel.event_type}</td>
                              <td className="py-3">
                                <Badge variant="outline">
                                  {pixel.target_type === 'All' ? t('allProducts') : t('specificProducts')}
                                </Badge>
                              </td>
                              <td className="py-3">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deletePixel(pixel.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">{t('noPixelsFound')}</p>
                      <p>{t('startByCreatingFirstPixel')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Create Pixel Dialog - Professional Design */}
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader className="flex flex-row items-center gap-3 space-y-0 pb-4">
                    <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl">{t('createPixel')}</DialogTitle>
                    </div>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    {/* Platform Selection */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">{t('pixelType')}</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          type="button"
                          variant={newPixel.platform === 'Facebook' ? 'default' : 'outline'}
                          onClick={() => setNewPixel({...newPixel, platform: 'Facebook'})}
                          className="h-10 text-xs"
                        >
                          Facebook
                        </Button>
                        <Button
                          type="button"
                          variant={newPixel.platform === 'TikTok' ? 'default' : 'outline'}
                          onClick={() => setNewPixel({...newPixel, platform: 'TikTok'})}
                          className="h-10 text-xs"
                        >
                          TikTok
                        </Button>
                        <Button
                          type="button"
                          variant={newPixel.platform === 'Snapchat' ? 'default' : 'outline'}
                          onClick={() => setNewPixel({...newPixel, platform: 'Snapchat'})}
                          className="h-10 text-xs"
                        >
                          Snapchat
                        </Button>
                      </div>
                    </div>

                    {/* Name Field */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">{t('pixelName')}</Label>
                      <Input
                        id="name"
                        value={newPixel.name}
                        onChange={(e) => setNewPixel({...newPixel, name: e.target.value})}
                        placeholder={t('pixelNamePlaceholder')}
                        className="h-10"
                      />
                    </div>

                    {/* Pixel ID */}
                    <div className="space-y-2">
                      <Label htmlFor="pixel_id" className="text-sm font-medium">
                        {t('pixelIdLabel')} {newPixel.platform}
                      </Label>
                      <Input
                        id="pixel_id"
                        value={newPixel.pixel_id}
                        onChange={(e) => setNewPixel({...newPixel, pixel_id: e.target.value})}
                        placeholder={
                          newPixel.platform === 'Facebook' ? t('enterFacebookPixelId') :
                          newPixel.platform === 'TikTok' ? t('enterTikTokPixelId') :
                          t('enterSnapchatPixelId')
                        }
                        className="h-10"
                      />
                    </div>

                    {/* Type Event */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">{t('typeEvent')}</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={newPixel.event_type === 'Lead' ? 'default' : 'outline'}
                          onClick={() => setNewPixel({...newPixel, event_type: 'Lead'})}
                          className="flex-1 h-10"
                        >
                          Lead
                        </Button>
                        <Button
                          type="button"
                          variant={newPixel.event_type === 'Purchase' ? 'default' : 'outline'}
                          onClick={() => setNewPixel({...newPixel, event_type: 'Purchase'})}
                          className="flex-1 h-10"
                        >
                          Purchase
                        </Button>
                      </div>
                    </div>

                    {/* Target */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">{t('target')}</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={newPixel.target_type === 'All' ? 'default' : 'outline'}
                          onClick={() => setNewPixel({...newPixel, target_type: 'All'})}
                          className="flex-1 h-10"
                        >
                          {t('all')}
                        </Button>
                        <Button
                          type="button"
                          variant={newPixel.target_type === 'Collection' ? 'default' : 'outline'}
                          onClick={() => setNewPixel({...newPixel, target_type: 'Collection'})}
                          className="flex-1 h-10"
                        >
                          {t('collection')}
                        </Button>
                        <Button
                          type="button"
                          variant={newPixel.target_type === 'Product' ? 'default' : 'outline'}
                          onClick={() => setNewPixel({...newPixel, target_type: 'Product'})}
                          className="flex-1 h-10"
                        >
                          {t('product')}
                        </Button>
                      </div>
                    </div>

                    {/* Product Selection */}
                    {newPixel.target_type === 'Product' && (
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">{t('selectProducts')}</Label>
                        {isLoadingProducts ? (
                          <div className="text-center py-6">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                            <p className="text-sm text-muted-foreground mt-2">{t('loadingProductsPixels')}</p>
                          </div>
                        ) : (
                          <div className="max-h-40 overflow-y-auto border rounded-lg p-3 space-y-3">
                            {shopifyProducts.length > 0 ? (
                              shopifyProducts.map((product) => (
                                <div key={product.id} className="flex items-center space-x-3 space-x-reverse">
                                  <input
                                    type="checkbox"
                                    id={`product-${product.id}`}
                                    checked={selectedProducts.includes(product.id.toString())}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedProducts([...selectedProducts, product.id.toString()]);
                                      } else {
                                        setSelectedProducts(selectedProducts.filter(id => id !== product.id.toString()));
                                      }
                                    }}
                                    className="h-4 w-4 rounded border-gray-300"
                                  />
                                  <label htmlFor={`product-${product.id}`} className="flex-1 cursor-pointer">
                                    <div className="flex items-center gap-3">
                                      {product.image && (
                                        <img 
                                          src={product.image.src || product.image} 
                                          alt="" 
                                          loading="lazy"
                                          decoding="async"
                                          className="w-10 h-10 rounded-lg object-cover border"
                                        />
                                      )}
                                      <div>
                                        <p className="text-sm font-medium">{product.title}</p>
                                        <p className="text-xs text-muted-foreground">{product.handle}</p>
                                      </div>
                                    </div>
                                  </label>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-6 text-muted-foreground">
                                <p className="text-sm">{t('noProductsAvailable')}</p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={loadShopifyProducts}
                                  className="mt-2"
                                >
                                  {t('reloadPixelProducts')}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Conversion API Status */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Conversion API status (optional)</Label>
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setNewPixel({...newPixel, conversion_api_enabled: !newPixel.conversion_api_enabled})}
                          className="p-0 h-auto text-gray-500"
                        >
                          ✕
                        </Button>
                        <span className="text-sm text-gray-600">Conversion API status</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <Button 
                        onClick={createPixel} 
                        className="flex-1 bg-orange-600 hover:bg-orange-700 h-10"
                        disabled={!newPixel.name || !newPixel.pixel_id}
                      >
                        Save
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsCreateDialogOpen(false);
                          setNewPixel({
                            name: '',
                            platform: 'Facebook',
                            pixel_id: '',
                            event_type: 'Lead',
                            target_type: 'All',
                            target_id: '',
                            access_token: '',
                            conversion_api_enabled: false
                          });
                          setSelectedProducts([]);
                        }}
                        className="flex-1 h-10"
                      >
                        {t('cancelDialog')}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>
    </SettingsLayout>
  );
};

export default AdvertisingTracking;