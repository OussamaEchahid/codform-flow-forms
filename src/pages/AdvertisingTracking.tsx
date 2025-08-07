import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/layout/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';

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

const AdvertisingTracking = () => {
  const navigate = useNavigate();
  const { language } = useI18n();
  const { shop, shopifyConnected, loading } = useAuth();
  
  // State for pixel management
  const [pixels, setPixels] = useState<AdvertisingPixel[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPixel, setNewPixel] = useState({
    name: '',
    platform: 'facebook',
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
    
    console.log('📥 Loading pixels for store:', activeStore);
    
    try {
      const { data, error } = await (supabase as any)
        .from('advertising_pixels')
        .select('*')
        .eq('shop_id', activeStore)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading pixels:', error);
        toast.error('خطأ في تحميل البيكسلات');
        return;
      }

      console.log('✅ Loaded pixels:', data);
      setPixels(data || []);
    } catch (error) {
      console.error('❌ Error in loadPixels:', error);
      toast.error('خطأ في تحميل البيكسلات');
    }
  };

  const loadShopifyProducts = async () => {
    if (!activeStore) return;
    
    setIsLoadingProducts(true);
    try {
      const { data, error } = await supabase.functions.invoke('shopify-products-fixed', {
        body: { 
          shop: activeStore
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success && data?.products) {
        setShopifyProducts(data.products);
        console.log('✅ Products loaded:', data.products.length);
      } else {
        throw new Error(data?.error || 'Failed to load products');
      }
    } catch (error) {
      console.error('Error loading Shopify products:', error);
      toast.error('خطأ في تحميل المنتجات من Shopify');
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
      toast.error('يرجى ملء اسم البيكسل ومعرف البيكسل');
      return;
    }

    if (!activeStore) {
      console.error('❌ No active store found');
      toast.error('لم يتم العثور على متجر نشط');
      return;
    }

    try {
      console.log('📤 Preparing pixel data for insertion...');
      
      // استخدم نفس النهج المتبع في باقي المشروع
      // النظام يستخدم user_id ثابت للتطبيقات المتكاملة مع Shopify
      const SYSTEM_USER_ID = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893';
      
      const pixelData = {
        name: newPixel.name.trim(),
        platform: 'facebook',
        pixel_id: newPixel.pixel_id.trim(),
        event_type: newPixel.event_type || 'Lead',
        target_type: newPixel.target_type || 'All',
        target_id: newPixel.target_type === 'Product' && selectedProducts.length > 0 
          ? selectedProducts.join(',') 
          : null,
        shop_id: activeStore,
        user_id: SYSTEM_USER_ID,
        access_token: newPixel.access_token || null,
        conversion_api_enabled: newPixel.conversion_api_enabled || false,
        enabled: true
      };

      console.log('📤 Final pixel data to insert:', pixelData);

      const { data, error } = await (supabase as any)
        .from('advertising_pixels')
        .insert([pixelData])
        .select();

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log('✅ Pixel created successfully:', data);
      toast.success('تم إنشاء البيكسل بنجاح');
      
      // Reset form
      setIsCreateDialogOpen(false);
      setNewPixel({
        name: '',
        platform: 'facebook',
        pixel_id: '',
        event_type: 'Lead',
        target_type: 'All',
        target_id: '',
        access_token: '',
        conversion_api_enabled: false
      });
      setSelectedProducts([]);
      
      // Reload pixels
      await loadPixels();
      
    } catch (error: any) {
      console.error('❌ Error creating pixel:', error);
      toast.error(error.message || 'خطأ في إنشاء البيكسل');
    }
  };

  const deletePixel = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('advertising_pixels')
        .delete()
        .eq('id', id);

      if (error) throw error;

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
    <div className="flex min-h-screen bg-[#F8F9FB]" dir={language === 'ar' ? 'rtl' : 'ltr'}>      
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* العنوان الرئيسي */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {language === 'ar' ? 'تتبع الإعلانات' : 'Advertising Tracking'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'ar' 
                ? 'إدارة بيكسلات التتبع للمنصات الإعلانية' 
                : 'Manage tracking pixels for advertising platforms'}
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
              {/* Header with Add Button */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Facebook Pixels</h2>
                  <p className="text-muted-foreground">إدارة بيكسلات التتبع الخاصة بك</p>
                </div>
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New
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
                      <span className="font-semibold">facebook pixel</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {pixels.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b text-sm text-muted-foreground">
                            <th className="text-right pb-3 font-medium">Last Update</th>
                            <th className="text-right pb-3 font-medium">Pixel Name</th>
                            <th className="text-right pb-3 font-medium">Pixel ID</th>
                            <th className="text-right pb-3 font-medium">Conversion API Status</th>
                            <th className="text-right pb-3 font-medium">Event type</th>
                            <th className="text-right pb-3 font-medium">Target</th>
                            <th className="text-right pb-3 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pixels.map((pixel) => (
                            <tr key={pixel.id} className="border-b last:border-b-0">
                              <td className="py-3 text-sm text-muted-foreground">
                                {new Date(pixel.updated_at).toLocaleDateString('ar-SA')}
                              </td>
                              <td className="py-3 font-medium">{pixel.name}</td>
                              <td className="py-3 text-sm text-blue-600">{pixel.pixel_id}</td>
                              <td className="py-3">
                                <Badge variant={pixel.conversion_api_enabled ? "default" : "secondary"}>
                                  {pixel.conversion_api_enabled ? "Active" : "Inactive"}
                                </Badge>
                              </td>
                              <td className="py-3">{pixel.event_type}</td>
                              <td className="py-3">
                                <Badge variant="outline">
                                  {pixel.target_type === 'All' ? 'All Products' : 'Specific Products'}
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
                      <p className="text-lg font-medium mb-2">لا توجد بيكسلات</p>
                      <p>ابدأ بإنشاء بيكسل تتبع أول</p>
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
                      <DialogTitle className="text-xl">Create pixel</DialogTitle>
                    </div>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    {/* Name Field */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                      <Input
                        id="name"
                        value={newPixel.name}
                        onChange={(e) => setNewPixel({...newPixel, name: e.target.value})}
                        placeholder="This name will help you recognize your pixel"
                        className="h-10"
                      />
                    </div>

                    {/* Facebook Pixel ID */}
                    <div className="space-y-2">
                      <Label htmlFor="pixel_id" className="text-sm font-medium">Facebook Pixel ID</Label>
                      <Input
                        id="pixel_id"
                        value={newPixel.pixel_id}
                        onChange={(e) => setNewPixel({...newPixel, pixel_id: e.target.value})}
                        placeholder="Enter your Facebook pixel ID here"
                        className="h-10"
                      />
                    </div>

                    {/* Type Event */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Type event</Label>
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
                      <Label className="text-sm font-medium">Target</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={newPixel.target_type === 'All' ? 'default' : 'outline'}
                          onClick={() => setNewPixel({...newPixel, target_type: 'All'})}
                          className="flex-1 h-10"
                        >
                          All
                        </Button>
                        <Button
                          type="button"
                          variant={newPixel.target_type === 'Collection' ? 'default' : 'outline'}
                          onClick={() => setNewPixel({...newPixel, target_type: 'Collection'})}
                          className="flex-1 h-10"
                        >
                          Collection
                        </Button>
                        <Button
                          type="button"
                          variant={newPixel.target_type === 'Product' ? 'default' : 'outline'}
                          onClick={() => setNewPixel({...newPixel, target_type: 'Product'})}
                          className="flex-1 h-10"
                        >
                          Product
                        </Button>
                      </div>
                    </div>

                    {/* Product Selection */}
                    {newPixel.target_type === 'Product' && (
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">اختيار المنتجات</Label>
                        {isLoadingProducts ? (
                          <div className="text-center py-6">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                            <p className="text-sm text-muted-foreground mt-2">جاري تحميل المنتجات...</p>
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
                                <p className="text-sm">لا توجد منتجات متاحة</p>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={loadShopifyProducts}
                                  className="mt-2"
                                >
                                  إعادة التحميل
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
                            platform: 'facebook',
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
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvertisingTracking;