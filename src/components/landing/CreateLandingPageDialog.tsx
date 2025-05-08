
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreatePageDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (pageId: string) => void;
}

interface Product {
  id: string;
  name: string;
}

const CreateLandingPageDialog: React.FC<CreatePageDialogProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const { language } = useI18n();
  const navigate = useNavigate();
  const [title, setTitle] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [syncProducts, setSyncProducts] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      fetchProducts();
    }
  }, [open]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .order('name');
        
      if (error) throw error;
      
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePage = async () => {
    if (!title.trim()) {
      toast.error(language === 'ar' ? 'يرجى إدخال عنوان للصفحة' : 'Please enter a page title');
      return;
    }
    
    try {
      setIsCreating(true);
      
      // Generate a slug from the title
      const slug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim();
      
      // Create new landing page
      const { data: newPage, error: pageError } = await supabase
        .from('landing_pages')
        .insert({
          title,
          slug,
          product_id: productId || null,
          is_published: false
        })
        .select()
        .single();
      
      if (pageError) throw pageError;
      
      toast.success(language === 'ar' ? 'تم إنشاء الصفحة بنجاح' : 'Page created successfully');
      
      if (onSuccess) {
        onSuccess(newPage.id);
      } else {
        navigate(`/landing-pages/editor/${newPage.id}`);
      }
      
      onClose();
    } catch (error) {
      console.error('Error creating page:', error);
      toast.error(language === 'ar' ? 'خطأ في إنشاء الصفحة' : 'Error creating page');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {language === 'ar' ? 'صفحة جديدة' : 'New Page'}
          </DialogTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4" 
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {language === 'ar' ? 'اسم الصفحة' : 'Page Name'}
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={language === 'ar' ? 'أدخل اسم الصفحة' : 'Enter page name'}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              {language === 'ar' ? 'اختر المنتج' : 'Select Product'}
            </label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={language === 'ar' ? 'اختر منتج (اختياري)' : 'Select Product (optional)'} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {isLoading ? (
                    <div className="px-2 py-4 text-center text-sm">
                      {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                    </div>
                  ) : products.length === 0 ? (
                    <div className="px-2 py-4 text-center text-sm">
                      {language === 'ar' ? 'لا توجد منتجات' : 'No products found'}
                    </div>
                  ) : (
                    <>
                      <SelectItem value="">
                        {language === 'ar' ? '-- لا يوجد منتج --' : '-- No Product --'}
                      </SelectItem>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="sync-products"
              checked={syncProducts}
              onChange={(e) => setSyncProducts(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="sync-products" className="ml-2 text-sm text-gray-600">
              {language === 'ar' ? 'مزامنة المنتجات من متجر شوبيفاي' : 'Sync products from Shopify'}
            </label>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handleCreatePage} disabled={isCreating}>
            {isCreating 
              ? (language === 'ar' ? 'جاري الإنشاء...' : 'Creating...') 
              : (language === 'ar' ? 'إنشاء الصفحة' : 'Create Page')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateLandingPageDialog;
