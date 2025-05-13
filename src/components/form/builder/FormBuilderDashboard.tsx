
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PenSquare, PlusCircle, FileSpreadsheet, SlidersHorizontal, Copy } from 'lucide-react';
import { FormData, useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import ProductSelectionDialog from '@/components/form/ProductSelectionDialog';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface FormBuilderDashboardProps {
  initialForms?: FormData[];
  forceRefresh?: boolean;
}

const FormBuilderDashboard: React.FC<FormBuilderDashboardProps> = ({ 
  initialForms = [],
  forceRefresh = false
}) => {
  const navigate = useNavigate();
  const { language } = useI18n();
  const { shopifyConnected, shop } = useAuth();
  const { forms, fetchForms, isLoading, loadForm, deleteForm, publishForm } = useFormTemplates();
  const [localForms, setLocalForms] = useState<FormData[]>(initialForms);
  const [isProductSelectionOpen, setIsProductSelectionOpen] = useState(false);
  const [isCreatingForm, setIsCreatingForm] = useState(false);
  
  // Fetch forms on component mount if no initial forms or forceRefresh is true
  useEffect(() => {
    if (forceRefresh || initialForms.length === 0) {
      fetchForms().then(() => {
        // Do nothing here, we'll handle the forms in the next useEffect
      }).catch(error => {
        console.error('Error fetching forms:', error);
      });
    }
  }, [forceRefresh, initialForms, fetchForms]);

  // Use forms from useFormTemplates hook if available
  useEffect(() => {
    if (forms && forms.length > 0) {
      setLocalForms(forms);
    }
  }, [forms]);

  const handleDeleteForm = async (id: string) => {
    const confirmDelete = window.confirm(
      language === 'ar' ? 'هل أنت متأكد من حذف هذا النموذج؟' : 'Are you sure you want to delete this form?'
    );
    
    if (confirmDelete) {
      try {
        const success = await deleteForm(id);
        if (success) {
          // Filter out the deleted form from local state
          setLocalForms((prevForms) => prevForms.filter((form) => form.id !== id));
          toast(
            language === 'ar' ? 'تم الحذف بنجاح' : 'Successfully deleted',
            {
              description: language === 'ar' ? 'تم حذف النموذج بنجاح' : 'Form deleted successfully',
            }
          );
        }
      } catch (error) {
        console.error('Error deleting form:', error);
        toast(
          language === 'ar' ? 'خطأ' : 'Error',
          {
            description: language === 'ar' ? 'فشل حذف النموذج' : 'Failed to delete form',
          }
        );
      }
    }
  };

  const handlePublishToggle = async (id: string, currentStatus: boolean) => {
    try {
      const success = await publishForm(id, !currentStatus);
      if (success) {
        // Update the form status in local state
        setLocalForms((prevForms) =>
          prevForms.map((form) =>
            form.id === id ? { ...form, isPublished: !currentStatus } : form
          )
        );
      }
    } catch (error) {
      console.error('Error toggling form publish status:', error);
      toast(
        language === 'ar' ? 'خطأ' : 'Error',
        {
          description: language === 'ar' ? 'فشل تغيير حالة النشر' : 'Failed to toggle publish status',
        }
      );
    }
  };

  const handleEditForm = (id: string) => {
    navigate(`/form-builder/${id}`);
  };

  const handleDuplicateForm = async (id: string) => {
    try {
      // Load the form to duplicate
      const formToDuplicate = await loadForm(id);
      if (!formToDuplicate) {
        toast(
          language === 'ar' ? 'خطأ' : 'Error',
          {
            description: language === 'ar' ? 'فشل نسخ النموذج' : 'Failed to duplicate form',
          }
        );
        return;
      }

      // Create a new ID for the duplicated form
      const newId = uuidv4();
      
      // Get active shop ID
      const shopId = shop || localStorage.getItem('shopify_store');
      
      if (!shopId) {
        toast(
          language === 'ar' ? 'خطأ' : 'Error',
          {
            description: language === 'ar' ? 'لم يتم العثور على معرف المتجر' : 'No shop ID found',
          }
        );
        return;
      }

      // Create a duplicate form in the database
      const { data, error } = await supabase.from('forms').insert({
        id: newId,
        title: `${formToDuplicate.title} (${language === 'ar' ? 'نسخة' : 'Copy'})`,
        description: formToDuplicate.description,
        data: formToDuplicate.data,
        is_published: false,
        shop_id: shopId,
        product_id: formToDuplicate.product_id, // Keep the same product association
        style: formToDuplicate.style
      });

      if (error) {
        console.error('Error duplicating form:', error);
        toast(
          language === 'ar' ? 'خطأ' : 'Error',
          {
            description: language === 'ar' ? 'فشل نسخ النموذج' : 'Failed to duplicate form',
          }
        );
        return;
      }

      // Refresh forms list - Fix: Use proper promise handling
      fetchForms().then(() => {
        // We'll get updated forms via the useEffect that watches forms state
      }).catch(error => {
        console.error('Error fetching forms after duplication:', error);
      });
      
      toast(
        language === 'ar' ? 'نجاح' : 'Success',
        {
          description: language === 'ar' ? 'تم نسخ النموذج بنجاح' : 'Form duplicated successfully',
        }
      );
    } catch (error) {
      console.error('Error duplicating form:', error);
      toast(
        language === 'ar' ? 'خطأ' : 'Error',
        {
          description: language === 'ar' ? 'فشل نسخ النموذج' : 'Failed to duplicate form',
        }
      );
    }
  };
  
  const handleCreateNewForm = () => {
    setIsProductSelectionOpen(true);
  };
  
  const handleProductSelected = async (productId: string, productTitle: string) => {
    setIsProductSelectionOpen(false);
    setIsCreatingForm(true);
    
    try {
      // Create a new ID for the form
      const newFormId = uuidv4();
      
      // Get active shop ID
      const shopId = shop || localStorage.getItem('shopify_store');
      
      if (!shopId) {
        toast(
          language === 'ar' ? 'خطأ' : 'Error',
          {
            description: language === 'ar' ? 'لم يتم العثور على معرف المتجر' : 'No shop ID found',
          }
        );
        setIsCreatingForm(false);
        return;
      }

      // Create a new form with the selected product ID
      const { data, error } = await supabase.from('forms').insert({
        id: newFormId,
        title: language === 'ar' ? `نموذج ${productTitle}` : `${productTitle} Form`,
        description: language === 'ar' ? `نموذج لمنتج ${productTitle}` : `Form for ${productTitle} product`,
        data: [
          {
            id: '1',
            title: 'Main Step',
            fields: [
              {
                type: 'form-title',
                id: `form-title-${Date.now()}`,
                label: language === 'ar' ? `نموذج ${productTitle}` : `${productTitle} Form`,
                helpText: language === 'ar' ? 'أكمل النموذج التالي لطلب المنتج' : 'Complete the form below to order the product',
                style: {
                  color: '#ffffff',
                  textAlign: language === 'ar' ? 'right' : 'left',
                  fontWeight: 'bold',
                  fontSize: '1.5rem',
                  descriptionColor: '#ffffff',
                  descriptionFontSize: '0.875rem',
                  backgroundColor: '#9b87f5'
                }
              },
              {
                type: 'text',
                id: `text-${Date.now()}-1`,
                label: language === 'ar' ? 'الاسم الكامل' : 'Full name',
                placeholder: language === 'ar' ? 'الاسم الكامل' : 'Full name',
                required: true,
                icon: 'user'
              },
              {
                type: 'phone',
                id: `phone-${Date.now()}-2`,
                label: language === 'ar' ? 'رقم الهاتف' : 'Phone number',
                placeholder: language === 'ar' ? 'رقم الهاتف' : 'Phone number',
                required: true,
                icon: 'phone'
              },
              {
                type: 'textarea',
                id: `textarea-${Date.now()}`,
                label: language === 'ar' ? 'العنوان' : 'Address',
                placeholder: language === 'ar' ? 'العنوان' : 'address',
                required: true
              },
              {
                type: 'submit',
                id: `submit-${Date.now()}`,
                label: language === 'ar' ? 'إرسال الطلب' : 'Submit Order',
                style: {
                  backgroundColor: '#9b87f5',
                  color: '#ffffff',
                  fontSize: '1.2rem',
                  animation: true,
                  animationType: 'pulse',
                  iconPosition: 'left'
                }
              }
            ]
          }
        ],
        is_published: true, // Automatically publish the form
        shop_id: shopId,
        product_id: productId,
        style: {
          primaryColor: '#9b87f5',
          borderRadius: '0.5rem',
          fontSize: '1rem',
          buttonStyle: 'rounded'
        }
      });

      if (error) {
        console.error('Error creating form:', error);
        toast(
          language === 'ar' ? 'خطأ' : 'Error',
          {
            description: language === 'ar' ? 'فشل إنشاء النموذج' : 'Failed to create form',
          }
        );
        setIsCreatingForm(false);
        return;
      }

      // Associate the form with the product in Shopify settings
      const productSettings = {
        productId: productId,
        formId: newFormId,
        enabled: true
      };

      const { error: settingsError } = await supabase.functions.invoke('shopify-product-settings', {
        body: {
          shop: shopId,
          settings: productSettings
        }
      });

      if (settingsError) {
        console.error('Error associating form with product:', settingsError);
        toast(
          language === 'ar' ? 'تحذير' : 'Warning',
          {
            description: language === 'ar' ? 'تم إنشاء النموذج ولكن فشل ربطه بالمنتج' : 'Form created but failed to associate with product',
          }
        );
      }

      // Redirect to the form editor
      navigate(`/form-builder/${newFormId}`);
      toast(
        language === 'ar' ? 'نجاح' : 'Success',
        {
          description: language === 'ar' ? 'تم إنشاء النموذج بنجاح' : 'Form created successfully',
        }
      );
    } catch (error) {
      console.error('Error creating form:', error);
      toast(
        language === 'ar' ? 'خطأ' : 'Error',
        {
          description: language === 'ar' ? 'فشل إنشاء النموذج' : 'Failed to create form',
        }
      );
    } finally {
      setIsCreatingForm(false);
    }
  };

  const handleProductSelectionClose = () => {
    setIsProductSelectionOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className={`text-2xl font-bold ${language === 'ar' ? 'text-right' : 'text-left'}`}>
          {language === 'ar' ? 'نماذج الدفع عند الاستلام' : 'Cash on Delivery Forms'}
        </h1>
        <Button 
          onClick={handleCreateNewForm}
          disabled={isCreatingForm}
          className="flex items-center"
        >
          {isCreatingForm ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <PlusCircle className="mr-2 h-4 w-4" />
          )}
          {language === 'ar' ? 'إنشاء نموذج جديد' : 'Create New Form'}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</span>
        </div>
      ) : localForms.length === 0 ? (
        <Card className="bg-gray-50 border-dashed border-2 border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileSpreadsheet className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-800 mb-2">
              {language === 'ar' ? 'لا توجد نماذج بعد' : 'No Forms Yet'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md text-center">
              {language === 'ar'
                ? 'ابدأ بإنشاء نموذج للدفع عند الاستلام لمتجرك'
                : 'Start by creating a Cash on Delivery form for your store'}
            </p>
            <Button onClick={handleCreateNewForm}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {language === 'ar' ? 'إنشاء نموذج جديد' : 'Create New Form'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {localForms.map((form) => (
            <Card key={form.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50 p-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{form.title}</CardTitle>
                  <Badge variant={form.isPublished || form.is_published ? 'success' : 'secondary'}>
                    {form.isPublished || form.is_published
                      ? language === 'ar' ? 'منشور' : 'Published'
                      : language === 'ar' ? 'مسودة' : 'Draft'}
                  </Badge>
                </div>
                <CardDescription className="text-sm mt-2">
                  {form.description || (language === 'ar' ? 'لا يوجد وصف' : 'No description')}
                </CardDescription>
                
                {form.product_id && (
                  <div className="mt-2 text-xs text-gray-500">
                    {language === 'ar' ? 'مرتبط بالمنتج:' : 'Linked to product:'} {form.product_id}
                  </div>
                )}
              </CardHeader>
              
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button
                    onClick={() => handleEditForm(form.id)}
                    size="sm"
                    className="flex items-center"
                  >
                    <PenSquare className="mr-1 h-4 w-4" />
                    {language === 'ar' ? 'تحرير' : 'Edit'}
                  </Button>
                  
                  <Button
                    onClick={() => handlePublishToggle(form.id, form.isPublished || form.is_published || false)}
                    size="sm"
                    variant={form.isPublished || form.is_published ? 'destructive' : 'default'}
                    className="flex items-center"
                  >
                    <SlidersHorizontal className="mr-1 h-4 w-4" />
                    {form.isPublished || form.is_published
                      ? language === 'ar' ? 'إلغاء النشر' : 'Unpublish'
                      : language === 'ar' ? 'نشر' : 'Publish'}
                  </Button>
                  
                  <Button
                    onClick={() => handleDuplicateForm(form.id)}
                    size="sm"
                    variant="outline"
                    className="flex items-center"
                  >
                    <Copy className="mr-1 h-4 w-4" />
                    {language === 'ar' ? 'نسخ' : 'Duplicate'}
                  </Button>
                  
                  <Button
                    onClick={() => handleDeleteForm(form.id)}
                    size="sm"
                    variant="destructive"
                    className="border border-red-200"
                  >
                    {language === 'ar' ? 'حذف' : 'Delete'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Product Selection Dialog */}
      <ProductSelectionDialog
        open={isProductSelectionOpen}
        onClose={handleProductSelectionClose}
        onSelectProduct={handleProductSelected}
      />
    </div>
  );
};

export default FormBuilderDashboard;
