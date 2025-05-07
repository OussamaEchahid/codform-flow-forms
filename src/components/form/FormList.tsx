
import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import FormPreview from '@/components/form/FormPreview';
import { useI18n } from '@/lib/i18n';

interface FormListProps {
  forms: FormData[];
  isLoading: boolean;
  onSelectForm: (formId: string) => void;
}

const FormList: React.FC<FormListProps> = ({ forms, isLoading, onSelectForm }) => {
  const { language } = useI18n();
  const [formToDelete, setFormToDelete] = useState<string | null>(null);
  const [previewForm, setPreviewForm] = useState<FormData | null>(null);
  const { publishForm, deleteForm } = useFormTemplates();
  const [uniqueForms, setUniqueForms] = useState<FormData[]>([]);

  // Remove duplicates based on form ID
  useState(() => {
    const uniqueFormsMap = new Map();
    forms.forEach(form => {
      if (!uniqueFormsMap.has(form.id)) {
        uniqueFormsMap.set(form.id, form);
      }
    });
    setUniqueForms(Array.from(uniqueFormsMap.values()));
  });

  const handlePublishToggle = async (formId: string, currentStatus: boolean) => {
    await publishForm(formId, !currentStatus);
  };

  const handleDelete = async () => {
    if (formToDelete) {
      await deleteForm(formToDelete);
      setFormToDelete(null);
    }
  };

  const openPreview = (form: FormData) => {
    setPreviewForm(form);
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

  // Deduplicate forms based on ID
  const deduplicatedForms = Array.from(
    new Map(forms.map(form => [form.id, form])).values()
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {deduplicatedForms.map((form) => (
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
                  <DropdownMenuItem onClick={() => openPreview(form)}>
                    <Eye className="mr-2 h-4 w-4" />
                    <span>معاينة</span>
                  </DropdownMenuItem>
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
            
            {/* Form preview thumbnail */}
            <div className="mt-4 border rounded-md overflow-hidden h-32">
              <div className="h-full w-full overflow-hidden bg-gray-50 flex items-center justify-center">
                {form.data && form.data.length > 0 ? (
                  <div className="w-full h-full p-2 transform scale-[0.6] origin-top">
                    <div className="bg-white rounded shadow p-2 w-full h-full">
                      <div className="rounded p-1" 
                        style={{ backgroundColor: form.primaryColor || '#9b87f5' }}>
                        <div className="text-xs text-white">{form.title}</div>
                      </div>
                      <div className="text-[10px] mt-2">
                        {form.data[0]?.fields?.length} حقول
                      </div>
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-400 text-xs">معاينة غير متاحة</span>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4">
            <div className="w-full grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                onClick={() => openPreview(form)}
                className="w-full"
              >
                معاينة
              </Button>
              <Button 
                variant="default" 
                onClick={() => onSelectForm(form.id)}
                className="w-full"
              >
                تعديل
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}

      {/* Form Preview Dialog */}
      <Dialog open={!!previewForm} onOpenChange={(open) => !open && setPreviewForm(null)}>
        <DialogContent className="max-w-3xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-right">معاينة النموذج: {previewForm?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {previewForm && (
              <FormPreview
                formTitle={previewForm.title}
                formDescription={previewForm.description}
                currentStep={1}
                totalSteps={previewForm.data?.length || 1}
                formStyle={{
                  primaryColor: previewForm.primaryColor,
                  borderRadius: previewForm.borderRadius,
                  fontSize: previewForm.fontSize,
                  buttonStyle: previewForm.buttonStyle
                }}
                fields={previewForm.data?.[0]?.fields || []}
                submitButtonText={previewForm.submitButtonText}
                formLanguage={previewForm.formLanguage || 'ar'}
              >
                <div className="text-center p-6">
                  <p className="text-gray-500 mb-4">لا توجد حقول في هذا النموذج</p>
                </div>
              </FormPreview>
            )}
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="default" onClick={() => onSelectForm(previewForm?.id || '')}>
              تعديل النموذج
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
