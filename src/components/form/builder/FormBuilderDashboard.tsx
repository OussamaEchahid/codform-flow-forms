
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Trash2, Edit, FileCheck, ShoppingCart, Package, RefreshCw, CloudOff, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
// تمت إزالة استيراد UnifiedStoreManager لحل مشكلة require
import NewFormProductDialog from './NewFormProductDialog';
import ProductManagementModal from '../ProductManagementModal';
import DefaultFormMessage from '@/components/dashboard/DefaultFormMessage';
import { CountrySelector } from '@/components/ui/country-selector';
import { formManagementService } from '@/services/FormManagementService';
import { ProductViewDropdown } from '@/components/ui/product-view-dropdown';

interface FormBuilderDashboardProps {
  initialForms?: any[];
  forceRefresh?: boolean;
  offlineMode?: boolean;
  onRetryConnection?: () => void;
  retryCount?: number;
}

const FormBuilderDashboard: React.FC<FormBuilderDashboardProps> = ({ 
  initialForms = [],
  forceRefresh = false,
  offlineMode = false,
  onRetryConnection,
  retryCount = 0
}) => {
  const navigate = useNavigate();
  const { forms, fetchForms, deleteForm, createDefaultForm } = useFormTemplates();
  const { t, language } = useI18n();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [associatedProducts, setAssociatedProducts] = useState<Record<string, Array<{id: string; title: string; image: string}>>>({});
  const [formList, setFormList] = useState(initialForms.length > 0 ? initialForms : forms);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isNewFormDialogOpen, setIsNewFormDialogOpen] = useState(false);
  
  // Product management modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedFormForProducts, setSelectedFormForProducts] = useState<{ id: string; title: string } | null>(null);
  
  // Fetch forms data only once on initial load or when forceRefresh changes
  const initializeData = useCallback(async () => {
    if (isInitialized && !forceRefresh) return;
    
    setIsLoading(true);
    try {
      await fetchForms();
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing forms data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchForms, forceRefresh, isInitialized]);
  
  useEffect(() => {
    initializeData();
  }, [initializeData]);
  
  // Update formList when initialForms or forms change
  useEffect(() => {
    // Always use forms from hook for real-time updates
    setFormList(forms.length > 0 ? forms : initialForms);
  }, [forms, initialForms]);

  // Fetch product counts for each form - with useCallback to prevent unnecessary rerenders
  const fetchProductCounts = useCallback(async () => {
    if (formList.length === 0 || offlineMode) return;
    
    // الحصول على المتجر النشط من localStorage مباشرة
    const getActiveShopId = (): string | null => {      
      try {
        const activeShop = localStorage.getItem('active_shopify_store') || 
                          localStorage.getItem('current_shopify_store') ||
                          localStorage.getItem('simple_active_store');
        
        if (activeShop && activeShop.trim() && activeShop !== 'null') {
          console.log('🏪 Found active shop:', activeShop);
          return activeShop.trim();
        }
      } catch (error) {
        console.error('Error getting active shop:', error);
      }
      
      // Fallback للمصادر الأخرى في حالة الضرورة فقط
      const fallbackSources = [
        (window as any).SHOPIFY_SHOP_DOMAIN,
        new URLSearchParams(window.location.search).get('shop')
      ];
      
      for (const source of fallbackSources) {
        if (source && source.trim() !== '') {
          console.log('🏪 Found active shop from fallback source:', source);
          return source.trim();
        }
      }
      
      console.warn('⚠️ No active shop found from any source');
      return null;
    };
    
    const activeShop = getActiveShopId();
    
    if (!activeShop) {
      console.log('⚠️ No active shop found for product counts');
      setProductCounts({}); // Clear counts instead of keeping old ones
      return;
    }
    
    // تحقق من صحة المتجر النشط مباشرة من localStorage
    console.log('✅ Using active shop for product counts:', activeShop);
    
    const formIds = formList.map(form => form.id);
    
    try {
      console.log('📊 Fetching product counts for shop:', activeShop, 'forms:', formIds.length);
      
      const { data, error } = await supabase
        .from('shopify_product_settings')
        .select('form_id, product_id')
        .eq('shop_id', activeShop)
        .eq('enabled', true)  // Only count enabled product associations
        .in('form_id', formIds);
        
      if (error) {
        console.error('❌ Error fetching product associations:', error);
        return;
      }
      
      // Count products per form and group product IDs
      const counts: Record<string, number> = {};
      const productsByForm: Record<string, string[]> = {};

      if (data) {
        data.forEach(item => {
          if (!counts[item.form_id]) {
            counts[item.form_id] = 0;
            productsByForm[item.form_id] = [];
          }
          counts[item.form_id]++;
          productsByForm[item.form_id].push(item.product_id);
        });
      }

      console.log('✅ Product counts for shop', activeShop, ':', counts);
      setProductCounts(counts);

      // Convert product IDs to product details for dropdown
      const productsDetails: Record<string, Array<{id: string; title: string; image: string}>> = {};

      Object.entries(productsByForm).forEach(([formId, productIds]) => {
        productsDetails[formId] = productIds.map(id => ({
          id: id.replace('gid://shopify/Product/', ''),
          title: `منتج ${id.replace('gid://shopify/Product/', '')}`,
          image: '/placeholder.svg'
        }));
      });

      setAssociatedProducts(productsDetails);
    } catch (error) {
      console.error('❌ Error fetching product counts:', error);
    }
  }, [formList.length, offlineMode]); // Only depend on formList.length
  
  useEffect(() => {
    fetchProductCounts();
  }, [fetchProductCounts]);
  
  const filteredForms = formList.filter(form =>
    form.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Log للتشخيص
  React.useEffect(() => {
    if (formList.length > 0) {
      console.log('🔍 النماذج المحمّلة في Dashboard:');
      formList.forEach(form => {
        console.log(`📋 ${form.title}: country=${form.country}`);
      });
    }
  }, [formList]);
  
  const handleCreateForm = () => {
    console.log('🎯 زر إنشاء النموذج تم النقر عليه');
    console.log('📌 الحالة الحالية لـ isNewFormDialogOpen:', isNewFormDialogOpen);
    // فتح النافذة المنبثقة لاختيار تفاصيل النموذج
    setIsNewFormDialogOpen(true);
    console.log('✅ تم تعيين isNewFormDialogOpen إلى true');
  };
  
  const handleDeleteForm = async (formId: string) => {
    try {
      setIsLoading(true);
      console.log('🗑️ Deleting form:', formId);
      
      // حذف النموذج من قاعدة البيانات أولاً
      const success = await deleteForm(formId);
      if (success) {
        // تحديث الحالة المحلية فوراً
        setFormList(prevForms => {
          const updatedForms = prevForms.filter(form => form.id !== formId);
          console.log('✅ Updated local forms after deletion:', updatedForms.length);
          return updatedForms;
        });
        
        toast.success(language === 'ar' ? 'تم حذف النموذج بنجاح' : 'Form deleted successfully');
        
        // إعادة جلب النماذج من قاعدة البيانات للتأكد
        setTimeout(() => {
          fetchForms();
        }, 1000);
      }
    } catch (error) {
      console.error('Error deleting form:', error);
      toast.error(language === 'ar' ? 'فشل حذف النموذج' : 'Failed to delete form');
    } finally {
      setIsLoading(false);
    }
  };
  
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'PPP', { locale: language === 'ar' ? ar : undefined });
    } catch (e) {
      return dateString;
    }
  };
  
  const handleRetryConnection = () => {
    if (onRetryConnection) {
      onRetryConnection();
      toast.info(language === 'ar' ? 'جاري محاولة الاتصال بالخادم...' : 'Attempting to connect to server...');
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
    // Force immediate refresh of product counts after closing modal
    setTimeout(() => {
      console.log('🔄 إعادة جلب عداد المنتجات بعد إغلاق المودال');
      fetchProductCounts();
    }, 100);
  };
  
  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // إذا لم توجد نماذج، عرض رسالة ترحيبية
  if (filteredForms.length === 0 && !searchTerm) {
    return <DefaultFormMessage onCreateForm={handleCreateForm} isLoading={isLoading} />;
  }

  return (
    <div className="container mx-auto py-8">
      {/* Offline Mode Banner */}
      {offlineMode && (
        <div className="mb-6">
          <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-300 rounded-md">
            <div className="flex items-center gap-2">
              <CloudOff className="h-5 w-5 text-amber-600" />
              <span className="text-amber-800">
                {language === 'ar' 
                  ? 'وضع عدم الاتصال - يتم استخدام البيانات المخزنة محليًا' 
                  : 'Offline Mode - Using locally stored data'}
              </span>
            </div>
            <Button onClick={handleRetryConnection} variant="outline" size="sm" className="bg-white hover:bg-amber-100">
              <RefreshCw className="mr-2 h-4 w-4" />
              {language === 'ar' ? 'إعادة الاتصال' : 'Reconnect'}
            </Button>
          </div>
          {retryCount > 0 && (
            <div className="text-center text-sm text-amber-600 mt-2">
              {language === 'ar' 
                ? `تمت محاولة الاتصال ${retryCount} مرة` 
                : `Connection attempted ${retryCount} ${retryCount === 1 ? 'time' : 'times'}`}
            </div>
          )}
        </div>
      )}
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' ? 'النماذج' : 'Forms'}
          </CardTitle>
          <Button onClick={handleCreateForm} className="flex items-center gap-2">
            <Plus size={16} />
            {language === 'ar' ? 'إنشاء نموذج جديد' : 'Create New Form'}
          </Button>
        </CardHeader>
        
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder={language === 'ar' ? 'بحث عن النماذج...' : 'Search forms...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          
          <Table>
            <TableCaption>
              {language === 'ar' 
                ? filteredForms.length > 0 
                  ? `${filteredForms.length} نموذج`
                  : 'لا توجد نماذج متاحة'
                : filteredForms.length > 0 
                  ? `${filteredForms.length} forms`
                  : 'No forms available'
              }
            </TableCaption>
            
            <TableHeader>
              <TableRow>
                <TableHead className={language === 'ar' ? 'text-right' : ''}>
                  {language === 'ar' ? 'العنوان' : 'Title'}
                </TableHead>
                <TableHead className={language === 'ar' ? 'text-right' : ''}>
                  {language === 'ar' ? 'تاريخ الإنشاء' : 'Created'}
                </TableHead>
                <TableHead className={language === 'ar' ? 'text-right' : ''}>
                  {language === 'ar' ? 'الحالة' : 'Status'}
                </TableHead>
                <TableHead className={language === 'ar' ? 'text-right' : ''}>
                  {language === 'ar' ? 'المنتجات' : 'Products'}
                </TableHead>
                <TableHead className={language === 'ar' ? 'text-right' : ''}>
                  {language === 'ar' ? 'علامة البلد' : 'Country Tag'}
                </TableHead>
                <TableHead className="text-right">
                  {language === 'ar' ? 'إجراءات' : 'Actions'}
                </TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {filteredForms.length > 0 ? (
                filteredForms.map((form) => (
                   <TableRow key={form.id}>
                     <TableCell className={`font-medium ${language === 'ar' ? 'text-right' : ''}`}>
                        <div 
                          className="group cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors flex items-center gap-2"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const titleElement = e.currentTarget;
                            const currentTitle = form.title;
                            
                            // Create input element
                            const input = document.createElement('input');
                            input.type = 'text';
                            input.value = currentTitle;
                            input.className = 'text-sm font-medium bg-white border-2 border-primary rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-primary/20';
                            
                            // Handle save on blur and enter
                            const saveTitle = async () => {
                              const newTitle = input.value.trim();
                              if (newTitle && newTitle !== currentTitle) {
                                try {
                                  const success = await formManagementService.saveForm(form.id, { title: newTitle });
                                  
                                  if (success) {
                                    toast.success(language === 'ar' ? 'تم تحديث عنوان النموذج بنجاح' : 'Form title updated successfully');
                                    // Update local state
                                    setFormList(prevForms => 
                                      prevForms.map(f => 
                                        f.id === form.id ? { ...f, title: newTitle } : f
                                      )
                                    );
                                  } else {
                                    toast.error(language === 'ar' ? 'فشل في تحديث عنوان النموذج' : 'Failed to update form title');
                                  }
                                } catch (error) {
                                  console.error('خطأ في تحديث العنوان:', error);
                                  toast.error(language === 'ar' ? 'فشل في تحديث عنوان النموذج' : 'Failed to update form title');
                                }
                              }
                              titleElement.style.display = 'flex';
                              input.remove();
                            };
                           
                           input.addEventListener('blur', saveTitle);
                           input.addEventListener('keydown', (e) => {
                             if (e.key === 'Enter') {
                               saveTitle();
                             } else if (e.key === 'Escape') {
                               titleElement.style.display = 'flex';
                               input.remove();
                             }
                           });
                           
                           // Replace title with input
                           titleElement.style.display = 'none';
                           titleElement.parentNode?.insertBefore(input, titleElement.nextSibling);
                           input.focus();
                           input.select();
                         }}
                       >
                         <span className="flex-1">{form.title}</span>
                         <Edit className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                       </div>
                    </TableCell>
                    <TableCell className={language === 'ar' ? 'text-right' : ''}>
                      {formatDate(form.created_at)}
                    </TableCell>
                    <TableCell className={language === 'ar' ? 'text-right' : ''}>
                      <Badge variant={form.is_published ? "success" : "secondary"}>
                        {form.is_published 
                          ? (language === 'ar' ? 'منشور' : 'Published')
                          : (language === 'ar' ? 'مسودة' : 'Draft')
                        }
                      </Badge>
                    </TableCell>
                     <TableCell className={language === 'ar' ? 'text-right' : ''}>
                       {productCounts[form.id] ? (
                         <Badge variant="outline" className="flex items-center gap-1">
                           <ShoppingCart size={12} />
                           {productCounts[form.id]}
                         </Badge>
                       ) : (
                         <span className="text-muted-foreground text-sm">
                           {language === 'ar' ? 'لا يوجد' : 'None'}
                         </span>
                       )}
                     </TableCell>
                     <TableCell className={language === 'ar' ? 'text-right' : ''}>
                       <CountrySelector
                         value={form.country}
                         defaultCountry={form.country || 'SA'}
                         onValueChange={async (countryCode) => {
                           try {
                             console.log('🏁 تحديث علامة البلد إلى:', countryCode, 'للنموذج:', form.id);

                             // حفظ في country مؤقتاً حتى نضيف country_tag column
                             const success = await formManagementService.saveForm(form.id, { country: countryCode });

                             if (success) {
                               console.log('✅ تم حفظ علامة البلد بنجاح');
                               toast.success(language === 'ar' ? 'تم تحديث علامة البلد بنجاح' : 'Country tag updated successfully');
                               setFormList(prevForms =>
                                 prevForms.map(f =>
                                   f.id === form.id ? { ...f, country: countryCode } : f
                                 )
                               );
                             } else {
                               console.error('❌ فشل في حفظ علامة البلد');
                               toast.error(language === 'ar' ? 'فشل في تحديث علامة البلد' : 'Failed to update country tag');
                             }
                           } catch (error) {
                             console.error('خطأ في تحديث علامة البلد:', error);
                             toast.error(language === 'ar' ? 'فشل في تحديث علامة البلد' : 'Failed to update country tag');
                           }
                         }}
                       />
                     </TableCell>
                     <TableCell className="flex justify-end gap-2">
                      <ProductViewDropdown
                        products={associatedProducts[form.id] || []}
                        language={language}
                      />
                      
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleManageProducts(form.id, form.title)}
                        title={language === 'ar' ? 'إدارة المنتجات' : 'Manage Products'}
                      >
                        <ShoppingBag size={16} />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                      >
                        <Link to={`/form-builder/${form.id}`}>
                          <Edit size={16} />
                        </Link>
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className={language === 'ar' ? 'text-right' : ''}>
                              {language === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?'}
                            </AlertDialogTitle>
                            <AlertDialogDescription className={language === 'ar' ? 'text-right' : ''}>
                              {language === 'ar' 
                                ? `هذا الإجراء لا يمكن التراجع عنه. سيتم حذف النموذج "${form.title}" بشكل دائم.`
                                : `This action cannot be undone. Form "${form.title}" will be permanently deleted.`
                              }
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {language === 'ar' ? 'إلغاء' : 'Cancel'}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteForm(form.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              {language === 'ar' ? 'حذف' : 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package size={32} className="text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {language === 'ar' 
                          ? 'لا توجد نماذج حاليًا' 
                          : 'No forms found'}
                      </p>
                      <Button 
                        variant="outline"
                        onClick={handleCreateForm}
                        className="mt-2"
                      >
                        {language === 'ar' ? 'إنشاء نموذج جديد' : 'Create your first form'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Form Product Dialog */}
      <NewFormProductDialog 
        open={isNewFormDialogOpen} 
        onClose={() => {
          setIsNewFormDialogOpen(false);
          // إعادة جلب النماذج بعد إنشاء نموذج جديد
          fetchForms();
        }} 
      />

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
  );
};

export default FormBuilderDashboard;
