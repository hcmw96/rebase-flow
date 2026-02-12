import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import Logo from '@/components/Logo';

interface SignUpProps {
  onSwitchToSignIn: () => void;
}

const SignUp = ({ onSwitchToSignIn }: SignUpProps) => {
  const { signUp } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signUp(email, password, firstName, lastName);
    if (error) {
      setError(error);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="px-6 pt-8 pb-4 max-w-sm mx-auto flex flex-col items-center justify-center min-h-[70vh]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full space-y-6 text-center"
        >
          <Logo className="h-14 w-auto opacity-80 mx-auto" invert={false} />
          <div>
            <h2 className="text-lg font-medium text-white/80">Check your email</h2>
            <p className="text-sm text-white/50 mt-2">
              We've sent a verification link to <strong className="text-white/70">{email}</strong>. Please verify your email to sign in.
            </p>
          </div>
          <Button variant="outline" onClick={onSwitchToSignIn} className="w-full border-white/20 text-white/70 hover:bg-white/10">
            Back to Sign In
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-6 pt-8 pb-4 max-w-sm mx-auto flex flex-col items-center justify-center min-h-[70vh]">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full space-y-8"
      >
        <div className="flex flex-col items-center space-y-3">
          <Logo className="h-14 w-auto opacity-80" invert={false} />
          <p className="text-sm text-white/50">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-white/70 text-xs">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-white/20"
                placeholder="First"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-white/70 text-xs">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-white/20"
                placeholder="Last"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/70 text-xs">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-white/20"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/70 text-xs">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-white/20"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="w-full bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
          </Button>
        </form>

        <p className="text-center text-sm text-white/40">
          Already have an account?{' '}
          <button onClick={onSwitchToSignIn} className="text-white/70 underline underline-offset-2">
            Sign In
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default SignUp;
