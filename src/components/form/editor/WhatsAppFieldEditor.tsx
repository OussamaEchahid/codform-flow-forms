import React, { useState, useEffect } from 'react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useI18n } from '@/lib/i18n';

interface WhatsAppFieldEditorProps {
  field: any;
  onSave: (field: any) => void;
  onClose: () => void;
}

const WhatsAppFieldEditor: React.FC<WhatsAppFieldEditorProps> = ({ field, onSave, onClose }) => {
  const { t, language } = useI18n();
  const [messageTitle, setMessageTitle] = useState(field.messageTitle || '');
  const [messageText, setMessageText] = useState(field.messageText || '');
  const [buttonText, setButtonText] = useState(field.buttonText || '');
  const [whatsappNumber, setWhatsappNumber] = useState(field.whatsappNumber || '');
  const [isRequired, setIsRequired] = useState(field.required || false);

  const handleSave = () => {
    const updatedField = {
      ...field,
      messageTitle: messageTitle || '',
      messageText: messageText || '',
      buttonText: buttonText || '',
      whatsappNumber: whatsappNumber || '',
      required: isRequired,
    };

    onSave(updatedField);
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="messageTitle">{t('Message Title')}</Label>
        <Input
          id="messageTitle"
          value={messageTitle}
          onChange={(e) => setMessageTitle(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="messageText">{t('Message Text')}</Label>
        <Input
          id="messageText"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="buttonText">{t('Button Text')}</Label>
        <Input
          id="buttonText"
          value={buttonText}
          onChange={(e) => setButtonText(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="whatsappNumber">{t('WhatsApp Number')}</Label>
        <Input
          id="whatsappNumber"
          value={whatsappNumber}
          onChange={(e) => setWhatsappNumber(e.target.value)}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="required" checked={isRequired} onCheckedChange={setIsRequired} />
        <Label htmlFor="required">{t('Required')}</Label>
      </div>
      <div className="flex justify-end space-x-2">
        <Button variant="ghost" onClick={onClose}>
          {t('Cancel')}
        </Button>
        <Button onClick={handleSave}>
          {t('Save')}
        </Button>
      </div>
    </div>
  );
};

export default WhatsAppFieldEditor;
