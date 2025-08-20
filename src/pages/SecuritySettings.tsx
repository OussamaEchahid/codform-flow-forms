import React, { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Download, Upload, Globe, MapPin, AlertTriangle, Copy, Code, TestTube } from 'lucide-react';
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

  // تشخيص قيمة shop
  console.log('🏪 SecuritySettings - shop value:', shop);
  console.log('🏪 SecuritySettings - shop type:', typeof shop);
  console.log('🏪 SecuritySettings - shop length:', shop?.length);

  // تشخيص localStorage
  console.log('💾 localStorage active_shopify_store:', localStorage.getItem('active_shopify_store'));
  console.log('💾 localStorage current_shopify_store:', localStorage.getItem('current_shopify_store'));
  console.log('💾 localStorage shopify_store:', localStorage.getItem('shopify_store'));
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

  // نافذة منبثقة لسكريپت الحماية
  const [showProtectionDialog, setShowProtectionDialog] = useState(false);
  const [protectionScript, setProtectionScript] = useState('');
  const [scriptLoading, setScriptLoading] = useState(false);

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
      // تحميل عناوين IP المحظورة مباشرة من قاعدة البيانات
      const { data: ipsData, error: ipsError } = await supabase
        .from('blocked_ips')
        .select('*')
        .eq('shop_id', shop)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (ipsError) console.error('Error loading IPs:', ipsError);
      setBlockedIPs(ipsData || []);

      // تحميل الدول المحظورة مباشرة من قاعدة البيانات
      const { data: countriesData, error: countriesError } = await supabase
        .from('blocked_countries')
        .select('*')
        .eq('shop_id', shop)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (countriesError) console.error('Error loading countries:', countriesError);
      setBlockedCountries(countriesData || []);

      // إحصائيات الأمان
      setSecurityStats({
        blocked_ips_count: ipsData?.length || 0,
        blocked_countries_count: countriesData?.length || 0,
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
      // التحقق من صحة IP address
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!ipRegex.test(newIP.trim())) {
        toast({
          title: "خطأ",
          description: "صيغة عنوان IP غير صحيحة",
          variant: "destructive",
        });
        return;
      }

      console.log('🔍 Current shop value for IP:', shop);

      // الحصول على معلومات المتجر من قاعدة البيانات
      const { data: storeData, error: storeError } = await supabase
        .from('shopify_stores')
        .select('shop, user_id')
        .eq('shop', shop)
        .eq('is_active', true)
        .single();

      console.log('📊 Store query result for IP:', { storeData, storeError });

      if (storeError || !storeData) {
        console.error('❌ Store not found for IP. Available stores:', await supabase.from('shopify_stores').select('shop, is_active'));
        throw new Error('لم يتم العثور على معلومات المتجر');
      }

      // التحقق من وجود سجل معطل لنفس IP
      const { data: existingIP, error: checkError } = await supabase
        .from('blocked_ips')
        .select('id, is_active')
        .eq('shop_id', storeData.shop)
        .eq('ip_address', newIP.trim())
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Check error for IP:', checkError);
        throw checkError;
      }

      let error;
      if (existingIP) {
        // إعادة تفعيل السجل الموجود
        const { error: updateError } = await supabase
          .from('blocked_ips')
          .update({
            reason: newIPReason.trim() || 'غير محدد',
            redirect_url: newIPRedirect.trim() || '/blocked',
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingIP.id);
        error = updateError;
        console.log('✅ Reactivated existing IP record');
      } else {
        // إنشاء سجل جديد
        const { error: insertError } = await supabase
          .from('blocked_ips')
          .insert({
            shop_id: storeData.shop,
            user_id: storeData.user_id,
            ip_address: newIP.trim(),
            reason: newIPReason.trim() || 'غير محدد',
            redirect_url: newIPRedirect.trim() || '/blocked',
            is_active: true
          });
        error = insertError;
        console.log('✅ Created new IP record');
      }

      if (error) {
        console.error('❌ Operation error for IP:', error);
        throw error;
      }

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
      const { error } = await supabase
        .from('blocked_ips')
        .update({ is_active: false })
        .eq('id', ipId);

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
    if (!shop || !selectedCountry) {
      console.error('❌ Missing shop or selectedCountry:', { shop, selectedCountry });
      toast({
        title: "خطأ",
        description: "يجب ربط متجر Shopify أولاً",
        variant: "destructive",
      });
      return;
    }

    const countryInfo = COUNTRIES_ALL.find(c => c.code === selectedCountry);
    if (!countryInfo) return;

    try {
      console.log('🔍 Current shop value:', shop);

      // الحصول على معلومات المتجر من قاعدة البيانات
      const { data: storeData, error: storeError } = await supabase
        .from('shopify_stores')
        .select('shop, user_id')
        .eq('shop', shop)
        .eq('is_active', true)
        .single();

      console.log('📊 Store query result:', { storeData, storeError });

      if (storeError || !storeData) {
        console.error('❌ Store not found. Available stores:', await supabase.from('shopify_stores').select('shop, is_active'));
        throw new Error('لم يتم العثور على معلومات المتجر');
      }

      // التحقق من وجود سجل معطل لنفس الدولة
      const { data: existingCountry, error: checkError } = await supabase
        .from('blocked_countries')
        .select('id, is_active')
        .eq('shop_id', storeData.shop)
        .eq('country_code', selectedCountry.toUpperCase())
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Check error:', checkError);
        throw checkError;
      }

      let error;
      if (existingCountry) {
        // إعادة تفعيل السجل الموجود
        const { error: updateError } = await supabase
          .from('blocked_countries')
          .update({
            reason: newCountryReason.trim() || 'غير محدد',
            redirect_url: newCountryRedirect.trim() || '/blocked',
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingCountry.id);
        error = updateError;
        console.log('✅ Reactivated existing country record');
      } else {
        // إنشاء سجل جديد
        const { error: insertError } = await supabase
          .from('blocked_countries')
          .insert({
            shop_id: storeData.shop,
            user_id: storeData.user_id,
            country_code: selectedCountry.toUpperCase(),
            country_name: countryInfo.name,
            reason: newCountryReason.trim() || 'غير محدد',
            redirect_url: newCountryRedirect.trim() || '/blocked',
            is_active: true
          });
        error = insertError;
        console.log('✅ Created new country record');
      }

      if (error) {
        console.error('❌ Operation error:', error);
        throw error;
      }

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
      const { error } = await supabase
        .from('blocked_countries')
        .update({ is_active: false })
        .eq('id', countryId);

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

  // إنتاج سكريپت الحماية
  const generateProtectionScript = async () => {
    if (!shop) {
      toast({
        title: 'خطأ',
        description: 'لا يوجد متجر مرتبط',
        variant: 'destructive'
      });
      return;
    }

    setScriptLoading(true);
    try {
      // إنتاج السكريپت محلياً بدلاً من استخدام Edge Function
      const script = generateShopifyProtectionScript(shop);
      setProtectionScript(script);

      toast({
        title: 'تم بنجاح',
        description: 'تم إنتاج سكريپت الحماية'
      });
    } catch (error) {
      console.error('Error generating script:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إنتاج سكريپت الحماية',
        variant: 'destructive'
      });
    } finally {
      setScriptLoading(false);
    }
  };

  // دالة إنتاج السكريپت محلياً - مبسط وفعال
  const generateShopifyProtectionScript = (shopDomain: string): string => {
    const supabaseUrl = 'https://trlklwixfeaexhydzaue.supabase.co';
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M';

    // التحقق من وجود shopDomain
    if (!shopDomain) {
      throw new Error('Shop domain is required');
    }

    // تنظيف وحماية المتغيرات
    const cleanShopDomain = shopDomain.replace(/['"\\]/g, '').trim();

    return `<!-- CodForm Protection System - Simplified for ${cleanShopDomain} -->
<script>
(function() {
  'use strict';

  // منع التشغيل المتعدد
  if (window.CodFormProtectionActive) return;
  window.CodFormProtectionActive = true;

  const SHOP_DOMAIN = '${cleanShopDomain}';
  const SUPABASE_URL = '${supabaseUrl}';
  const API_KEY = '${apiKey}';

  console.log('[CodForm] 🛡️ Protection initialized for:', SHOP_DOMAIN);

  // إخفاء الصفحة فوراً
  document.documentElement.style.cssText = 'visibility: hidden !important;';

  // دالة إظهار شاشة بيضاء
  function showWhiteScreen() {
    document.documentElement.style.cssText = 'visibility: visible !important;';
    document.body.innerHTML = '';
    document.body.style.cssText = 'margin: 0; padding: 0; background: white; width: 100vw; height: 100vh;';
  }

  // دالة إعادة التوجيه
  function redirectTo(url) {
    if (url && url !== '/blocked') {
      window.location.href = url;
    } else {
      showWhiteScreen();
    }
  }

  // دالة إظهار الصفحة العادية
  function showNormalPage() {
    document.documentElement.style.cssText = '';
    console.log('[CodForm] ✅ Access allowed');
  }

  // فحص الحماية
  async function checkSecurity() {
    try {
      // الحصول على IP
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      const visitorIP = ipData.ip;

      console.log('[CodForm] 🔍 Checking IP:', visitorIP);

      // استخدام Edge Function للفحص
      const checkResponse = await fetch(SUPABASE_URL + '/functions/v1/store-security-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + API_KEY
        },
        body: JSON.stringify({
          shop_id: SHOP_DOMAIN,
          visitor_ip: visitorIP,
          user_agent: navigator.userAgent,
          referer: document.referrer || window.location.href
        })
      });

      if (!checkResponse.ok) {
        console.warn('[CodForm] ⚠️ Check failed, allowing access');
        showNormalPage();
        return;
      }

      const result = await checkResponse.json();
      console.log('[CodForm] 📊 Check result:', result);

      if (result.blocked) {
        console.log('[CodForm] 🚫 Access blocked:', result.reason);
        redirectTo(result.redirect_url);
      } else {
        showNormalPage();
      }

    } catch (error) {
      console.error('[CodForm] ❌ Error:', error);
      showNormalPage(); // في حالة الخطأ، إظهار الصفحة
    }
    }
  }

  // تشغيل فحص الحماية عند تحميل الصفحة
  checkSecurity();

})();
</script>`;
  };

  // نسخ السكريپت
  const copyProtectionScript = async () => {
    if (!protectionScript) {
      toast({
        title: 'خطأ',
        description: 'يجب إنتاج السكريپت أولاً',
        variant: 'destructive'
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(protectionScript);
      toast({
        title: 'تم النسخ',
        description: 'تم نسخ السكريپت إلى الحافظة'
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في نسخ السكريپت',
        variant: 'destructive'
      });
    }
  };

  // تحميل السكريپت
  const downloadProtectionScript = () => {
    if (!protectionScript || !shop) {
      toast({
        title: 'خطأ',
        description: 'يجب إنتاج السكريپت أولاً',
        variant: 'destructive'
      });
      return;
    }

    const blob = new Blob([protectionScript], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codform-protection-${shop}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
                <Dialog open={showProtectionDialog} onOpenChange={setShowProtectionDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="default" 
                      size="default"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      إنتاج سكريپت الحماية
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        سكريپت حماية متجر Shopify
                      </DialogTitle>
                      <DialogDescription>
                        قم بإنتاج ونسخ السكريپت لتفعيل الحماية على متجر {shop}
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      {!protectionScript ? (
                        <div className="text-center py-8">
                          <Code className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-lg font-medium mb-2">إنتاج سكريپت الحماية</p>
                          <p className="text-sm text-muted-foreground mb-4">
                            سيتم إنتاج سكريپت مخصص لمتجرك يحتوي على نظام الحماية الكامل
                          </p>
                          <Button 
                            onClick={generateProtectionScript}
                            disabled={scriptLoading}
                            size="lg"
                          >
                            {scriptLoading ? 'جاري الإنتاج...' : 'إنتاج السكريپت'}
                            <Code className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-green-800 mb-2">
                              <Shield className="h-4 w-4" />
                              <span className="font-medium">تم إنتاج السكريپت بنجاح!</span>
                            </div>
                            <p className="text-sm text-green-700">
                              يمكنك الآن نسخ السكريپت أدناه ولصقه في ملف theme.liquid في شوبيفاي قبل إغلاق &lt;/head&gt;
                            </p>
                          </div>
                          
                          <div className="flex gap-2 mb-4">
                            <Button onClick={copyProtectionScript} variant="default">
                              <Copy className="h-4 w-4 mr-2" />
                              نسخ السكريپت
                            </Button>
                            <Button onClick={downloadProtectionScript} variant="outline">
                              <Download className="h-4 w-4 mr-2" />
                              تحميل كملف
                            </Button>
                          </div>
                          
                          <div className="border rounded-lg">
                            <div className="bg-muted px-3 py-2 border-b">
                              <span className="text-sm font-medium">سكريپت الحماية - اللصق في theme.liquid</span>
                            </div>
                            <Textarea
                              value={protectionScript}
                              readOnly
                              rows={15}
                              className="font-mono text-xs border-0 rounded-t-none resize-none"
                            />
                          </div>
                          
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h4 className="font-medium text-yellow-800 mb-2">خطوات التطبيق:</h4>
                            <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700">
                              <li>انسخ السكريپت أعلاه</li>
                              <li>اذهب إلى إعدادات الثيم في شوبيفاي</li>
                              <li>افتح ملف theme.liquid للتحرير</li>
                              <li>الصق السكريپت قبل إغلاق &lt;/head&gt;</li>
                              <li>احفظ التغييرات</li>
                            </ol>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => {
                        setShowProtectionDialog(false);
                        setProtectionScript('');
                      }}>
                        إغلاق
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
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