import { useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { exchangeOAuthCode } from "@/lib/mindbody-api";
import { useMindbody } from "@/hooks/useMindbody";

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setAuthData, isAuthenticated } = useMindbody();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');
        
        // Check for OAuth error
        if (errorParam) {
          const errorDescription = searchParams.get('error_description');
          setError(errorDescription || 'OAuth authorization failed');
          setProcessing(false);
          return;
        }

        // Check for required parameters
        if (!code || !state) {
          setError('Missing required OAuth parameters');
          setProcessing(false);
          return;
        }

        // Exchange code for tokens
        const redirectUri = `${window.location.origin}/auth/callback`;
        const result = await exchangeOAuthCode(code, redirectUri, state);

        if (result.success && result.data) {
          // Store OAuth tokens
          localStorage.setItem('mindbody_oauth_access_token', result.data.access_token);
          localStorage.setItem('mindbody_oauth_refresh_token', result.data.refresh_token);
          localStorage.setItem('mindbody_oauth_expires_at', (Date.now() + (result.data.expires_in * 1000)).toString());

          // For now, we'll need to get client information using the access token
          // This would typically involve calling the Mindbody API to get user profile
          // For demonstration, we'll use a placeholder client object
          const userData = {
            Id: 'oauth_user',
            UniqueId: 'oauth_user',
            FirstName: 'OAuth',
            LastName: 'User',
            Email: 'oauth@user.com',
            MobilePhone: '',
            CreationDate: new Date().toISOString(),
            Active: true
          };

          setAuthData(result.data.access_token, userData);
          setProcessing(false);
        } else {
          setError(result.error || 'Failed to complete OAuth authentication');
          setProcessing(false);
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError('An unexpected error occurred during OAuth authentication');
        setProcessing(false);
      }
    };

    handleOAuthCallback();
  }, [searchParams, setAuthData]);

  // Redirect to dashboard if authenticated
  if (isAuthenticated && !processing) {
    return <Navigate to="/book" replace />;
  }

  // Redirect to auth page if there's an error
  if (error && !processing) {
    return <Navigate to="/auth" state={{ error }} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="card-luxury w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Completing Authentication
          </h2>
          <p className="text-sm text-muted-foreground text-center">
            Please wait while we complete your Mindbody authentication...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuthCallback;