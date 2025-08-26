import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X } from "lucide-react";
import { getOAuthUrl } from '@/lib/mindbody-api';

interface MindbodyAuthPromptProps {
  onClose?: () => void;
}

export const MindbodyAuthPrompt = ({ onClose }: MindbodyAuthPromptProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOAuthLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const redirectUri = `${window.location.origin}/oauth/mindbody/callback`;
      const result = await getOAuthUrl(redirectUri);
      
      if (result.success && result.data?.authUrl) {
        // Redirect to Mindbody OAuth page
        window.location.href = result.data.authUrl;
      } else {
        setError(result.error || 'Failed to generate OAuth URL');
      }
    } catch (err) {
      setError('Failed to initiate OAuth flow');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="glass-card rounded-3xl border-white/10 w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white font-serif text-center flex-1">
              Connect to Mindbody
            </CardTitle>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-white hover:bg-white/10">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-white/70 text-sm text-center">
            Sign in securely with your Mindbody account to access live class schedules and booking
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert className="border-red-500/50">
              <AlertDescription className="text-white">
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          <Button 
            onClick={handleOAuthLogin}
            className="w-full glass-button text-white rounded-xl font-medium"
            disabled={loading}
          >
            {loading ? 'Redirecting...' : 'Sign in with Mindbody'}
          </Button>
          
          <div className="text-center pt-4">
            <p className="text-white/60 text-xs">
              You'll be redirected to Mindbody's secure login page
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};