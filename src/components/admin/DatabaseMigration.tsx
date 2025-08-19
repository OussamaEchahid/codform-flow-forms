import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { addCountryTagColumn, updateCreateFormRPC } from '@/utils/addCountryTagColumn';

export const DatabaseMigration: React.FC = () => {
  const [isApplying, setIsApplying] = useState(false);

  const applyMigrations = async () => {
    setIsApplying(true);
    
    try {
      // Add country_tag column
      const columnAdded = await addCountryTagColumn();
      if (!columnAdded) {
        throw new Error('Failed to add country_tag column');
      }
      
      // Update RPC function
      const rpcUpdated = await updateCreateFormRPC();
      if (!rpcUpdated) {
        throw new Error('Failed to update RPC function');
      }
      
      toast.success('✅ Database migrations applied successfully!');
    } catch (error) {
      console.error('Migration error:', error);
      toast.error('❌ Failed to apply migrations: ' + (error as Error).message);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Database Migration</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Apply country_tag column and RPC function updates
        </p>
        <Button 
          onClick={applyMigrations} 
          disabled={isApplying}
          className="w-full"
        >
          {isApplying ? 'Applying...' : 'Apply Migrations'}
        </Button>
      </CardContent>
    </Card>
  );
};
