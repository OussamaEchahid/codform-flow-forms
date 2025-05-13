
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { useShopify } from '@/hooks/useShopify';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import FormTemplatesDialog from '@/components/form/FormTemplatesDialog';
import FormList from '@/components/form/FormList';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ShopifyProduct } from '@/lib/shopify/types';

interface FormBuilderDashboardProps {
  initialForms?: any[];
  forceRefresh?: boolean;
}

const FormBuilderDashboard: React.FC<FormBuilderDashboardProps> = ({ 
  initialForms = [],
  forceRefresh = false
}) => {
  const navigate = useNavigate();
  const { language } = useI18n();
  const { forms, isLoading, fetchForms, createFormFromTemplate, createDefaultForm } = useFormTemplates();
  const { products, loadProducts, isLoading: isLoadingProducts } = useShopify();
  
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [localForms, setLocalForms] = useState(initialForms || []);
  const [hasLoadedForms, setHasLoadedForms] = useState(false);

  // Fetch forms on component mount
  useEffect(() => {
    const loadForms = async () => {
      try {
        await fetchForms();
        setHasLoadedForms(true);
      } catch (error) {
        console.error("Error loading forms:", error);
        toast.error(language === 'ar' ? 'خطأ في تحميل النماذج' : 'Error loading forms');
      }
    };

    // If we have initial forms, use those first, then fetch
    if (initialForms && initialForms.length > 0) {
      setLocalForms(initialForms);
      if (forceRefresh) {
        loadForms();
      }
    } else {
      loadForms();
    }
  }, [forceRefresh]);

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Update local forms when the forms from hook change
  useEffect(() => {
    if (hasLoadedForms && forms && forms.length > 0) {
      setLocalForms(forms);
    }
  }, [forms, hasLoadedForms]);

  const handleOpenCreateDialog = () => {
    setIsProductDialogOpen(true);
  };

  const handleCreateForm = async () => {
    if (!selectedProductId) {
      toast.error(language === 'ar' ? 'يرجى اختيار منتج أولاً' : 'Please select a product first');
      return;
    }

    try {
      const newForm = await createDefaultForm(selectedProductId);
      if (newForm) {
        // Navigate to form builder with the new form ID
        setIsProductDialogOpen(false);
        setSelectedProductId('');
        navigate(`/form-builder/${newForm.id}`);
      }
    } catch (error) {
      console.error("Error creating form:", error);
      toast.error(language === 'ar' ? 'خطأ في إنشاء نموذج جديد' : 'Error creating new form');
    }
  };

  const handleSelectForm = (formId: string) => {
    navigate(`/form-builder/${formId}`);
  };

  const handleOpenTemplateDialog = () => {
    setIsTemplateDialogOpen(true);
  };

  const handleSelectTemplate = (templateId: number) => {
    setSelectedTemplateId(templateId);
    setIsTemplateDialogOpen(false);
    setIsProductDialogOpen(true);
  };

  const handleTemplateWithProduct = async () => {
    if (!selectedProductId || !selectedTemplateId) {
      toast.error(language === 'ar' ? 'يرجى اختيار منتج وقالب' : 'Please select a product and template');
      return;
    }

    try {
      const newForm = await createFormFromTemplate(selectedTemplateId, selectedProductId);
      
      if (newForm) {
        // Navigate to form builder with the new form ID
        setIsProductDialogOpen(false);
        setSelectedProductId('');
        setSelectedTemplateId(null);
        navigate(`/form-builder/${newForm.id}`);
      }
    } catch (error) {
      console.error("Error creating form from template:", error);
      toast.error(
        language === 'ar'
          ? 'خطأ في إنشاء نموذج من القالب'
          : 'Error creating form from template'
      );
    }
  };

  const findProductById = (productId: string): ShopifyProduct | undefined => {
    return products.find(product => product.id === productId || product.id.endsWith(`/${productId}`));
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {language === 'ar' ? 'النماذج' : 'Forms'}
          </h1>
          <p className="text-gray-500">
            {language === 'ar' ? 'إدارة نماذج الدفع عند الاستلام' : 'Manage your Cash On Delivery forms'}
          </p>
        </div>
        
        <div className="flex space-x-3">
          <Button 
            variant="outline"
            onClick={handleOpenTemplateDialog}
          >
            {language === 'ar' ? 'استخدام قالب' : 'Use Template'}
          </Button>
          
          <Button onClick={handleOpenCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'إنشاء نموذج جديد' : 'Create New Form'}
          </Button>
        </div>
      </div>
      
      <FormList 
        forms={localForms} 
        isLoading={isLoading && !localForms.length} 
        onSelectForm={handleSelectForm}
        findProductById={findProductById}
      />
      
      <FormTemplatesDialog
        open={isTemplateDialogOpen}
        onSelect={handleSelectTemplate}
        onClose={() => setIsTemplateDialogOpen(false)}
      />

      {/* Product Selection Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'اختر منتجًا' : 'Select a Product'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="product-select">
              {language === 'ar' ? 'المنتج' : 'Product'}:
            </Label>
            <Select
              value={selectedProductId}
              onValueChange={setSelectedProductId}
            >
              <SelectTrigger id="product-select" className="mt-1">
                <SelectValue placeholder={language === 'ar' ? 'اختر منتجًا' : 'Select a product'} />
              </SelectTrigger>
              <SelectContent>
                {isLoadingProducts ? (
                  <SelectItem value="loading" disabled>
                    {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                  </SelectItem>
                ) : products.length > 0 ? (
                  products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.title}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    {language === 'ar' ? 'لا توجد منتجات متاحة' : 'No products available'}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsProductDialogOpen(false);
                setSelectedProductId('');
              }}
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={selectedTemplateId ? handleTemplateWithProduct : handleCreateForm}
              disabled={!selectedProductId}
            >
              {language === 'ar' ? 'إنشاء' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormBuilderDashboard;
