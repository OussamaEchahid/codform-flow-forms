import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { FormData, useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { Edit, MoreVertical, Trash, Eye, EyeOff, ShoppingBag, Link, CloudOff, RefreshCw, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ShopifyProduct } from '@/lib/shopify/types';
import { toast } from 'sonner';
import ProductManagementModal from './ProductManagementModal';

interface FormListProps {
  forms: FormData[];
  isLoading: boolean;
  onSelectForm: (formId: string) => void;
  offlineMode?: boolean;
  onRefresh?: () => void;
  retryCount?: number;
}

interface EnhancedFormData extends FormData {
  associatedProducts?: Array<{
    id: string;
    title: string;
    image: string;
  }>;
}

const FormList: React.FC<FormListProps> = ({ 
  forms, 
  isLoading, 
  onSelectForm,
  offlineMode = false,
  onRefresh,
  retryCount = 0
}) => {
  const [formToDelete, setFormToDelete] = useState<string | null>(null);
  const [isOperating, setIsOperating] = useState<string | null>(null);
  const { publishForm, deleteForm } = useFormTemplates();
  const [enhancedForms, setEnhancedForms] = useState<EnhancedFormData[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);

  // Product management modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedFormForProducts, setSelectedFormForProducts] = useState<{ id: string; title: string } | null>(null);

  // Retry mechanism for fetching data
  useEffect(() => {
    if (retryCount > retryAttempts) {
      setRetryAttempts(retryCount);
    }
  }, [retryCount, retryAttempts]);

  // Fetch associated products for each form
  useEffect(() => {
    const fetchProductAssociations = async () => {
      if (!forms.length || offlineMode) {
        console.log('Skipping product fetch - no forms or offline mode', { formsCount: forms.length, offlineMode });
        setEnhancedForms(forms);
        return;
      }
      
      console.log('🔄 بدء جلب المنتجات المرتبطة للنماذج:', forms.length);
      setIsLoadingProducts(true);
      
      try {
        // Get all product settings
        const { data: productSettings, error } = await supabase
          .from('shopify_product_settings')
          .select('*')
          .in('form_id', forms.map(form => form.id));
          
        if (error) {
          console.error('❌ خطأ في جلب إعدادات المنتج:', error);
          setEnhancedForms(forms);
          return;
        }
        
        console.log('✅ تم جلب إعدادات المنتج:', productSettings);
        
        // Group product IDs by form ID
        const productsByForm = productSettings?.reduce((acc, setting) => {
          if (!acc[setting.form_id]) {
            acc[setting.form_id] = [];
          }
          acc[setting.form_id].push(setting.product_id);
          return acc;
        }, {} as Record<string, string[]>) || {};
        
        console.log('📊 تجميع المنتجات حسب النموذج:', productsByForm);
        
        // Get all unique product IDs
        const allProductIds = [...new Set(productSettings?.map(s => s.product_id) || [])];
        
        if (allProductIds.length === 0) {
          console.log('⚠️ لا توجد معرفات منتجات، استخدام النماذج كما هي');
          setEnhancedForms(forms);
          return;
        }
        
        console.log('🎯 جلب تفاصيل المنتجات للمعرفات:', allProductIds);
        
        const shopId = localStorage.getItem('shopify_store');
        if (!shopId) {
          console.error('❌ لم يتم العثور على معرف المتجر في localStorage');
          setEnhancedForms(forms);
          return;
        }
        
        // Fetch product details from Shopify API via our edge function
        const productsMap = new Map<string, { id: string; title: string; image: string }>();
        
        try {
          console.log('🚀 استدعاء edge function مع:', { shop: shopId, productIds: allProductIds });
          
          const response = await fetch(`https://trlklwixfeaexhydzaue.supabase.co/functions/v1/shopify-products`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M`
            },
            body: JSON.stringify({
              shop: shopId,
              productIds: allProductIds
            })
          });
          
          console.log('📡 استجابة edge function:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log('📦 بيانات استجابة edge function:', data);
            
            if (data.success && data.products) {
              data.products.forEach((product: any) => {
                const originalId = String(product.id);
                const cleanId = originalId.replace('gid://shopify/Product/', '');
                
                let imageUrl = '/placeholder.svg';
                
                if (product.featuredImage) {
                  imageUrl = product.featuredImage;
                } else if (product.images && product.images.length > 0) {
                  imageUrl = product.images[0];
                } else if (product.image) {
                  imageUrl = product.image;
                }
                
                console.log('🔧 معالجة المنتج:', { 
                  originalId, 
                  cleanId, 
                  title: product.title, 
                  image: imageUrl
                });
                
                const productData = {
                  id: cleanId,
                  title: product.title || `منتج ${cleanId}`,
                  image: imageUrl
                };
                
                productsMap.set(cleanId, productData);
                productsMap.set(originalId, productData);
              });
              
              console.log('🗺️ خريطة المنتجات المنشأة:', productsMap);
            } else {
              console.error('❌ edge function أرجع استجابة غير ناجحة:', data);
            }
          } else {
            console.error('❌ خطأ HTTP في edge function:', response.status, response.statusText);
          }
        } catch (fetchError) {
          console.error('❌ خطأ في استدعاء edge function:', fetchError);
        }
        
        // Enhance the forms with associated products
        const formsWithProducts = forms.map(form => {
          const productIds = productsByForm[form.id] || [];
          console.log(`📋 النموذج ${form.id} يحتوي على معرفات المنتجات:`, productIds);
          
          const associatedProducts = productIds.map(id => {
            const product = productsMap.get(id) || productsMap.get(String(id).replace('gid://shopify/Product/', ''));
            if (!product) {
              return {
                id: String(id).replace('gid://shopify/Product/', ''),
                title: `منتج ${String(id).replace('gid://shopify/Product/', '')}`,
                image: '/placeholder.svg'
              };
            }
            return product;
          });
          
          console.log(`📋 المنتجات المرتبطة النهائية للنموذج ${form.id}:`, associatedProducts);
          
          return {
            ...form,
            associatedProducts
          };
        });
        
        console.log('🎉 النماذج المحسّنة النهائية:', formsWithProducts);
        setEnhancedForms(formsWithProducts);
      } catch (error) {
        console.error('❌ خطأ في تحسين النماذج بالمنتجات:', error);
        setEnhancedForms(forms);
      } finally {
        setIsLoadingProducts(false);
      }
    };
    
    fetchProductAssociations();
  }, [forms, offlineMode]);

  const handlePublishToggle = async (formId: string, currentStatus: boolean) => {
    if (isOperating) {
      console.log('عملية جارية، تجاهل الطلب');
      return;
    }
    
    const newStatus = !currentStatus;
    console.log(`🔄 تغيير حالة نشر النموذج ${formId} من ${currentStatus} إلى ${newStatus}`);
    
    setIsOperating(formId);
    
    try {
      const success = await publishForm(formId, newStatus);
      
      if (success) {
        console.log(`✅ تم تغيير حالة نشر النموذج بنجاح`);
        // The forms state is already updated by the hook
      } else {
        console.error(`❌ فشل تغيير حالة نشر النموذج`);
      }
    } catch (error) {
      console.error('خطأ في تغيير حالة النشر:', error);
    } finally {
      setIsOperating(null);
    }
  };

  const handleDelete = async () => {
    if (!formToDelete || isOperating) {
      return;
    }
    
    console.log(`🗑️ بدء حذف النموذج: ${formToDelete}`);
    setIsOperating(formToDelete);
    
    try {
      const success = await deleteForm(formToDelete);
      
      if (success) {
        console.log(`✅ تم حذف النموذج بنجاح`);
        // The forms state is already updated by the hook
      } else {
        console.error(`❌ فشل حذف النموذج`);
      }
    } catch (error) {
      console.error('خطأ في حذف النموذج:', error);
    } finally {
      setFormToDelete(null);
      setIsOperating(null);
    }
  };
  
  const handleRefresh = () => {
    if (onRefresh) {
      toast.info('جاري تحديث البيانات...');
      onRefresh();
    }
  };

  const handleRemoveProduct = async (formId: string, productId: string) => {
    try {
      const { error } = await supabase
        .from('shopify_product_settings')
        .delete()
        .eq('form_id', formId)
        .eq('product_id', productId);

      if (error) {
        console.error('❌ خطأ في إزالة المنتج:', error);
        toast.error('فشل في إزالة المنتج من النموذج');
        return;
      }

      toast.success('تم إزالة المنتج من النموذج بنجاح');
      
      // Update enhanced forms locally
      setEnhancedForms(prevForms => 
        prevForms.map(form => 
          form.id === formId 
            ? {
                ...form,
                associatedProducts: form.associatedProducts?.filter(p => p.id !== productId) || []
              }
            : form
        )
      );
    } catch (error) {
      console.error('❌ خطأ في إزالة المنتج:', error);
      toast.error('فشل في إزالة المنتج من النموذج');
    }
  };

  const handleManageProducts = (formId: string, formTitle: string) => {
    console.log('🔍 تم النقر على زر إدارة المنتجات:', { formId, formTitle });
    setSelectedFormForProducts({ id: formId, title: formTitle });
    setIsProductModalOpen(true);
    console.log('✅ تم فتح المودال بنجاح');
  };

  const handleCloseProductModal = () => {
    setIsProductModalOpen(false);
    setSelectedFormForProducts(null);
    // Refresh the enhanced forms to show updated product associations
    if (onRefresh) {
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (forms.length === 0) {
    return (
      <Card className="bg-gray-50 border-dashed">
        <CardContent className="pt-6 text-center">
          <p className="text-gray-500 mb-4">لا توجد نماذج متاحة</p>
          <p className="text-sm text-gray-400">انقر على زر "إنشاء نموذج جديد" لإضافة نموذج</p>
          {offlineMode && (
            <div className="mt-4 flex flex-col items-center">
              <Badge variant="outline" className="flex items-center gap-1 p-2 bg-amber-50 text-amber-800 border-amber-300">
                <CloudOff className="h-4 w-4" />
                <span>وضع عدم الاتصال - بعض الوظائف قد لا تعمل</span>
              </Badge>
              <Button onClick={handleRefresh} variant="outline" className="mt-2 text-sm" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                محاولة الاتصال مجددًا
              </Button>
            </div>
          )}
          {retryAttempts > 0 && (
            <div className="mt-2 text-xs text-amber-600">
              تمت محاولة إعادة الاتصال {retryAttempts} مرة
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const displayForms = enhancedForms.length > 0 ? enhancedForms : forms;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Offline Mode Indicator */}
        {offlineMode && (
          <div className="col-span-full">
            <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-300 rounded-md mb-4">
              <div className="flex items-center gap-2">
                <CloudOff className="h-5 w-5 text-amber-600" />
                <span className="text-amber-800">وضع عدم الاتصال - يتم استخدام البيانات المخزنة محليًا</span>
              </div>
              <Button onClick={handleRefresh} variant="outline" size="sm" className="bg-white hover:bg-amber-100">
                <RefreshCw className="mr-2 h-4 w-4" />
                إعادة الاتصال
              </Button>
            </div>
            {retryAttempts > 0 && (
              <div className="text-center text-sm text-amber-600 mb-4">
                تمت محاولة الاتصال {retryAttempts} مرة
              </div>
            )}
          </div>
        )}

        {/* Loading indicator for products */}
        {isLoadingProducts && (
          <div className="col-span-full">
            <div className="flex items-center justify-center p-4 bg-blue-50 border border-blue-200 rounded-md mb-4">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600 mr-2" />
              <span className="text-blue-800">جاري تحميل بيانات المنتجات المرتبطة...</span>
            </div>
          </div>
        )}

        {displayForms.map((form) => {
          const isCurrentlyOperating = isOperating === form.id;
          console.log('🎨 عرض النموذج:', form.id, 'منتجات مرتبطة:', form.associatedProducts?.length || 0);
          
          return (
          <Card key={form.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <div className={`h-2 ${form.is_published ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                   <div className="group">
                     <div className="flex items-center gap-2">
                       <CardTitle className="text-lg truncate group-hover:bg-gray-50 px-2 py-1 rounded transition-colors cursor-text">
                         {form.title}
                       </CardTitle>
                       <button 
                         className="text-xs text-gray-500 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                         onClick={(e) => {
                           e.stopPropagation();
                           const titleElement = e.currentTarget.previousElementSibling as HTMLElement;
                           const input = document.createElement('input');
                           input.type = 'text';
                           input.value = form.title;
                           input.className = 'text-lg font-semibold bg-white border border-primary rounded px-2 py-1 w-full';
                           input.addEventListener('blur', async () => {
                             const newTitle = input.value.trim();
                             if (newTitle && newTitle !== form.title) {
                               try {
                                 const { error } = await supabase
                                   .from('forms')
                                   .update({ title: newTitle })
                                   .eq('id', form.id);
                                 
                                 if (error) {
                                   console.error('خطأ في تحديث العنوان:', error);
                                   toast.error('فشل في تحديث عنوان النموذج');
                                 } else {
                                   toast.success('تم تحديث عنوان النموذج بنجاح');
                                   // Update local state
                                   setEnhancedForms(prevForms => 
                                     prevForms.map(f => 
                                       f.id === form.id ? { ...f, title: newTitle } : f
                                     )
                                   );
                                 }
                               } catch (error) {
                                 console.error('خطأ في تحديث العنوان:', error);
                                 toast.error('فشل في تحديث عنوان النموذج');
                               }
                             }
                             titleElement.style.display = 'block';
                             input.remove();
                           });
                           input.addEventListener('keydown', (e) => {
                             if (e.key === 'Enter') {
                               input.blur();
                             } else if (e.key === 'Escape') {
                               titleElement.style.display = 'block';
                               input.remove();
                             }
                           });
                           titleElement.style.display = 'none';
                           titleElement.parentNode?.insertBefore(input, titleElement.nextSibling);
                           input.focus();
                           input.select();
                         }}
                       >
                         تحرير
                       </button>
                     </div>
                   </div>
                   {/* Display associated products if any */}
                  {form.associatedProducts && form.associatedProducts.length > 0 && (
                    <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <ShoppingBag className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-800">
                          مرتبط بـ {form.associatedProducts.length} {form.associatedProducts.length === 1 ? 'منتج' : 'منتجات'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {form.associatedProducts.slice(0, 3).map((product) => (
                          <TooltipProvider key={product.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-2 bg-white rounded-md p-2 shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
                                  <img 
                                    src={product.image} 
                                    alt={product.title}
                                    className="w-10 h-10 rounded object-cover border"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                                    }}
                                  />
                                   <div className="flex flex-col">
                                     <span className="text-xs font-medium text-gray-700 truncate max-w-20">
                                       {product.title}
                                     </span>
                                     <span className="text-xs text-gray-500">
                                       ID: {product.id}
                                     </span>
                                   </div>
                                   <button
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       handleRemoveProduct(form.id, product.id);
                                     }}
                                     className="ml-1 h-6 w-6 bg-red-500 text-white hover:bg-red-600 rounded-full flex items-center justify-center transition-colors shadow-sm"
                                     title="إزالة المنتج من النموذج"
                                   >
                                     <Trash className="h-3 w-3" />
                                   </button>
                                   <ExternalLink className="h-3 w-3 text-gray-400" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="max-w-48 text-center">
                                  <p className="font-semibold">{product.title}</p>
                                  <p className="text-xs text-gray-500">معرف المنتج: {product.id}</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                        {form.associatedProducts.length > 3 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center justify-center bg-white rounded-md p-2 shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
                                  <span className="text-xs text-blue-600 font-medium">
                                    +{form.associatedProducts.length - 3}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="max-w-64">
                                  <p className="font-semibold mb-2">المنتجات الإضافية:</p>
                                  {form.associatedProducts.slice(3).map((product) => (
                                    <p key={product.id} className="text-sm">{product.title}</p>
                                  ))}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={isCurrentlyOperating}>
                      {isCurrentlyOperating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreVertical className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onSelectForm(form.id)} disabled={isCurrentlyOperating}>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>تعديل</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleManageProducts(form.id, form.title)} disabled={isCurrentlyOperating}>
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      <span>إدارة المنتجات</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handlePublishToggle(form.id, form.is_published)} 
                      disabled={isCurrentlyOperating}
                    >
                      {form.is_published ? (
                        <>
                          <EyeOff className="mr-2 h-4 w-4" />
                          <span>إلغاء النشر</span>
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          <span>نشر</span>
                        </>
                      )}
                    </DropdownMenuItem>
                    {form.associatedProducts && form.associatedProducts.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-blue-600">
                          <Link className="mr-2 h-4 w-4" />
                          <span>المنتجات المرتبطة ({form.associatedProducts.length})</span>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setFormToDelete(form.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={isCurrentlyOperating}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      <span>حذف</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-2">
                <Badge variant={form.is_published ? "success" : "secondary"}>
                  {form.is_published ? 'منشور' : 'مسودة'}
                </Badge>
                <span className="text-xs text-gray-500 rtl:text-left">
                  {formatDistanceToNow(new Date(form.created_at), { addSuffix: true, locale: ar })}
                </span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{form.description || 'لا يوجد وصف'}</p>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button 
                variant="default" 
                onClick={() => onSelectForm(form.id)}
                className="w-full"
                disabled={isCurrentlyOperating}
              >
                {isCurrentlyOperating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري المعالجة...
                  </>
                ) : (
                  "عرض وتعديل"
                )}
              </Button>
            </CardFooter>
          </Card>
          );
        })}

        {/* Product Management Modal */}
        {selectedFormForProducts && (
          <ProductManagementModal
            isOpen={isProductModalOpen}
            onClose={handleCloseProductModal}
            formId={selectedFormForProducts.id}
            formTitle={selectedFormForProducts.title}
          />
        )}
      </div>
    </>
  );
};

export default FormList;
