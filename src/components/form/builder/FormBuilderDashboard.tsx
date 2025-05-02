
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Search } from 'lucide-react';

const FormBuilderDashboard = () => {
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const { forms, isLoading, fetchForms } = useFormTemplates();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredForms, setFilteredForms] = useState<any[]>([]);
  const { user, shopifyConnected } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    console.log('FormBuilderDashboard: Mounted, fetching forms...');
    fetchForms();
  }, [fetchForms]);

  useEffect(() => {
    if (forms) {
      setFilteredForms(
        searchQuery
          ? forms.filter(
              (form) =>
                form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (form.description &&
                  form.description.toLowerCase().includes(searchQuery.toLowerCase()))
            )
          : forms
      );
    }
  }, [forms, searchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleViewForm = (formId: string) => {
    navigate(`/form-builder/${formId}`);
  };

  const handleCreateForm = useCallback(() => {
    console.log('FormBuilderDashboard: Creating new form...');
    if (!user && !shopifyConnected) {
      toast.error(
        language === 'ar'
          ? 'يجب تسجيل الدخول أو الاتصال بـ Shopify لإنشاء نموذج جديد'
          : 'You need to login or connect to Shopify to create a new form'
      );
      return;
    }
    
    setIsCreating(true);
    
    // Navigate to the new form page with a small delay to show the loading state
    setTimeout(() => {
      navigate('/form-builder/new');
      setIsCreating(false);
    }, 500);
  }, [navigate, user, shopifyConnected, language]);

  // Helper function to format relative time
  const getRelativeTimeString = (date: string) => {
    try {
      const now = new Date();
      const past = new Date(date);
      const diffInHours = Math.abs(now.getTime() - past.getTime()) / 36e5;

      if (diffInHours < 1) {
        return language === 'ar' ? 'منذ أقل من ساعة' : 'less than an hour ago';
      } else if (diffInHours < 24) {
        const hours = Math.floor(diffInHours);
        return language === 'ar' 
          ? `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`
          : `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
      } else {
        const days = Math.floor(diffInHours / 24);
        return language === 'ar'
          ? `منذ ${days} ${days === 1 ? 'يوم' : 'أيام'}`
          : `${days} ${days === 1 ? 'day' : 'days'} ago`;
      }
    } catch (e) {
      return '';
    }
  };

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // If user is not logged in and not connected to Shopify
  if (!user && !shopifyConnected && !isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-xl mx-auto text-center bg-yellow-50 border border-yellow-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">
            {language === 'ar' ? 'تسجيل الدخول مطلوب' : 'Login Required'}
          </h2>
          <p className="mb-6 text-lg">
            {language === 'ar'
              ? 'يرجى تسجيل الدخول أو الاتصال بـ Shopify لإنشاء وتعديل النماذج'
              : 'Please login or connect to Shopify to create and edit forms'}
          </p>
          <div className="flex flex-col space-y-3">
            <Button className="w-full" onClick={() => navigate('/shopify')}>
              {language === 'ar' ? 'الاتصال بـ Shopify' : 'Connect with Shopify'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#9b87f5]"></div>
        <span className="ml-3">
          {language === 'ar' ? 'جار تحميل النماذج...' : 'Loading forms...'}
        </span>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {language === 'ar' ? 'النماذج' : 'Forms'}
          </h1>
          <p className="text-gray-500">
            {language === 'ar' ? 'إدارة نماذج الدفع عند الاستلام الخاصة بك' : 'Manage your Cash On Delivery forms'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/form-templates')}
            className="text-[#9b87f5] hover:underline"
          >
            {language === 'ar' ? 'استخدام قالب' : 'Use Template'}
          </button>
          <Button
            onClick={handleCreateForm}
            disabled={isCreating}
            className="bg-[#9b87f5] hover:bg-[#8a74e8]"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {language === 'ar' ? 'جاري الإنشاء...' : 'Creating...'}
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                {language === 'ar' ? 'إنشاء نموذج جديد' : 'Create New Form'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Search section */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-[#9b87f5] focus:border-[#9b87f5]"
          placeholder={language === 'ar' ? 'بحث في النماذج...' : 'Search forms...'}
        />
      </div>

      {/* Display the information message if no forms found after search */}
      {filteredForms.length === 0 && searchQuery && (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">
            {language === 'ar'
              ? 'لم يتم العثور على نماذج مطابقة لعبارة البحث'
              : 'No forms found matching your search query'}
          </p>
        </div>
      )}

      {/* Display the no forms message if no forms found and no search */}
      {filteredForms.length === 0 && !searchQuery && (
        <div className="text-center p-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">
            {language === 'ar' ? 'لا توجد نماذج بعد' : 'No Forms Yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {language === 'ar'
              ? 'ابدأ بإنشاء نموذج جديد للبدء'
              : 'Start by creating a new form to get started'}
          </p>
          <Button 
            onClick={handleCreateForm}
            disabled={isCreating}
            className="bg-[#9b87f5] hover:bg-[#8a74e8]"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {language === 'ar' ? 'جاري الإنشاء...' : 'Creating...'}
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                {language === 'ar' ? 'إنشاء نموذج جديد' : 'Create New Form'}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Forms grid */}
      {filteredForms.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredForms.map((form: any) => (
            <div key={form.id} className="bg-white rounded-lg overflow-hidden shadow border border-gray-200">
              <div className="p-5 flex flex-col h-full">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg truncate" title={form.title}>
                    {form.title || (language === 'ar' ? 'نموذج بدون عنوان' : 'Untitled Form')}
                  </h3>
                  
                  <div className="flex items-center">
                    <span 
                      className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClasses(form.status || 'draft')}`}
                    >
                      {form.status === 'active' 
                        ? (language === 'ar' ? 'نشط' : 'Active')
                        : form.status === 'draft'
                        ? (language === 'ar' ? 'مسودة' : 'Draft')
                        : (language === 'ar' ? 'مؤرشف' : 'Archived')}
                    </span>
                    <button className="ml-2 text-gray-500 hover:text-gray-700">
                      {/* More options icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 mb-4 flex-grow" title={form.description}>
                  {form.description || (language === 'ar' ? 'لا يوجد وصف' : 'No description')}
                </p>
                
                <div className="text-xs text-gray-400 mb-4">
                  {form.updated_at && getRelativeTimeString(form.updated_at)}
                </div>
                
                <Button
                  onClick={() => handleViewForm(form.id)}
                  className="w-full text-center bg-transparent hover:bg-[#9b87f5] text-[#9b87f5] hover:text-white border border-[#9b87f5] transition-all ease-in-out"
                  variant="outline"
                >
                  {language === 'ar' ? 'عرض وتعديل' : 'View & Edit'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Information message for users */}
      {filteredForms.length > 0 && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-100 rounded-lg text-sm text-yellow-700">
          <p>
            {language === 'ar' 
              ? 'إذا لم يتم إعادة توجيهك بعد إنشاء النموذج، يرجى محاولة النقر على "إنشاء نموذج جديد" مرة أخرى بعد بضع ثوانٍ.' 
              : 'If you were not redirected after form creation, please try clicking "Create New Form" again after a few seconds.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default FormBuilderDashboard;
