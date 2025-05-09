
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useShopify } from '@/hooks/useShopify';
import { toast } from 'sonner';

interface CreateLandingPageDialogProps {
  open: boolean;
  onClose: () => void;
}

const CreateLandingPageDialog: React.FC<CreateLandingPageDialogProps> = ({ open, onClose }) => {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const [pageName, setPageName] = useState('');
  const [productId, setProductId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Shopify integration
  const { isConnected, shop, products: shopifyProducts, loadProducts, isLoading: isLoadingShopifyProducts } = useShopify();
  
  // Load Shopify products when the dialog opens
  useEffect(() => {
    if (open && isConnected) {
      loadProducts();
    }
  }, [open, isConnected, loadProducts]);

  // تأكد من عدم عرض أي شيء إذا كان الحوار مغلقًا
  if (!open) {
    return null;
  }
  
  const handleCreatePage = async () => {
    if (!pageName.trim()) {
      toast.error(language === 'ar' ? 'يرجى إدخال اسم الصفحة' : 'Please enter a page name');
      return;
    }
    
    try {
      setIsCreating(true);
      
      // توليد الرابط المختصر من اسم الصفحة
      const slug = pageName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
      
      // إنشاء الصفحة
      const { data, error } = await supabase
        .from('landing_pages')
        .insert({
          title: pageName,
          slug,
          is_published: false
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // تخزين معرف منتج Shopify في جدول منفصل إذا تم تحديده
      if (productId) {
        // هنا يمكن تخزين معرف منتج Shopify في جدول منفصل
        // سيتم تنفيذ ذلك في الدالة الطرفية
      }
      
      // الانتقال إلى المحرر
      navigate(`/landing-pages/editor/${data.id}`);
      toast.success(language === 'ar' ? 'تم إنشاء الصفحة بنجاح' : 'Page created successfully');
    } catch (error) {
      console.error('Error creating page:', error);
      toast.error(language === 'ar' ? 'خطأ في إنشاء الصفحة' : 'Error creating page');
    } finally {
      setIsCreating(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) onClose();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {language === 'ar' ? 'صفحة هبوط جديدة' : 'New Landing Page'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="page-name">
              {language === 'ar' ? 'اسم الصفحة' : 'Page Name'}
            </Label>
            <Input
              id="page-name"
              placeholder={language === 'ar' ? 'أدخل اسم الصفحة' : 'Enter page name'}
              value={pageName}
              onChange={(e) => setPageName(e.target.value)}
            />
          </div>
          
          <div>
            <Label>
              {language === 'ar' ? 'اختر منتج شوبيفاي' : 'Select Shopify Product'}
            </Label>
            
            <select
              className="w-full border rounded-md p-2"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">
                {language === 'ar' ? 'اختر منتج...' : 'Select product...'}
              </option>
              
              {isConnected ? (
                isLoadingShopifyProducts ? (
                  <option disabled>{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</option>
                ) : shopifyProducts.length > 0 ? (
                  shopifyProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.title}
                    </option>
                  ))
                ) : (
                  <option disabled>{language === 'ar' ? 'لا توجد منتجات' : 'No products found'}</option>
                )
              ) : (
                <option disabled>
                  {language === 'ar' 
                    ? 'يرجى الاتصال بشوبيفاي أولاً' 
                    : 'You must connect to Shopify first'}
                </option>
              )}
            </select>
            
            {!isConnected && (
              <p className="text-sm text-amber-600 mt-1">
                {language === 'ar' 
                  ? 'يجب عليك الاتصال بشوبيفاي أولاً' 
                  : 'You must connect to Shopify first'}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handleCreatePage} disabled={isCreating}>
            {isCreating
              ? (language === 'ar' ? 'جاري الإنشاء...' : 'Creating...')
              : (language === 'ar' ? 'إنشاء صفحة' : 'Create Page')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateLandingPageDialog;
