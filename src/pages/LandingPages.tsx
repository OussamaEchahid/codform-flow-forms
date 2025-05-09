
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Pencil, Trash, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/components/layout/AppLayout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import CreateLandingPageDialog from '@/components/landing/CreateLandingPageDialog';

interface LandingPage {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
  product_id?: string;
  product_name?: string;
  updated_at: string;
  created_at: string;
}

const LandingPages = () => {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchLandingPages();
  }, []);

  const fetchLandingPages = async () => {
    try {
      setIsLoading(true);
      // Fetching landing pages without trying to join with products table
      const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // For pages with product_ids, try to get product names separately
      const pagesWithProducts = await Promise.all(data.map(async (page) => {
        let product_name = undefined;
        
        if (page.product_id) {
          // Check if it's a Shopify product ID (starts with gid://)
          if (page.product_id.startsWith('gid://shopify/Product/')) {
            // For Shopify products, we could fetch the name separately if needed
            // For now, just extract the ID part and use as placeholder
            const productIdParts = page.product_id.split('/');
            const shopifyId = productIdParts[productIdParts.length - 1];
            product_name = `Shopify Product (${shopifyId})`;
          } else {
            // Try to get name for local product
            try {
              const { data: productData } = await supabase
                .from('products')
                .select('name')
                .eq('id', page.product_id)
                .maybeSingle();
                
              if (productData) {
                product_name = productData.name;
              }
            } catch (err) {
              console.log('Could not fetch product name', err);
            }
          }
        }
        
        return {
          ...page,
          product_name
        };
      }));

      setPages(pagesWithProducts);
    } catch (error) {
      console.error('Error fetching landing pages:', error);
      toast.error(language === 'ar' ? 'خطأ في تحميل الصفحات' : 'Error loading pages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePage = () => {
    setCreateDialogOpen(true);
  };

  const handleEditPage = (id: string) => {
    navigate(`/landing-pages/editor/${id}`);
  };

  const handlePreviewPage = (slug: string) => {
    window.open(`/landing/${slug}`, '_blank');
  };

  const handleDeletePage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('landing_pages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPages(pages.filter(page => page.id !== id));
      toast.success(language === 'ar' ? 'تم حذف الصفحة بنجاح' : 'Page deleted successfully');
    } catch (error) {
      console.error('Error deleting page:', error);
      toast.error(language === 'ar' ? 'خطأ في حذف الصفحة' : 'Error deleting page');
    }
  };

  const handleDuplicatePage = async (id: string) => {
    try {
      const pageToDuplicate = pages.find(page => page.id === id);
      if (!pageToDuplicate) return;

      const { data: templateData, error: templateError } = await supabase
        .from('landing_page_templates')
        .select('content')
        .eq('page_id', id)
        .single();

      if (templateError && templateError.code !== 'PGRST116') throw templateError;

      const newTitle = `${pageToDuplicate.title} (${language === 'ar' ? 'نسخة' : 'Copy'})`;
      const newSlug = `${pageToDuplicate.slug}-copy-${Date.now()}`;

      const { data, error } = await supabase
        .from('landing_pages')
        .insert({
          title: newTitle,
          slug: newSlug,
          product_id: pageToDuplicate.product_id,
          is_published: false
        })
        .select()
        .single();

      if (error) throw error;

      if (data && templateData) {
        const { error: contentError } = await supabase
          .from('landing_page_templates')
          .insert({
            page_id: data.id,
            content: templateData.content
          });

        if (contentError) throw contentError;
      }

      toast.success(language === 'ar' ? 'تم نسخ الصفحة بنجاح' : 'Page duplicated successfully');
      fetchLandingPages();
    } catch (error) {
      console.error('Error duplicating page:', error);
      toast.error(language === 'ar' ? 'خطأ في نسخ الصفحة' : 'Error duplicating page');
    }
  };

  const getStatusLabel = (isPublished: boolean) => {
    return isPublished
      ? language === 'ar' ? 'منشور' : 'Published'
      : language === 'ar' ? 'غير منشور' : 'Unpublished';
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd-MM-yy HH:mm');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {language === 'ar' ? 'صفحات الهبوط' : 'Landing Pages'}
          </h1>
          <Button onClick={handleCreatePage}>
            <Plus className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'صفحة جديدة' : 'New Page'}
          </Button>
        </div>

        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">
                  {language === 'ar' ? 'اسم الصفحة' : 'Page name'}
                </TableHead>
                <TableHead>
                  {language === 'ar' ? 'آخر تحديث' : 'Last update'}
                </TableHead>
                <TableHead>
                  {language === 'ar' ? 'المنتج' : 'Product'}
                </TableHead>
                <TableHead>
                  {language === 'ar' ? 'الحالة' : 'Status'}
                </TableHead>
                <TableHead className="text-right">
                  {language === 'ar' ? 'إجراءات' : 'Actions'}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                  </TableCell>
                </TableRow>
              ) : pages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    {language === 'ar' 
                      ? 'لم يتم إنشاء أي صفحات هبوط بعد. قم بإنشاء صفحة جديدة.' 
                      : 'No landing pages created yet. Create a new page.'}
                  </TableCell>
                </TableRow>
              ) : (
                pages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell className="font-medium">{page.title}</TableCell>
                    <TableCell>{formatDate(page.updated_at)}</TableCell>
                    <TableCell>{page.product_name || '-'}</TableCell>
                    <TableCell>
                      <span 
                        className={`px-2 py-1 rounded-full text-xs ${
                          page.is_published 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {getStatusLabel(page.is_published)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handlePreviewPage(page.slug)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditPage(page.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">•••</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDuplicatePage(page.id)}>
                              {language === 'ar' ? 'نسخ الصفحة' : 'Duplicate page'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeletePage(page.id)}
                            >
                              {language === 'ar' ? 'حذف الصفحة' : 'Delete page'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
        
        {/* Create Landing Page Dialog */}
        <CreateLandingPageDialog 
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
        />
      </div>
    </AppLayout>
  );
};

export default LandingPages;
