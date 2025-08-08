import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useI18n } from '@/lib/i18n';
import { 
  RotateCcw, 
  Save, 
  Package, 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  Truck,
  Calculator
} from 'lucide-react';

interface OrderDetailsDialogProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (order: any) => void;
}

const OrderDetailsDialog: React.FC<OrderDetailsDialogProps> = ({
  order,
  isOpen,
  onClose,
  onSave
}) => {
  const { language } = useI18n();

  if (!order) return null;

  const handleSave = () => {
    // Handle save logic here
    if (onSave) {
      onSave(order);
    }
    onClose();
  };

  const handleReset = () => {
    // Handle reset logic here
    console.log('Reset order details');
  };

  // Parse items if it's a string
  const orderItems = typeof order.items === 'string' 
    ? JSON.parse(order.items || '[]') 
    : (Array.isArray(order.items) ? order.items : []);

  // Parse addresses if they're strings
  const shippingAddress = typeof order.shipping_address === 'string'
    ? JSON.parse(order.shipping_address || '{}')
    : (order.shipping_address || {});

  const billingAddress = typeof order.billing_address === 'string'
    ? JSON.parse(order.billing_address || '{}')
    : (order.billing_address || {});

  // Calculate totals
  const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingCost = 0; // Add shipping cost calculation here
  const extras = 0; // Add extras calculation here
  const total = order.total_amount || subtotal + shippingCost + extras;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-xl font-semibold">
                {language === 'ar' ? 'تفاصيل الطلب' : 'Order Details'}
              </DialogTitle>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <div className="grid grid-cols-3 gap-4 text-right">
                <div>
                  <span className="font-medium">{language === 'ar' ? 'رقم الطلب' : 'Order ID'}</span>
                  <div className="font-mono text-lg">#{order.order_number || order.id}</div>
                </div>
                <div>
                  <span className="font-medium">{language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}</span>
                  <div className="text-lg">
                    {new Date(order.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')} {' '}
                    {new Date(order.created_at).toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div>
                  <span className="font-medium">IP</span>
                  <div className="text-lg">196.65.252.43</div>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Customer Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5" />
                {language === 'ar' ? 'معلومات العميل' : 'Customer Info'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium">{language === 'ar' ? 'الاسم' : 'Name'}</Label>
                  <Input 
                    value={order.customer_name || ''} 
                    className="mt-1"
                    readOnly
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">{language === 'ar' ? 'الهاتف' : 'Phone'}</Label>
                  <Input 
                    value={order.customer_phone || ''} 
                    className="mt-1"
                    readOnly
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">{language === 'ar' ? 'المدينة' : 'City'}</Label>
                  <Input 
                    value={shippingAddress.city || ''} 
                    className="mt-1"
                    readOnly
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">{language === 'ar' ? 'البلد' : 'Country'}</Label>
                  <Input 
                    value={shippingAddress.country || ''} 
                    className="mt-1"
                    readOnly
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">{language === 'ar' ? 'العنوان' : 'Address'}</Label>
                  <Input 
                    value={`${shippingAddress.address1 || ''} ${shippingAddress.address2 || ''}`.trim() || ''}
                    className="mt-1"
                    readOnly
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">{language === 'ar' ? 'الإيميل' : 'Email'}</Label>
                  <Input 
                    value={order.customer_email || ''} 
                    className="mt-1"
                    readOnly
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">{language === 'ar' ? 'الحالة' : 'Status'}</Label>
                  <Select defaultValue={order.status}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</SelectItem>
                      <SelectItem value="processing">{language === 'ar' ? 'قيد المعالجة' : 'Processing'}</SelectItem>
                      <SelectItem value="delivered">{language === 'ar' ? 'تم التوصيل' : 'Delivered'}</SelectItem>
                      <SelectItem value="cancelled">{language === 'ar' ? 'ملغي' : 'Cancelled'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Truck className="h-5 w-5" />
                {language === 'ar' ? 'معلومات الشحن' : 'Shipping'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">{language === 'ar' ? 'اسم الشحن' : 'Shipping Name'}</Label>
                  <Input 
                    value="Free shipping" 
                    className="mt-1"
                    readOnly
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">{language === 'ar' ? 'السعر' : 'Price'}</Label>
                  <div className="flex items-center mt-1">
                    <div className="w-8 h-6 bg-blue-500 rounded-sm mr-2"></div>
                    <span className="text-sm">{shippingCost} {order.currency || 'SAR'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5" />
                {language === 'ar' ? 'معلومات المنتج' : 'Product Info'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orderItems.length > 0 ? (
                <div className="space-y-4">
                  {orderItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.title || item.name} 
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="w-8 h-8 text-white" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.title || item.name || 'Product'}</h4>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-8 text-center">
                        <div>
                          <div className="text-sm text-muted-foreground">{language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}</div>
                          <div className="font-medium">{item.price || 0} {order.currency || 'SAR'}</div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-muted-foreground">{language === 'ar' ? 'الكمية' : 'Quantity'}</div>
                          <div className="font-medium">{item.quantity || 1}</div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-muted-foreground">{language === 'ar' ? 'المجموع' : 'Total'}</div>
                          <div className="font-medium">{(item.price || 0) * (item.quantity || 1)} {order.currency || 'SAR'}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {language === 'ar' ? 'لا توجد منتجات' : 'No products found'}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {language === 'ar' ? 'ملاحظة' : 'Note'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder={language === 'ar' ? 'اكتب ملاحظتك هنا' : 'Write your note here'}
                className="min-h-[100px]"
                defaultValue=""
              />
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">{language === 'ar' ? 'المنتجات' : 'Products'}</span>
                  <span className="font-medium">{subtotal.toFixed(2)} {order.currency || 'SAR'}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">{language === 'ar' ? 'إضافي' : 'Extra'}</span>
                  <span className="font-medium">{extras} {order.currency || 'SAR'}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">{language === 'ar' ? 'الشحن' : 'Shipping'}</span>
                  <span className="font-medium">{shippingCost} {order.currency || 'SAR'}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{language === 'ar' ? 'المجموع' : 'Total'}</span>
                  <span className="font-bold text-lg">{total.toFixed(2)} {order.currency || 'SAR'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={handleReset}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              {language === 'ar' ? 'إعادة تعيين' : 'Reset'}
            </Button>
            
            <Button 
              onClick={handleSave}
              className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {language === 'ar' ? 'حفظ' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;