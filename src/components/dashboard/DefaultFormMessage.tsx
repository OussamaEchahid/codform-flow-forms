import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import NewFormProductDialog from '@/components/form/builder/NewFormProductDialog';

interface DefaultFormMessageProps {
  onCreateForm?: () => void;
  isLoading?: boolean;
}

const DefaultFormMessage: React.FC<DefaultFormMessageProps> = ({
  onCreateForm,
  isLoading = false
}) => {
  const { t } = useI18n();
  const [isNewFormDialogOpen, setIsNewFormDialogOpen] = useState(false);

  const handleCreateForm = () => {
    console.log('🎯 DefaultFormMessage - Create form button clicked');
    setIsNewFormDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {t('welcomeToFormBuilder')}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          <p className="text-muted-foreground text-lg">
            {t('noFormsFound')}
          </p>
          
          <div className="space-y-4">
            <Button 
              onClick={handleCreateForm}
              disabled={isLoading}
              size="lg"
              className="w-full max-w-xs mx-auto flex items-center gap-2"
            >
              {isLoading ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {t('createNewForm')}
            </Button>
            
            <p className="text-sm text-muted-foreground">
              {t('defaultFormDescription')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* New Form Product Dialog */}
      <NewFormProductDialog 
        open={isNewFormDialogOpen} 
        onClose={() => setIsNewFormDialogOpen(false)} 
      />
    </div>
  );
};

export default DefaultFormMessage;