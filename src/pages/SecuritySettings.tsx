import React, { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Download, Upload, Globe, MapPin, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/layout/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { CountrySelector } from '@/components/ui/country-selector';
import { COUNTRIES_ALL } from '@/lib/constants/countries-all';

interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string;
  redirect_url: string;
  created_at: string;
  is_active: boolean;
}

interface BlockedCountry {
  id: string;
  country_code: string;
  country_name: string;
  reason: string;
  redirect_url: string;
  created_at: string;
  is_active: boolean;
}

interface SecurityStats {
  blocked_ips_count: number;
  blocked_countries_count: number;
  total_blocks_today: number;
}

const SecuritySettings = () => {
  const { shop } = useAuth();
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [blockedCountries, setBlockedCountries] = useState<BlockedCountry[]>([]);
  const [securityStats, setSecurityStats] = useState<SecurityStats>({
    blocked_ips_count: 0,
    blocked_countries_count: 0,
    total_blocks_today: 0
  });
  const [loading, setLoading] = useState(true);

  // نماذج إضافة جديدة
  const [newIP, setNewIP] = useState('');
  const [newIPReason, setNewIPReason] = useState('');
  const [newIPRedirect, setNewIPRedirect] = useState('');
  const [showAddIPDialog, setShowAddIPDialog] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState('');
  const [newCountryReason, setNewCountryReason] = useState('');
  const [newCountryRedirect, setNewCountryRedirect] = useState('');
  const [showAddCountryDialog, setShowAddCountryDialog] = useState(false);

  const [csvData, setCsvData] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);

  // تحميل البيانات عند بدء الصفحة
  useEffect(() => {
    if (shop) {
      loadSecurityData();
    }
  }, [shop]);

  const loadSecurityData = async () => {
    if (!shop) return;
    
    setLoading(true);
    try {
      // تحميل عناوين IP المحظورة باستخدام Edge Function
      const { data: ipsData, error: ipsError } = await supabase.functions.invoke('get-blocked-data', {
        body: { type: 'ips', shop_id: shop }
      });
      
      if (ipsError) console.error('Error loading IPs:', ipsError);
      setBlockedIPs(ipsData?.data || []);

      // تحميل الدول المحظورة باستخدام Edge Function
      const { data: countriesData, error: countriesError } = await supabase.functions.invoke('get-blocked-data', {
        body: { type: 'countries', shop_id: shop }
      });
      
      if (countriesError) console.error('Error loading countries:', countriesError);
      setBlockedCountries(countriesData?.data || []);

      // إحصائيات الأمان
      setSecurityStats({
        blocked_ips_count: ipsData?.data?.length || 0,
        blocked_countries_count: countriesData?.data?.length || 0,
        total_blocks_today: 0 // يمكن إضافة استعلام للحصول على إحصائيات اليوم
      });

    } catch (error) {
      console.error('Error loading security data:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات الأمان",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddIP = async () => {
    if (!shop || !newIP.trim()) return;

    try {
      const { data, error } = await supabase.functions.invoke('manage-blocked-items', {
        body: {
          action: 'add_ip',
          shop_id: shop,
          ip_address: newIP.trim(),
          reason: newIPReason.trim() || 'غير محدد',
          redirect_url: newIPRedirect.trim() || null
        }
      });

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم إضافة عنوان IP إلى قائمة الحظر",
      });

      // إعادة تعيين النموذج وتحديث البيانات
      setNewIP('');
      setNewIPReason('');
      setNewIPRedirect('');
      setShowAddIPDialog(false);
      loadSecurityData();

    } catch (error) {
      console.error('Error adding blocked IP:', error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة عنوان IP",
        variant: "destructive",
      });
    }
  };

  const handleRemoveIP = async (ipId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-blocked-items', {
        body: {
          action: 'remove_ip',
          blocked_id: ipId
        }
      });

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم إزالة عنوان IP من قائمة الحظر",
      });

      loadSecurityData();

    } catch (error) {
      console.error('Error removing blocked IP:', error);
      toast({
        title: "خطأ",
        description: "فشل في إزالة عنوان IP",
        variant: "destructive",
      });
    }
  };

  const handleAddCountry = async () => {
    if (!shop || !selectedCountry) return;

    const countryInfo = COUNTRIES_ALL.find(c => c.code === selectedCountry);
    if (!countryInfo) return;

    try {
      const { data, error } = await supabase.functions.invoke('manage-blocked-items', {
        body: {
          action: 'add_country',
          shop_id: shop,
          country_code: selectedCountry,
          country_name: countryInfo.name,
          reason: newCountryReason.trim() || 'غير محدد',
          redirect_url: newCountryRedirect.trim() || null
        }
      });

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: `تم إضافة ${countryInfo.name} إلى قائمة الحظر`,
      });

      // إعادة تعيين النموذج وتحديث البيانات
      setSelectedCountry('');
      setNewCountryReason('');
      setNewCountryRedirect('');
      setShowAddCountryDialog(false);
      loadSecurityData();

    } catch (error) {
      console.error('Error adding blocked country:', error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة الدولة",
        variant: "destructive",
      });
    }
  };

  const handleRemoveCountry = async (countryId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-blocked-items', {
        body: {
          action: 'remove_country',
          blocked_id: countryId
        }
      });

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم إزالة الدولة من قائمة الحظر",
      });

      loadSecurityData();

    } catch (error) {
      console.error('Error removing blocked country:', error);
      toast({
        title: "خطأ",
        description: "فشل في إزالة الدولة",
        variant: "destructive",
      });
    }
  };

  const handleExportIPs = () => {
    const csvContent = [
      'IP Address,Reason,Redirect URL,Created Date',
      ...blockedIPs.map(ip => 
        `"${ip.ip_address}","${ip.reason}","${ip.redirect_url || ''}","${new Date(ip.created_at).toLocaleDateString()}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `blocked-ips-${shop}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportIPs = () => {
    try {
      const lines = csvData.trim().split('\n');
      const header = lines[0];
      
      if (!header.includes('IP Address')) {
        throw new Error('CSV file must include "IP Address" column');
      }

      const ipAddresses = lines.slice(1).map(line => {
        const values = line.split(',');
        return values[0].replace(/"/g, '').trim();
      });

      // يمكن إضافة منطق لإضافة عناوين IP بشكل جماعي
      toast({
        title: "تحديث",
        description: "ميزة الاستيراد الجماعي ستكون متوفرة قريباً",
      });

      setShowImportDialog(false);
      setCsvData('');

    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في قراءة ملف CSV",
        variant: "destructive",
      });
    }
  };

  if (!shop) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-warning mb-4" />
            <h3 className="text-lg font-semibold mb-2">يجب ربط متجر Shopify</h3>
            <p className="text-muted-foreground">يجب ربط متجر Shopify أولاً للوصول إلى إعدادات الأمان</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">الأمان والتحكم في الوصول</h1>
          <p className="text-muted-foreground">إدارة حظر عناوين IP والدول لحماية متجرك</p>
        </div>
      </div>

      {/* تحذير تفعيل الحماية */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Shield className="h-8 w-8 text-blue-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-bold text-blue-900 text-xl mb-2">🔒 كيفية تفعيل الحماية على متجر Shopify</h3>
              <div className="text-blue-800 text-sm space-y-2 mb-4">
                <p><strong>الخطوة 1:</strong> أضف عناوين IP أو الدول المحظورة أدناه</p>
                <p><strong>الخطوة 2:</strong> اضغط على الزر لإنتاج سكريپت الحماية</p>
                <p><strong>الخطوة 3:</strong> انسخ السكريپت والصقه في ثيم شوبيفاي</p>
                <p><strong>النتيجة:</strong> سيتم حظر الزوار فوراً عند دخولهم للمتجر</p>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="default" 
                  size="default"
                  onClick={() => window.open('/shopify-protection', '_blank')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  إنتاج سكريپت الحماية
                </Button>
                <Button 
                  variant="outline" 
                  size="default"
                  onClick={() => window.open('https://www.youtube.com/watch?v=example', '_blank')}
                  className="border-blue-300 text-blue-800 hover:bg-blue-100"
                >
                  📺 شرح فيديو
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* إحصائيات سريعة */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <MapPin className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{securityStats.blocked_ips_count}</p>
                <p className="text-sm text-muted-foreground">عناوين IP محظورة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Globe className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{securityStats.blocked_countries_count}</p>
                <p className="text-sm text-muted-foreground">دول محظورة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{securityStats.total_blocks_today}</p>
                <p className="text-sm text-muted-foreground">محاولات حظر اليوم</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التبويبات الرئيسية */}
      <Tabs defaultValue="ip-blocking" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ip-blocking">حظر عناوين IP</TabsTrigger>
          <TabsTrigger value="country-blocking">حظر الدول</TabsTrigger>
        </TabsList>

        {/* تبويب حظر عناوين IP */}
        <TabsContent value="ip-blocking" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>إدارة عناوين IP المحظورة</CardTitle>
                  <CardDescription>
                    أضف أو احذف عناوين IP المحددة لمنع الوصول إلى متجرك
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        استيراد
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>استيراد عناوين IP</DialogTitle>
                        <DialogDescription>
                          الصق بيانات CSV مع رأس "IP Address,Reason,Redirect URL"
                        </DialogDescription>
                      </DialogHeader>
                      <Textarea
                        placeholder="IP Address,Reason,Redirect URL&#10;192.168.1.1,Suspicious activity,/blocked"
                        value={csvData}
                        onChange={(e) => setCsvData(e.target.value)}
                        rows={10}
                      />
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                          إلغاء
                        </Button>
                        <Button onClick={handleImportIPs}>
                          استيراد
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" size="sm" onClick={handleExportIPs}>
                    <Download className="h-4 w-4 mr-2" />
                    تصدير
                  </Button>

                  <Dialog open={showAddIPDialog} onOpenChange={setShowAddIPDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        إضافة IP
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>إضافة عنوان IP إلى قائمة الحظر</DialogTitle>
                        <DialogDescription>
                          أدخل عنوان IP والسبب ورابط إعادة التوجيه (اختياري)
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="new-ip">عنوان IP</Label>
                          <Input
                            id="new-ip"
                            placeholder="192.168.1.1"
                            value={newIP}
                            onChange={(e) => setNewIP(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="new-ip-reason">السبب</Label>
                          <Input
                            id="new-ip-reason"
                            placeholder="نشاط مشبوه"
                            value={newIPReason}
                            onChange={(e) => setNewIPReason(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="new-ip-redirect">رابط إعادة التوجيه (اختياري)</Label>
                          <Input
                            id="new-ip-redirect"
                            placeholder="/blocked"
                            value={newIPRedirect}
                            onChange={(e) => setNewIPRedirect(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddIPDialog(false)}>
                          إلغاء
                        </Button>
                        <Button onClick={handleAddIP}>
                          إضافة
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p>جاري التحميل...</p>
                </div>
              ) : blockedIPs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">لا توجد عناوين IP محظورة</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>عنوان IP</TableHead>
                      <TableHead>السبب</TableHead>
                      <TableHead>رابط إعادة التوجيه</TableHead>
                      <TableHead>تاريخ الإضافة</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blockedIPs.map((ip) => (
                      <TableRow key={ip.id}>
                        <TableCell className="font-mono">{ip.ip_address}</TableCell>
                        <TableCell>{ip.reason}</TableCell>
                        <TableCell>{ip.redirect_url || '-'}</TableCell>
                        <TableCell>{new Date(ip.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={ip.is_active ? "destructive" : "secondary"}>
                            {ip.is_active ? "محظور" : "معطل"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveIP(ip.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب حظر الدول */}
        <TabsContent value="country-blocking" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>إدارة الدول المحظورة</CardTitle>
                  <CardDescription>
                    أضف أو احذف دول محددة لمنع الوصول من مناطق جغرافية معينة
                  </CardDescription>
                </div>
                <Dialog open={showAddCountryDialog} onOpenChange={setShowAddCountryDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      إضافة دولة
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>إضافة دولة إلى قائمة الحظر</DialogTitle>
                      <DialogDescription>
                        اختر الدولة والسبب ورابط إعادة التوجيه (اختياري)
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="country-selector">الدولة</Label>
                        <CountrySelector
                          value={selectedCountry}
                          onValueChange={setSelectedCountry}
                        />
                      </div>
                      <div>
                        <Label htmlFor="new-country-reason">السبب</Label>
                        <Input
                          id="new-country-reason"
                          placeholder="قيود جغرافية"
                          value={newCountryReason}
                          onChange={(e) => setNewCountryReason(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="new-country-redirect">رابط إعادة التوجيه (اختياري)</Label>
                        <Input
                          id="new-country-redirect"
                          placeholder="/blocked"
                          value={newCountryRedirect}
                          onChange={(e) => setNewCountryRedirect(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddCountryDialog(false)}>
                        إلغاء
                      </Button>
                      <Button onClick={handleAddCountry}>
                        إضافة
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p>جاري التحميل...</p>
                </div>
              ) : blockedCountries.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">لا توجد دول محظورة</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الدولة</TableHead>
                      <TableHead>رمز الدولة</TableHead>
                      <TableHead>السبب</TableHead>
                      <TableHead>رابط إعادة التوجيه</TableHead>
                      <TableHead>تاريخ الإضافة</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blockedCountries.map((country) => (
                      <TableRow key={country.id}>
                        <TableCell className="flex items-center gap-2">
                          <img
                            src={`https://flagcdn.com/24x18/${country.country_code.toLowerCase()}.png`}
                            alt={country.country_name}
                            className="w-6 h-4"
                          />
                          {country.country_name}
                        </TableCell>
                        <TableCell className="font-mono">{country.country_code}</TableCell>
                        <TableCell>{country.reason}</TableCell>
                        <TableCell>{country.redirect_url || '-'}</TableCell>
                        <TableCell>{new Date(country.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={country.is_active ? "destructive" : "secondary"}>
                            {country.is_active ? "محظورة" : "معطلة"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveCountry(country.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecuritySettings;