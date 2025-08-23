import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save, RotateCcw, Edit2, Trash2, Plus } from "lucide-react";
import SettingsLayout from "@/components/layout/SettingsLayout";
import { useI18n } from "@/lib/i18n";
import { CurrencyService, CurrencyDisplaySettings } from "@/lib/services/CurrencyService";
import { CURRENCIES } from "@/lib/constants/countries-currencies";
import { toast } from "sonner";
import { useAuth } from '@/components/layout/AuthProvider';

const CurrencySettings = () => {
  const { t, language } = useI18n();
  const { shop: currentStore, shops: userStores, isShopifyAuthenticated } = useAuth();
  
  // إعدادات العرض
  const [displaySettings, setDisplaySettings] = useState<CurrencyDisplaySettings>({
    showSymbol: true,
    symbolPosition: 'before',
    decimalPlaces: 2,
    customSymbols: {}
  });
  
  // المعدلات المخصصة
  const [customRates, setCustomRates] = useState<Map<string, any>>(new Map());
  const [editingRate, setEditingRate] = useState<string | null>(null);
  const [newRate, setNewRate] = useState({ currency: '', rate: '' });
  const [loading, setLoading] = useState(false);

  // تحميل الإعدادات عند بدء التشغيل
  useEffect(() => {
    console.log('🔄 CurrencySettings useEffect triggered:', { currentStore, userStoresLength: userStores?.length || 0, isShopifyAuthenticated });
    
    // استخدام قيمة مباشرة من localStorage مع التحقق من useAuth
    const storeFromStorage = localStorage.getItem('current_shopify_store');
    const activeStore = currentStore || storeFromStorage;
    
    console.log('⏰ Active store check:', { currentStore, storeFromStorage, activeStore });
    
    if (activeStore) {
      loadSettings(activeStore);
    }
  }, [currentStore, userStores, isShopifyAuthenticated]);

  const loadSettings = async (storeId: string) => {
    
    if (!storeId) {
      console.log('❌ No store ID provided for currency settings');
      return;
    }

    try {
      console.log('🏪 Loading currency settings for store:', storeId);
      console.log('📋 Hook current store:', currentStore);
      console.log('📋 Available user stores:', userStores?.length || 0);
      
      // تعيين سياق المتجر للخدمة مع التأكد من التمرير الصحيح
      const userId = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893';
      console.log('💫 Setting currency service context:', { shop: storeId, userId });
      
      // إجبار إعادة تعيين الخدمة
      (CurrencyService as any).currentShopId = storeId;
      (CurrencyService as any).currentUserId = userId;
      (CurrencyService as any).initialized = false;
      
      console.log('✅ Forced context update - Shop ID:', (CurrencyService as any).currentShopId);
      
      await CurrencyService.initialize();
      setDisplaySettings(CurrencyService.getDisplaySettings());
      setCustomRates(CurrencyService.getCustomRates());
      
      console.log('✅ Currency settings loaded successfully');
    } catch (error) {
      console.error('❌ Error loading currency settings:', error);
      toast.error('فشل في تحميل إعدادات العملة');
    }
  };

  const saveDisplaySettings = async () => {
    const storeFromStorage = localStorage.getItem('current_shopify_store');
    const activeStore = currentStore || storeFromStorage;
    
    if (!activeStore) {
      toast.error('يرجى اختيار متجر أولاً');
      return;
    }

    setLoading(true);
    try {
      // التأكد من أن السياق محدد بشكل صحيح قبل الحفظ
      console.log('💾 Saving display settings for store:', activeStore);
      console.log('🔧 Current service context:', {
        shopId: (CurrencyService as any).currentShopId,
        userId: (CurrencyService as any).currentUserId
      });
      
      await CurrencyService.saveDisplaySettings(displaySettings);
      toast.success('تم حفظ إعدادات العرض بنجاح');
    } catch (error) {
      console.error('❌ Error saving display settings:', error);
      toast.error('فشل في حفظ إعدادات العرض');
    } finally {
      setLoading(false);
    }
  };

  const saveCustomRate = async (currencyCode: string, rate: number) => {
    try {
      await CurrencyService.saveCustomRate(currencyCode, rate);
      setCustomRates(CurrencyService.getCustomRates());
      setEditingRate(null);
      toast.success(`تم حفظ معدل تحويل ${currencyCode} بنجاح`);
    } catch (error) {
      console.error('Error saving custom rate:', error);
      toast.error('فشل في حفظ معدل التحويل');
    }
  };

  const deleteCustomRate = async (currencyCode: string) => {
    try {
      await CurrencyService.deleteCustomRate(currencyCode);
      setCustomRates(CurrencyService.getCustomRates());
      toast.success(`تم حذف معدل تحويل ${currencyCode} بنجاح`);
    } catch (error) {
      console.error('Error deleting custom rate:', error);
      toast.error('فشل في حذف معدل التحويل');
    }
  };

  const addNewRate = async () => {
    if (!newRate.currency || !newRate.rate) {
      toast.error('يرجى إدخال العملة والمعدل');
      return;
    }

    const rate = parseFloat(newRate.rate);
    if (isNaN(rate) || rate <= 0) {
      toast.error('يرجى إدخال معدل تحويل صحيح');
      return;
    }

    await saveCustomRate(newRate.currency, rate);
    setNewRate({ currency: '', rate: '' });
  };

  const resetToDefaults = async () => {
    if (!confirm('هل أنت متأكد من إعادة تعيين جميع المعدلات إلى القيم الافتراضية؟')) {
      return;
    }

    try {
      await CurrencyService.resetToDefaults();
      setCustomRates(new Map());
      toast.success('تم إعادة تعيين جميع المعدلات إلى القيم الافتراضية');
    } catch (error) {
      console.error('Error resetting rates:', error);
      toast.error('فشل في إعادة تعيين المعدلات');
    }
  };

  // معاينة تنسيق العملة
  const previewFormat = (amount: number, currency: string) => {
    const currencyData = CURRENCIES.find(c => c.code === currency);
    if (!currencyData) return `${amount.toFixed(displaySettings.decimalPlaces)} ${currency}`;

    const formattedAmount = amount.toFixed(displaySettings.decimalPlaces);
    
    // استخدام الرمز المخصص إذا كان متوفراً
    let displayText: string;
    if (displaySettings.customSymbols[currency]) {
      displayText = displaySettings.customSymbols[currency];
    } else {
      displayText = displaySettings.showSymbol ? currencyData.symbol : currency;
    }

    if (displaySettings.symbolPosition === 'before') {
      return `${displayText}${formattedAmount}`;
    } else {
      return `${formattedAmount} ${displayText}`;
    }
  };

  return (
    <SettingsLayout>
      <div className="container mx-auto p-6 space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        
        {/* Debug info - إظهار حالة المتجر الحالي */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm mb-4">
          <strong>Debug Info:</strong><br/>
          useAuth Current Store: {currentStore || 'غير محدد'}<br/>
          LocalStorage Store: {localStorage.getItem('current_shopify_store') || 'غير محدد'}<br/>
          User Stores: {userStores?.length || 0}<br/>
          Service Shop ID: {(CurrencyService as any).currentShopId || 'غير محدد'}<br/>
          Is Shopify Authenticated: {isShopifyAuthenticated ? 'نعم' : 'لا'}
        </div>

        {!currentStore && !localStorage.getItem('current_shopify_store') && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">⚠️ {t('invalidInput')}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('currencySettings')}</h1>
            <p className="text-muted-foreground">{t('currencySettingsDescription')}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={resetToDefaults} variant="outline" className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              {t('resetToDefault')}
            </Button>
            <Button 
              onClick={saveDisplaySettings} 
              disabled={loading || (!currentStore && !localStorage.getItem('current_shopify_store'))} 
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {t('save')}
            </Button>
          </div>
        </div>

        {/* إعدادات عرض العملة */}
        <Card>
          <CardHeader>
            <CardTitle>{t('displaySettings')}</CardTitle>
            <CardDescription>{t('currencySettingsDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>{t('displayType')}</Label>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={displaySettings.showSymbol}
                    onCheckedChange={(checked) => 
                      setDisplaySettings(prev => ({ ...prev, showSymbol: checked }))
                    }
                  />
                  <Label className="text-sm">
                    {displaySettings.showSymbol ? t('showSymbol') : t('showCode')}
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('symbolPosition')}</Label>
                <Select 
                  value={displaySettings.symbolPosition} 
                  onValueChange={(value: 'before' | 'after') => 
                    setDisplaySettings(prev => ({ ...prev, symbolPosition: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="before">{t('before')}</SelectItem>
                    <SelectItem value="after">{t('after')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('decimalPlaces')}</Label>
                <Select 
                  value={displaySettings.decimalPlaces.toString()} 
                  onValueChange={(value) => 
                    setDisplaySettings(prev => ({ ...prev, decimalPlaces: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 منازل</SelectItem>
                    <SelectItem value="1">1 منزلة</SelectItem>
                    <SelectItem value="2">2 منزلة</SelectItem>
                    <SelectItem value="3">3 منازل</SelectItem>
                    <SelectItem value="4">4 منازل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* معاينة التنسيق */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <Label className="text-sm font-medium mb-2 block">معاينة التنسيق:</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">USD:</span> {previewFormat(29.99, 'USD')}
                </div>
                <div>
                  <span className="text-gray-600">MAD:</span> {previewFormat(299.99, 'MAD')}
                </div>
                <div>
                  <span className="text-gray-600">XOF:</span> {previewFormat(19655, 'XOF')}
                </div>
                <div>
                  <span className="text-gray-600">XAF:</span> {previewFormat(19655, 'XAF')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* رموز العرض المخصصة */}
        <Card>
          <CardHeader>
            <CardTitle>رموز العرض المخصصة</CardTitle>
            <CardDescription>
              تخصيص كيفية عرض رموز العملات. مثال: عرض "CFA" بدلاً من "XOF" أو "XAF"
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* اختصارات سريعة للفرنك الأفريقي */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Label className="text-sm font-medium mb-3 block">اختصارات سريعة للفرنك الأفريقي:</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDisplaySettings(prev => ({
                      ...prev,
                      customSymbols: {
                        ...prev.customSymbols,
                        'XOF': 'CFA',
                        'XAF': 'CFA'
                      }
                    }));
                  }}
                >
                  استخدام "CFA" للفرنك الأفريقي
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newSymbols = { ...displaySettings.customSymbols };
                    delete newSymbols['XOF'];
                    delete newSymbols['XAF'];
                    setDisplaySettings(prev => ({
                      ...prev,
                      customSymbols: newSymbols
                    }));
                  }}
                >
                  إزالة تخصيص الفرنك
                </Button>
              </div>
            </div>

            {/* إدارة الرموز المخصصة */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">الرموز المخصصة الحالية:</Label>
              
              {Object.keys(displaySettings.customSymbols).length === 0 ? (
                <p className="text-gray-500 text-sm">لا توجد رموز مخصصة حالياً</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(displaySettings.customSymbols).map(([currency, symbol]) => (
                    <div key={currency} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <code className="px-2 py-1 bg-gray-200 rounded text-sm">{currency}</code>
                        <span className="text-gray-600">→</span>
                        <span className="font-medium">{symbol}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newSymbols = { ...displaySettings.customSymbols };
                          delete newSymbols[currency];
                          setDisplaySettings(prev => ({
                            ...prev,
                            customSymbols: newSymbols
                          }));
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* إضافة رمز مخصص جديد */}
            <div className="flex gap-2">
              <Select
                value=""
                onValueChange={(currency) => {
                  const symbol = prompt(`أدخل الرمز المخصص للعملة ${currency}:`);
                  if (symbol && symbol.trim()) {
                    setDisplaySettings(prev => ({
                      ...prev,
                      customSymbols: {
                        ...prev.customSymbols,
                        [currency]: symbol.trim()
                      }
                    }));
                  }
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="إضافة رمز مخصص..." />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.filter(c => !displaySettings.customSymbols[c.code]).map(currency => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code} - {language === 'ar' ? currency.nameAr : currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* إدارة معدلات التحويل */}
        <Card>
          <CardHeader>
            <CardTitle>معدلات التحويل المخصصة</CardTitle>
            <CardDescription>تخصيص معدلات تحويل العملات (جميع المعدلات مقابل الدولار الأمريكي)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* إضافة معدل جديد */}
              <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <Label className="text-sm">العملة</Label>
                  <Select value={newRate.currency} onValueChange={(value) => setNewRate(prev => ({ ...prev, currency: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر العملة" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.filter(c => !customRates.has(c.code)).map(currency => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.code} - {language === 'ar' ? currency.nameAr : currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label className="text-sm">المعدل (مقابل 1 USD)</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    placeholder="10.0000"
                    value={newRate.rate}
                    onChange={(e) => setNewRate(prev => ({ ...prev, rate: e.target.value }))}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={addNewRate} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    إضافة
                  </Button>
                </div>
              </div>

              {/* جدول المعدلات */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العملة</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>المعدل الافتراضي</TableHead>
                    <TableHead>المعدل المخصص</TableHead>
                    <TableHead>آخر تحديث</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CURRENCIES.map(currency => {
                    const customRate = customRates.get(currency.code);
                    const isEditing = editingRate === currency.code;
                    
                    return (
                      <TableRow key={currency.code}>
                        <TableCell className="font-medium">{currency.code}</TableCell>
                        <TableCell>{language === 'ar' ? currency.nameAr : currency.name}</TableCell>
                        <TableCell>{currency.exchangeRate.toFixed(4)}</TableCell>
                        <TableCell>
                          {isEditing ? (
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                step="0.0001"
                                defaultValue={customRate?.rate || currency.exchangeRate}
                                className="w-20"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const rate = parseFloat((e.target as HTMLInputElement).value);
                                    saveCustomRate(currency.code, rate);
                                  }
                                  if (e.key === 'Escape') {
                                    setEditingRate(null);
                                  }
                                }}
                                onBlur={(e) => {
                                  const rate = parseFloat(e.target.value);
                                  if (!isNaN(rate) && rate > 0) {
                                    saveCustomRate(currency.code, rate);
                                  } else {
                                    setEditingRate(null);
                                  }
                                }}
                                autoFocus
                              />
                            </div>
                          ) : (
                            <span className={customRate ? 'font-medium text-blue-600' : 'text-gray-500'}>
                              {customRate ? customRate.rate.toFixed(4) : '—'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {customRate ? new Date(customRate.updatedAt).toLocaleDateString('ar') : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingRate(currency.code)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            {customRate && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteCustomRate(currency.code)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  );
};

export default CurrencySettings;