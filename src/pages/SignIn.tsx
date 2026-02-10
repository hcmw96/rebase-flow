import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import Logo from '@/components/Logo';

interface SignInProps {
  onSwitchToSignUp: () => void;
}

const SignIn = ({ onSwitchToSignUp }: SignInProps) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) setError(error);
    setLoading(false);
  };

  return (
    <div className="px-6 pt-8 pb-4 max-w-sm mx-auto flex flex-col items-center justify-center min-h-[70vh]">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full space-y-8"
      >
        <div className="flex flex-col items-center space-y-3">
          <Logo className="h-14 w-auto opacity-80" />
          <p className="text-sm text-black/40">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-black/60 text-xs">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/60 border-black/10 text-black placeholder:text-black/30 focus-visible:ring-black/20"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-black/60 text-xs">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-white/60 border-black/10 text-black placeholder:text-black/30 focus-visible:ring-black/20"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="w-full bg-black/80 hover:bg-black text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign In'}
          </Button>
        </form>

        <p className="text-center text-sm text-black/40">
          Don't have an account?{' '}
          <button onClick={onSwitchToSignUp} className="text-black/70 underline underline-offset-2">
            Sign Up
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default SignIn;
