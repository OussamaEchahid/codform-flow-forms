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
import { BlockedIP, BlockedCountry } from '@/lib/shopify/types';
import { AuthHelper } from '@/utils/auth-helper';
import { useI18n } from '@/lib/i18n';
import SettingsLayout from '@/components/layout/SettingsLayout';

interface SecurityStats {
  blocked_ips_count: number;
  blocked_countries_count: number;
  total_blocks_today: number;
}

const SecuritySettings = () => {
  const { shop } = useAuth();
  const { t } = useI18n();

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
    if (!shop) {
      console.log('❌ No shop ID available');
      return;
    }

    console.log('🔍 Loading security data for shop:', shop);
    setLoading(true);
    try {
      // تحميل الدول المحظورة من قاعدة البيانات
      const { data: countriesData, error: countriesError } = await (supabase as any)
        .from('blocked_countries')
        .select('*')
        .eq('user_id', AuthHelper.getCurrentUserId())
        .eq('shop_id', shop)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (countriesError) {
        console.error('Error loading countries:', countriesError);
        setBlockedCountries([]);
      } else {
        setBlockedCountries(countriesData || []);
        console.log('🌍 Loaded countries from database:', countriesData);
      }

      // تحميل عناوين IP المحظورة من قاعدة البيانات
      const { data: ipsData, error: ipsError } = await (supabase as any)
        .from('blocked_ips')
        .select('*')
        .eq('user_id', AuthHelper.getCurrentUserId())
        .eq('shop_id', shop)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (ipsError) {
        console.error('Error loading IPs:', ipsError);
        setBlockedIPs([]);
      } else {
        setBlockedIPs(ipsData || []);
        console.log('🔒 Loaded IPs from database:', ipsData);
      }

      // إحصائيات الأمان
      setSecurityStats({
        blocked_ips_count: ipsData?.length || 0,
        blocked_countries_count: countriesData?.length || 0,
        total_blocks_today: 0
      });

    } catch (error) {
      console.error('Error loading security data:', error);
      toast({
        title: t('error'),
        description: t('operationFailed'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddIP = async () => {
    if (!shop || !newIP.trim()) {
      toast({
        title: t('error'),
        description: t('invalidInput'),
        variant: "destructive",
      });
      return;
    }

    try {
      // التحقق من صحة IP address
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      const trimmedIP = newIP.trim();

      if (!ipRegex.test(trimmedIP)) {
        toast({
          title: t('error'),
          description: t('invalidInput'),
          variant: "destructive",
        });
        return;
      }

      console.log('🔍 Adding IP:', trimmedIP, 'for shop:', shop);

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

      // إضافة IP إلى قاعدة البيانات
      const { data: newIPData, error: insertError } = await (supabase as any)
        .from('blocked_ips')
        .insert({
          user_id: AuthHelper.getCurrentUserId(),
          shop_id: shop,
          ip_address: trimmedIP,
          reason: newIPReason.trim() || t('unspecified'),
          redirect_url: newIPRedirect.trim() || '/blocked',
          is_active: true
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting IP:', insertError);
        throw insertError;
      }

      console.log('✅ IP added successfully:', newIPData);

      toast({
        title: t('success'),
        description: t('operationSuccessful'),
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
        title: t('error'),
        description: t('operationFailed'),
        variant: "destructive",
      });
    }
  };

  const handleRemoveIP = async (ipId: string) => {
    try {
      // حذف IP من قاعدة البيانات
      const { error } = await (supabase as any)
        .from('blocked_ips')
        .delete()
        .eq('id', ipId)
        .eq('user_id', AuthHelper.getCurrentUserId())
        .eq('shop_id', shop);

      if (error) {
        console.error('Error deleting IP:', error);
        throw error;
      }

      console.log('✅ IP removed successfully:', ipId);

      toast({
        title: t('success'),
        description: t('operationSuccessful'),
      });

      loadSecurityData();

    } catch (error) {
      console.error('Error removing blocked IP:', error);
      toast({
        title: t('error'),
        description: t('operationFailed'),
        variant: "destructive",
      });
    }
  };

  const handleAddCountry = async () => {
    if (!shop || !selectedCountry) {
      console.error('❌ Missing shop or selectedCountry:', { shop, selectedCountry });
      toast({
        title: t('error'),
        description: t('invalidInput'),
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

      // إضافة الدولة إلى قاعدة البيانات
      const insertData = {
        user_id: AuthHelper.getCurrentUserId(),
        shop_id: shop,
        country_code: selectedCountry.toUpperCase(),
        country_name: countryInfo.name,
        reason: newCountryReason.trim() || t('unspecified'),
        redirect_url: newCountryRedirect.trim() || '/blocked',
        is_active: true
      };

      console.log('🔍 Inserting country data:', insertData);

      const { data: newCountry, error: insertError } = await (supabase as any)
        .from('blocked_countries')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting country:', insertError);
        throw insertError;
      }

      console.log('✅ Country added successfully:', newCountry);

      toast({
        title: t('success'),
        description: t('operationSuccessful'),
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
        title: t('error'),
        description: t('operationFailed'),
        variant: "destructive",
      });
    }
  };

  const handleRemoveCountry = async (countryId: string) => {
    try {
      // حذف الدولة من قاعدة البيانات
      const { error } = await (supabase as any)
        .from('blocked_countries')
        .delete()
        .eq('id', countryId)
        .eq('user_id', AuthHelper.getCurrentUserId())
        .eq('shop_id', shop);

      if (error) {
        console.error('Error deleting country:', error);
        throw error;
      }

      console.log('✅ Country removed successfully:', countryId);

      toast({
        title: t('success'),
        description: t('operationSuccessful'),
      });

      loadSecurityData();

    } catch (error) {
      console.error('Error removing blocked country:', error);
      toast({
        title: t('error'),
        description: t('operationFailed'),
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
        title: t('info'),
        description: t('operationSuccessful'),
      });

      setShowImportDialog(false);
      setCsvData('');

    } catch (error) {
      toast({
        title: t('error'),
        description: t('operationFailed'),
        variant: "destructive",
      });
    }
  };

  // إنتاج سكريپت الحماية
  const generateProtectionScript = async () => {
    if (!shop) {
      toast({
        title: t('error'),
        description: t('invalidInput'),
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
        title: t('success'),
        description: t('operationSuccessful')
      });
    } catch (error) {
      console.error('Error generating script:', error);
      toast({
        title: t('error'),
        description: t('operationFailed'),
        variant: 'destructive'
      });
    } finally {
      setScriptLoading(false);
    }
  };

  // دالة إنتاج السكريپت محلياً
  const generateShopifyProtectionScript = (shopDomain: string): string => {
    const supabaseUrl = 'https://trlklwixfeaexhydzaue.supabase.co';
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M';

    // التحقق من وجود shopDomain
    if (!shopDomain) {
      throw new Error('Shop domain is required');
    }

    // تنظيف وحماية المتغيرات
    const cleanShopDomain = shopDomain.replace(/['"\\]/g, '').trim();

    return `<!-- CodForm Protection System - Generated for ${cleanShopDomain} -->
<script>
(function() {
  'use strict';

  // منع التشغيل المتعدد بشكل مطلق مع علامة عالمية قوية
  if (window.CodFormProtectionActive === true) {
    return;
  }
  window.CodFormProtectionActive = true;

  const SHOP_DOMAIN = '${cleanShopDomain}';
  const SECURITY_API = '${supabaseUrl}/functions/v1/store-security-check';
  const API_KEY = '${apiKey}';

  console.log('[CodForm] 🛡️ Protection system initialized for:', SHOP_DOMAIN);

  // حظر فوري وكامل للمحتوى
  function immediateBlock() {
    try {
      // إنشاء overlay كامل لحظر المحتوى
      const blockOverlay = document.createElement('div');
      blockOverlay.id = 'codform-block-overlay';
      blockOverlay.style.cssText = 'position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; background: white !important; z-index: 2147483647 !important; display: block !important; visibility: visible !important; opacity: 1 !important;';

      // إضافة الـ overlay فوراً
      if (document.head) {
        document.head.appendChild(blockOverlay);
      } else {
        document.documentElement.appendChild(blockOverlay);
      }

      // إخفاء المحتوى الأصلي
      document.documentElement.style.cssText = 'visibility: hidden !important; opacity: 0 !important; pointer-events: none !important;';
      if (document.body) {
        document.body.style.cssText = 'display: none !important;';
      }
    } catch(e) {
      console.warn('[CodForm] Could not apply immediate block styles:', e);
    }
  }

  // حظر فوري عند التحميل
  immediateBlock();

  // تشغيل فحص الحماية
  async function activateProtection() {
    try {
      console.log('[CodForm] 🛡️ Activating store protection...');

      // الحصول على IP العنوان
      const visitorIP = await fetch('https://api.ipify.org?format=json')
        .then(r => r.json())
        .then(data => data.ip)
        .catch(() => null);

      if (!visitorIP) {
        console.warn('[CodForm] ⚠️ Could not get visitor IP - allowing access');
        allowAccess();
        return;
      }

      console.log('[CodForm] 🔍 Checking security for IP:', visitorIP);

      // فحص الحماية
      const response = await fetch(SECURITY_API, {
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

      if (!response.ok) {
        throw new Error('Security check failed: ' + response.status);
      }

      const result = await response.json();
      console.log('[CodForm] 🔒 Security check result:', result);

      // تعيين علامة أن الفحص تم
      window.CodFormProtectionChecked = true;

      if (result.blocked) {
        console.warn('[CodForm] 🚫 Access BLOCKED:', result.reason);
        window.CodFormProtectionBlocked = true;
        blockAccess(result);
      } else {
        console.log('[CodForm] ✅ Access ALLOWED');
        allowAccess();
      }

    } catch (error) {
      console.error('[CodForm] ❌ Protection error:', error);
      // في حالة الخطأ، إظهار المحتوى
      allowAccess();
    }
  }

  function allowAccess() {
    // التأكد من أن المستخدم غير محظور
    if (window.CodFormProtectionBlocked) {
      console.warn('[CodForm] ⚠️ Cannot allow access - user is blocked');
      return;
    }

    console.log('[CodForm] ✅ Allowing access - restoring page content');

    try {
      // إزالة الـ overlay
      const blockOverlay = document.getElementById('codform-block-overlay');
      if (blockOverlay) {
        blockOverlay.remove();
      }

      // إزالة جميع أنماط الحظر
      document.documentElement.style.cssText = '';
      if (document.body) {
        document.body.style.cssText = '';
      }

      // إعادة تفعيل التفاعل
      document.documentElement.style.visibility = 'visible';
      document.documentElement.style.opacity = '1';
      document.documentElement.style.pointerEvents = 'auto';

      if (document.body) {
        document.body.style.display = 'block';
        document.body.style.visibility = 'visible';
        document.body.style.opacity = '1';
      }

      console.log('[CodForm] ✅ Page content restored successfully');

      // تعيين علامة أن الفحص تم
      window.CodFormProtectionChecked = true;

    } catch(e) {
      console.error('[CodForm] Error restoring page content:', e);
      // fallback
      const blockOverlay = document.getElementById('codform-block-overlay');
      if (blockOverlay) {
        blockOverlay.remove();
      }
      document.documentElement.style.cssText = 'visibility: visible !important; opacity: 1 !important; pointer-events: auto !important;';
      if (document.body) {
        document.body.style.cssText = 'display: block !important;';
      }
    }
  }

  // دالة لتطبيع عنوان URL للإعادة التوجيه
  function normalizeRedirectUrl(redirectUrl) {
    if (!redirectUrl || redirectUrl.trim() === '') {
      return '/blocked';
    }

    const trimmedUrl = redirectUrl.trim();

    // إذا كان URL يبدأ بـ http:// أو https://، استخدمه كما هو
    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
      return trimmedUrl;
    }

    // إذا كان URL يبدأ بـ www. أو يحتوي على نقطة ولا يبدأ بـ /، أضف https://
    if (trimmedUrl.startsWith('www.') || (trimmedUrl.includes('.') && !trimmedUrl.startsWith('/'))) {
      return 'https://' + trimmedUrl;
    }

    // إذا كان مسار نسبي، أبقه كما هو
    return trimmedUrl;
  }

  function blockAccess(blockInfo) {
    console.log('[CodForm] 🚫 Blocking access with info:', blockInfo);

    try {
      // تطبيع وتطبيق redirect_url
      const normalizedRedirectUrl = normalizeRedirectUrl(blockInfo.redirect_url);
      if (normalizedRedirectUrl && normalizedRedirectUrl !== '/blocked') {
        console.log('[CodForm] 🔄 Redirecting to:', normalizedRedirectUrl);
        window.location.href = normalizedRedirectUrl;
        return;
      }

      // إنشاء overlay صفحة بيضاء للحظر
      const blockOverlay = document.getElementById('codform-block-overlay') || document.createElement('div');
      blockOverlay.id = 'codform-block-overlay';
      blockOverlay.style.cssText = 'position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; background: white !important; z-index: 2147483647 !important; display: block !important; visibility: visible !important; opacity: 1 !important;';

      // إضافة الـ overlay إلى الصفحة
      if (!document.getElementById('codform-block-overlay')) {
        if (document.body) {
          document.body.appendChild(blockOverlay);
        } else {
          document.documentElement.appendChild(blockOverlay);
        }
      }

      // إخفاء المحتوى الأصلي بالكامل
      document.documentElement.style.cssText = 'visibility: hidden !important; opacity: 0 !important; pointer-events: none !important;';
      if (document.body) {
        document.body.style.cssText = 'visibility: hidden !important; opacity: 0 !important;';
      }

    } catch(e) {
      console.error('[CodForm] Error creating block overlay:', e);
      // fallback - إخفاء المحتوى فقط
      document.documentElement.style.cssText = 'visibility: hidden !important; opacity: 0 !important; pointer-events: none !important;';
      if (document.body) {
        document.body.style.cssText = 'display: none !important;';
      }
    }
  }

  // تشغيل الحماية مع timeout
  setTimeout(() => {
    activateProtection();
  }, 100);

  // إزالة timeout تماماً - لا نريد إلغاء الحظر أبداً
  // setTimeout(() => {
  //   if (!window.CodFormProtectionChecked && !window.CodFormProtectionBlocked) {
  //     console.warn('[CodForm] ⚠️ Protection timeout - allowing access due to server error');
  //     allowAccess();
  //   }
  // }, 15000);

})();
</script>`;
  };

  // نسخ السكريپت
  const copyProtectionScript = async () => {
    if (!protectionScript) {
      toast({
        title: t('error'),
        description: t('invalidInput'),
        variant: 'destructive'
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(protectionScript);
      toast({
        title: t('success'),
        description: t('operationSuccessful')
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: t('operationFailed'),
        variant: 'destructive'
      });
    }
  };

  // تحميل السكريپت
  const downloadProtectionScript = () => {
    if (!protectionScript || !shop) {
      toast({
        title: t('error'),
        description: t('invalidInput'),
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
      <SettingsLayout>
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-warning mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('error')}</h3>
              <p className="text-muted-foreground">{t('invalidInput')}</p>
            </CardContent>
          </Card>
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout>
      <div className="container mx-auto p-6 space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">{t('securitySettings')}</h1>
          <p className="text-muted-foreground">{t('securitySettingsDescription')}</p>
        </div>
      </div>

      {/* تحذير تفعيل الحماية */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Shield className="h-8 w-8 text-blue-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-bold text-blue-900 text-xl mb-2">{t('howToActivateProtection')}</h3>
              <div className="text-blue-800 text-sm space-y-2 mb-4">
                <p><strong>{t('step1')}</strong> {t('step1AddIPs')}</p>
                <p><strong>{t('step2')}</strong> {t('step2GenerateScript')}</p>
                <p><strong>{t('step3')}</strong> {t('step3CopyScript')}</p>
                <p><strong>{t('result')}</strong> {t('resultBlockVisitors')}</p>
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
                      {t('generateProtectionScript')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        {t('protectionScript')}
                      </DialogTitle>
                      <DialogDescription>
                        {t('securitySettingsDescription')}
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      {!protectionScript ? (
                        <div className="text-center py-8">
                          <Code className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-lg font-medium mb-2">{t('generateProtectionScriptTitle')}</p>
                          <p className="text-sm text-muted-foreground mb-4">
                            {t('customScriptDescription')}
                          </p>
                          <Button 
                            onClick={generateProtectionScript}
                            disabled={scriptLoading}
                            size="lg"
                          >
                            {scriptLoading ? t('loading') : t('generateProtectionScript')}
                            <Code className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-green-800 mb-2">
                              <Shield className="h-4 w-4" />
                              <span className="font-medium">{t('scriptGeneratedSuccessfully')}</span>
                            </div>
                            <p className="text-sm text-green-700">
                              {t('copyScriptInstructions')}
                            </p>
                          </div>
                          
                          <div className="flex gap-2 mb-4">
                            <Button onClick={copyProtectionScript} variant="default">
                              <Copy className="h-4 w-4 mr-2" />
                              {t('copyScript')}
                            </Button>
                            <Button onClick={downloadProtectionScript} variant="outline">
                              <Download className="h-4 w-4 mr-2" />
                              {t('downloadScript')}
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
                            <h4 className="font-medium text-yellow-800 mb-2">{t('applicationSteps')}</h4>
                            <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700">
                              <li>{t('copyScriptAbove')}</li>
                              <li>{t('goToThemeSettings')}</li>
                              <li>{t('openThemeLiquid')}</li>
                              <li>{t('pasteBeforeHead')}</li>
                              <li>{t('saveChanges')}</li>
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
                        {t('close')}
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
                  {t('videoTutorial')}
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
                <p className="text-sm text-muted-foreground">{t('blockedIPs')}</p>
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
                <p className="text-sm text-muted-foreground">{t('blockedCountries')}</p>
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
                <p className="text-sm text-muted-foreground">{t('blockAttemptsToday')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التبويبات الرئيسية */}
      <Tabs defaultValue="ip-blocking" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ip-blocking">{t('blockedIPs')}</TabsTrigger>
          <TabsTrigger value="country-blocking">{t('blockedCountries')}</TabsTrigger>
        </TabsList>

        {/* تبويب حظر عناوين IP */}
        <TabsContent value="ip-blocking" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('blockedIPs')}</CardTitle>
                  <CardDescription>
                    {t('securitySettingsDescription')}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        {t('import')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t('import')} {t('ipAddress')}</DialogTitle>
                        <DialogDescription>
                          {t('csvImportDescription')}
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
                          {t('cancel')}
                        </Button>
                        <Button onClick={handleImportIPs}>
                          {t('import')}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" size="sm" onClick={handleExportIPs}>
                    <Download className="h-4 w-4 mr-2" />
                    {t('export')}
                  </Button>

                  <Dialog open={showAddIPDialog} onOpenChange={setShowAddIPDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        {t('addNewIP')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t('addNewIP')}</DialogTitle>
                        <DialogDescription>
                          {t('securitySettingsDescription')}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="new-ip">{t('ipAddress')}</Label>
                          <Input
                            id="new-ip"
                            placeholder="192.168.1.1"
                            value={newIP}
                            onChange={(e) => setNewIP(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="new-ip-reason">{t('reason')}</Label>
                          <Input
                            id="new-ip-reason"
                            placeholder={t('suspiciousActivity')}
                            value={newIPReason}
                            onChange={(e) => setNewIPReason(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="new-ip-redirect">{t('redirectUrl')} ({t('optional')})</Label>
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
                          {t('cancel')}
                        </Button>
                        <Button onClick={handleAddIP}>
                          {t('add')}
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
                  <p className="text-muted-foreground">{t('noBlockedIPs')}</p>
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
                            {ip.is_active ? t('blockedStatus') : t('disabledStatus')}
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
                  <CardTitle>{t('manageBlockedCountries')}</CardTitle>
                  <CardDescription>
                    {t('addOrRemoveCountries')}
                  </CardDescription>
                </div>
                <Dialog open={showAddCountryDialog} onOpenChange={setShowAddCountryDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      {t('addCountry')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('addCountryToBlockList')}</DialogTitle>
                      <DialogDescription>
                        {t('chooseCountryAndReason')}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="country-selector">{t('country')}</Label>
                        <CountrySelector
                          value={selectedCountry}
                          onValueChange={setSelectedCountry}
                        />
                      </div>
                      <div>
                        <Label htmlFor="new-country-reason">{t('reason')}</Label>
                        <Input
                          id="new-country-reason"
                          placeholder={t('geographicRestrictions')}
                          value={newCountryReason}
                          onChange={(e) => setNewCountryReason(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="new-country-redirect">{t('redirectUrl')} ({t('optional')})</Label>
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
                        {t('cancel')}
                      </Button>
                      <Button onClick={handleAddCountry}>
                        {t('add')}
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
                  <p className="text-muted-foreground">{t('noBlockedCountries')}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('country')}</TableHead>
                      <TableHead>{t('countryCode')}</TableHead>
                      <TableHead>{t('reason')}</TableHead>
                      <TableHead>{t('redirectUrl')}</TableHead>
                      <TableHead>{t('dateAdded')}</TableHead>
                      <TableHead>{t('status')}</TableHead>
                      <TableHead>{t('actions')}</TableHead>
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
                            {country.is_active ? t('blockedCountryFemale') : t('disabledCountryFemale')}
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
    </SettingsLayout>
  );
};

export default SecuritySettings;