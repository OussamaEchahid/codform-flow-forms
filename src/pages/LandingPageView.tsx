
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import NotFound from '@/pages/NotFound';

const LandingPageView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useI18n();
  const [content, setContent] = useState<any>(null);
  const [page, setPage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchPageData();
    }
  }, [slug]);

  const fetchPageData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch the page data by slug
      const { data: pageData, error: pageError } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('slug', slug)
        .single();
        
      if (pageError) {
        if (pageError.code === 'PGRST116') {
          throw new Error('Page not found');
        }
        throw pageError;
      }
      
      if (!pageData.is_published) {
        throw new Error('This page is not published');
      }
      
      setPage(pageData);
      
      // Fetch the template content
      const { data: templateData, error: templateError } = await supabase
        .from('landing_page_templates')
        .select('*')
        .eq('page_id', pageData.id)
        .single();
        
      if (templateError) {
        if (templateError.code !== 'PGRST116') {
          throw templateError;
        }
      }
      
      if (templateData) {
        setContent(templateData.content);
      }
    } catch (error: any) {
      console.error('Error fetching page:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner h-8 w-8 border-4 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p>{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <h1 className="text-3xl font-bold mb-4">
          {language === 'ar' ? 'الصفحة غير موجودة' : 'Page Not Found'}
        </h1>
        <p className="text-gray-600 mb-8">
          {error || (language === 'ar' 
            ? 'الصفحة التي تبحث عنها غير موجودة أو تم حذفها.' 
            : 'The page you are looking for does not exist or has been deleted.')}
        </p>
      </div>
    );
  }

  return (
    <div className="landing-page">
      {content && content.sections ? (
        content.sections.map((section: any) => (
          <div key={section.id} className="mb-8">
            {/* Here would be the dynamic rendering of different section types */}
            <div className="p-4 text-center">
              {section.title && (
                <h2 className="text-2xl font-bold">
                  {language === 'ar' ? section.title.ar : section.title.en}
                </h2>
              )}
              {section.subtitle && (
                <p className="mt-2">
                  {language === 'ar' ? section.subtitle.ar : section.subtitle.en}
                </p>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center p-8">
          {language === 'ar' ? 'لا يوجد محتوى متاح' : 'No content available'}
        </div>
      )}
    </div>
  );
};

export default LandingPageView;
