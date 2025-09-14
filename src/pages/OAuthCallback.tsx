import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const OAuthCallback = () => {
  const location = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    // Send message to parent window
    if (window.opener) {
      if (error) {
        window.opener.postMessage({
          type: 'MINDBODY_OAUTH_ERROR',
          data: {
            error,
            error_description: errorDescription
          }
        }, window.location.origin);
      } else if (code) {
        window.opener.postMessage({
          type: 'MINDBODY_OAUTH_SUCCESS',
          data: {
            code
          }
        }, window.location.origin);
      }

      // Close the popup
      window.close();
    } else {
      // Fallback if not in popup - redirect to main app
      window.location.href = '/login';
    }
  }, [location.search]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Processing authentication...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;