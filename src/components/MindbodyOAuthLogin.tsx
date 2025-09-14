import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMindbody } from '@/hooks/useMindbody';
import { getMindbodyOAuthUrl } from '@/lib/mindbody-api';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface MindbodyOAuthLoginProps {
  redirectPath?: string;
}

export const MindbodyOAuthLogin: React.FC<MindbodyOAuthLoginProps> = ({ 
  redirectPath = '/dashboard' 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { loading, error, loginWithOAuth } = useMindbody();
  const { toast } = useToast();

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    if (error) {
      console.error('OAuth error:', error, errorDescription);
      toast({
        title: 'Authentication failed',
        description: errorDescription || error,
        variant: 'destructive',
      });
      return;
    }

    if (code) {
      console.log('Received OAuth code, exchanging for tokens...');
      const redirectUri = `${window.location.origin}${location.pathname}`;
      loginWithOAuth(code, redirectUri)
        .then((success) => {
          if (success) {
            toast({
              title: 'Successfully logged in',
              description: 'Welcome to your Mindbody account!',
            });
            navigate(redirectPath);
          }
        })
        .catch((err) => {
          console.error('OAuth login failed:', err);
          toast({
            title: 'Login failed',
            description: 'Failed to complete authentication. Please try again.',
            variant: 'destructive',
          });
        });
    }
  }, [location.search, location.pathname, loginWithOAuth, navigate, redirectPath, toast]);

  const handleMindbodyLogin = async () => {
    try {
      const redirectUri = `${window.location.origin}${location.pathname}`;
      const result = await getMindbodyOAuthUrl(redirectUri);
      
      if (result.success && result.data?.authUrl) {
        // Redirect to Mindbody OAuth page
        window.location.href = result.data.authUrl;
      } else {
        toast({
          title: 'Authentication error',
          description: result.error || 'Failed to initiate authentication',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Failed to get OAuth URL:', err);
      toast({
        title: 'Authentication error',
        description: 'Failed to start authentication process. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Sign in to Mindbody</CardTitle>
        <CardDescription>
          Connect your Mindbody account to book appointments and manage your wellness journey
        </CardDescription>
        
        {/* Configuration Notice */}
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-sm">
            <p className="font-medium text-yellow-800 mb-1">⚠️ Setup Required</p>
            <p className="text-yellow-700">
              To complete setup, add this URL to your Mindbody OAuth client:
            </p>
            <p className="font-mono text-xs bg-yellow-100 p-2 rounded mt-1 break-all">
              {window.location.origin}/login
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
            {error}
          </div>
        )}
        
        <Button 
          onClick={handleMindbodyLogin}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              Sign in with Mindbody
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground text-center space-y-2">
          <p>By signing in, you'll be redirected to Mindbody's secure authentication page.</p>
          <p>Your login credentials are handled directly by Mindbody for your security.</p>
          
          <details className="text-left">
            <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
              🔧 Mindbody Setup Instructions
            </summary>
            <div className="mt-2 p-3 bg-gray-50 rounded text-xs space-y-2">
              <p><strong>1.</strong> Go to <a href="https://developers.mindbodyonline.com" target="_blank" rel="noopener" className="text-blue-600 underline">developers.mindbodyonline.com</a></p>
              <p><strong>2.</strong> Navigate to your OAuth Client settings</p>
              <p><strong>3.</strong> Add this redirect URI:</p>
              <code className="block bg-white p-1 border rounded">{window.location.origin}/login</code>
              <p><strong>4.</strong> Save and try signing in again</p>
            </div>
          </details>
        </div>
      </CardContent>
    </Card>
  );
};