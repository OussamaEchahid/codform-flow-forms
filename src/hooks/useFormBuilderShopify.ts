
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useShopify } from '@/hooks/useShopify';
import { toast } from 'sonner';

export const useFormBuilderShopify = () => {
  const { shop } = useAuth();
  const { tokenError, failSafeMode, toggleFailSafeMode, getDefaultForm } = useShopify();
  
  const [bypassEnabled, setBypassEnabled] = useState(false);
  const [isCheckingDefaultForm, setIsCheckingDefaultForm] = useState(false);
  
  // Handle connection issues automatically
  useEffect(() => {
    if (tokenError) {
      console.log("Token error detected, enabling bypass");
      setBypassEnabled(true);
      
      if (!failSafeMode) {
        toggleFailSafeMode(true);
        console.log("Enabling fail-safe mode automatically");
      }
    }
  }, [tokenError, failSafeMode, toggleFailSafeMode]);
  
  // Check for default form - with proper dependencies to prevent infinite loop
  useEffect(() => {
    // Fix for infinite loop - only run when shop changes and not already checking
    let isMounted = true;
    
    const checkForDefaultForm = async () => {
      if (!shop || isCheckingDefaultForm) return;
      
      setIsCheckingDefaultForm(true);
      try {
        // Store the result and check it properly
        const result = await getDefaultForm(shop);
        
        if (isMounted) {
          if (result) {
            console.log('Default form found:', result.id);
          } else {
            console.log('No default form found, will create one when needed');
          }
        }
      } catch (error) {
        console.error('Error checking for default form:', error);
      } finally {
        if (isMounted) {
          setIsCheckingDefaultForm(false);
        }
      }
    };
    
    // Run the function immediately
    checkForDefaultForm().catch(console.error);
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [shop, getDefaultForm, isCheckingDefaultForm]);
  
  // Always enable bypass access in development mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setBypassEnabled(true);
    }
  }, []);
  
  const enableBypass = () => {
    setBypassEnabled(true);
    localStorage.setItem('bypass_auth', 'true');
    toast.success('Bypass mode activated. You can continue managing forms.');
  };
  
  return {
    tokenError,
    failSafeMode,
    bypassEnabled,
    enableBypass
  };
};
