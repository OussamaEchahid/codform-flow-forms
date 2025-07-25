import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ShoppingBag } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const ShopifyAccountLink: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [shopDomain, setShopDomain] = useState<string | null>(null);
  const [mode, setMode] = useState<'link' | 'signup'>('link');
  const navigate = useNavigate();

  useEffect(() => {
    // احصل على معلومات المتجر من التخزين المحلي
    const storedShop = localStorage.getItem('shopify_store');
    if (storedShop) {
      setShopDomain(storedShop);
      // اقترح بريد إلكتروني افتراضي بناءً على اسم المتجر
      const suggestedEmail = `admin@${storedShop.replace('.myshopify.com', '')}.com`;
      setEmail(suggestedEmail);
    } else {
      // إذا لم يكن هناك متجر، ارجع للصفحة الرئيسية
      navigate('/');
    }
  }, [navigate]);

  const handleLinkExistingAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // تسجيل الدخول بالحساب الموجود
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError('بيانات تسجيل الدخول غير صحيحة. جرب إنشاء حساب جديد بدلاً من ذلك.');
        return;
      }

      if (data.user && shopDomain) {
        // ربط المتجر بالحساب الموجود
        await linkStoreToUser(data.user.id, shopDomain, email);
        
        toast({
          title: "تم ربط الحساب بنجاح",
          description: `تم ربط متجر ${shopDomain} بحسابك الموجود`,
        });
        
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('خطأ في ربط الحساب:', error);
      setError('حدث خطأ غير متوقع. حاول مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            shopify_shop: shopDomain,
            created_for_shop: true
          }
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          setError('يوجد حساب بهذا البريد الإلكتروني. جرب ربط الحساب الموجود بدلاً من ذلك.');
          setMode('link');
        } else {
          setError(error.message);
        }
        return;
      }

      if (data.user && shopDomain) {
        // ربط المتجر بالحساب الجديد
        await linkStoreToUser(data.user.id, shopDomain, email);
        
        if (data.user.email_confirmed_at) {
          toast({
            title: "تم إنشاء الحساب بنجاح",
            description: `تم ربط متجر ${shopDomain} بحسابك الجديد`,
          });
          navigate('/dashboard');
        } else {
          toast({
            title: "تحقق من بريدك الإلكتروني",
            description: "تم إرسال رابط التفعيل. تحقق من بريدك الإلكتروني لتفعيل الحساب.",
          });
        }
      }
    } catch (error: any) {
      console.error('خطأ في إنشاء الحساب:', error);
      setError('حدث خطأ غير متوقع. حاول مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  const linkStoreToUser = async (userId: string, shop: string, userEmail: string) => {
    try {
      const response = await supabase.functions.invoke('link-store-to-user', {
        body: { 
          shop, 
          user_id: userId, 
          email: userEmail 
        }
      });

      if (response.error) {
        console.error('خطأ في ربط المتجر:', response.error);
      } else {
        console.log('✅ تم ربط المتجر بالمستخدم بنجاح');
      }
    } catch (error) {
      console.error('خطأ في استدعاء دالة ربط المتجر:', error);
    }
  };

  if (!shopDomain) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <ShoppingBag className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle>ربط متجر Shopify</CardTitle>
          <CardDescription>
            تم اكتشاف متجر: <strong>{shopDomain}</strong>
            <br />
            يرجى ربط المتجر بحسابك لمتابعة استخدام التطبيق
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button 
                variant={mode === 'link' ? 'default' : 'outline'}
                onClick={() => setMode('link')}
                className="flex-1"
                size="sm"
              >
                ربط حساب موجود
              </Button>
              <Button 
                variant={mode === 'signup' ? 'default' : 'outline'}
                onClick={() => setMode('signup')}
                className="flex-1"
                size="sm"
              >
                إنشاء حساب جديد
              </Button>
            </div>

            <form onSubmit={mode === 'link' ? handleLinkExistingAccount : handleCreateNewAccount} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  dir="ltr"
                />
                {mode === 'signup' && (
                  <p className="text-sm text-muted-foreground">
                    يجب أن تكون 8 أحرف على الأقل مع أحرف كبيرة وصغيرة وأرقام
                  </p>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري المعالجة...
                  </>
                ) : (
                  mode === 'link' ? 'ربط الحساب الموجود' : 'إنشاء حساب جديد'
                )}
              </Button>
            </form>

            <div className="text-center">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/')}
                className="text-sm"
              >
                العودة للصفحة الرئيسية
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShopifyAccountLink;