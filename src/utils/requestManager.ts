
/**
 * Request tracker utility to prevent duplicate requests and manage timeouts
 */
type RequestMap = {
  [key: string]: {
    inProgress: boolean;
    timeout?: number;
  };
};

export const createRequestTracker = () => {
  const requests: RequestMap = {};
  
  return {
    /**
     * Track if a request is in progress
     */
    trackRequest: (key: string, inProgress: boolean) => {
      if (!requests[key]) {
        requests[key] = { inProgress: false };
      }
      requests[key].inProgress = inProgress;
    },
    
    /**
     * Check if a request is in progress
     */
    isInProgress: (key: string): boolean => {
      return requests[key]?.inProgress === true;
    },
    
    /**
     * Reset tracking status
     */
    reset: (key?: string) => {
      if (key) {
        delete requests[key];
      } else {
        Object.keys(requests).forEach(k => delete requests[k]);
      }
    },
    
    /**
     * Set a timeout and track it
     */
    setTimeout: (key: string, callback: () => void, delay: number): void => {
      // Clear any existing timeout first
      if (requests[key]?.timeout) {
        clearTimeout(requests[key].timeout);
      }
      
      // Create new timeout and store its ID
      if (!requests[key]) {
        requests[key] = { inProgress: false };
      }
      
      requests[key].timeout = window.setTimeout(() => {
        if (callback) callback();
        if (requests[key]) {
          requests[key].timeout = undefined;
        }
      }, delay);
    },
    
    /**
     * Clear a specific timeout
     */
    clearTimeout: (key: string): void => {
      if (requests[key]?.timeout) {
        clearTimeout(requests[key].timeout);
        requests[key].timeout = undefined;
      }
    },
    
    /**
     * Clear all tracked timeouts
     */
    clearAllTimeouts: (): void => {
      Object.keys(requests).forEach(key => {
        if (requests[key]?.timeout) {
          clearTimeout(requests[key].timeout);
          requests[key].timeout = undefined;
        }
      });
    }
  };
};
