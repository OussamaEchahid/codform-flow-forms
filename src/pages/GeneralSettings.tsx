import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save, Plus, Trash2 } from "lucide-react";
import SettingsLayout from "@/components/layout/SettingsLayout";

interface ShippingRate {
  id: number;
  minAmount: number;
  maxAmount: number;
  cost: number;
}

const GeneralSettings = () => {
  const [showShopifyButton, setShowShopifyButton] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [dailyOrderLimit, setDailyOrderLimit] = useState(5);
  const [outOfStockMessage, setOutOfStockMessage] = useState("");
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([
    { id: 1, minAmount: 0, maxAmount: 100, cost: 15 },
    { id: 2, minAmount: 101, maxAmount: 500, cost: 10 },
  ]);

  const [newRate, setNewRate] = useState({ minAmount: "", maxAmount: "", cost: "" });

  const addShippingRate = () => {
    if (newRate.minAmount && newRate.maxAmount && newRate.cost) {
      const rate: ShippingRate = {
        id: Date.now(),
        minAmount: parseFloat(newRate.minAmount),
        maxAmount: parseFloat(newRate.maxAmount),
        cost: parseFloat(newRate.cost),
      };
      setShippingRates([...shippingRates, rate]);
      setNewRate({ minAmount: "", maxAmount: "", cost: "" });
    }
  };

  const removeShippingRate = (id: number) => {
    setShippingRates(shippingRates.filter(rate => rate.id !== id));
  };

  const handleSave = () => {
    console.log("Saving general settings...");
  };

  return (
    <SettingsLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">الإعدادات العامة</h1>
          <p className="text-muted-foreground">إدارة الإعدادات العامة للتطبيق</p>
        </div>
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          حفظ الإعدادات
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>إعدادات Shopify</CardTitle>
            <CardDescription>تخصيص التكامل مع Shopify</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="shopify-button" 
                checked={showShopifyButton} 
                onCheckedChange={setShowShopifyButton}
              />
              <Label htmlFor="shopify-button">إظهار زر الشراء عبر Shopify</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>إعدادات الطلبات</CardTitle>
            <CardDescription>تخصيص سلوك الطلبات</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment-status">حالة دفع الطلب</Label>
              <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر حالة الدفع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">مدفوع</SelectItem>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="daily-limit">الحد الأقصى للطلبات اليومية لكل زائر</Label>
              <Input
                id="daily-limit"
                type="number"
                min="1"
                value={dailyOrderLimit}
                onChange={(e) => setDailyOrderLimit(parseInt(e.target.value) || 5)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="out-of-stock-message">رسالة عند نفاد المخزون</Label>
              <Textarea
                id="out-of-stock-message"
                placeholder="عذراً، هذا المنتج غير متوفر حالياً"
                value={outOfStockMessage}
                onChange={(e) => setOutOfStockMessage(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الشحن حسب السعر الإجمالي للطلب</CardTitle>
            <CardDescription>إعداد أسعار الشحن حسب نطاقات الأسعار</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min-amount">الحد الأدنى</Label>
                <Input
                  id="min-amount"
                  type="number"
                  placeholder="0"
                  value={newRate.minAmount}
                  onChange={(e) => setNewRate({...newRate, minAmount: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-amount">الحد الأقصى</Label>
                <Input
                  id="max-amount"
                  type="number"
                  placeholder="100"
                  value={newRate.maxAmount}
                  onChange={(e) => setNewRate({...newRate, maxAmount: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shipping-cost">تكلفة الشحن</Label>
                <Input
                  id="shipping-cost"
                  type="number"
                  placeholder="15"
                  value={newRate.cost}
                  onChange={(e) => setNewRate({...newRate, cost: e.target.value})}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={addShippingRate} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة
                </Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الحد الأدنى</TableHead>
                  <TableHead>الحد الأقصى</TableHead>
                  <TableHead>تكلفة الشحن</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shippingRates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell>{rate.minAmount}</TableCell>
                    <TableCell>{rate.maxAmount}</TableCell>
                    <TableCell>{rate.cost}</TableCell>
                    <TableCell>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => removeShippingRate(rate.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      </div>
    </SettingsLayout>
  );
};

export default GeneralSettings;