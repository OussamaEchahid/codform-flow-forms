
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { useAuth } from '@/lib/auth';
import { Loader2, Plus, Edit, Eye, Trash, FileCheck } from 'lucide-react';
import { toast } from 'sonner';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    forms,
    isLoading,
    createDefaultForm,
    publishForm,
    deleteForm
  } = useFormTemplates();

  const handleCreateForm = async () => {
    const newForm = await createDefaultForm();
    if (newForm) {
      navigate(`/form-builder/${newForm.id}`);
    }
  };

  const handleEditForm = (formId: string) => {
    navigate(`/form-builder/${formId}`);
  };

  const handlePreviewForm = (formId: string) => {
    // هنا ستتم إضافة معاينة النموذج عند تطويره مستقبلاً
    toast.info('سيتم توفير خاصية معاينة النموذج قريباً');
  };

  const handleDeleteForm = async (formId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا النموذج؟')) {
      await deleteForm(formId);
    }
  };

  const handleTogglePublish = async (formId: string, isPublished: boolean) => {
    await publishForm(formId, !isPublished);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <p className="text-center">يرجى تسجيل الدخول للوصول إلى لوحة التحكم</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" dir="rtl">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">لوحة التحكم</h1>
          <p className="text-gray-600">قم بإدارة وتخصيص نماذج الطلب الخاصة بك للدفع عند الاستلام</p>
        </div>

        <div className="mb-6 flex justify-end">
          <Button onClick={handleCreateForm} className="flex items-center gap-2">
            <Plus size={16} />
            إنشاء نموذج جديد
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-500" />
            <p className="mt-4 text-gray-600">جاري تحميل النماذج...</p>
          </div>
        ) : forms.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <p className="text-xl font-medium mb-4">لا توجد نماذج بعد</p>
            <p className="text-gray-600 mb-6">قم بإنشاء نموذج جديد للبدء</p>
            <Button onClick={handleCreateForm} className="flex items-center gap-2">
              <Plus size={16} />
              إنشاء نموذج جديد
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map((form) => (
              <Card key={form.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50 pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`px-2 py-1 rounded-full text-xs ${form.is_published ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                      {form.is_published ? 'منشور' : 'مسودة'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(form.updated_at || form.created_at).toLocaleDateString('ar-SA')}
                    </div>
                  </div>
                  <CardTitle className="mt-2">{form.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {form.description || 'لا يوجد وصف'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <div className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                      {form.data.length} خطوة
                    </div>
                    <div className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                      {form.data.reduce((acc, step) => acc + step.fields.length, 0)} حقل
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50 flex justify-between pt-3">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteForm(form.id)} title="حذف">
                      <Trash size={16} className="text-red-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handlePreviewForm(form.id)} title="معاينة">
                      <Eye size={16} />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleTogglePublish(form.id, form.is_published)}>
                      <FileCheck size={16} className="mr-1" />
                      {form.is_published ? 'إلغاء النشر' : 'نشر'}
                    </Button>
                    <Button size="sm" onClick={() => handleEditForm(form.id)}>
                      <Edit size={16} className="mr-1" />
                      تعديل
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
