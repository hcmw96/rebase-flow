import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { exchangeOAuthCode } from '@/lib/mindbody-api';
import { useMindbody } from '@/hooks/useMindbody';

export const MindbodyOAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const { setAuthData } = useMindbody();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      
      if (error) {
        setStatus('error');
        setError(`OAuth error: ${error}`);
        return;
      }
      
      if (!code) {
        setStatus('error');
        setError('No authorization code received');
        return;
      }

      try {
        const redirectUri = `${window.location.origin}/oauth/mindbody/callback`;
        const result = await exchangeOAuthCode(code, redirectUri);
        
        if (result.success && result.token) {
          // Store the token and user data
          setAuthData(result.token, result.data);
          setStatus('success');
          
          // Redirect to services page after a short delay
          setTimeout(() => {
            navigate('/services');
          }, 2000);
        } else {
          setStatus('error');
          setError(result.error || 'Failed to exchange authorization code');
        }
      } catch (err) {
        setStatus('error');
        setError('Failed to complete authentication');
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, setAuthData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="glass-card rounded-3xl border-white/10 w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-white font-serif text-center">
            Completing Mindbody Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-white mx-auto" />
              <p className="text-white/70">Processing your authentication...</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center mx-auto">
                <span className="text-white text-sm">✓</span>
              </div>
              <p className="text-white">Successfully connected to Mindbody!</p>
              <p className="text-white/70 text-sm">Redirecting you to services...</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <Alert className="border-red-500/50">
                <AlertDescription className="text-white">
                  {error}
                </AlertDescription>
              </Alert>
              <button 
                onClick={() => navigate('/services')}
                className="glass-button text-white rounded-xl font-medium px-4 py-2"
              >
                Return to Services
              </button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};