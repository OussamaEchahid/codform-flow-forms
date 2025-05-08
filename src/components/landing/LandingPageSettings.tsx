
import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface LandingPage {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
  product_id?: string;
}

interface LandingPageSettingsProps {
  page: LandingPage;
  onSave: (pageData: Partial<LandingPage>) => Promise<void>;
  onClose: () => void;
}

interface Product {
  id: string;
  name: string;
}

const LandingPageSettings: React.FC<LandingPageSettingsProps> = ({
  page,
  onSave,
  onClose
}) => {
  const { language } = useI18n();
  const [title, setTitle] = useState<string>(page.title);
  const [slug, setSlug] = useState<string>(page.slug);
  const [productId, setProductId] = useState<string | undefined>(page.product_id);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  React.useEffect(() => {
    fetchProducts();
  }, []);

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

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      await onSave({
        title,
        slug,
        product_id: productId
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving page settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Generate a slug from the title
  const generateSlug = () => {
    const newSlug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/--+/g, '-') // Replace multiple hyphens with single
      .trim();
      
    setSlug(newSlug);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">
            {language === 'ar' ? 'إعدادات الصفحة' : 'Page Settings'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {language === 'ar' ? 'عنوان الصفحة' : 'Page Title'}
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={language === 'ar' ? 'عنوان الصفحة' : 'Page Title'}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              {language === 'ar' ? 'رابط URL المخصص' : 'Custom URL Slug'}
            </label>
            <div className="flex gap-2">
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder={language === 'ar' ? 'رابط-الصفحة' : 'page-slug'}
              />
              <Button
                variant="outline" 
                onClick={generateSlug}
                size="sm"
              >
                {language === 'ar' ? 'توليد' : 'Generate'}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {language === 'ar' 
                ? 'سيكون رابط الصفحة: yourstore.com/landing/' + slug
                : 'Your page URL will be: yourstore.com/landing/' + slug}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              {language === 'ar' ? 'ربط بمنتج' : 'Link to Product'}
            </label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'ar' ? 'اختر منتج (اختياري)' : 'Select Product (optional)'} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="">
                    {language === 'ar' ? '-- لا يوجد منتج --' : '-- No Product --'}
                  </SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              {language === 'ar' 
                ? 'اختياري: ربط هذه الصفحة بمنتج محدد'
                : 'Optional: Associate this page with a specific product'}
            </p>
          </div>
        </div>
        
        <div className="p-4 border-t flex justify-end">
          <Button variant="outline" className="mr-2" onClick={onClose}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving 
              ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
              : (language === 'ar' ? 'حفظ' : 'Save')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LandingPageSettings;
