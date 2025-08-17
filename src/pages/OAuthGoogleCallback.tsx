import { useEffect } from 'react';

export default function OAuthGoogleCallback() {
  useEffect(() => {
    // Close the window after successful callback; parent can refresh
    setTimeout(() => {
      window.close();
    }, 2000);
  }, []);

  return (
    <div className="p-6 text-center">
      <p>Google connected. You can close this window.</p>
    </div>
  );
}

