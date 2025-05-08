
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { toast } from 'sonner';

// Simplified version that only displays a fixed language (Arabic)
const LanguageSelector: React.FC = () => {
  const [selectedLanguage] = useState<'ar'>('ar');

  const languages = [
    { code: 'ar', label: 'العربية', dir: 'rtl' }
  ];

  const currentLanguage = languages.find(lang => lang.code === selectedLanguage);

  // This is now just a display component, doesn't actually change anything
  const handleClick = () => {
    toast.info('النموذج باللغة العربية فقط');
  };

  return (
    <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={handleClick}>
      <Globe className="h-4 w-4" />
      <span>{currentLanguage?.label || 'العربية'}</span>
    </Button>
  );
};

export default LanguageSelector;
