import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface FormNavigationProps {
  currentSlide: number;
  totalSlides: number;
  isAutoPlaying: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onGoToSlide: (index: number) => void;
}

const FormNavigation: React.FC<FormNavigationProps> = ({
  currentSlide,
  totalSlides,
  isAutoPlaying,
  onPrevious,
  onNext,
  onGoToSlide
}) => {
  const { language } = useI18n();

  return (
    <>
      {/* أزرار التنقل */}
      <button
        onClick={onPrevious}
        className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-full p-3 shadow-xl transition-all duration-300 hover:scale-110 z-20`}
        aria-label={language === 'ar' ? 'السابق' : 'Previous'}
      >
        {language === 'ar' ? <ChevronRight className="w-5 h-5 no-flip" /> : <ChevronLeft className="w-5 h-5 no-flip" />}
      </button>

      <button
        onClick={onNext}
        className={`absolute ${language === 'ar' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-full p-3 shadow-xl transition-all duration-300 hover:scale-110 z-20`}
        aria-label={language === 'ar' ? 'التالي' : 'Next'}
      >
        {language === 'ar' ? <ChevronLeft className="w-5 h-5 no-flip" /> : <ChevronRight className="w-5 h-5 no-flip" />}
      </button>

      {/* مؤشرات الشرائح */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 bg-black/20 backdrop-blur-sm rounded-full px-4 py-2">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            onClick={() => onGoToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'bg-white scale-125 shadow-lg'
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`${language === 'ar' ? 'الانتقال للشريحة' : 'Go to slide'} ${index + 1}`}
          />
        ))}
      </div>

      {/* شارة "مباشر" للتبديل التلقائي */}
      {isAutoPlaying && (
        <div className={`absolute top-4 ${language === 'ar' ? 'left-4' : 'right-4'} bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full flex items-center space-x-1 shadow-lg`}>
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="font-medium">{language === 'ar' ? 'مباشر' : 'LIVE'}</span>
        </div>
      )}

      {/* رقم الشريحة */}
      <div className={`absolute top-4 ${language === 'ar' ? 'right-4' : 'left-4'} bg-black/20 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full`}>
        {currentSlide + 1} / {totalSlides}
      </div>
    </>
  );
};

export default FormNavigation;