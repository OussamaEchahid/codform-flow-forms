
import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { FormData, useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { Edit, MoreVertical, Trash, Eye, EyeOff, LinkIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useShopify } from '@/hooks/useShopify';
import { useEffect } from 'react';

interface FormListProps {
  forms: FormData[];
  isLoading: boolean;
  onSelectForm: (formId: string) => void;
}

const FormList: React.FC<FormListProps> = ({ forms, isLoading, onSelectForm }) => {
  const [formToDelete, setFormToDelete] = useState<string | null>(null);
  const { publishForm, deleteForm } = useFormTemplates();
  const { getProducts } = useShopify();
  const [products, setProducts] = useState<{[key: string]: string}>({});
  
  // Load products to display their names instead of IDs
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const shopifyProducts = await getProducts();
        if (shopifyProducts && Array.isArray(shopifyProducts)) {
          const productMap: {[key: string]: string} = {};
          shopifyProducts.forEach(product => {
            // Extract the ID from the Shopify GID format if needed
            const id = product.id.includes('/') 
              ? product.id.split('/').pop() || product.id 
              : product.id;
            productMap[id] = product.title;
            productMap[product.id] = product.title;
          });
          setProducts(productMap);
        }
      } catch (error) {
        console.error('Error loading products for form list:', error);
      }
    };
    
    loadProducts();
  }, [getProducts]);

  const handlePublishToggle = async (formId: string, currentStatus: boolean) => {
    await publishForm(formId, !currentStatus);
  };

  const handleDelete = async () => {
    if (formToDelete) {
      await deleteForm(formToDelete);
      setFormToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (forms.length === 0) {
    return (
      <Card className="bg-gray-50 border-dashed">
        <CardContent className="pt-6 text-center">
          <p className="text-gray-500 mb-4">لا توجد نماذج متاحة</p>
          <p className="text-sm text-gray-400">انقر على زر "إنشاء نموذج جديد" لإضافة نموذج</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {forms.map((form) => (
        <Card key={form.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <div className={`h-2 ${form.is_published ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg truncate">{form.title}</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onSelectForm(form.id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>تعديل</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handlePublishToggle(form.id, form.is_published)}>
                    {form.is_published ? (
                      <>
                        <EyeOff className="mr-2 h-4 w-4" />
                        <span>إلغاء النشر</span>
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        <span>نشر</span>
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setFormToDelete(form.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    <span>حذف</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-2">
              <Badge variant={form.is_published ? "success" : "secondary"}>
                {form.is_published ? 'منشور' : 'مسودة'}
              </Badge>
              <span className="text-xs text-gray-500 rtl:text-left">
                {formatDistanceToNow(new Date(form.created_at), { addSuffix: true, locale: ar })}
              </span>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
              {form.description || 'لا يوجد وصف'}
            </p>
            
            {/* Display associated product if available */}
            {form.productId && (
              <div className="flex items-center text-xs text-gray-500 mt-2">
                <LinkIcon size={12} className="mr-1" />
                <span>
                  مرتبط بمنتج: {products[form.productId] || form.productId}
                </span>
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Button 
              variant="default" 
              onClick={() => onSelectForm(form.id)}
              className="w-full"
            >
              عرض وتعديل
            </Button>
          </CardFooter>
        </Card>
      ))}

      <AlertDialog open={!!formToDelete} onOpenChange={(open) => !open && setFormToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف النموذج؟</AlertDialogTitle>
            <AlertDialogDescription>
              لا يمكن التراجع عن هذا الإجراء. سيتم حذف النموذج بشكل دائم وإزالة جميع البيانات المرتبطة به.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FormList;
