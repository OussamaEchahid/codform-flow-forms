
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SubmissionsAPIProps {
  formId?: string;
}

export default function SubmissionsAPI({ formId }: SubmissionsAPIProps) {
  const params = useParams();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const id = formId || params.id;
  
  useEffect(() => {
    async function fetchSubmissions() {
      try {
        if (!id) {
          throw new Error('Form ID is required');
        }

        // Use the main supabase client for form submissions
        const { data, error } = await supabase
          .from('form_submissions')
          .insert({
            form_id: id,
            data: {}
          })
          .select();

        if (error) {
          throw error;
        }

        setSubmissions(data || []);
      } catch (error: any) {
        setError(error.message || 'Error fetching submissions');
        toast.error(`Failed to fetch submissions: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubmissions();
  }, [id]);

  // This component acts as an API endpoint, so it returns JSON
  useEffect(() => {
    if (!isLoading) {
      if (error) {
        document.body.innerHTML = JSON.stringify({ error }, null, 2);
      } else {
        document.body.innerHTML = JSON.stringify(submissions, null, 2);
      }
    }
  }, [isLoading, error, submissions]);

  return null;
}
