
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

interface LanguageSelectorProps {
  onChange?: (language: 'ar' | 'en' | 'fr') => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onChange }) => {
  const { formState, setFormLanguage } = useFormStore();
  const [selectedLanguage, setSelectedLanguage] = useState<'ar' | 'en' | 'fr'>(
    formState.formLanguage || 'ar'
  );

  // Update selected language when form state changes
  useEffect(() => {
    if (formState.formLanguage && formState.formLanguage !== selectedLanguage) {
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
      
      // Call external onChange if provided
      if (onChange) {
        onChange(lang);
      }

      toast.success(`تم تغيير اللغة إلى ${languages.find(l => l.code === lang)?.label}`);
    } catch (error) {
      console.error("Error changing language:", error);
      toast.error("حدث خطأ أثناء تغيير اللغة");
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
