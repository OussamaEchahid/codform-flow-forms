import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Palette, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface GlobalFormStylingProps {
  formStyle: {
    borderColor?: string;
    borderRadius?: string;
    borderWidth?: string;
    backgroundColor?: string;
    paddingTop?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    paddingRight?: string;
    formGap?: string;
    formDirection?: 'ltr' | 'rtl';
    floatingLabels?: boolean;
    focusBorderColor?: string;
    fieldBorderColor?: string;
    fieldBorderWidth?: string;
    fieldBorderRadius?: string;
  };
  onStyleChange: (key: string, value: string | boolean) => void;
}

const GlobalFormStyling: React.FC<GlobalFormStylingProps> = ({ formStyle, onStyleChange }) => {
  const { t, language } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  // Helper function to get numeric value from string with unit
  const getNumericValue = (value: string | undefined, defaultValue: number): number => {
    if (!value) return defaultValue;
    const numeric = parseInt(value.replace(/\D/g, ''));
    return isNaN(numeric) ? defaultValue : numeric;
  };

  // Helper function to format value with px unit
  const formatWithPx = (value: number): string => `${value}px`;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="mb-4 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-primary/5 transition-colors">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Global form styling
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-primary" />
              ) : (
                <ChevronDown className="h-4 w-4 text-primary" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Border color */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Border color</Label>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={formStyle.borderColor || '#000000'}
                onChange={(e) => onStyleChange('borderColor', e.target.value)}
                className="w-12 h-8 p-1 border rounded"
              />
              <Input
                type="text"
                value={formStyle.borderColor || '#000000'}
                onChange={(e) => onStyleChange('borderColor', e.target.value)}
                className="flex-1"
                placeholder="#000000"
              />
            </div>
          </div>

          {/* Border radius */}
          <div className="space-y-2">
            <Label className="flex items-center justify-between text-sm font-medium">
              <span>Border radius ({getNumericValue(formStyle.borderRadius, 0)})</span>
              <span className="text-xs text-muted-foreground">30</span>
            </Label>
            <Slider
              value={[getNumericValue(formStyle.borderRadius, 0)]}
              onValueChange={(value) => onStyleChange('borderRadius', formatWithPx(value[0]))}
              max={30}
              step={1}
              className="w-full"
            />
          </div>

          {/* Border width */}
          <div className="space-y-2">
            <Label className="flex items-center justify-between text-sm font-medium">
              <span>Border width ({getNumericValue(formStyle.borderWidth, 2)})</span>
              <span className="text-xs text-muted-foreground">30</span>
            </Label>
            <Slider
              value={[getNumericValue(formStyle.borderWidth, 2)]}
              onValueChange={(value) => onStyleChange('borderWidth', formatWithPx(value[0]))}
              max={30}
              step={1}
              className="w-full"
            />
          </div>

          {/* Background color */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Background color</Label>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={formStyle.backgroundColor || '#ffffff'}
                onChange={(e) => onStyleChange('backgroundColor', e.target.value)}
                className="w-12 h-8 p-1 border rounded"
              />
              <Input
                type="text"
                value={formStyle.backgroundColor || '#ffffff'}
                onChange={(e) => onStyleChange('backgroundColor', e.target.value)}
                className="flex-1"
                placeholder="#ffffff"
              />
            </div>
          </div>

          {/* Padding top */}
          <div className="space-y-2">
            <Label className="flex items-center justify-between text-sm font-medium">
              <span>Padding top ({getNumericValue(formStyle.paddingTop, 12)})</span>
              <span className="text-xs text-muted-foreground">50</span>
            </Label>
            <Slider
              value={[getNumericValue(formStyle.paddingTop, 12)]}
              onValueChange={(value) => onStyleChange('paddingTop', formatWithPx(value[0]))}
              max={50}
              step={1}
              className="w-full"
            />
          </div>

          {/* Padding bottom */}
          <div className="space-y-2">
            <Label className="flex items-center justify-between text-sm font-medium">
              <span>Padding bottom ({getNumericValue(formStyle.paddingBottom, 12)})</span>
              <span className="text-xs text-muted-foreground">50</span>
            </Label>
            <Slider
              value={[getNumericValue(formStyle.paddingBottom, 12)]}
              onValueChange={(value) => onStyleChange('paddingBottom', formatWithPx(value[0]))}
              max={50}
              step={1}
              className="w-full"
            />
          </div>

          {/* Padding left */}
          <div className="space-y-2">
            <Label className="flex items-center justify-between text-sm font-medium">
              <span>Padding left ({getNumericValue(formStyle.paddingLeft, 14)})</span>
              <span className="text-xs text-muted-foreground">50</span>
            </Label>
            <Slider
              value={[getNumericValue(formStyle.paddingLeft, 14)]}
              onValueChange={(value) => onStyleChange('paddingLeft', formatWithPx(value[0]))}
              max={50}
              step={1}
              className="w-full"
            />
          </div>

          {/* Padding right */}
          <div className="space-y-2">
            <Label className="flex items-center justify-between text-sm font-medium">
              <span>Padding right ({getNumericValue(formStyle.paddingRight, 14)})</span>
              <span className="text-xs text-muted-foreground">50</span>
            </Label>
            <Slider
              value={[getNumericValue(formStyle.paddingRight, 14)]}
              onValueChange={(value) => onStyleChange('paddingRight', formatWithPx(value[0]))}
              max={50}
              step={1}
              className="w-full"
            />
          </div>

          {/* Form gap */}
          <div className="space-y-2">
            <Label className="flex items-center justify-between text-sm font-medium">
              <span>Form gap ({getNumericValue(formStyle.formGap, 15)})</span>
              <span className="text-xs text-muted-foreground">20</span>
            </Label>
            <Slider
              value={[getNumericValue(formStyle.formGap, 15)]}
              onValueChange={(value) => onStyleChange('formGap', formatWithPx(value[0]))}
              max={20}
              step={1}
              className="w-full"
            />
          </div>

          {/* Form direction */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Form direction rtl</Label>
            <div className="flex items-center gap-2">
              <Switch
                checked={formStyle.formDirection === 'rtl'}
                onCheckedChange={(checked) => onStyleChange('formDirection', checked ? 'rtl' : 'ltr')}
              />
              <span className="text-sm text-muted-foreground">
                {formStyle.formDirection === 'rtl' ? 'Right to Left' : 'Left to Right'}
              </span>
            </div>
          </div>

          {/* Floating labels */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Floating labels</Label>
            <div className="flex items-center gap-2">
              <Switch
                checked={formStyle.floatingLabels || false}
                onCheckedChange={(checked) => onStyleChange('floatingLabels', checked)}
              />
              <span className="text-sm text-muted-foreground">
                {formStyle.floatingLabels ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          {/* Focus border color */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Focus border color</Label>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={formStyle.focusBorderColor || '#3b82f6'}
                onChange={(e) => onStyleChange('focusBorderColor', e.target.value)}
                className="w-12 h-8 p-1 border rounded"
              />
              <Input
                type="text"
                value={formStyle.focusBorderColor || '#3b82f6'}
                onChange={(e) => onStyleChange('focusBorderColor', e.target.value)}
                className="flex-1"
                placeholder="#3b82f6"
              />
            </div>
          </div>

          {/* Field border color */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Field border color</Label>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={formStyle.fieldBorderColor || '#d1d5db'}
                onChange={(e) => onStyleChange('fieldBorderColor', e.target.value)}
                className="w-12 h-8 p-1 border rounded"
              />
              <Input
                type="text"
                value={formStyle.fieldBorderColor || '#d1d5db'}
                onChange={(e) => onStyleChange('fieldBorderColor', e.target.value)}
                className="flex-1"
                placeholder="#d1d5db"
              />
            </div>
          </div>

          {/* Field border width */}
          <div className="space-y-2">
            <Label className="flex items-center justify-between text-sm font-medium">
              <span>Field border width ({getNumericValue(formStyle.fieldBorderWidth, 1)})</span>
              <span className="text-xs text-muted-foreground">10</span>
            </Label>
            <Slider
              value={[getNumericValue(formStyle.fieldBorderWidth, 1)]}
              onValueChange={(value) => onStyleChange('fieldBorderWidth', formatWithPx(value[0]))}
              max={10}
              step={1}
              className="w-full"
            />
          </div>

          {/* Field border radius */}
          <div className="space-y-2">
            <Label className="flex items-center justify-between text-sm font-medium">
              <span>Field border radius ({getNumericValue(formStyle.fieldBorderRadius, 8)})</span>
              <span className="text-xs text-muted-foreground">30</span>
            </Label>
            <Slider
              value={[getNumericValue(formStyle.fieldBorderRadius, 8)]}
              onValueChange={(value) => onStyleChange('fieldBorderRadius', formatWithPx(value[0]))}
              max={30}
              step={1}
              className="w-full"
            />
          </div>
        </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default GlobalFormStyling;