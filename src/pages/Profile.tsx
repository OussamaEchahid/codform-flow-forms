import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Mail, Key, ShoppingBag, Calendar } from 'lucide-react';
import { useAuth } from '@/components/layout/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useShopifyStoreSync } from '@/hooks/useShopifyStoreSync';

const Profile = () => {
  const { user, signOut } = useAuth();
  const { stores, loading: storesLoading } = useShopifyStoreSync();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isAutoCreated = user?.user_metadata?.created_via === 'shopify_auto';
  const hasTemporaryPassword = user?.user_metadata?.temp_password === true;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 6) {
      setError('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    // For auto-created accounts, current password is not required
    if (!isAutoCreated && !currentPassword) {
      setError('يرجى إدخال كلمة المرور الحالية');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        if (error.message.includes('New password should be different')) {
          setError('كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية');
        } else {
          setError('حدث خطأ في تحديث كلمة المرور');
        }
        return;
      }

      // Update user metadata to remove temp password flag
      if (hasTemporaryPassword) {
        await supabase.auth.updateUser({
          data: { 
            ...user?.user_metadata,
            temp_password: false,
            password_updated_at: new Date().toISOString()
          }
        });
      }

      setSuccess('تم تحديث كلمة المرور بنجاح');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      toast({
        title: "تم تحديث كلمة المرور",
        description: "كلمة المرور الخاصة بك تم تحديثها بنجاح",
      });

    } catch (error) {
      setError('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <User className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">الملف الشخصي</h1>
      </div>

      {/* معلومات الحساب */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            معلومات الحساب
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label>البريد الإلكتروني</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input value={user.email || ''} disabled className="bg-muted" />
                {isAutoCreated && (
                  <Badge variant="secondary" className="whitespace-nowrap">
                    مرتبط بـ Shopify
                  </Badge>
                )}
              </div>
            </div>
            
            <div>
              <Label>تاريخ إنشاء الحساب</Label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString('ar-SA')}
                </span>
              </div>
            </div>

            {isAutoCreated && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-800 font-medium mb-2">
                  <ShoppingBag className="h-4 w-4" />
                  حساب Shopify
                </div>
                <p className="text-blue-700 text-sm">
                  تم إنشاء هذا الحساب تلقائياً عند الاتصال من متجر Shopify الخاص بك.
                  {hasTemporaryPassword && ' يُنصح بتحديث كلمة المرور لأمان إضافي.'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* المتاجر المرتبطة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            المتاجر المرتبطة
          </CardTitle>
          <CardDescription>
            متاجر Shopify المرتبطة بحسابك
          </CardDescription>
        </CardHeader>
        <CardContent>
          {storesLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>جاري تحميل المتاجر...</span>
            </div>
          ) : stores.length > 0 ? (
            <div className="space-y-3">
              {stores.map((store, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{store.shop}</div>
                    <div className="text-sm text-muted-foreground">
                      آخر تحديث: {new Date(store.updated_at).toLocaleDateString('ar-SA')}
                    </div>
                  </div>
                  <Badge variant={store.is_active ? "default" : "secondary"}>
                    {store.is_active ? 'نشط' : 'غير نشط'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد متاجر مرتبطة</p>
              <p className="text-sm text-muted-foreground mt-2">
                قم بالاتصال من داخل متجر Shopify الخاص بك لربطه تلقائياً
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* تغيير كلمة المرور */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            تغيير كلمة المرور
          </CardTitle>
          <CardDescription>
            {hasTemporaryPassword 
              ? 'لأمان إضافي، يُنصح بتحديث كلمة المرور المؤقتة'
              : 'قم بتحديث كلمة المرور الخاصة بك'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {!isAutoCreated && (
              <div className="space-y-2">
                <Label htmlFor="current-password">كلمة المرور الحالية</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required={!isAutoCreated}
                  disabled={loading}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">تأكيد كلمة المرور الجديدة</Label>
              <Input
                id="confirm-new-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري التحديث...
                </>
              ) : (
                'تحديث كلمة المرور'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* تسجيل الخروج */}
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">منطقة الخطر</CardTitle>
          <CardDescription>
            تصرفات لا يمكن التراجع عنها
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleSignOut}>
            تسجيل الخروج
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;