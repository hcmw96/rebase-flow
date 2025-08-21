import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMindbody } from '@/hooks/useMindbody';

export const MindbodyAuthPrompt = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useMindbody();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(username, password);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="glass-card rounded-3xl border-white/10 w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-white font-serif text-center">
            Connect to Mindbody
          </CardTitle>
          <p className="text-white/70 text-sm text-center">
            Sign in to access live class schedules and booking
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
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white/70">Email or Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="glass-morphism border-white/20 text-white placeholder:text-white/50"
                placeholder="Enter your Mindbody username"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/70">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-morphism border-white/20 text-white placeholder:text-white/50"
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full glass-button text-white rounded-xl font-medium"
              disabled={loading || !username || !password}
            >
              {loading ? 'Connecting...' : 'Connect to Mindbody'}
            </Button>
          </form>
          
          <div className="text-center pt-4">
            <p className="text-white/60 text-xs">
              Don't have a Mindbody account? Contact us to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};