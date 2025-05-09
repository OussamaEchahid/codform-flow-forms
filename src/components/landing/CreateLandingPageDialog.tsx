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
  const [shopifyTabActive, setShopifyTabActive] = useState(true);
  const [localProducts, setLocalProducts] = useState<any[]>([]);
  const [isLoadingLocalProducts, setIsLoadingLocalProducts] = useState(false);
  
  // Shopify integration
  const { isConnected, shop, products: shopifyProducts, loadProducts, isLoading: isLoadingShopifyProducts } = useShopify();
  
  // Load Shopify products when the dialog opens
  useEffect(() => {
    if (open && isConnected && shopifyTabActive) {
      loadProducts();
    }
  }, [open, isConnected, shopifyTabActive, loadProducts]);
  
  // Load local products
  useEffect(() => {
    const fetchLocalProducts = async () => {
      if (!open || shopifyTabActive) return;
      
      try {
        setIsLoadingLocalProducts(true);
        const { data, error } = await supabase
          .from('products')
          .select('id, name')
          .order('name');
          
        if (error) throw error;
        setLocalProducts(data || []);
      } catch (error) {
        console.error('Error fetching local products:', error);
      } finally {
        setIsLoadingLocalProducts(false);
      }
    };
    
    fetchLocalProducts();
  }, [open, shopifyTabActive]);

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
      
      // Generate a slug from the page name
      const slug = pageName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
      
      // Create the landing page
      const { data, error } = await supabase
        .from('landing_pages')
        .insert({
          title: pageName,
          slug,
          product_id: !shopifyTabActive ? productId : null,
          is_published: false
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Store Shopify product ID in a separate table if selected
      if (shopifyTabActive && productId) {
        // You would store the Shopify product ID in a separate table
        // This part will be implemented in the edge function
      }
      
      // Navigate to the editor
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
            {language === 'ar' ? 'صفحة جديدة' : 'New Page'}
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
            <div className="flex items-center justify-between mb-2">
              <Label>
                {language === 'ar' ? 'اختر المنتج' : 'Select Product'}
              </Label>
              
              <div className="flex gap-2">
                <Button 
                  type="button"
                  variant={!shopifyTabActive ? "default" : "outline"}
                  onClick={() => setShopifyTabActive(false)}
                  className="text-xs"
                  size="sm"
                >
                  {language === 'ar' ? 'منتجات الموقع' : 'Local Products'}
                </Button>
                <Button
                  type="button"
                  variant={shopifyTabActive ? "default" : "outline"}
                  onClick={() => setShopifyTabActive(true)}
                  className="text-xs"
                  size="sm"
                >
                  {language === 'ar' ? 'منتجات شوبيفاي' : 'Shopify Products'}
                </Button>
              </div>
            </div>
            
            {shopifyTabActive ? (
              <div>
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
            ) : (
              <select
                className="w-full border rounded-md p-2"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              >
                <option value="">
                  {language === 'ar' ? 'اختر منتج...' : 'Select product...'}
                </option>
                
                {isLoadingLocalProducts ? (
                  <option disabled>{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</option>
                ) : localProducts.length > 0 ? (
                  localProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
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
