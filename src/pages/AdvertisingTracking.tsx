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
    platform: '',
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
    try {
      const { data, error } = await (supabase as any)
        .from('advertising_pixels')
        .select('*')
        .eq('shop_id', activeStore);

      if (error) throw error;
      setPixels((data || []) as AdvertisingPixel[]);
    } catch (error) {
      console.error('Error loading pixels:', error);
      toast.error('خطأ في تحميل البيكسلات');
    }
  };

  const loadShopifyProducts = async () => {
    if (!activeStore) return;
    
    setIsLoadingProducts(true);
    try {
      const response = await fetch(`/api/shopify-products?shop=${activeStore}`);
      if (response.ok) {
        const data = await response.json();
        setShopifyProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error loading Shopify products:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const createPixel = async () => {
    if (!newPixel.name || !newPixel.platform || !newPixel.pixel_id) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      const pixelData = {
        ...newPixel,
        shop_id: activeStore,
        target_id: newPixel.target_type === 'Specific' ? selectedProducts.join(',') : null
      };

      const { data, error } = await (supabase as any)
        .from('advertising_pixels')
        .insert([pixelData]);

      if (error) throw error;

      toast.success('تم إنشاء البيكسل بنجاح');
      setIsCreateDialogOpen(false);
      setNewPixel({
        name: '',
        platform: '',
        pixel_id: '',
        event_type: 'Lead',
        target_type: 'All',
        target_id: '',
        access_token: '',
        conversion_api_enabled: false
      });
      setSelectedProducts([]);
      loadPixels();
    } catch (error) {
      console.error('Error creating pixel:', error);
      toast.error('خطأ في إنشاء البيكسل');
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* بطاقة إنشاء بيكسل جديد */}
              <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
                <CardHeader className="text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                    <Plus className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">إنشاء بيكسل جديد</CardTitle>
                  <CardDescription>
                    ابدأ بإنشاء بيكسل تتبع لمنصاتك الإعلانية
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        إنشاء بيكسل
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>إنشاء بيكسل جديد</DialogTitle>
                        <DialogDescription>
                          أضف بيكسل تتبع جديد لمنصاتك الإعلانية
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name">اسم البيكسل</Label>
                          <Input
                            id="name"
                            value={newPixel.name}
                            onChange={(e) => setNewPixel({...newPixel, name: e.target.value})}
                            placeholder="مثال: فيسبوك بيكسل الرئيسي"
                          />
                        </div>
                        <div>
                          <Label htmlFor="platform">المنصة</Label>
                          <Select value={newPixel.platform} onValueChange={(value) => setNewPixel({...newPixel, platform: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر المنصة" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="facebook">Facebook</SelectItem>
                              <SelectItem value="tiktok">TikTok</SelectItem>
                              <SelectItem value="snapchat">Snapchat</SelectItem>
                              <SelectItem value="twitter">Twitter</SelectItem>
                              <SelectItem value="google">Google Ads</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="pixel_id">معرف البيكسل</Label>
                          <Input
                            id="pixel_id"
                            value={newPixel.pixel_id}
                            onChange={(e) => setNewPixel({...newPixel, pixel_id: e.target.value})}
                            placeholder="مثال: 123456789"
                          />
                        </div>
                        <div>
                          <Label htmlFor="event_type">نوع الحدث</Label>
                          <Select value={newPixel.event_type} onValueChange={(value) => setNewPixel({...newPixel, event_type: value})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Lead">Lead</SelectItem>
                              <SelectItem value="Purchase">Purchase</SelectItem>
                              <SelectItem value="ViewContent">ViewContent</SelectItem>
                              <SelectItem value="AddToCart">AddToCart</SelectItem>
                              <SelectItem value="InitiateCheckout">InitiateCheckout</SelectItem>
                            </SelectContent>
                          </Select>
                         </div>
                         <div>
                           <Label htmlFor="target_type">نوع الاستهداف</Label>
                           <Select value={newPixel.target_type} onValueChange={(value) => setNewPixel({...newPixel, target_type: value})}>
                             <SelectTrigger>
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="All">جميع المنتجات</SelectItem>
                               <SelectItem value="Specific">منتجات محددة</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>
                         
                         {/* اختيار المنتجات المحددة */}
                         {newPixel.target_type === 'Specific' && (
                           <div>
                             <Label>اختيار المنتجات</Label>
                             {isLoadingProducts ? (
                               <div className="text-center py-4">
                                 <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                                 <p className="text-sm text-muted-foreground mt-2">جاري تحميل المنتجات...</p>
                               </div>
                             ) : (
                               <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                                 {shopifyProducts.length > 0 ? (
                                   shopifyProducts.map((product) => (
                                     <div key={product.id} className="flex items-center space-x-2">
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
                                         className="rounded"
                                       />
                                       <label htmlFor={`product-${product.id}`} className="text-sm flex-1 cursor-pointer">
                                         <div className="flex items-center gap-2">
                                           {product.image && (
                                             <img src={product.image.src} alt="" className="w-8 h-8 rounded object-cover" />
                                           )}
                                           <span>{product.title}</span>
                                         </div>
                                       </label>
                                     </div>
                                   ))
                                 ) : (
                                   <p className="text-sm text-muted-foreground text-center py-4">
                                     لا توجد منتجات متاحة
                                   </p>
                                 )}
                               </div>
                             )}
                           </div>
                          )}
                         <div className="flex gap-2">
                           <Button onClick={createPixel} className="flex-1">
                             إنشاء
                           </Button>
                           <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="flex-1">
                             إلغاء
                           </Button>
                         </div>
                       </div>
                     </DialogContent>
                   </Dialog>
                </CardContent>
              </Card>

              {/* عرض البيكسلات الموجودة */}
              {pixels.map((pixel) => (
                <Card key={pixel.id} className="border border-muted-foreground/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          pixel.platform === 'facebook' ? 'bg-blue-100' :
                          pixel.platform === 'tiktok' ? 'bg-black' :
                          pixel.platform === 'snapchat' ? 'bg-yellow-100' :
                          'bg-gray-100'
                        }`}>
                          <Target className={`h-5 w-5 ${
                            pixel.platform === 'facebook' ? 'text-blue-600' :
                            pixel.platform === 'tiktok' ? 'text-white' :
                            pixel.platform === 'snapchat' ? 'text-yellow-600' :
                            'text-gray-600'
                          }`} />
                        </div>
                        <div>
                          <CardTitle className="text-base">{pixel.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {pixel.platform.toUpperCase()} • {pixel.event_type}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={pixel.enabled ? 'default' : 'secondary'}>
                        {pixel.enabled ? 'نشط' : 'متوقف'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">معرف البيكسل:</span>
                        <span className="font-mono">{pixel.pixel_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">نوع الهدف:</span>
                        <span>{pixel.target_type}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Edit className="h-4 w-4 mr-1" />
                        تعديل
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => deletePixel(pixel.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* بطاقة Quick Add Facebook */}
              <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-blue-500/50 transition-colors">
                <CardHeader className="text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Facebook Pixel</CardTitle>
                  <CardDescription>
                    إضافة سريعة لبيكسل فيسبوك
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setNewPixel({...newPixel, platform: 'facebook', event_type: 'Lead'});
                      setIsCreateDialogOpen(true);
                    }}
                  >
                    إضافة Facebook Pixel
                  </Button>
                </CardContent>
              </Card>

              {/* بطاقة Quick Add TikTok */}
              <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-black/50 transition-colors">
                <CardHeader className="text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-black flex items-center justify-center mb-4">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">TikTok Pixel</CardTitle>
                  <CardDescription>
                    إضافة سريعة لبيكسل TikTok
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setNewPixel({...newPixel, platform: 'tiktok', event_type: 'CompleteRegistration'});
                      setIsCreateDialogOpen(true);
                    }}
                  >
                    إضافة TikTok Pixel
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvertisingTracking;