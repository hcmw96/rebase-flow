import { useState } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { LogOut, ExternalLink, User, Mail, MessageSquare, Calendar, Clock, History, CreditCard, Sparkles } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useMyBookings } from '@/hooks/useMindbodyBookings';
import { useClientMembership } from '@/hooks/useMindbodyMembership';

const AccountPage = () => {
  const { mbSession, isAuthenticated, logout, login } = useAuth();
  const { data: bookingsData } = useMyBookings();
  const [message, setMessage] = useState('');
  const [showAllHistory, setShowAllHistory] = useState(false);

  const pastBookings = (bookingsData?.bookings || [])
    .filter((b: any) => new Date(b.startDateTime) < new Date())
    .sort((a: any, b: any) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime());

  if (!isAuthenticated) {
    return (
      <div className="px-4 pt-6 pb-4 max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <User className="h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Sign in to view your account</p>
        <Button onClick={login} className="w-full">Sign in with Mindbody</Button>
      </div>
    );
  }

  const visibleHistory = showAllHistory ? pastBookings : pastBookings.slice(0, 5);

  return (
    <div className="px-4 pt-6 pb-4 space-y-6 max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-light text-black/80">Account</h1>
      </motion.div>

      {/* Profile info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="rounded-lg border border-black/[0.06] bg-white/40 p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-black/[0.04] flex items-center justify-center">
              <User className="h-6 w-6 text-black/40" />
            </div>
            <div>
              <h2 className="font-semibold text-black/80">
                {mbSession?.firstName} {mbSession?.lastName}
              </h2>
              {mbSession?.email && (
                <p className="text-sm text-black/40 flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {mbSession.email}
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Session History */}
      {pastBookings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="rounded-lg border border-black/[0.06] bg-white/40 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-black/[0.04] flex items-center justify-center">
                <History className="h-4 w-4 text-black/40" />
              </div>
              <div>
                <p className="text-sm font-medium text-black/80">Session History</p>
                <p className="text-xs text-black/40">{pastBookings.length} past session{pastBookings.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            <div className="space-y-2">
              {visibleHistory.map((booking: any, index: number) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center justify-between py-2 border-b border-black/[0.04] last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-black/70 truncate">{booking.serviceName}</p>
                    <div className="flex items-center gap-2 text-xs text-black/40">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(booking.startDateTime), 'MMM d, yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(booking.startDateTime), 'h:mm a')}
                      </span>
                    </div>
                  </div>
                  {booking.staffName && (
                    <p className="text-xs text-black/30 ml-2 flex-shrink-0">{booking.staffName}</p>
                  )}
                </motion.div>
              ))}
            </div>

            {pastBookings.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-black/50 hover:text-black/70"
                onClick={() => setShowAllHistory(!showAllHistory)}
              >
                {showAllHistory ? 'Show Less' : `View All ${pastBookings.length} Sessions`}
              </Button>
            )}
          </div>
        </motion.div>
      )}

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
          className="flex items-center justify-between p-4 rounded-lg border border-black/[0.06] bg-white/40 hover:bg-white/60 transition-colors"
        >
          <span className="text-sm text-black/70">Visit Rebase Website</span>
          <ExternalLink className="h-4 w-4 text-black/30" />
        </a>
      </motion.div>

      {/* Contact Form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="rounded-lg border border-black/[0.06] bg-white/40 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-black/[0.04] flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-black/40" />
            </div>
            <div>
              <p className="text-sm font-medium text-black/80">Get in Touch</p>
              <p className="text-xs text-black/40">Questions or feedback</p>
            </div>
          </div>
          <Textarea
            placeholder="Write your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[100px] resize-none bg-white/60 border-black/10 text-black placeholder:text-black/30 focus-visible:ring-black/20"
          />
          <Button
            size="sm"
            className="w-full bg-black/80 hover:bg-black text-white"
            disabled={!message.trim()}
            onClick={() => {
              const name = `${mbSession?.firstName || ''} ${mbSession?.lastName || ''}`.trim();
              const email = mbSession?.email || '';
              const subject = encodeURIComponent(`Message from ${name}`);
              const body = encodeURIComponent(`${message}\n\nFrom: ${name} (${email})`);
              window.open(`mailto:reception@rebaserecovery.com?subject=${subject}&body=${body}`, '_self');
              toast.success('Opening your email client...');
              setMessage('');
            }}
          >
            Send Message
          </Button>
        </div>
      </motion.div>

      {/* Logout */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Button
          variant="outline"
          className="w-full border-black/10 text-red-600 hover:text-red-700 hover:bg-red-50/50"
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
