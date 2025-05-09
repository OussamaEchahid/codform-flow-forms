
import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';

interface EditorContainerProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  open: boolean; // خاصية التحكم في العرض/الإخفاء
}

const EditorContainer = ({ title, onClose, children, open }: EditorContainerProps) => {
  // استخدام onOpenChange للتأكد من تفعيل onClose عند إغلاق الحوار
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="flex items-center justify-between border-b p-2 sticky top-0 bg-gray-100 z-10">
          <h3 className="font-medium text-gray-700">{title}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="max-h-[80vh] overflow-auto">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditorContainer;
