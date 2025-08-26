import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X } from "lucide-react";
import { authenticateUser } from '@/lib/mindbody-api';
import { useMindbody } from '@/hooks/useMindbody';

interface MindbodyAuthPromptProps {
  onClose?: () => void;
}

export const MindbodyAuthPrompt = ({ onClose }: MindbodyAuthPromptProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useMindbody();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await authenticateUser(username, password);
      if (result.success && result.token) {
        const loginSuccess = await login(username, password);
        if (loginSuccess) {
          onClose?.();
        } else {
          setError('Failed to complete login process');
        }
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Failed to authenticate with Mindbody');
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
              Sign In to Mindbody
            </CardTitle>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-white hover:bg-white/10">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-white/70 text-sm text-center">
            Enter your Mindbody credentials to access live class schedules and booking
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white/90">Username/Email</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your Mindbody username"
                className="glass-input text-white placeholder:text-white/50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/90">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
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
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
            
            <div className="text-center pt-2">
              <p className="text-white/60 text-xs">
                Use your regular Mindbody login credentials
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};