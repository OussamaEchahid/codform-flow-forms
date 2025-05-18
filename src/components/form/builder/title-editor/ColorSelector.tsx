
import React from 'react';
import { Input } from '@/components/ui/input';

interface ColorSelectorProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
  language: string;
}

const ColorSelector: React.FC<ColorSelectorProps> = ({ 
  label, 
  color, 
  onChange,
  language 
}) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label}
      </label>
      <div className="flex items-center">
        <div 
          className="w-8 h-8 rounded-md mr-2" 
          style={{ backgroundColor: color }}
        ></div>
        <Input 
          type="color" 
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="w-16 h-8 p-0"
        />
      </div>
    </div>
  );
};

export default ColorSelector;
