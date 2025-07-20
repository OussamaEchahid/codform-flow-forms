import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import SettingsLayout from "@/components/layout/SettingsLayout";

const OrderSettings = () => {
  const [postOrderAction, setPostOrderAction] = useState("redirect");
  const [redirectEnabled, setRedirectEnabled] = useState(true);
  const [thankYouPageUrl, setThankYouPageUrl] = useState("");
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMessage, setPopupMessage] = useState("");

  const handleSave = () => {
    // Save functionality will be implemented later
    console.log("Saving order settings...");
  };

  return (
    <SettingsLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إعدادات الطلب</h1>
          <p className="text-muted-foreground">إدارة إعدادات ما بعد إنشاء الطلب</p>
        </div>
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          حفظ الإعدادات
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>الإجراء بعد إنشاء الطلب</CardTitle>
            <CardDescription>اختر ما يحدث بعد إنشاء الطلب بنجاح</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="post-order-action">الإجراء</Label>
              <Select value={postOrderAction} onValueChange={setPostOrderAction}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الإجراء" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="redirect">إعادة التوجيه</SelectItem>
                  <SelectItem value="popup">نافذة منبثقة</SelectItem>
                  <SelectItem value="stay">البقاء في الصفحة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>إعدادات إعادة التوجيه</CardTitle>
            <CardDescription>تخصيص إعادة التوجيه بعد إنشاء الطلب</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="redirect-enabled" 
                checked={redirectEnabled} 
                onCheckedChange={setRedirectEnabled}
              />
              <Label htmlFor="redirect-enabled">تفعيل إعادة التوجيه</Label>
            </div>
            
            {redirectEnabled && (
              <div className="space-y-2">
                <Label htmlFor="thank-you-url">رابط صفحة الشكر</Label>
                <Input
                  id="thank-you-url"
                  type="url"
                  placeholder="https://example.com/thank-you"
                  value={thankYouPageUrl}
                  onChange={(e) => setThankYouPageUrl(e.target.value)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>إعدادات النافذة المنبثقة</CardTitle>
            <CardDescription>تخصيص النافذة المنبثقة التي تظهر بعد إنشاء الطلب</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="popup-title">العنوان</Label>
              <Input
                id="popup-title"
                placeholder="تم إنشاء طلبك بنجاح!"
                value={popupTitle}
                onChange={(e) => setPopupTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="popup-message">الرسالة</Label>
              <Textarea
                id="popup-message"
                placeholder="شكراً لك على طلبك. سنتواصل معك قريباً..."
                value={popupMessage}
                onChange={(e) => setPopupMessage(e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </SettingsLayout>
  );
};

export default OrderSettings;