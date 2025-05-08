
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';

interface LandingPage {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
}

interface Template {
  id: string;
  page_id: string;
  content: any;
}

const LandingPageView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useI18n();
  const [page, setPage] = useState<LandingPage | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (slug) {
      fetchPageBySlug();
    }
  }, [slug]);

  const fetchPageBySlug = async () => {
    try {
      setIsLoading(true);
      
      // First fetch the page data
      const { data: pageData, error: pageError } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();
        
      if (pageError) {
        console.error('Error fetching page:', pageError);
        setIsLoading(false);
        return;
      }
      
      setPage(pageData);
      
      // Then fetch the template data
      const { data: templateData, error: templateError } = await supabase
        .from('landing_page_templates')
        .select('*')
        .eq('page_id', pageData.id)
        .single();
        
      if (templateError) {
        console.error('Error fetching template:', templateError);
        setIsLoading(false);
        return;
      }
      
      setTemplate(templateData);
    } catch (error) {
      console.error('Error loading landing page:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner h-8 w-8 border-4 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!page || !template) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h1 className="text-2xl font-bold mb-2">
          {language === 'ar' ? 'الصفحة غير موجودة' : 'Page Not Found'}
        </h1>
        <p className="text-gray-600 max-w-md">
          {language === 'ar' 
            ? 'عذراً، الصفحة التي تبحث عنها غير موجودة أو غير منشورة حالياً.' 
            : 'Sorry, the page you are looking for does not exist or is not currently published.'}
        </p>
      </div>
    );
  }

  const renderSection = (section: any) => {
    switch (section.type) {
      case 'hero':
        return (
          <section key={section.id} className="bg-gray-100 py-12 md:py-20">
            <div className="container mx-auto px-4 max-w-6xl">
              <div className="text-center mb-10">
                <h1 className="text-3xl md:text-5xl font-bold mb-4">
                  {language === 'ar' ? section.title.ar : section.title.en}
                </h1>
                <p className="text-lg md:text-xl max-w-3xl mx-auto">
                  {language === 'ar' ? section.subtitle.ar : section.subtitle.en}
                </p>
                {section.buttonText && section.buttonUrl && (
                  <div className="mt-8">
                    <a 
                      href={section.buttonUrl} 
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md font-medium inline-block"
                    >
                      {language === 'ar' ? section.buttonText.ar : section.buttonText.en}
                    </a>
                  </div>
                )}
              </div>
              {section.image && (
                <div className="mt-8">
                  <img 
                    src={section.image} 
                    alt="Hero" 
                    className="max-w-full h-auto mx-auto rounded-lg shadow-lg"
                  />
                </div>
              )}
            </div>
          </section>
        );
      
      case 'products':
        return (
          <section key={section.id} className="py-12 bg-white">
            <div className="container mx-auto px-4 max-w-6xl">
              <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
                {language === 'ar' ? section.title.ar : section.title.en}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {section.items && section.items.map((item: any) => (
                  <div key={item.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full aspect-square object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-medium text-lg">{item.name}</h3>
                      {item.price && <p className="text-blue-600 font-bold mt-1">{item.price}</p>}
                      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md mt-3">
                        {language === 'ar' ? 'أضف للسلة' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      
      case 'faq':
        return (
          <section key={section.id} className="py-12 bg-amber-50">
            <div className="container mx-auto px-4 max-w-4xl">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 text-center">
                {language === 'ar' ? section.title.ar : section.title.en}
              </h2>
              {section.subtitle && (
                <p className="text-center text-gray-600 mb-8 max-w-3xl mx-auto">
                  {language === 'ar' ? section.subtitle.ar : section.subtitle.en}
                </p>
              )}
              <div className="space-y-4 bg-white rounded-lg p-6 shadow-sm">
                {section.items && section.items.map((item: any, index: number) => (
                  <div key={item.id} className={index < section.items.length - 1 ? "border-b pb-4 mb-4" : ""}>
                    <details className="group">
                      <summary className="flex justify-between items-center font-medium cursor-pointer list-none p-2 rounded-md hover:bg-gray-50">
                        <span>{language === 'ar' ? item.question.ar : item.question.en}</span>
                        <span className="transition group-open:rotate-180">▼</span>
                      </summary>
                      <p className="text-gray-600 mt-3 pl-2">
                        {language === 'ar' ? item.answer.ar : item.answer.en}
                      </p>
                    </details>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      
      case 'cod_form':
        return (
          <section key={section.id} className="py-12 bg-white">
            <div className="container mx-auto px-4 max-w-6xl">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {section.image && (
                  <div className="md:order-2">
                    <img 
                      src={section.image} 
                      alt="Product" 
                      className="w-full rounded-lg shadow-lg"
                    />
                  </div>
                )}
                <div className="md:order-1">
                  <h2 className="text-2xl md:text-3xl font-bold mb-3">
                    {language === 'ar' ? section.title.ar : section.title.en}
                  </h2>
                  <p className="text-gray-600 mb-6">
                    {language === 'ar' ? section.subtitle.ar : section.subtitle.en}
                  </p>
                  
                  {section.formId ? (
                    <div className="codform-container" data-form-id={section.formId}></div>
                  ) : (
                    <div className="border rounded-lg p-6 bg-gray-50">
                      <p className="text-center text-gray-500">
                        {language === 'ar' 
                          ? 'لم يتم تعيين نموذج بعد. يرجى تحديد نموذج في إعدادات القسم.' 
                          : 'No form has been set yet. Please select a form in the section settings.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        );
      
      case 'image':
        return (
          <section key={section.id} className="py-4">
            <div className="container mx-auto px-4">
              {section.link ? (
                <a href={section.link} target="_blank" rel="noopener noreferrer">
                  <img 
                    src={section.image} 
                    alt={language === 'ar' ? section.alt?.ar : section.alt?.en}
                    className="w-full h-auto rounded-lg" 
                  />
                </a>
              ) : (
                <img 
                  src={section.image} 
                  alt={language === 'ar' ? section.alt?.ar : section.alt?.en}
                  className="w-full h-auto rounded-lg" 
                />
              )}
            </div>
          </section>
        );
      
      case 'testimonial':
        return (
          <section key={section.id} className="py-12 bg-gray-50">
            <div className="container mx-auto px-4 max-w-6xl">
              <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
                {language === 'ar' ? section.title.ar : section.title.en}
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {section.items && section.items.map((item: any) => (
                  <div key={item.id} className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                        <img 
                          src={item.image || '/placeholder.svg'} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <div className="flex text-yellow-400">
                          {'★'.repeat(item.rating || 5)}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 italic">"{language === 'ar' ? item.text.ar : item.text.en}"</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      
      case 'video':
        return (
          <section key={section.id} className="py-12">
            <div className="container mx-auto px-4 max-w-4xl">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">
                {language === 'ar' ? section.title.ar : section.title.en}
              </h2>
              <div className="relative aspect-video rounded-lg overflow-hidden shadow-lg">
                {section.videoUrl ? (
                  <iframe
                    src={section.videoUrl}
                    className="absolute top-0 left-0 w-full h-full"
                    title={language === 'ar' ? section.title.ar : section.title.en}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <p className="text-gray-500">
                      {language === 'ar' ? 'الفيديو غير متوفر' : 'Video not available'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      {template && template.content && template.content.sections && (
        <div>
          {template.content.sections.map((section: any) => renderSection(section))}
        </div>
      )}
    </div>
  );
};

export default LandingPageView;
