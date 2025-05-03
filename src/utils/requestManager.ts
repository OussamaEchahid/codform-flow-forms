
/**
 * Simple request tracker to prevent duplicate requests and infinite loops
 */
export const createRequestTracker = () => {
  // Track in-progress requests
  const inProgressRequests: Record<string, boolean> = {};
  
  // Timeouts for cleanup
  const timeouts: Record<string, number> = {};
  
  return {
    /**
     * Track a request in progress
     * @param key Identifier for the request
     * @param inProgress Whether the request is in progress
     */
    trackRequest: (key: string, inProgress: boolean) => {
      inProgressRequests[key] = inProgress;
      
      // Auto-clean after 30 seconds to prevent stale state
      if (inProgress) {
        // Clear any existing timeout
        if (timeouts[key]) {
          clearTimeout(timeouts[key]);
        }
        
        // Set new timeout
        timeouts[key] = window.setTimeout(() => {
          inProgressRequests[key] = false;
        }, 30000);
      } else {
        // Clear timeout when request completes
        if (timeouts[key]) {
          clearTimeout(timeouts[key]);
          delete timeouts[key];
        }
      }
    },
    
    /**
     * Check if a request is in progress
     */
    isInProgress: (key: string): boolean => {
      return !!inProgressRequests[key];
    },
    
    /**
     * Clear all timeouts
     */
    clearAllTimeouts: () => {
      Object.keys(timeouts).forEach(key => {
        clearTimeout(timeouts[key]);
        delete timeouts[key];
      });
    }
  };
};
