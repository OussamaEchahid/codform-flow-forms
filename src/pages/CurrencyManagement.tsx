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
import { useSimpleShopifyAuth } from "@/hooks/useSimpleShopifyAuth";

const CurrencyManagement = () => {
  const { t, language } = useI18n();
  const { currentStore, userStores } = useSimpleShopifyAuth();
  
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
    loadSettings();
  }, [currentStore]);

  const loadSettings = async () => {
    try {
      // تعيين سياق المتجر للخدمة
      const currentStoreData = userStores.find(s => s.shop === currentStore);
      if (currentStore) {
        // استخدام معرف ثابت للمستخدم مؤقتاً حتى يتم إضافة user_id للنوع
        CurrencyService.setShopContext(currentStore, '36d7eb85-0c45-4b4f-bea1-a9cb732ca893');
      }
      
      await CurrencyService.initialize();
      setDisplaySettings(CurrencyService.getDisplaySettings());
      setCustomRates(CurrencyService.getCustomRates());
    } catch (error) {
      console.error('Error loading currency settings:', error);
      toast.error('فشل في تحميل إعدادات العملة');
    }
  };

  const saveDisplaySettings = async () => {
    setLoading(true);
    try {
      await CurrencyService.saveDisplaySettings(displaySettings);
      toast.success('تم حفظ إعدادات العرض بنجاح');
    } catch (error) {
      console.error('Error saving display settings:', error);
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
    const displayText = displaySettings.showSymbol ? currencyData.symbol : currency;

    if (displaySettings.symbolPosition === 'before') {
      return `${displayText}${formattedAmount}`;
    } else {
      return `${formattedAmount} ${displayText}`;
    }
  };

  return (
    <SettingsLayout>
      <div className="container mx-auto p-6 space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">إدارة العملات</h1>
            <p className="text-muted-foreground">تخصيص معدلات التحويل وإعدادات عرض العملات</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={resetToDefaults} variant="outline" className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              إعادة تعيين
            </Button>
            <Button onClick={saveDisplaySettings} disabled={loading} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              حفظ الإعدادات
            </Button>
          </div>
        </div>

        {/* إعدادات عرض العملة */}
        <Card>
          <CardHeader>
            <CardTitle>إعدادات العرض</CardTitle>
            <CardDescription>تخصيص كيفية عرض العملات في النماذج والمعاينة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>نوع العرض</Label>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={displaySettings.showSymbol}
                    onCheckedChange={(checked) => 
                      setDisplaySettings(prev => ({ ...prev, showSymbol: checked }))
                    }
                  />
                  <Label className="text-sm">
                    {displaySettings.showSymbol ? 'رمز العملة (د.م)' : 'كود العملة (MAD)'}
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>موضع الرمز</Label>
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
                    <SelectItem value="before">قبل المبلغ</SelectItem>
                    <SelectItem value="after">بعد المبلغ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>المنازل العشرية</Label>
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
                  <span className="text-gray-600">SAR:</span> {previewFormat(112.50, 'SAR')}
                </div>
                <div>
                  <span className="text-gray-600">EUR:</span> {previewFormat(27.59, 'EUR')}
                </div>
              </div>
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

export default CurrencyManagement;