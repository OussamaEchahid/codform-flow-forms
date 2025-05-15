
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
import { Plus, Trash2, Edit, Copy, FileCheck, Eye, ShoppingCart, Package } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface FormBuilderDashboardProps {
  initialForms?: any[];
  forceRefresh?: boolean;
}

const FormBuilderDashboard: React.FC<FormBuilderDashboardProps> = ({ 
  initialForms = [],
  forceRefresh = false
}) => {
  const navigate = useNavigate();
  const { forms, fetchForms, deleteForm } = useFormTemplates();
  const { t, language } = useI18n();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [formList, setFormList] = useState(initialForms.length > 0 ? initialForms : forms);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Fetch forms data only once on initial load or when forceRefresh changes
  const initializeData = useCallback(async () => {
    if (isInitialized && !forceRefresh) return;
    
    setIsLoading(true);
    await fetchForms();
    setIsInitialized(true);
    setIsLoading(false);
  }, [fetchForms, forceRefresh, isInitialized]);
  
  useEffect(() => {
    initializeData();
  }, [initializeData]);
  
  // Update formList when initialForms or forms change
  useEffect(() => {
    if (initialForms.length > 0 || forms.length > 0) {
      setFormList(initialForms.length > 0 ? initialForms : forms);
    }
  }, [forms, initialForms]);

  // Fetch product counts for each form - with useCallback to prevent unnecessary rerenders
  const fetchProductCounts = useCallback(async () => {
    if (formList.length === 0) return;
    
    const formIds = formList.map(form => form.id);
    
    try {
      const { data, error } = await supabase
        .from('shopify_product_settings')
        .select('form_id, product_id')
        .in('form_id', formIds);
        
      if (error) {
        console.error('Error fetching product associations:', error);
        return;
      }
      
      // Count products per form
      const counts: Record<string, number> = {};
      
      if (data) {
        data.forEach(item => {
          if (!counts[item.form_id]) {
            counts[item.form_id] = 0;
          }
          counts[item.form_id]++;
        });
      }
      
      setProductCounts(counts);
    } catch (error) {
      console.error('Error in fetchProductCounts:', error);
    }
  }, [formList]);
  
  useEffect(() => {
    fetchProductCounts();
  }, [fetchProductCounts]);
  
  const filteredForms = formList.filter(form => 
    form.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleCreateForm = () => {
    navigate('/form-builder/new');
  };
  
  const handleDeleteForm = async (formId: string) => {
    try {
      await deleteForm(formId);
      // Using toast from sonner correctly
      toast.success(language === 'ar' ? 'تم حذف النموذج بنجاح' : 'Form deleted successfully');
    } catch (error) {
      console.error('Error deleting form:', error);
      toast.error(language === 'ar' ? 'فشل حذف النموذج' : 'Failed to delete form');
    }
  };
  
  const handleDuplicateForm = async (formId: string) => {
    try {
      // Create a new form based on the existing one
      const formToDuplicate = forms.find(form => form.id === formId);
      if (!formToDuplicate) return;
      
      // We'll use the existing saveForm function to create a duplicate
      const formData = {
        ...formToDuplicate,
        title: `${formToDuplicate.title} (${language === 'ar' ? 'نسخة' : 'Copy'})`,
      };
      
      // Remove the ID so a new one is generated
      delete formData.id;
      
      await fetchForms(); // Refresh the list after duplication
      // Using toast from sonner correctly
      toast.success(language === 'ar' ? 'تم نسخ النموذج بنجاح' : 'Form duplicated successfully');
    } catch (error) {
      console.error('Error duplicating form:', error);
      toast.error(language === 'ar' ? 'فشل نسخ النموذج' : 'Failed to duplicate form');
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
  
  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
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
                      {form.title}
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
                    <TableCell className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                      >
                        <Link to={`/form/${form.id}/preview`}>
                          <Eye size={16} />
                        </Link>
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDuplicateForm(form.id)}
                      >
                        <Copy size={16} />
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
                  <TableCell colSpan={5} className="text-center py-8">
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
    </div>
  );
};

export default FormBuilderDashboard;
