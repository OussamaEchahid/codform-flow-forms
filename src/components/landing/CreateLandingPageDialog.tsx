
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useShopify } from '@/hooks/useShopify';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [dialogOpen, setDialogOpen] = useState(open);

  // Shopify integration
  const { isConnected, shop, products: shopifyProducts, loadProducts, isLoading: isLoadingShopifyProducts } = useShopify();
  
  // Load Shopify products when the dialog opens
  useEffect(() => {
    setDialogOpen(open);
    
    if (open && isConnected) {
      loadProducts();
    }
  }, [open, isConnected, loadProducts]);

  // Handle dialog close in a synchronized manner
  const handleDialogClose = () => {
    setDialogOpen(false);
    setTimeout(() => {
      onClose();
    }, 100);
  };
  
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
      
      // استخراج معرف المنتج الأساسي من معرف Shopify GID
      let cleanProductId = null;
      if (productId) {
        // إذا كان معرف المنتج هو GID من Shopify، تخزين المعرف الكامل كما هو
        // سنقوم بمعالجته في وظيفة النشر إلى Shopify
        cleanProductId = productId;
        
        console.log('Using Shopify product ID:', productId);
      }
      
      console.log('Creating landing page with:', { 
        title: pageName, 
        slug, 
        is_published: false,
        product_id: cleanProductId
      });
      
      // إنشاء الصفحة
      const { data, error } = await supabase
        .from('landing_pages')
        .insert({
          title: pageName,
          slug,
          is_published: false,
          product_id: cleanProductId
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting landing page:', error);
        throw error;
      }
      
      console.log('Created landing page:', data);
      
      // الانتقال إلى المحرر
      toast.success(language === 'ar' ? 'تم إنشاء الصفحة بنجاح' : 'Page created successfully');
      navigate(`/landing-pages/editor/${data.id}`);
    } catch (error) {
      console.error('Error creating page:', error);
      toast.error(language === 'ar' ? 'خطأ في إنشاء الصفحة' : 'Error creating page');
    } finally {
      setIsCreating(false);
    }
  };

  // تأكد من عدم عرض أي شيء إذا كان الحوار مغلقًا
  if (!open && !dialogOpen) {
    return null;
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={(isOpen) => {
      if (!isOpen) handleDialogClose();
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
            <Label className="flex items-center">
              <Store className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'اختر منتج شوبيفاي' : 'Select Shopify Product'}
            </Label>
            
            {!isConnected ? (
              <Alert variant="warning" className="mt-2">
                <AlertDescription>
                  {language === 'ar' 
                    ? 'يجب عليك الاتصال بشوبيفاي أولاً لربط صفحة الهبوط بمنتج' 
                    : 'You must connect to Shopify first to link landing page with a product'}
                </AlertDescription>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => window.location.href = '/shopify-connect'}
                >
                  {language === 'ar' ? 'اتصل بشوبيفاي' : 'Connect to Shopify'}
                </Button>
              </Alert>
            ) : (
              <select
                className="w-full border rounded-md p-2 mt-1"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                disabled={isLoadingShopifyProducts}
              >
                <option value="">
                  {language === 'ar' ? 'اختر منتج...' : 'Select product...'}
                </option>
                
                {isLoadingShopifyProducts ? (
                  <option disabled>{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</option>
                ) : shopifyProducts && shopifyProducts.length > 0 ? (
                  shopifyProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.title}
                    </option>
                  ))
                ) : (
                  <option disabled>{language === 'ar' ? 'لا توجد منتجات' : 'No products found'}</option>
                )}
              </select>
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={handleDialogClose}>
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
