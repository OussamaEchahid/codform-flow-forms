
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useShopify } from '@/hooks/useShopify';
import { ShopifyProduct } from '@/lib/shopify/types';
import { supabase } from '@/integrations/supabase/client';

interface LandingPage {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
  product_id?: string;
}

interface Product {
  id: string;
  name: string;
}

interface LandingPageSettingsProps {
  page: LandingPage;
  onSave: (data: Partial<LandingPage>) => Promise<void>;
  onClose: () => void;
}

const LandingPageSettings: React.FC<LandingPageSettingsProps> = ({ page, onSave, onClose }) => {
  const { t, language } = useI18n();
  const [title, setTitle] = useState(page.title);
  const [slug, setSlug] = useState(page.slug);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublished, setIsPublished] = useState(page.is_published);
  const [productId, setProductId] = useState(page.product_id || '');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [shopifyTabActive, setShopifyTabActive] = useState(false);
  const { isConnected, products: shopifyProducts, loadProducts } = useShopify();

  // Load normal products
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name')
          .order('name');

        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  // Load Shopify products
  useEffect(() => {
    if (isConnected && shopifyTabActive) {
      loadProducts();
    }
  }, [isConnected, shopifyTabActive, loadProducts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !slug) {
      return;
    }
    
    try {
      setIsSaving(true);
      
      await onSave({
        title,
        slug,
        is_published: isPublished,
        product_id: productId || null,
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving page:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle slug auto-generation when title changes
  const handleTitleChange = (value: string) => {
    setTitle(value);
    
    // Auto-generate slug if it hasn't been manually edited
    if (!page.slug || page.slug === '' || page.slug === `page-${page.id}`) {
      const generatedSlug = value
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
      
      setSlug(generatedSlug);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              {language === 'ar' ? 'إعدادات الصفحة' : 'Page Settings'}
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">
                  {language === 'ar' ? 'عنوان الصفحة' : 'Page Title'}
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="slug">
                  {language === 'ar' ? 'الرابط المختصر' : 'Slug'}
                </Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  {language === 'ar' 
                    ? 'سيتم استخدام هذا في رابط الصفحة' 
                    : 'This will be used in the page URL'}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button 
                    type="button"
                    variant={!shopifyTabActive ? "default" : "outline"}
                    onClick={() => setShopifyTabActive(false)}
                    className="text-sm"
                  >
                    {language === 'ar' ? 'منتجات الموقع' : 'Local Products'}
                  </Button>
                  <Button
                    type="button"
                    variant={shopifyTabActive ? "default" : "outline"}
                    onClick={() => setShopifyTabActive(true)}
                    className="text-sm"
                  >
                    {language === 'ar' ? 'منتجات شوبيفاي' : 'Shopify Products'}
                  </Button>
                </div>
              </div>
              
              {shopifyTabActive ? (
                <div>
                  <Label htmlFor="shopify-product">
                    {language === 'ar' ? 'منتج شوبيفاي' : 'Shopify Product'}
                  </Label>
                  <select
                    id="shopify-product"
                    className="w-full border rounded-md p-2"
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                  >
                    <option value="">
                      {language === 'ar' ? 'اختر منتج...' : 'Select product...'}
                    </option>
                    {isConnected ? (
                      shopifyProducts.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.title}
                        </option>
                      ))
                    ) : (
                      <option disabled>
                        {language === 'ar' ? 'يرجى الاتصال بشوبيفاي أولاً' : 'Please connect to Shopify first'}
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
                <div>
                  <Label htmlFor="product">
                    {language === 'ar' ? 'المنتج' : 'Product'}
                  </Label>
                  <select
                    id="product"
                    className="w-full border rounded-md p-2"
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                  >
                    <option value="">
                      {language === 'ar' ? 'اختر منتج...' : 'Select product...'}
                    </option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <Label htmlFor="is_published" className="cursor-pointer">
                  {language === 'ar' ? 'نشر الصفحة' : 'Publish Page'}
                </Label>
                <Switch
                  id="is_published"
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={onClose}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving
                  ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                  : (language === 'ar' ? 'حفظ' : 'Save')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LandingPageSettings;
