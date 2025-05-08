
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';

const LandingPageView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useI18n();
  const [content, setContent] = useState<any>(null);
  const [page, setPage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (slug) {
      fetchPageData();
    }
  }, [slug]);

  const fetchPageData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch the page data by slug
      const { data: pageData, error: pageError } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('slug', slug)
        .single();
        
      if (pageError) throw pageError;
      
      setPage(pageData);
      
      // Fetch the template content
      const { data: templateData, error: templateError } = await supabase
        .from('landing_page_templates')
        .select('*')
        .eq('page_id', pageData.id)
        .single();
        
      if (templateError) throw templateError;
      
      setContent(templateData.content);
    } catch (error) {
      console.error('Error fetching page:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!page) {
    return <div className="flex items-center justify-center min-h-screen">Page not found</div>;
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
        <div className="text-center p-8">No content available</div>
      )}
    </div>
  );
};

export default LandingPageView;
