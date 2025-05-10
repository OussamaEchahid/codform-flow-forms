
import React from 'react';
import { useI18n } from '@/lib/i18n';

interface LandingPagePreviewProps {
  content: any;
  mode: 'desktop' | 'tablet' | 'mobile';
  selectedSection: string | null;
  onSelectSection: (sectionId: string | null) => void;
}

const LandingPagePreview: React.FC<LandingPagePreviewProps> = ({
  content,
  mode,
  selectedSection,
  onSelectSection
}) => {
  const { language } = useI18n();

  const getContainerStyles = () => {
    switch (mode) {
      case 'mobile':
        return 'max-w-[375px] mx-auto';
      case 'tablet':
        return 'max-w-[768px] mx-auto';
      default:
        return 'max-w-[1200px] mx-auto';
    }
  };

  const renderSection = (section: any) => {
    const isSelected = selectedSection === section.id;

    const wrapperClasses = `relative mb-4 ${
      isSelected ? 'outline outline-2 outline-blue-500' : ''
    }`;

    switch (section.type) {
      case 'hero':
        return (
          <div 
            className={wrapperClasses} 
            onClick={() => onSelectSection(section.id)}
          >
            <div className="bg-gray-100 p-6 md:p-10 rounded-lg">
              <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  {language === 'ar' ? section.title.ar : section.title.en}
                </h1>
                <p className="text-lg mb-6">
                  {language === 'ar' ? section.subtitle.ar : section.subtitle.en}
                </p>
                <button className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium">
                  {language === 'ar' ? section.buttonText.ar : section.buttonText.en}
                </button>
                {section.image && (
                  <div className="mt-8">
                    <img 
                      src={section.image} 
                      className="max-w-full h-auto mx-auto" 
                      alt="Hero"
                    />
                  </div>
                )}
              </div>
            </div>
            {renderSectionBadge(section)}
          </div>
        );
      
      case 'products':
        return (
          <div 
            className={wrapperClasses} 
            onClick={() => onSelectSection(section.id)}
          >
            <div className="bg-white p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-6 text-center">
                {language === 'ar' ? section.title.ar : section.title.en}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {section.items && section.items.map((item: any) => (
                  <div key={item.id} className="border rounded-lg overflow-hidden">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full aspect-square object-cover"
                    />
                    <div className="p-3">
                      <p className="font-medium">{item.name}</p>
                      {item.price && <p className="text-blue-600">{item.price}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {renderSectionBadge(section)}
          </div>
        );
      
      case 'faq':
        return (
          <div 
            className={wrapperClasses} 
            onClick={() => onSelectSection(section.id)}
          >
            <div className="bg-amber-50 p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-2 text-center">
                {language === 'ar' ? section.title.ar : section.title.en}
              </h2>
              {section.subtitle && (
                <p className="text-center text-gray-600 mb-6">
                  {language === 'ar' ? section.subtitle.ar : section.subtitle.en}
                </p>
              )}
              <div className="space-y-3">
                {section.items && section.items.map((item: any) => (
                  <div key={item.id} className="border-b pb-3">
                    <details className="group">
                      <summary className="flex justify-between items-center font-medium cursor-pointer list-none">
                        <span>{language === 'ar' ? item.question.ar : item.question.en}</span>
                        <span className="transition group-open:rotate-180">▼</span>
                      </summary>
                      <p className="text-neutral-600 mt-3">
                        {language === 'ar' ? item.answer.ar : item.answer.en}
                      </p>
                    </details>
                  </div>
                ))}
              </div>
            </div>
            {renderSectionBadge(section)}
          </div>
        );
      
      case 'cod_form':
        return (
          <div 
            className={wrapperClasses} 
            onClick={() => onSelectSection(section.id)}
          >
            <div className="bg-white p-6 rounded-lg">
              <div className="grid md:grid-cols-2 gap-6">
                {section.image && (
                  <div className="md:order-2">
                    <img 
                      src={section.image} 
                      alt="Product" 
                      className="w-full rounded-lg"
                    />
                  </div>
                )}
                <div className="md:order-1">
                  <h2 className="text-2xl font-bold mb-2">
                    {language === 'ar' ? section.title.ar : section.title.en}
                  </h2>
                  <p className="text-gray-600 mb-6">
                    {language === 'ar' ? section.subtitle.ar : section.subtitle.en}
                  </p>
                  <div className="border rounded-lg p-4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">
                        {language === 'ar' ? 'الاسم' : 'Name'}
                      </label>
                      <input 
                        type="text" 
                        className="w-full border rounded-md p-2" 
                        disabled
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">
                        {language === 'ar' ? 'رقم الهاتف' : 'Phone'}
                      </label>
                      <input 
                        type="text" 
                        className="w-full border rounded-md p-2" 
                        disabled
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">
                        {language === 'ar' ? 'العنوان' : 'Address'}
                      </label>
                      <input 
                        type="text" 
                        className="w-full border rounded-md p-2" 
                        disabled
                      />
                    </div>
                    <button 
                      className="w-full bg-blue-600 text-white py-2 rounded-md font-medium"
                      disabled
                    >
                      {language === 'ar' ? 'إرسال الطلب' : 'Submit Order'}
                    </button>
                    <p className="text-xs text-center text-gray-500 mt-2">
                      {language === 'ar' 
                        ? 'سيتم استبدال هذا النموذج بالنموذج الذي تختاره' 
                        : 'This form will be replaced by your selected form'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {renderSectionBadge(section)}
          </div>
        );
      
      case 'image':
        return (
          <div 
            className={wrapperClasses} 
            onClick={() => onSelectSection(section.id)}
          >
            <img 
              src={section.image} 
              alt={language === 'ar' ? section.alt?.ar : section.alt?.en} 
              className="w-full h-auto"
            />
            {renderSectionBadge(section)}
          </div>
        );
      
      case 'testimonial':
        return (
          <div 
            className={wrapperClasses} 
            onClick={() => onSelectSection(section.id)}
          >
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-6 text-center">
                {language === 'ar' ? section.title.ar : section.title.en}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {section.items && section.items.map((item: any) => (
                  <div key={item.id} className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden mr-3">
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
                    <p className="text-gray-600">
                      {language === 'ar' ? item.text.ar : item.text.en}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            {renderSectionBadge(section)}
          </div>
        );
      
      case 'video':
        return (
          <div 
            className={wrapperClasses} 
            onClick={() => onSelectSection(section.id)}
          >
            <div className="p-4">
              <h2 className="text-xl font-bold mb-4 text-center">
                {language === 'ar' ? section.title.ar : section.title.en}
              </h2>
              <div className="relative aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                {section.videoUrl ? (
                  <iframe
                    src={section.videoUrl}
                    className="w-full h-full absolute inset-0"
                    title="Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">
                      {language === 'ar' ? 'سيتم عرض الفيديو هنا' : 'Video will appear here'}
                    </p>
                  </div>
                )}
              </div>
            </div>
            {renderSectionBadge(section)}
          </div>
        );
      
      default:
        return (
          <div 
            className={wrapperClasses} 
            onClick={() => onSelectSection(section.id)}
          >
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <p className="text-gray-500">
                {language === 'ar' 
                  ? `قسم غير معروف: ${section.type}` 
                  : `Unknown section type: ${section.type}`}
              </p>
            </div>
            {renderSectionBadge(section)}
          </div>
        );
    }
  };

  const renderSectionBadge = (section: any) => {
    const sectionName = 
      section.type === 'hero' ? (language === 'ar' ? 'بانر رئيسي' : 'Hero') :
      section.type === 'products' ? (language === 'ar' ? 'منتجات' : 'Products') :
      section.type === 'faq' ? (language === 'ar' ? 'أسئلة شائعة' : 'FAQ') :
      section.type === 'cod_form' ? (language === 'ar' ? 'نموذج طلب' : 'Order Form') :
      section.type === 'image' ? (language === 'ar' ? 'صورة' : 'Image') :
      section.type === 'testimonial' ? (language === 'ar' ? 'شهادات' : 'Testimonials') :
      section.type === 'video' ? (language === 'ar' ? 'فيديو' : 'Video') :
      section.type;

    return (
      <div className="absolute top-0 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-br">
        {sectionName}
      </div>
    );
  };

  if (!content || !content.sections || content.sections.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-10 max-w-md">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-xl font-medium mb-2">
            {language === 'ar' ? 'لا يوجد محتوى بعد!' : 'No content yet!'}
          </h3>
          <p className="text-gray-500">
            {language === 'ar' 
              ? 'أضف قسمًا جديدًا من شريط الأقسام لبدء بناء صفحتك.' 
              : 'Add a new section from the sections panel to start building your page.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white p-4 rounded-lg shadow ${getContainerStyles()}`}>
      {content.sections.map((section: any) => (
        <div key={section.id}>
          {renderSection(section)}
        </div>
      ))}
    </div>
  );
};

export default LandingPagePreview;
