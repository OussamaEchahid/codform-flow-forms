import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  HelpCircle, 
  Plus, 
  Trash2, 
  Settings as SettingsIcon,
  ShoppingCart,
  Shield,
  Crown,
  Clock,
  DollarSign,
  MessageSquare,
  MapPin,
  Globe
} from 'lucide-react';

const Settings = () => {
  // حالات إعدادات الطلب
  const [postOrderAction, setPostOrderAction] = useState('popup');
  const [redirectEnabled, setRedirectEnabled] = useState(false);
  const [thankYouUrl, setThankYouUrl] = useState('');
  const [popupTitle, setPopupTitle] = useState('شكراً لك!');
  const [popupMessage, setPopupMessage] = useState('تم إنشاء طلبك بنجاح وسيتم التواصل معك قريباً');

  // حالات الإعدادات العامة
  const [showShopifyButton, setShowShopifyButton] = useState(true);
  const [orderPaymentStatus, setOrderPaymentStatus] = useState('pending');
  const [dailyOrderLimit, setDailyOrderLimit] = useState(5);
  const [outOfStockMessage, setOutOfStockMessage] = useState('عذراً، هذا المنتج غير متوفر حالياً');
  const [shippingRates, setShippingRates] = useState<Array<{id: number, minAmount: number, maxAmount: number, shippingCost: number}>>([]);

  // حالات حظر السبام
  const [newBlockedIP, setNewBlockedIP] = useState('');
  const [blockedIPs, setBlockedIPs] = useState([
    { id: 1, ip: '192.168.1.100', date: '2024-01-15', reason: 'نشاط مشبوه' },
    { id: 2, ip: '10.0.0.50', date: '2024-01-10', reason: 'محاولات متكررة' }
  ]);

  const addBlockedIP = () => {
    if (newBlockedIP.trim()) {
      const newEntry = {
        id: Date.now(),
        ip: newBlockedIP.trim(),
        date: new Date().toLocaleDateString('ar-SA'),
        reason: 'محظور يدوياً'
      };
      setBlockedIPs([...blockedIPs, newEntry]);
      setNewBlockedIP('');
    }
  };

  const removeBlockedIP = (id: number) => {
    setBlockedIPs(blockedIPs.filter(item => item.id !== id));
  };

  const addShippingRate = () => {
    const newRate = {
      id: Date.now(),
      minAmount: 0,
      maxAmount: 100,
      shippingCost: 10
    };
    setShippingRates([...shippingRates, newRate]);
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto py-6 max-w-6xl">
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="h-6 w-6" />
          <h1 className="text-3xl font-bold">إعدادات التطبيق</h1>
        </div>
        
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              إعدادات الطلب
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              الإعدادات العامة
            </TabsTrigger>
            <TabsTrigger value="spam" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              حظر السبام
            </TabsTrigger>
            <TabsTrigger value="plans" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              الخطط
            </TabsTrigger>
          </TabsList>

          {/* قسم إعدادات الطلب */}
          <TabsContent value="orders">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    إعدادات الطلب
                  </CardTitle>
                  <CardDescription>
                    تحكم في سلوك التطبيق بعد إنشاء الطلبات
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* الإجراء بعد إنشاء الطلب */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="post-order-action">الإجراء بعد إنشاء الطلب</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>حدد ما يحدث بعد إنشاء الطلب بنجاح</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select value={postOrderAction} onValueChange={setPostOrderAction}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="popup">عرض نافذة منبثقة</SelectItem>
                        <SelectItem value="redirect">إعادة التوجيه إلى صفحة</SelectItem>
                        <SelectItem value="both">كلاهما</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* إعدادات إعادة التوجيه */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="redirect-enabled">إعادة التوجيه إلى صفحة</Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>تفعيل إعادة التوجيه التلقائي بعد إنشاء الطلب</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Switch 
                        id="redirect-enabled"
                        checked={redirectEnabled}
                        onCheckedChange={setRedirectEnabled}
                      />
                    </div>
                    
                    {redirectEnabled && (
                      <div className="space-y-2">
                        <Label htmlFor="thank-you-url">رابط صفحة الشكر</Label>
                        <Input
                          id="thank-you-url"
                          type="url"
                          placeholder="https://example.com/thank-you"
                          value={thankYouUrl}
                          onChange={(e) => setThankYouUrl(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* إعدادات النافذة المنبثقة */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      إعدادات النافذة المنبثقة (Popup)
                    </h4>
                    
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="popup-title">العنوان</Label>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>عنوان النافذة المنبثقة التي تظهر بعد إنشاء الطلب</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input
                          id="popup-title"
                          value={popupTitle}
                          onChange={(e) => setPopupTitle(e.target.value)}
                          placeholder="شكراً لك!"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="popup-message">الرسالة</Label>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>محتوى الرسالة التي تظهر للعميل</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Textarea
                          id="popup-message"
                          value={popupMessage}
                          onChange={(e) => setPopupMessage(e.target.value)}
                          placeholder="تم إنشاء طلبك بنجاح وسيتم التواصل معك قريباً"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* قسم الإعدادات العامة */}
          <TabsContent value="general">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SettingsIcon className="h-5 w-5" />
                    الإعدادات العامة
                  </CardTitle>
                  <CardDescription>
                    إعدادات عامة لسلوك التطبيق والطلبات
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* إظهار زر الشراء عبر Shopify */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="shopify-button">إظهار زر الشراء عبر Shopify</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>عرض زر للشراء المباشر من متجر Shopify</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch 
                      id="shopify-button"
                      checked={showShopifyButton}
                      onCheckedChange={setShowShopifyButton}
                    />
                  </div>

                  <Separator />

                  {/* حالة دفع الطلب */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="payment-status">حالة دفع الطلب</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>الحالة الافتراضية لحالة الدفع عند إنشاء الطلبات</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select value={orderPaymentStatus} onValueChange={setOrderPaymentStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">مدفوع</SelectItem>
                        <SelectItem value="pending">قيد الانتظار</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* الحد الأقصى للطلبات اليومية */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="daily-limit">الحد الأقصى للطلبات اليومية لكل زائر</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>عدد الطلبات المسموح بها لكل زائر يومياً (0 = بلا حدود)</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="daily-limit"
                      type="number"
                      min="0"
                      value={dailyOrderLimit}
                      onChange={(e) => setDailyOrderLimit(Number(e.target.value))}
                      className="max-w-xs"
                    />
                  </div>

                  <Separator />

                  {/* رسالة عند نفاد المخزون */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="out-of-stock">رسالة عند نفاد المخزون</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>الرسالة التي تظهر عندما يكون المنتج غير متوفر</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="out-of-stock"
                      value={outOfStockMessage}
                      onChange={(e) => setOutOfStockMessage(e.target.value)}
                      placeholder="عذراً، هذا المنتج غير متوفر حالياً"
                    />
                  </div>

                  <Separator />

                  {/* الشحن حسب السعر الإجمالي */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        الشحن حسب السعر الإجمالي للطلب
                      </h4>
                      <Button onClick={addShippingRate} size="sm" className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        إضافة سعر
                      </Button>
                    </div>
                    
                    {shippingRates.length > 0 && (
                      <div className="border rounded-lg p-4 space-y-3">
                        {shippingRates.map((rate) => (
                          <div key={rate.id} className="flex items-center gap-4 p-3 border rounded-lg">
                            <div className="flex-1 grid grid-cols-3 gap-4">
                              <div>
                                <Label className="text-xs">من (ريال)</Label>
                                <Input type="number" defaultValue={rate.minAmount.toString()} className="text-sm" />
                              </div>
                              <div>
                                <Label className="text-xs">إلى (ريال)</Label>
                                <Input type="number" defaultValue={rate.maxAmount.toString()} className="text-sm" />
                              </div>
                              <div>
                                <Label className="text-xs">تكلفة الشحن</Label>
                                <Input type="number" defaultValue={rate.shippingCost.toString()} className="text-sm" />
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShippingRates(shippingRates.filter(r => r.id !== rate.id))}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* قسم حظر السبام */}
          <TabsContent value="spam">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    حظر السبام
                  </CardTitle>
                  <CardDescription>
                    إدارة قائمة عناوين IP المحظورة لمنع الزوار المزعجين
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* إضافة IP جديد */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="new-ip">حظر عنوان IP</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>أدخل عنوان IP لإضافته إلى قائمة الحظر</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        id="new-ip"
                        placeholder="192.168.1.1"
                        value={newBlockedIP}
                        onChange={(e) => setNewBlockedIP(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={addBlockedIP} disabled={!newBlockedIP.trim()}>
                        حظر
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* جدول العناوين المحظورة */}
                  <div className="space-y-3">
                    <h4 className="font-medium">العناوين المحظورة</h4>
                    
                    {blockedIPs.length > 0 ? (
                      <div className="border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>التاريخ</TableHead>
                              <TableHead>عنوان الـ IP</TableHead>
                              <TableHead>السبب</TableHead>
                              <TableHead className="text-center">الإجراءات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {blockedIPs.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>{item.date}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className="font-mono">
                                    {item.ip}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {item.reason}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeBlockedIP(item.id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>لا توجد عناوين IP محظورة حالياً</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* قسم الخطط */}
          <TabsContent value="plans">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5" />
                    إدارة الخطط
                  </CardTitle>
                  <CardDescription>
                    إعدادات الخطط والاشتراكات (قريباً)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Crown className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">قسم الخطط قيد التطوير</h3>
                    <p className="text-muted-foreground mb-6">
                      سيتم إضافة إعدادات الخطط والاشتراكات في التحديثات القادمة
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium">الخطة الأساسية</h4>
                        <p className="text-sm text-muted-foreground">قريباً</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium">الخطة المتقدمة</h4>
                        <p className="text-sm text-muted-foreground">قريباً</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium">خطة الأعمال</h4>
                        <p className="text-sm text-muted-foreground">قريباً</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
};

export default Settings;