import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import SettingsLayout from "@/components/layout/SettingsLayout";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";

const GeneralSettings = () => {
  const { t } = useI18n();
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [paymentStatusEnabled, setPaymentStatusEnabled] = useState(true);
  const [dailyOrderLimit, setDailyOrderLimit] = useState(5);
  const [dailyOrderLimitEnabled, setDailyOrderLimitEnabled] = useState(true);
  const [outOfStockMessage, setOutOfStockMessage] = useState("Sorry, this product is currently out of stock / عذراً، هذا المنتج غير متوفر حالياً");
  const [outOfStockMessageEnabled, setOutOfStockMessageEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  // Load settings from database
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Get current user's shop settings
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from('order_settings')
        .select('*')
        .eq('user_id', userData.user.id)
        .limit(1)
        .single();

      if (data && !error) {
        setPaymentStatus(data.payment_status || "pending");
        setPaymentStatusEnabled(data.payment_status_enabled !== false);
        setDailyOrderLimit(data.daily_order_limit || 5);
        setDailyOrderLimitEnabled(data.daily_order_limit_enabled !== false);
        setOutOfStockMessage(data.out_of_stock_message || "Sorry, this product is currently out of stock / عذراً، هذا المنتج غير متوفر حالياً");
        setOutOfStockMessageEnabled(data.out_of_stock_message_enabled !== false);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        alert('يجب تسجيل الدخول أولاً');
        return;
      }

      const settings = {
        user_id: userData.user.id,
        payment_status: paymentStatus,
        payment_status_enabled: paymentStatusEnabled,
        daily_order_limit: dailyOrderLimit,
        daily_order_limit_enabled: dailyOrderLimitEnabled,
        out_of_stock_message: outOfStockMessage,
        out_of_stock_message_enabled: outOfStockMessageEnabled,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('order_settings')
        .upsert(settings, { onConflict: 'user_id' });

      if (error) {
        console.error('Error saving settings:', error);
        alert('خطأ في حفظ الإعدادات: ' + error.message);
      } else {
        alert('تم حفظ الإعدادات بنجاح');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('خطأ غير متوقع: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">الإعدادات العامة</h1>
            <p className="text-muted-foreground">إدارة إعدادات إنشاء الطلبات</p>
          </div>
          <Button onClick={handleSave} disabled={loading} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </Button>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>إدارة إعدادات إنشاء الطلب</CardTitle>
              <CardDescription>تخصيص إعدادات الطلبات والرسائل</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment Status Settings */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="payment-status-enabled"
                    checked={paymentStatusEnabled}
                    onCheckedChange={setPaymentStatusEnabled}
                  />
                  <Label htmlFor="payment-status-enabled" className="font-medium">تفعيل حالة الدفع للطلب</Label>
                </div>

                {paymentStatusEnabled && (
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="payment-status">حالة الدفع الافتراضية</Label>
                    <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر حالة الدفع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">مدفوع / Paid</SelectItem>
                        <SelectItem value="pending">قيد الانتظار / Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Daily Order Limit Settings */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="daily-limit-enabled"
                    checked={dailyOrderLimitEnabled}
                    onCheckedChange={setDailyOrderLimitEnabled}
                  />
                  <Label htmlFor="daily-limit-enabled" className="font-medium">تحديد طلبات يومية لكل زائر</Label>
                </div>

                {dailyOrderLimitEnabled && (
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="daily-limit">عدد الطلبات المسموحة يومياً لكل زائر</Label>
                    <Input
                      id="daily-limit"
                      type="number"
                      min="1"
                      max="100"
                      value={dailyOrderLimit}
                      onChange={(e) => setDailyOrderLimit(parseInt(e.target.value) || 5)}
                      className="w-32"
                    />
                  </div>
                )}
              </div>

              {/* Out of Stock Message Settings */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="out-of-stock-enabled"
                    checked={outOfStockMessageEnabled}
                    onCheckedChange={setOutOfStockMessageEnabled}
                  />
                  <Label htmlFor="out-of-stock-enabled" className="font-medium">تفعيل رسالة نفاد المخزون</Label>
                </div>

                {outOfStockMessageEnabled && (
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="out-of-stock-message">رسالة نفاد المخزون</Label>
                    <Textarea
                      id="out-of-stock-message"
                      placeholder="عذراً، هذا المنتج غير متوفر حالياً / Sorry, this product is currently out of stock"
                      value={outOfStockMessage}
                      onChange={(e) => setOutOfStockMessage(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </SettingsLayout>
  );
};

export default GeneralSettings;