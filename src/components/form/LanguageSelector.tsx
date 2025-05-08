
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { useFormStore } from '@/hooks/useFormStore';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';

interface LanguageSelectorProps {
  onChange?: (language: 'ar' | 'en' | 'fr') => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onChange }) => {
  const { formState, setFormLanguage } = useFormStore();
  const { setLanguage: setI18nLanguage } = useI18n();
  const [selectedLanguage, setSelectedLanguage] = useState<'ar' | 'en' | 'fr'>(
    formState.formLanguage || 'ar'
  );

  // Update selected language when form state changes
  useEffect(() => {
    if (formState.formLanguage && formState.formLanguage !== selectedLanguage) {
      console.log(`Form language changed to ${formState.formLanguage}, updating selector`);
      setSelectedLanguage(formState.formLanguage);
    }
  }, [formState.formLanguage]);

  const languages = [
    { code: 'ar', label: 'العربية', dir: 'rtl' },
    { code: 'en', label: 'English', dir: 'ltr' },
    { code: 'fr', label: 'Français', dir: 'ltr' }
  ];

  const handleLanguageChange = (lang: 'ar' | 'en' | 'fr') => {
    console.log("Changing language to:", lang);
    setSelectedLanguage(lang);
    
    try {
      // Apply language change to form state
      setFormLanguage(lang);
      
      // Also update the i18n language context for app-wide language sync
      setI18nLanguage(lang);
      
      // Call external onChange if provided
      if (onChange) {
        onChange(lang);
      }

      // Show success message in the selected language
      const langLabel = languages.find(l => l.code === lang)?.label;
      if (lang === 'ar') {
        toast.success(`تم تغيير اللغة إلى ${langLabel}`);
      } else if (lang === 'en') {
        toast.success(`Language changed to ${langLabel}`);
      } else if (lang === 'fr') {
        toast.success(`La langue a été changée en ${langLabel}`);
      }
      
    } catch (error) {
      console.error("Error changing language:", error);
      toast.error(
        lang === 'ar' ? "حدث خطأ أثناء تغيير اللغة" : 
        lang === 'en' ? "Error changing language" : 
        "Erreur lors du changement de langue"
      );
    }
  };

  const currentLanguage = languages.find(lang => lang.code === selectedLanguage);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <span>{currentLanguage?.label || 'Language'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code as 'ar' | 'en' | 'fr')}
            className="flex justify-between items-center"
          >
            <span>{lang.label}</span>
            {selectedLanguage === lang.code && (
              <span className="w-2 h-2 bg-primary rounded-full" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
