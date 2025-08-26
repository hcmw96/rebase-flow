import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X } from "lucide-react";
import { validateClient } from '@/lib/mindbody-api';
import { useMindbody } from '@/hooks/useMindbody';

interface MindbodyAuthPromptProps {
  onClose?: () => void;
}

export const MindbodyAuthPrompt = ({ onClose }: MindbodyAuthPromptProps) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setAuthData } = useMindbody();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await validateClient(email);
      if (result.success && result.client) {
        // Set client data and mark as authenticated
        await setAuthData(null, result.client);
        onClose?.();
      } else {
        setError(result.error || 'Client not found. Please check your email address.');
      }
    } catch (err) {
      setError('Failed to find client account');
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
              Find Your Account
            </CardTitle>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-white hover:bg-white/10">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-white/70 text-sm text-center">
            Enter your email address to find your Mindbody client account
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/90">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="glass-input text-white placeholder:text-white/50"
                required
              />
            </div>
            {error && (
              <Alert className="border-red-500/50">
                <AlertDescription className="text-white">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            <Button 
              type="submit" 
              className="w-full glass-button text-white rounded-xl font-medium" 
              disabled={loading}
            >
              {loading ? 'Finding Account...' : 'Find My Account'}
            </Button>
            
            <div className="text-center pt-2">
              <p className="text-white/60 text-xs">
                We'll look up your account using your email address registered with the business.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};