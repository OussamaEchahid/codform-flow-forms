
import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Edit, MoreVertical, Trash, Eye, EyeOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { FormData } from '@/lib/hooks/form/types';
import { useI18n } from '@/lib/i18n';

interface FormListItemProps {
  form: FormData;
  onSelectForm: (formId: string) => void;
  onPublishToggle: (formId: string, currentStatus: boolean) => void;
  onDeleteRequest: (formId: string) => void;
  isActionInProgress: boolean;
}

const FormListItem: React.FC<FormListItemProps> = ({
  form,
  onSelectForm,
  onPublishToggle,
  onDeleteRequest,
  isActionInProgress
}) => {
  const { language } = useI18n();
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
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
              <DropdownMenuItem 
                onClick={() => {
                  if (!isActionInProgress) {
                    onSelectForm(form.id);
                  }
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                <span>تعديل</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  if (!isActionInProgress) {
                    onPublishToggle(form.id, form.is_published || false);
                  }
                }}
              >
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
                onClick={() => {
                  if (!isActionInProgress) {
                    onDeleteRequest(form.id);
                  }
                }}
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
            {formatDistanceToNow(new Date(form.created_at || ''), { 
              addSuffix: true, 
              locale: language === 'ar' ? ar : undefined 
            })}
          </span>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">{form.description || 'لا يوجد وصف'}</p>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button 
          variant="default" 
          onClick={() => {
            if (!isActionInProgress) {
              onSelectForm(form.id);
            }
          }}
          className="w-full"
          disabled={isActionInProgress}
        >
          عرض وتعديل
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FormListItem;
