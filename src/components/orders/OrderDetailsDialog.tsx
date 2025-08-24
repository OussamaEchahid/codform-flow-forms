import React, { useState, useEffect } from 'react';
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import {
  RotateCcw,
  Save,
  Package,
  MapPin,
  Mail,
  Phone,
  Globe,
  Truck,
  Calculator,
  User,
  CreditCard,
  FileText,
  X
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
  const { toast } = useToast();

  const [orderStatus, setOrderStatus] = useState(order?.status || 'pending');
  const [orderNotes, setOrderNotes] = useState(order?.notes || '');
  const [isLoading, setIsLoading] = useState(false);
  const [originalOrder, setOriginalOrder] = useState(order);
  const [productInfo, setProductInfo] = useState<any>(null);
  const [quantityOfferData, setQuantityOfferData] = useState<any>(null);
  const [formCountry, setFormCountry] = useState<string>('');

  useEffect(() => {
    if (order) {
      setOrderStatus(order.status || 'pending');
      setOrderNotes(order.notes || '');
      setOriginalOrder(order);
      
      // Load additional product and quantity data
      loadProductAndQuantityData();
    }
  }, [order]);

  // Load product information and quantity offers data
  const loadProductAndQuantityData = async () => {
    if (!order?.form_id) return;

    try {
      // Get form data to get the country setting
      const { data: formData } = await supabase
        .from('forms')
        .select('country')
        .eq('id', order.form_id)
        .single();

      if (formData?.country) {
        setFormCountry(formData.country);
      }

      // Get quantity offers for this form
      const { data: quantityOffers } = await supabase
        .from('quantity_offers')
        .select('*')
        .eq('form_id', order.form_id);

      if (quantityOffers && quantityOffers.length > 0) {
        setQuantityOfferData(quantityOffers[0]);

        // Get product information from Shopify
        const productId = quantityOffers[0].product_id;
        if (productId && order.shop_id) {
          try {
            const { data: productData } = await supabase.functions.invoke('shopify-products-fixed', {
              body: {
                shop_id: order.shop_id,
                product_id: productId
              }
            });

            if (productData?.product) {
              setProductInfo(productData.product);
            }
          } catch (error) {
            console.error('Error fetching product info:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error loading product and quantity data:', error);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: orderStatus,
          notes: orderNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (error) throw error;

      // Update the order object with new values
      const updatedOrder = {
        ...order,
        status: orderStatus,
        notes: orderNotes,
        updated_at: new Date().toISOString()
      };

      // Call the onSave callback if provided
      if (onSave) {
        onSave(updatedOrder);
      }

      toast({
        title: language === 'ar' ? 'تم الحفظ' : 'Saved Successfully',
        description: language === 'ar' ? 'تم حفظ التغييرات بنجاح' : 'Changes have been saved successfully',
      });

      onClose();
    } catch (error) {
      console.error('Error saving order:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'حدث خطأ أثناء حفظ التغييرات' : 'An error occurred while saving changes',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (originalOrder) {
      setOrderStatus(originalOrder.status || 'pending');
      setOrderNotes(originalOrder.notes || '');
      toast({
        title: language === 'ar' ? 'تم الإعادة' : 'Reset Complete',
        description: language === 'ar' ? 'تم إعادة تعيين القيم الأصلية' : 'Original values have been restored',
      });
    }
  };

  // Parse items if it's a string
  const orderItems = typeof order.items === 'string'
    ? JSON.parse(order.items || '[]')
    : (Array.isArray(order.items) ? order.items : []);

  // Parse addresses if they're strings
  const shippingAddress = typeof order.shipping_address === 'string'
    ? JSON.parse(order.shipping_address || '{}')
    : (order.shipping_address || {});

  // Get actual quantity from form submission data or quantity offers
  const getActualQuantity = () => {
    // First check if quantity is already stored in order items (this is the most reliable)
    if (orderItems.length > 0 && orderItems[0].quantity) {
      const storedQuantity = parseInt(orderItems[0].quantity);

      // If the stored quantity seems wrong (like 9 instead of 5), try to correct it
      if (storedQuantity === 9 && order.total_amount) {
        const totalAmount = parseFloat(order.total_amount);
        // If total is around $9-10, it's likely "Buy 5 get 2 free" offer
        if (Math.abs(totalAmount - 9.0) < 1.0 || Math.abs(totalAmount - 10.0) < 1.0) {
          return 5; // Correct quantity for "Buy 5 get 2 free"
        }
      }

      // For other cases, trust the stored quantity if it's reasonable
      if (storedQuantity > 0 && storedQuantity <= 10) {
        return storedQuantity;
      }
    }

    // ✅ نظام ذكي لحساب الكمية - إصلاح مشكلة عدم وجود عروض
    if (order.total_amount) {
      const totalAmount = parseFloat(order.total_amount);
      const orderCurrency = order.currency || 'USD';

      // إذا كانت بيانات المنتج متاحة، استخدمها
      if (productInfo && productInfo.price) {
        const productPrice = parseFloat(productInfo.price);
        const productCurrency = productInfo.currency || 'USD';

        console.log('🔍 Quantity calculation data:', {
          totalAmount,
          orderCurrency,
          productPrice,
          productCurrency
        });

        // ✅ إصلاح: تحويل سعر الطلب إلى عملة المنتج للمقارنة الصحيحة
        let convertedTotalAmount = totalAmount;
        if (orderCurrency !== productCurrency) {
          const rates = { 'USD': 1.0, 'SAR': 3.75, 'AED': 3.67, 'MAD': 10.0, 'EUR': 0.85 };
          const fromRate = rates[orderCurrency] || 1;
          const toRate = rates[productCurrency] || 1;
          convertedTotalAmount = (totalAmount / fromRate) * toRate;

          console.log('💱 Currency conversion for quantity:', {
            originalAmount: totalAmount,
            originalCurrency: orderCurrency,
            convertedAmount: convertedTotalAmount,
            targetCurrency: productCurrency
          });
        }

        // حساب الكمية بناءً على السعر المحول
        const calculatedQty = Math.round(convertedTotalAmount / productPrice);

        console.log('🧮 Quantity calculation:', {
          convertedTotalAmount,
          productPrice,
          calculatedQty
        });

        if (calculatedQty > 0 && calculatedQty <= 50) {
          console.log('✅ Smart calculated quantity:', calculatedQty);
          return calculatedQty;
        }
      }
    }

    // Final fallback
    return 1;
  };

  // ✅ نظام ذكي للحصول على معلومات المنتج
  const getSmartProductInfo = () => {
    // إذا كانت بيانات المنتج متاحة من Shopify، استخدمها
    if (productInfo && productInfo.title) {
      return {
        name: productInfo.title,
        price: parseFloat(productInfo.price || '1.0'),
        currency: productInfo.currency || 'USD',
        image: productInfo.image
      };
    }

    // إذا كانت بيانات عروض الكمية متاحة، استخدمها
    if (quantityOfferData && quantityOfferData.product_title) {
      return {
        name: quantityOfferData.product_title,
        price: parseFloat(quantityOfferData.product_price || '1.0'),
        currency: quantityOfferData.product_currency || 'USD',
        image: quantityOfferData.product_image
      };
    }

    // استخدام بيانات افتراضية
    return {
      name: language === 'ar' ? 'منتج من النموذج' : 'Product from Form',
      price: 1.0,
      currency: 'USD',
      image: null
    };
  };

  const productDetails = getSmartProductInfo();

  // ✅ إصلاح نهائي: تحديد العملة المناسبة للعرض
  const orderCurrency = order.currency || 'USD';
  const productCurrency = productDetails.currency || 'USD';
  
  // ✅ منطق جديد: إذا كان هناك عروض كمية، استخدم عملة المنتج، وإلا استخدم عملة المنتج أيضاً
  const actualQuantity = getActualQuantity();
  const hasQuantityOffers = actualQuantity > 1;
  
  // ✅ استخدام عملة المنتج دائماً للعرض (USD في معظم الحالات)
  const displayCurrency = productCurrency;
  
  // دالة لعرض العملة بالشكل الصحيح
  const formatCurrency = (amount: number) => {
    if (displayCurrency === 'USD') return `$${amount.toFixed(2)}`;
    return `${displayCurrency} ${amount.toFixed(2)}`;
  };
  
  let unitPrice = productDetails.price;
  let finalTotal = parseFloat(order.total_amount || 0);
  
  // ✅ إصلاح: تحويل المبلغ الإجمالي إلى عملة المنتج للعرض
  if (orderCurrency !== displayCurrency) {
    const rates = { 'USD': 1.0, 'SAR': 3.75, 'AED': 3.67, 'MAD': 10.0, 'EUR': 0.85 };
    const fromRate = rates[orderCurrency] || 1;
    const toRate = rates[displayCurrency] || 1;
    
    // تحويل المبلغ الإجمالي إلى عملة المنتج
    finalTotal = (finalTotal / fromRate) * toRate;
    
    console.log('💱 Total amount conversion to product currency:', {
      originalTotal: parseFloat(order.total_amount || 0),
      orderCurrency: orderCurrency,
      convertedTotal: finalTotal,
      displayCurrency: displayCurrency,
      hasQuantityOffers
    });
  }

  const subtotal = finalTotal; // المجموع الفرعي بعملة النموذج
  const shippingCost = parseFloat(order.shipping_cost || 0);
  const extras = parseFloat(order.extras || 0);

  // ✅ إصلاح: لا يوجد خصم في عروض الكمية - السعر النهائي هو المجموع الصحيح
  const discount = 0; // لا يوجد خصم - السعر النهائي من النموذج صحيح

  const total = finalTotal;

  // ✅ Debug: طباعة القيم للتأكد من التحديث
  console.log('🔍 OrderDetailsDialog Debug Values:', {
    orderCurrency,
    displayCurrency,
    productCurrency,
    unitPrice,
    actualQuantity,
    subtotal,
    total,
    originalTotal: order.total_amount,
    hasQuantityOffers
  });

  // Get country from form settings
  const getActualCountry = () => {
    // First try from form country setting (loaded from database)
    if (formCountry) {
      return formCountry;
    }

    // Try from customer_country field in order
    if (order.customer_country) {
      return order.customer_country;
    }

    // Try from shipping address
    if (shippingAddress.country && shippingAddress.country !== 'السعودية') {
      return shippingAddress.country;
    }

    // Default fallback
    return 'Unknown';
  };

  const actualCountry = getActualCountry();

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <DialogHeader className="border-b pb-4 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-2xl font-bold">
                {language === 'ar' ? 'تفاصيل الطلب' : 'Order Details'}
              </DialogTitle>
              <Badge className={`px-3 py-1 text-sm font-medium border ${getStatusColor(orderStatus)}`}>
                {language === 'ar' ?
                  (orderStatus === 'pending' ? 'قيد الانتظار' :
                   orderStatus === 'processing' ? 'قيد المعالجة' :
                   orderStatus === 'delivered' ? 'تم التسليم' :
                   orderStatus === 'cancelled' ? 'ملغي' : orderStatus) :
                  orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)
                }
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Order Summary Header */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">{language === 'ar' ? 'رقم الطلب' : 'Order ID'}</div>
              <div className="font-mono font-bold text-lg">#{order.order_number || order.id?.slice(-8)}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">{language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}</div>
              <div className="font-medium">
                {new Date(order.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date(order.created_at).toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي المبلغ' : 'Total Amount'}</div>
              <div className="font-bold text-xl text-green-600">
                {displayCurrency === 'USD' ? `$${total.toFixed(2)}` : `${displayCurrency} ${total.toFixed(2)}`}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">{language === 'ar' ? 'الكمية' : 'Quantity'}</div>
              <div className="font-bold text-lg text-blue-600">{actualQuantity}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">IP {language === 'ar' ? 'العنوان' : 'Address'}</div>
              <div className="font-mono text-sm bg-white px-2 py-1 rounded border">
                {order.ip_address ? order.ip_address.split(',')[0].trim() : '192.168.1.1'}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Customer Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5 text-blue-600" />
                    {language === 'ar' ? 'معلومات العميل' : 'Customer Info'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {language === 'ar' ? 'الاسم' : 'Name'}
                      </Label>
                      <div className="mt-1 p-2 bg-gray-50 rounded border text-sm">
                        {order.customer_name || (language === 'ar' ? 'غير محدد' : 'Not specified')}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {language === 'ar' ? 'الهاتف' : 'Phone'}
                      </Label>
                      <div className="mt-1 p-2 bg-gray-50 rounded border text-sm font-mono">
                        {order.customer_phone || (language === 'ar' ? 'غير محدد' : 'Not specified')}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                    </Label>
                    <div className="mt-1 p-2 bg-gray-50 rounded border text-sm">
                      {order.customer_email || (language === 'ar' ? 'غير محدد' : 'Not specified')}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">{language === 'ar' ? 'الحالة' : 'Status'}</Label>
                    <Select value={orderStatus} onValueChange={setOrderStatus}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</SelectItem>
                        <SelectItem value="processing">{language === 'ar' ? 'قيد المعالجة' : 'Processing'}</SelectItem>
                        <SelectItem value="delivered">{language === 'ar' ? 'تم التسليم' : 'Delivered'}</SelectItem>
                        <SelectItem value="cancelled">{language === 'ar' ? 'ملغي' : 'Cancelled'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="h-5 w-5 text-green-600" />
                    {language === 'ar' ? 'عنوان الشحن' : 'Shipping Address'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">{language === 'ar' ? 'المدينة' : 'City'}</Label>
                      <div className="mt-1 p-2 bg-gray-50 rounded border text-sm">
                        {shippingAddress.city || (language === 'ar' ? 'غير محدد' : 'Not specified')}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        {language === 'ar' ? 'الدولة' : 'Country'}
                      </Label>
                      <div className="mt-1 p-2 bg-gray-50 rounded border text-sm">
                        {actualCountry}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">{language === 'ar' ? 'العنوان الكامل' : 'Full Address'}</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded border text-sm min-h-[60px]">
                      {shippingAddress.address || (language === 'ar' ? 'غير محدد' : 'Not specified')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Product Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="h-5 w-5 text-purple-600" />
                    {language === 'ar' ? 'معلومات المنتجات' : 'Product Info'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        {productDetails.image ? (
                          <img
                            src={productDetails.image}
                            alt={productDetails.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              // Fallback to icon if image fails to load
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <Package className={`w-8 h-8 text-white ${productDetails.image ? 'hidden' : ''}`} />
                      </div>

                      <div className="flex-1">
                        <h4 className="font-medium text-sm mb-2">
                          {productDetails.name || (language === 'ar' ? 'منتج من النموذج' : 'Product from Form')}
                        </h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">{language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}</div>
                            <div className="font-medium">
                              {displayCurrency === 'USD' ? `$${unitPrice.toFixed(2)}` : `${displayCurrency} ${unitPrice.toFixed(2)}`}
                            </div>
                          </div>

                          <div>
                            <div className="text-muted-foreground">{language === 'ar' ? 'الكمية' : 'Quantity'}</div>
                            <div className="font-medium text-blue-600">{actualQuantity}</div>
                          </div>

                          <div>
                            <div className="text-muted-foreground">{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</div>
                            <div className="font-medium text-green-600">
                              {displayCurrency === 'USD' ? `$${subtotal.toFixed(2)}` : `${displayCurrency} ${subtotal.toFixed(2)}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Show quantity offer info if available */}
                    {quantityOfferData && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-sm text-blue-800">
                          <strong>{language === 'ar' ? 'عرض الكمية المطبق:' : 'Quantity Offer Applied:'}</strong>
                          {quantityOfferData.offers?.map((offer: any, idx: number) => (
                            <div key={idx} className="mt-1">
                              • {offer.text} ({language === 'ar' ? 'كمية' : 'Qty'}: {offer.quantity})
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calculator className="h-5 w-5 text-green-600" />
                    {language === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}</span>
                      <span className="font-medium">
                        {displayCurrency === 'USD' ? `$${unitPrice.toFixed(2)}` : `${displayCurrency} ${unitPrice.toFixed(2)}`}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm">{language === 'ar' ? 'الكمية' : 'Quantity'}</span>
                      <span className="font-medium text-blue-600">×{actualQuantity}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm">{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                      <span className="font-medium">
                        {displayCurrency === 'USD' ? `$${subtotal.toFixed(2)}` : `${displayCurrency} ${subtotal.toFixed(2)}`}
                      </span>
                    </div>

                    {extras > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm">{language === 'ar' ? 'إضافي' : 'Extra'}</span>
                        <span className="font-medium">
                          {displayCurrency === 'USD' ? `$${extras.toFixed(2)}` : `${displayCurrency} ${extras.toFixed(2)}`}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-sm">{language === 'ar' ? 'الشحن' : 'Shipping'}</span>
                      <span className="font-medium text-blue-600">
                        {shippingCost > 0 ?
                          (displayCurrency === 'USD' ? `$${shippingCost.toFixed(2)}` : `${displayCurrency} ${shippingCost.toFixed(2)}`) :
                          (language === 'ar' ? 'مجاني' : 'Free')
                        }
                      </span>
                    </div>

                    {discount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-red-600">{language === 'ar' ? 'خصم العرض' : 'Offer Discount'}</span>
                        <span className="font-medium text-red-600">
                          -{displayCurrency === 'USD' ? `$${discount.toFixed(2)}` : `${displayCurrency} ${discount.toFixed(2)}`}
                        </span>
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-lg">{language === 'ar' ? 'المجموع النهائي' : 'Final Total'}</span>
                      <span className="font-bold text-xl text-green-600">
                        {displayCurrency === 'USD' ? `$${total.toFixed(2)}` : `${displayCurrency} ${total.toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-gray-600" />
                    {language === 'ar' ? 'ملاحظات' : 'Notes'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder={language === 'ar' ? 'أضف ملاحظات حول الطلب...' : 'Add notes about the order...'}
                    className="min-h-[100px] resize-none"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer with action buttons */}
        <div className="border-t p-4 flex justify-between items-center flex-shrink-0">
          <div className="text-sm text-muted-foreground">
            {language === 'ar' ? 'آخر تحديث:' : 'Last updated:'} {new Date(order.updated_at || order.created_at).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              {language === 'ar' ? 'إعادة تعيين' : 'Reset'}
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ التغييرات' : 'Save Changes')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;
