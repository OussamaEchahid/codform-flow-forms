
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import NotFound from '@/pages/NotFound';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// Section components import will go here as we develop them
const LandingHeroSection = ({ data, language }: { data: any, language: string }) => {
  return (
    <div className="relative bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white py-16">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {language === 'ar' ? data.title?.ar : data.title?.en}
            </h1>
            <p className="text-lg md:text-xl mb-6">
              {language === 'ar' ? data.subtitle?.ar : data.subtitle?.en}
            </p>
            {data.buttonText && (
              <Button 
                asChild
                size="lg" 
                className="font-semibold"
              >
                <a href={data.buttonUrl || '#'}>
                  {language === 'ar' ? data.buttonText.ar : data.buttonText.en}
                </a>
              </Button>
            )}
          </div>
          <div className="md:w-1/2">
            {data.image && (
              <img 
                src={data.image} 
                alt="Hero" 
                className="rounded-lg shadow-lg w-full h-auto"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductsSection = ({ data, language }: { data: any, language: string }) => {
  return (
    <div className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">
          {language === 'ar' ? data.title?.ar : data.title?.en}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {data.items?.map((item: any) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-48 overflow-hidden">
                <img 
                  src={item.image || '/placeholder.svg'} 
                  alt={item.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
                <p className="text-gray-600 mb-4">{item.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold">{item.price}</span>
                  <Button>
                    {language === 'ar' ? 'اطلب الآن' : 'Order Now'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const FAQSection = ({ data, language }: { data: any, language: string }) => {
  return (
    <div className="py-16 bg-white">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-4">
          {language === 'ar' ? data.title?.ar : data.title?.en}
        </h2>
        <p className="text-lg text-center text-gray-600 mb-12">
          {language === 'ar' ? data.subtitle?.ar : data.subtitle?.en}
        </p>
        <div className="max-w-3xl mx-auto divide-y divide-gray-200">
          {data.items?.map((item: any) => (
            <div key={item.id} className="py-6">
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {language === 'ar' ? item.question?.ar : item.question?.en}
              </h3>
              <p className="text-gray-600">
                {language === 'ar' ? item.answer?.ar : item.answer?.en}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CODFormSection = ({ data, language }: { data: any, language: string }) => {
  // This section would typically include a form component
  // For now we'll just show a placeholder
  return (
    <div className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
            <h2 className="text-3xl font-bold mb-4">
              {language === 'ar' ? data.title?.ar : data.title?.en}
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              {language === 'ar' ? data.subtitle?.ar : data.subtitle?.en}
            </p>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-center text-gray-500 mb-4">
                {language === 'ar' ? 'نموذج الطلب سيظهر هنا' : 'Order form would appear here'}
              </p>
              <Button className="w-full">
                {language === 'ar' ? 'تقديم الطلب' : 'Submit Order'}
              </Button>
            </div>
          </div>
          <div className="md:w-1/2">
            {data.image && (
              <img 
                src={data.image} 
                alt="Product" 
                className="rounded-lg shadow-lg w-full h-auto"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ImageSection = ({ data, language }: { data: any, language: string }) => {
  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-center">
          <a href={data.link || '#'} className={!data.link ? 'pointer-events-none' : ''}>
            <img 
              src={data.image || '/placeholder.svg'} 
              alt={language === 'ar' ? data.alt?.ar : data.alt?.en} 
              className="rounded-lg shadow-md max-w-full h-auto"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
          </a>
        </div>
      </div>
    </div>
  );
};

const TestimonialSection = ({ data, language }: { data: any, language: string }) => {
  return (
    <div className="py-16 bg-white">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">
          {language === 'ar' ? data.title?.ar : data.title?.en}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {data.items?.map((item: any) => (
            <div key={item.id} className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full overflow-hidden mr-4">
                  <img 
                    src={item.image || '/placeholder.svg'} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                </div>
                <div>
                  <h3 className="font-medium">{item.name}</h3>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < item.rating ? "text-yellow-400" : "text-gray-300"}>★</span>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-600">"{language === 'ar' ? item.text?.ar : item.text?.en}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const VideoSection = ({ data, language }: { data: any, language: string }) => {
  return (
    <div className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-8">
          {language === 'ar' ? data.title?.ar : data.title?.en}
        </h2>
        <div className="max-w-4xl mx-auto">
          {data.videoUrl ? (
            <div className="aspect-w-16 aspect-h-9">
              <iframe
                className="w-full h-[480px] rounded-lg shadow-lg"
                src={data.videoUrl}
                title="Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            <div 
              className="bg-gray-200 rounded-lg flex items-center justify-center h-[480px]"
              style={{backgroundImage: `url(${data.poster || '/placeholder.svg'})`}}
            >
              <div className="bg-white bg-opacity-75 p-4 rounded-lg">
                {language === 'ar' ? 'لم يتم تعيين رابط الفيديو' : 'Video URL not set'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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
        .select('*, products(name, description, price, image_url)')
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

  // Render the appropriate section component based on section type
  const renderSection = (section: any) => {
    switch (section.type) {
      case 'hero':
        return <LandingHeroSection data={section} language={language} />;
      case 'products':
        return <ProductsSection data={section} language={language} />;
      case 'faq':
        return <FAQSection data={section} language={language} />;
      case 'cod_form':
        return <CODFormSection data={section} language={language} />;
      case 'image':
        return <ImageSection data={section} language={language} />;
      case 'testimonial':
        return <TestimonialSection data={section} language={language} />;
      case 'video':
        return <VideoSection data={section} language={language} />;
      default:
        return (
          <div className="p-4 text-center">
            <p className="text-gray-600">{language === 'ar' ? 'نوع قسم غير معروف' : 'Unknown section type'}</p>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
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
        <Button asChild>
          <a href="/">{language === 'ar' ? 'العودة إلى الصفحة الرئيسية' : 'Return to Home'}</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="landing-page min-h-screen">
      {/* Display product information if a product is associated */}
      {page.products && (
        <div className="bg-gray-100 p-4 text-center">
          <div className="container mx-auto">
            <h2 className="font-semibold">{page.products.name}</h2>
            {page.products.price && (
              <p className="text-xl font-bold mt-1">{page.products.price}</p>
            )}
          </div>
        </div>
      )}
      
      {content && content.sections ? (
        content.sections.map((section: any) => (
          <div key={section.id}>
            {renderSection(section)}
          </div>
        ))
      ) : (
        <div className="text-center p-16">
          <h2 className="text-2xl font-bold mb-4">{page.title}</h2>
          <p className="text-gray-600">
            {language === 'ar' ? 'لا يوجد محتوى متاح' : 'No content available'}
          </p>
        </div>
      )}
    </div>
  );
};

export default LandingPageView;
