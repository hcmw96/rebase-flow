import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogOut, ExternalLink, User, Mail, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useMindbody } from '@/contexts/MindbodyContext';
import SignIn from '@/pages/SignIn';
import SignUp from '@/pages/SignUp';

const AccountPage = () => {
  const { profile, isAuthenticated, signOut } = useAuth();
  const { isMindbodyLinked, linkMindbody, isLinking } = useMindbody();
  const [authView, setAuthView] = useState<'signin' | 'signup'>('signin');

  if (!isAuthenticated) {
    if (authView === 'signup') {
      return <SignUp onSwitchToSignIn={() => setAuthView('signin')} />;
    }
    return <SignIn onSwitchToSignUp={() => setAuthView('signup')} />;
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-6 max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-light text-foreground">Account</h1>
      </motion.div>

      {/* Profile info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">
                  {profile?.first_name} {profile?.last_name}
                </h2>
                {profile?.email && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {profile.email}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Mindbody link status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card>
          <CardContent className="p-5">
            {isMindbodyLinked ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Link2 className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Mindbody Connected</p>
                  <p className="text-xs text-muted-foreground">You can book and manage appointments</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Connect Mindbody</p>
                    <p className="text-xs text-muted-foreground">Required to book services</p>
                  </div>
                </div>
                <Button onClick={linkMindbody} disabled={isLinking} className="w-full" size="sm">
                  {isLinking ? 'Connecting...' : 'Connect Mindbody Account'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Links */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <a
          href="https://rebase.co.uk"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-secondary/50 transition-colors"
        >
          <span className="text-sm text-foreground">Visit Rebase Website</span>
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </a>
      </motion.div>

      {/* Logout */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          variant="outline"
          className="w-full text-destructive hover:text-destructive"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </motion.div>
    </div>
  );
};

export default AccountPage;
