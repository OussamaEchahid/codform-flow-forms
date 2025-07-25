import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, User, Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useSimpleShopify } from '@/hooks/useSimpleShopify';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [userMetadata, setUserMetadata] = useState<any>(null);
  const [shopEmail, setShopEmail] = useState<string>('');
  const [shopEmailLoading, setShopEmailLoading] = useState(true);
  const { activeStore, isConnected } = useSimpleShopify();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Error getting user:', error);
          navigate('/login');
          return;
        }
        
        if (!currentUser) {
          navigate('/login');
          return;
        }

        setUser(currentUser);
        setUserMetadata(currentUser.user_metadata || {});
      } catch (error) {
        console.error('Error:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [navigate]);

  // جلب بيانات المتجر من Shopify API
  useEffect(() => {
    const fetchShopData = async () => {
      if (!isConnected || !activeStore) {
        setShopEmailLoading(false);
        return;
      }

      setShopEmailLoading(true);
      try {
        // جلب بيانات المتجر من قاعدة البيانات المحلية
        const { data: shopData } = await supabase
          .from('shopify_stores')
          .select('access_token')
          .eq('shop', activeStore)
          .single();

        if (shopData?.access_token && shopData?.access_token !== 'placeholder_token') {
          // جلب بيانات المتجر من Shopify API
          const response = await fetch(`https://trlklwixfeaexhydzaue.supabase.co/functions/v1/shopify-products`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            },
            body: JSON.stringify({
              shop: activeStore,
              endpoint: 'shop.json'
            })
          });

          if (response.ok) {
            const result = await response.json();
            if (result.shop?.email) {
              setShopEmail(result.shop.email);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching shop data:', error);
      } finally {
        setShopEmailLoading(false);
      }
    };

    fetchShopData();
  }, [isConnected, activeStore]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (newPassword !== confirmPassword) {
      setError('كلمات المرور الجديدة غير متطابقة');
      return;
    }

    if (newPassword.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      setError('كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم على الأقل');
      return;
    }

    setUpdateLoading(true);

    try {
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      // Update user metadata to remove temp_password flag
      if (userMetadata?.temp_password) {
        const { error: metadataError } = await supabase.auth.updateUser({
          data: {
            ...userMetadata,
            temp_password: false,
            password_updated_at: new Date().toISOString()
          }
        });

        if (metadataError) {
          console.error('Failed to update metadata:', metadataError);
        }
      }

      toast.success('تم تغيير كلمة المرور بنجاح');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (error: any) {
      console.error('Password update error:', error);
      setError(error.message || 'حدث خطأ أثناء تغيير كلمة المرور');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            العودة إلى لوحة التحكم
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6" />
            الملف الشخصي
          </h1>
        </div>

        <div className="space-y-6">
          {/* User Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                معلومات الحساب
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">البريد الإلكتروني للمتجر</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={shopEmailLoading ? 'جاري تحميل بيانات المتجر...' : (shopEmail || 'لم يتم جلب البريد الإلكتروني')}
                    disabled
                    className="bg-muted"
                  />
                  {shopEmailLoading && (
                    <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
                  )}
                </div>
                {!shopEmailLoading && !shopEmail && isConnected && (
                  <p className="text-sm text-muted-foreground mt-1">
                    لم يتم العثور على بريد إلكتروني مرتبط بالمتجر {activeStore}
                  </p>
                )}
                {!isConnected && (
                  <p className="text-sm text-muted-foreground mt-1">
                    يرجى ربط متجر Shopify لعرض البريد الإلكتروني
                  </p>
                )}
              </div>
              
              {isConnected && activeStore && (
                <div>
                  <Label>المتجر المتصل</Label>
                  <Input
                    type="text"
                    value={activeStore}
                    disabled
                    className="bg-muted"
                  />
                </div>
              )}
              
              {userMetadata?.created_via === 'shopify_auto' && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    تم إنشاء هذا الحساب تلقائياً عند ربط متجر Shopify الخاص بك
                  </p>
                </div>
              )}

              {userMetadata?.temp_password && (
                <Alert>
                  <AlertDescription>
                    يُنصح بتغيير كلمة المرور الخاصة بك لضمان أمان الحساب
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Password Change Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                تغيير كلمة المرور
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور الجديدة"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="أعد إدخال كلمة المرور الجديدة"
                    required
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="text-sm text-muted-foreground">
                  <p>متطلبات كلمة المرور:</p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>8 أحرف على الأقل</li>
                    <li>حرف كبير وحرف صغير</li>
                    <li>رقم واحد على الأقل</li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  disabled={updateLoading || !newPassword || !confirmPassword}
                  className="w-full"
                >
                  {updateLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      جاري التحديث...
                    </>
                  ) : (
                    'تغيير كلمة المرور'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Sign Out Section */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">تسجيل الخروج</h3>
                  <p className="text-sm text-muted-foreground">
                    تسجيل الخروج من جميع الأجهزة
                  </p>
                </div>
                <Button variant="outline" onClick={handleSignOut}>
                  تسجيل الخروج
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;