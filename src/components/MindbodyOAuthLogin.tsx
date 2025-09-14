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

    if (error) {
      toast({
        title: 'Authentication failed',
        description: error,
        variant: 'destructive',
      });
      return;
    }

    if (code) {
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

        <div className="text-xs text-muted-foreground text-center">
          By signing in, you'll be redirected to Mindbody's secure authentication page.
          Your login credentials are handled directly by Mindbody for your security.
        </div>
      </CardContent>
    </Card>
  );
};