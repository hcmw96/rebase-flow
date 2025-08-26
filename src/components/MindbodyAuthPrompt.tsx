import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, Search } from "lucide-react";
import { validateClient } from '@/lib/mindbody-api';
import { useMindbody } from '@/hooks/useMindbody';

interface MindbodyAuthPromptProps {
  onClose?: () => void;
}

export const MindbodyAuthPrompt = ({ onClose }: MindbodyAuthPromptProps) => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setAuthData } = useMindbody();

  const handleLookupClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email && !phone) {
      setError('Please enter either your email or phone number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try to find client by email first, then phone
      const searchValue = email || phone;
      const result = await validateClient(searchValue);
      
      if (result.success && result.client) {
        await setAuthData(null, result.client);
        onClose?.();
      } else {
        setError('Account not found. Please check your information or contact the studio.');
      }
    } catch (err) {
      setError('Failed to find your account. Please try again.');
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
            Enter your email or phone number to access your account
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLookupClient} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/90">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="glass-input text-white placeholder:text-white/50"
              />
            </div>
            
            <div className="text-center text-white/60 text-sm">or</div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white/90">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="glass-input text-white placeholder:text-white/50"
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
              className="w-full glass-button text-white rounded-xl font-medium flex items-center gap-2" 
              disabled={loading || (!email && !phone)}
            >
              {loading ? (
                'Looking up your account...'
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Find My Account
                </>
              )}
            </Button>
            
            <div className="text-center pt-2">
              <p className="text-white/60 text-xs">
                We'll look up your account using the information you have on file with us.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};