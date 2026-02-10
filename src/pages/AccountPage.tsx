import { motion } from 'framer-motion';
import { LogOut, ExternalLink, User, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useMindbody } from '@/contexts/MindbodyContext';

const AccountPage = () => {
  const { session, isAuthenticated, login, logout } = useMindbody();

  const handleLogin = () => {
    const redirectUri = `${window.location.origin}`;
    login(redirectUri);
  };

  if (!isAuthenticated) {
    return (
      <div className="px-4 pt-6 pb-4 max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full space-y-6 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Sign In</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Log in with your Mindbody account to manage bookings and your profile.
            </p>
          </div>
          <Button onClick={handleLogin} className="w-full">
            Login with Mindbody
          </Button>
        </motion.div>
      </div>
    );
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
                  {session?.firstName} {session?.lastName}
                </h2>
                {session?.email && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {session.email}
                  </p>
                )}
              </div>
            </div>
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
          onClick={logout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </motion.div>
    </div>
  );
};

export default AccountPage;
