
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react';

interface TextAlignmentSelectorProps {
  textAlign: string;
  onChange: (align: 'left' | 'center' | 'right') => void;
  language: string;
}

const TextAlignmentSelector: React.FC<TextAlignmentSelectorProps> = ({
  textAlign,
  onChange,
  language
}) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {language === 'ar' ? 'محاذاة النص' : 'Text Alignment'}
      </label>
      <div className="flex items-center space-x-2">
        <Button 
          variant={textAlign === 'left' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => onChange('left')}
          className="p-2"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button 
          variant={textAlign === 'center' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => onChange('center')}
          className="p-2"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button 
          variant={textAlign === 'right' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => onChange('right')}
          className="p-2"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default TextAlignmentSelector;
