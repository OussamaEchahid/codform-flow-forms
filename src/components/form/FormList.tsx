
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
import { Edit, MoreVertical, Trash, Eye, EyeOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FormListProps {
  forms: FormData[];
  isLoading: boolean;
  onSelectForm: (formId: string) => void;
}

const FormList: React.FC<FormListProps> = ({ forms, isLoading, onSelectForm }) => {
  const [formToDelete, setFormToDelete] = useState<string | null>(null);
  const { publishForm, deleteForm } = useFormTemplates();
  
  // Remove duplicate forms by ID
  const uniqueForms = Array.isArray(forms) ? forms.reduce((acc: FormData[], current) => {
    const existingForm = acc.find(form => form.id === current.id);
    if (!existingForm && current.id) {
      acc.push(current);
    }
    return acc;
  }, []) : [];

  const handlePublishToggle = async (formId: string, currentStatus: boolean) => {
    try {
      await publishForm(formId, !currentStatus);
    } catch (error) {
      console.error("Error toggling form publish status:", error);
    }
  };

  const handleDelete = async () => {
    if (formToDelete) {
      try {
        await deleteForm(formToDelete);
        setFormToDelete(null);
      } catch (error) {
        console.error("Error deleting form:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!Array.isArray(forms) || uniqueForms.length === 0) {
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
      {uniqueForms.map((form) => (
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
            <p className="text-sm text-gray-600 line-clamp-2">{form.description || 'لا يوجد وصف'}</p>
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
