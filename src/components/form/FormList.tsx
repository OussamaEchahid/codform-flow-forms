
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
import { Edit, MoreVertical, Trash, Eye, EyeOff, ShoppingBag, Link, CloudOff, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ShopifyProduct } from '@/lib/shopify/types';
import { toast } from 'sonner';

interface FormListProps {
  forms: FormData[];
  isLoading: boolean;
  onSelectForm: (formId: string) => void;
  offlineMode?: boolean;
  onRefresh?: () => void;
  retryCount?: number;
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
  const { publishForm, deleteForm } = useFormTemplates();
  const [enhancedForms, setEnhancedForms] = useState<FormData[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);

  // Retry mechanism for fetching data
  useEffect(() => {
    if (retryCount > retryAttempts) {
      setRetryAttempts(retryCount);
    }
  }, [retryCount, retryAttempts]);

  // Fetch associated products for each form
  useEffect(() => {
    const fetchProductAssociations = async () => {
      if (!forms.length) return;
      
      setIsLoadingProducts(true);
      
      try {
        // Get all product settings
        const { data: productSettings, error } = await supabase
          .from('shopify_product_settings')
          .select('*')
          .in('form_id', forms.map(form => form.id));
          
        if (error) {
          console.error('Error fetching product settings:', error);
          return;
        }
        
        // Group product IDs by form ID
        const productsByForm = productSettings?.reduce((acc, setting) => {
          if (!acc[setting.form_id]) {
            acc[setting.form_id] = [];
          }
          acc[setting.form_id].push(setting.product_id);
          return acc;
        }, {} as Record<string, string[]>) || {};
        
        // Fetch product details for all product IDs
        const allProductIds = productSettings?.map(s => s.product_id) || [];
        if (allProductIds.length === 0) {
          // No products to fetch, just set the forms as is
          setEnhancedForms(forms);
          return;
        }
        
        // Fetch product details from cached products table
        const shopId = localStorage.getItem('shopify_store');
        if (!shopId) {
          console.error('No shop ID found in localStorage');
          return;
        }
        
        // Skip cached products query since table doesn't exist
        const cachedProducts = null;
          
        // Map the products to forms
        const productsMap = new Map<string, { id: string; title: string }>();
        
        if (cachedProducts?.products) {
          const shopifyProducts = cachedProducts.products as ShopifyProduct[];
          shopifyProducts.forEach(product => {
            if (allProductIds.includes(product.id)) {
              productsMap.set(product.id, { 
                id: product.id,
                title: product.title
              });
            }
          });
        }
        
        // Enhance the forms with associated products
        const formsWithProducts = forms.map(form => {
          const productIds = productsByForm[form.id] || [];
          const associatedProducts = productIds.map(id => productsMap.get(id))
            .filter(p => p !== undefined) as { id: string; title: string }[];
            
          return {
            ...form,
            associatedProducts
          };
        });
        
        setEnhancedForms(formsWithProducts);
      } catch (error) {
        console.error('Error enhancing forms with products:', error);
        setEnhancedForms(forms); // Fallback to original forms
      } finally {
        setIsLoadingProducts(false);
      }
    };
    
    if (!offlineMode) {
      fetchProductAssociations();
    } else {
      // In offline mode, just use the forms as is
      setEnhancedForms(forms);
    }
  }, [forms, offlineMode]);

  const handlePublishToggle = async (formId: string, currentStatus: boolean) => {
    await publishForm(formId, !currentStatus);
  };

  const handleDelete = async () => {
    if (formToDelete) {
      await deleteForm(formToDelete);
      setFormToDelete(null);
    }
  };
  
  const handleRefresh = () => {
    if (onRefresh) {
      toast.info('جاري تحديث البيانات...');
      onRefresh();
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

      {displayForms.map((form) => (
        <Card key={form.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <div className={`h-2 ${form.is_published ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg truncate">
                  {form.title}
                </CardTitle>
                {/* Display associated products if any */}
                {form.associatedProducts && form.associatedProducts.length > 0 && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
                    <ShoppingBag className="h-3 w-3" />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            {form.associatedProducts.length} {form.associatedProducts.length === 1 ? 'منتج' : 'منتجات'}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="max-w-xs">
                            <p className="font-bold mb-1">المنتجات المرتبطة:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {form.associatedProducts.map(product => (
                                <li key={product.id}>{product.title}</li>
                              ))}
                            </ul>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onSelectForm(form.id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>تعديل</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handlePublishToggle(form.id, form.is_published)}>
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
            >
              عرض وتعديل
            </Button>
          </CardFooter>
        </Card>
      ))}

      <AlertDialog open={!!formToDelete} onOpenChange={(open) => !open && setFormToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف النموذج؟</AlertDialogTitle>
            <AlertDialogDescription>
              لا يمكن التراجع عن هذا الإجراء. سيتم حذف النموذج بشكل دائم وإزالة جميع البيانات المرتبطة به.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FormList;
