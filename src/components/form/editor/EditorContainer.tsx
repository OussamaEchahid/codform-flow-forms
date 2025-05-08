
import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EditorContainerProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const EditorContainer = ({ title, onClose, children }: EditorContainerProps) => {
  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black/50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-gray-100 p-2 flex items-center justify-between border-b z-10">
          <h3 className="font-medium text-gray-700">{title}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default EditorContainer;
