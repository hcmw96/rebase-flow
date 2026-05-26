import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { Helmet } from 'react-helmet-async';
import {
  Calendar,
  Clock,
  ChevronRight,
  Sparkles,
  Gift,
  Snowflake,
  Wind,
  Waves,
  Dumbbell,
  ExternalLink,
  LogOut,
  Mail,
  History,
  MessageSquare,
  Crown,
  User,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useMyBookings } from '@/hooks/useMindbodyBookings';
import { useClientMembership, type Membership } from '@/hooks/useMindbodyMembership';
import { resolveTier, MEMBER_PERKS, type TierConfig } from '@/lib/membershipTiers';

const SITE_URL = 'https://rebase-flow.lovable.app';

const QUICK_BOOK = [
  { label: 'Cryotherapy', icon: Snowflake, to: '/experiences' },
  { label: 'HBOT', icon: Wind, to: '/experiences' },
  { label: 'Communal Contrast', icon: Waves, to: '/experiences' },
  { label: 'Classes', icon: Dumbbell, to: '/experiences' },
];

const SectionHeading = ({ eyebrow, title }: { eyebrow?: string; title: string }) => (
  <div className="mb-5">
    {eyebrow && (
      <p className="text-[10px] uppercase tracking-[0.25em] text-[#3B2712]/50 mb-1.5">{eyebrow}</p>
    )}
    <h2 className="text-xl md:text-2xl font-light text-[#3B2712] tracking-tight">{title}</h2>
  </div>
);

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`rounded-lg border border-[#3B2712]/[0.08] bg-white/40 backdrop-blur-sm ${className}`}
  >
    {children}
  </div>
);

const formatRelativeDay = (date: Date) => {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isThisWeek(date)) return format(date, 'EEEE');
  return format(date, 'EEE d MMM');
};

const SignedOutView = ({ onLogin }: { onLogin: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center max-w-md mx-auto">
    <div className="w-16 h-16 rounded-full bg-[#3B2712]/[0.06] flex items-center justify-center mb-6">
      <Crown className="h-7 w-7 text-[#3B2712]/60" strokeWidth={1.25} />
    </div>
    <h1 className="text-3xl font-light text-[#3B2712] tracking-tight mb-3">Members</h1>
    <p className="text-sm text-[#3B2712]/60 mb-8 leading-relaxed">
      Sign in with your Rebase account to view your membership, allowances and bookings.
    </p>
    <Button
      onClick={onLogin}
      className="rounded-none px-8 h-11 bg-[#3B2712] text-[#F9ECD9] hover:bg-[#3B2712]/90 tracking-[0.08em] text-[13px]"
    >
      Sign In <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
    </Button>
    <Link
      to="/membership"
      className="mt-5 text-[12px] uppercase tracking-[0.18em] text-[#3B2712]/50 hover:text-[#3B2712] transition-colors"
    >
      Become a member →
    </Link>
  </div>
);

const TierHero = ({
  membership,
  tier,
  firstName,
}: {
  membership: Membership | null;
  tier: TierConfig | null;
  firstName: string | null;
}) => {
  if (!membership || !tier) {
    return (
      <Card className="p-6 md:p-8">
        <p className="text-[10px] uppercase tracking-[0.25em] text-[#3B2712]/50 mb-2">
          Welcome{firstName ? `, ${firstName}` : ''}
        </p>
        <h1 className="text-2xl md:text-3xl font-light text-[#3B2712] tracking-tight mb-3">
          You don't have a Rebase membership yet
        </h1>
        <p className="text-sm text-[#3B2712]/60 mb-6 max-w-xl">
          Members enjoy unlimited contrast, monthly cryotherapy and HBOT allowances, priority class
          booking and 10% off everything else.
        </p>
        <Link to="/membership">
          <Button className="rounded-none h-11 px-6 bg-[#3B2712] text-[#F9ECD9] hover:bg-[#3B2712]/90 tracking-[0.08em] text-[13px]">
            Become a Member <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </Link>
      </Card>
    );
  }

  const renews = membership.paymentDate ? new Date(membership.paymentDate) : null;
  const since = membership.activeDate ? new Date(membership.activeDate) : null;

  return (
    <Card className="p-6 md:p-8 relative overflow-hidden">
      <div className="absolute top-6 right-6 hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#3B2712] text-[#F9ECD9] text-[10px] uppercase tracking-[0.2em]">
        <Sparkles className="h-3 w-3" />
        {tier.name}
      </div>
      <p className="text-[10px] uppercase tracking-[0.25em] text-[#3B2712]/50 mb-2">
        Welcome back{firstName ? `, ${firstName}` : ''}
      </p>
      <h1 className="text-3xl md:text-4xl font-light text-[#3B2712] tracking-tight mb-2">
        {tier.name} Member
      </h1>
      <p className="text-sm text-[#3B2712]/70 mb-5 max-w-xl">{tier.blurb}</p>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#3B2712]/60">
        {since && (
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Member since {format(since, 'MMM yyyy')}
          </span>
        )}
        {renews && (
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {membership.autoRenewing ? 'Auto-renews' : 'Renews'} {format(renews, 'd MMM')}
          </span>
        )}
        {membership.autoRenewing && (
          <span className="text-emerald-700">Auto-renew on</span>
        )}
      </div>
    </Card>
  );
};

const Allowances = ({
  tier,
  clientServices,
}: {
  tier: TierConfig | null;
  clientServices: { name: string; remaining: number }[];
}) => {
  if (!tier) return null;

  const rows = tier.allowances.map((a) => {
    const matched = clientServices.find((s) =>
      a.matchKeywords.some((k) => s.name.toLowerCase().includes(k))
    );
    if (a.monthly === 'unlimited') {
      return { label: a.label, used: 0, total: 0, unlimited: true, remaining: matched?.remaining };
    }
    const remaining = matched?.remaining ?? a.monthly;
    const used = Math.max(0, a.monthly - remaining);
    return { label: a.label, used, total: a.monthly, unlimited: false, remaining };
  });

  return (
    <Card className="p-6 h-full">
      <SectionHeading eyebrow="This month" title="Allowances" />
      <div className="space-y-4">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-sm text-[#3B2712]/80">{r.label}</span>
              {r.unlimited ? (
                <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-700">
                  Unlimited
                </span>
              ) : (
                <span className="text-xs text-[#3B2712]/50 tabular-nums">
                  {r.remaining} of {r.total} left
                </span>
              )}
            </div>
            <div className="h-1 bg-[#3B2712]/[0.08] overflow-hidden">
              <div
                className="h-full bg-[#3B2712] transition-all duration-500"
                style={{
                  width: r.unlimited
                    ? '100%'
                    : `${Math.max(4, ((r.total - r.used) / Math.max(r.total, 1)) * 100)}%`,
                  opacity: r.unlimited ? 0.15 : 1,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const NextSession = ({ next }: { next: any }) => {
  if (!next) {
    return (
      <Card className="p-6 h-full flex flex-col">
        <SectionHeading eyebrow="Next session" title="Nothing booked" />
        <p className="text-sm text-[#3B2712]/60 mb-4 flex-1">
          Choose your next experience and we'll have everything ready for you.
        </p>
        <Link to="/experiences">
          <Button
            variant="outline"
            className="w-full rounded-none border-[#3B2712]/20 text-[#3B2712] hover:bg-[#3B2712]/5 tracking-wider text-sm"
          >
            Book a Session <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </Link>
      </Card>
    );
  }

  const start = new Date(next.startTime);
  return (
    <Card className="p-6 h-full flex flex-col">
      <SectionHeading eyebrow="Next session" title={formatRelativeDay(start)} />
      <div className="flex-1 space-y-2 mb-5">
        <p className="text-2xl font-light text-[#3B2712] tracking-tight">
          {format(start, 'h:mm a')}
        </p>
        <p className="text-sm text-[#3B2712]/80">{next.serviceName}</p>
        {next.staffName && <p className="text-xs text-[#3B2712]/50">with {next.staffName}</p>}
        {next.locationName && <p className="text-xs text-[#3B2712]/50">{next.locationName}</p>}
      </div>
      <Link to="/">
        <Button
          variant="outline"
          className="w-full rounded-none border-[#3B2712]/20 text-[#3B2712] hover:bg-[#3B2712]/5 tracking-wider text-sm"
        >
          Manage Booking <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </Link>
    </Card>
  );
};

const QuickBook = () => (
  <Card className="p-6 h-full">
    <SectionHeading eyebrow="One tap" title="Quick book" />
    <div className="grid grid-cols-2 gap-2.5">
      {QUICK_BOOK.map(({ label, icon: Icon, to }) => (
        <Link
          key={label}
          to={to}
          className="group flex flex-col items-start gap-2 p-3.5 border border-[#3B2712]/[0.1] hover:border-[#3B2712]/30 hover:bg-[#3B2712]/[0.03] transition-all"
        >
          <Icon className="h-4 w-4 text-[#3B2712]/60 group-hover:text-[#3B2712]" strokeWidth={1.5} />
          <span className="text-xs text-[#3B2712]/80 leading-tight">{label}</span>
        </Link>
      ))}
    </div>
  </Card>
);

const UpcomingList = ({ upcoming }: { upcoming: any[] }) => {
  if (upcoming.length === 0) return null;
  return (
    <Card className="p-6">
      <div className="flex items-baseline justify-between mb-5">
        <SectionHeading eyebrow="Upcoming" title="Your schedule" />
      </div>
      <div className="space-y-1">
        {upcoming.slice(0, 5).map((b) => {
          const start = new Date(b.startTime);
          return (
            <div
              key={b.id}
              className="flex items-center justify-between py-3 border-b border-[#3B2712]/[0.06] last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#3B2712]/85 truncate">{b.serviceName}</p>
                <div className="flex items-center gap-3 text-xs text-[#3B2712]/50 mt-0.5">
                  <span>{formatRelativeDay(start)}</span>
                  <span>{format(start, 'h:mm a')}</span>
                  {b.staffName && <span className="truncate">{b.staffName}</span>}
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#3B2712]/40 ml-3 hidden sm:block">
                {b.type}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

const Perks = ({ tier }: { tier: TierConfig | null }) => (
  <Card className="p-6">
    <SectionHeading eyebrow="Yours to enjoy" title="Member perks" />
    <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
      {MEMBER_PERKS.map((perk) => {
        let description = perk.description;
        if (perk.title === 'Guest passes' && tier) {
          description = `${tier.guestPassesAnnual} per year — bring friends and family to experience Rebase with you.`;
        }
        return (
          <div key={perk.title} className="flex gap-3">
            <Gift className="h-4 w-4 text-[#3B2712]/40 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#3B2712]/85 flex items-center gap-2">
                {perk.title}
                {perk.soon && (
                  <span className="text-[9px] uppercase tracking-[0.2em] text-[#3B2712]/40 border border-[#3B2712]/20 px-1.5 py-0.5">
                    Soon
                  </span>
                )}
              </p>
              <p className="text-xs text-[#3B2712]/55 mt-0.5 leading-relaxed">{description}</p>
            </div>
          </div>
        );
      })}
    </div>
  </Card>
);

const RecentSessions = ({ past }: { past: any[] }) => {
  const [showAll, setShowAll] = useState(false);
  if (past.length === 0) return null;
  const visible = showAll ? past : past.slice(0, 5);
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <History className="h-4 w-4 text-[#3B2712]/40" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#3B2712]/50">History</p>
            <h2 className="text-xl font-light text-[#3B2712] tracking-tight">
              Recent sessions
            </h2>
          </div>
        </div>
      </div>
      <div className="space-y-1">
        {visible.map((b) => {
          const start = new Date(b.startTime);
          return (
            <div
              key={b.id}
              className="flex items-center justify-between py-2.5 border-b border-[#3B2712]/[0.06] last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[#3B2712]/80 truncate">{b.serviceName}</p>
                <p className="text-xs text-[#3B2712]/45 mt-0.5">
                  {format(start, 'd MMM yyyy')} · {format(start, 'h:mm a')}
                </p>
              </div>
              {b.staffName && (
                <span className="text-xs text-[#3B2712]/40 ml-3 hidden sm:block">
                  {b.staffName}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {past.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 text-[11px] uppercase tracking-[0.2em] text-[#3B2712]/55 hover:text-[#3B2712] transition-colors"
        >
          {showAll ? 'Show less' : `View all ${past.length} sessions →`}
        </button>
      )}
    </Card>
  );
};

const ConciergeAndAccount = ({
  email,
  fullName,
  onLogout,
}: {
  email: string | null;
  fullName: string;
  onLogout: () => void;
}) => {
  const [message, setMessage] = useState('');

  const sendMessage = () => {
    const subject = encodeURIComponent(`Message from ${fullName || 'Rebase Member'}`);
    const body = encodeURIComponent(`${message}\n\nFrom: ${fullName} (${email || ''})`);
    window.open(
      `mailto:support@rebaserecovery.com?subject=${subject}&body=${body}`,
      '_self'
    );
    toast.success('Opening your email client...');
    setMessage('');
  };

  return (
    <div className="grid md:grid-cols-2 gap-5">
      <Card className="p-6">
        <SectionHeading eyebrow="Anything you need" title="Concierge" />
        <Textarea
          placeholder="Send a note to the Rebase team..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[110px] resize-none rounded-none bg-[#F9ECD9]/40 border-[#3B2712]/15 text-[#3B2712] placeholder:text-[#3B2712]/35 focus-visible:ring-[#3B2712]/20 mb-3"
        />
        <Button
          onClick={sendMessage}
          disabled={!message.trim()}
          className="w-full rounded-none bg-[#3B2712] text-[#F9ECD9] hover:bg-[#3B2712]/90 tracking-[0.08em] text-[13px] h-11"
        >
          <MessageSquare className="h-3.5 w-3.5 mr-2" />
          Send Message
        </Button>
      </Card>

      <Card className="p-6 flex flex-col">
        <SectionHeading eyebrow="Your details" title="Account" />
        <div className="space-y-3 mb-5 flex-1">
          <div className="flex items-center gap-3 text-sm text-[#3B2712]/75">
            <User className="h-4 w-4 text-[#3B2712]/40" strokeWidth={1.5} />
            {fullName || 'Rebase Member'}
          </div>
          {email && (
            <div className="flex items-center gap-3 text-sm text-[#3B2712]/75">
              <Mail className="h-4 w-4 text-[#3B2712]/40" strokeWidth={1.5} />
              {email}
            </div>
          )}
          <a
            href="https://rebase.co.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between text-sm text-[#3B2712]/75 hover:text-[#3B2712] transition-colors pt-2"
          >
            Visit Rebase
            <ExternalLink className="h-3.5 w-3.5 text-[#3B2712]/40" />
          </a>
        </div>
        <Button
          variant="outline"
          onClick={onLogout}
          className="rounded-none border-[#3B2712]/15 text-red-700 hover:text-red-800 hover:bg-red-50/40 tracking-wider text-sm"
        >
          <LogOut className="h-3.5 w-3.5 mr-2" />
          Sign Out
        </Button>
      </Card>
    </div>
  );
};

const MembersPage = () => {
  const { mbSession, isAuthenticated, isLoading: authLoading, login, logout } = useAuth();
  const { data: bookingsData, isLoading: bookingsLoading } = useMyBookings();
  const { data: membershipData, isLoading: membershipLoading } = useClientMembership();

  const allBookings = (bookingsData?.bookings || []) as any[];
  const now = new Date();
  const upcoming = useMemo(
    () =>
      allBookings
        .filter((b) => new Date(b.startTime) >= now)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bookingsData]
  );
  const past = useMemo(
    () =>
      allBookings
        .filter((b) => new Date(b.startTime) < now)
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bookingsData]
  );

  const activeMembership: Membership | null = membershipData?.memberships?.[0] ?? null;
  const tier = resolveTier(activeMembership?.name);
  const fullName = `${mbSession?.firstName || ''} ${mbSession?.lastName || ''}`.trim();

  const isLoading = authLoading || (isAuthenticated && (bookingsLoading || membershipLoading));

  return (
    <div className="fixed inset-0 overflow-y-auto bg-[#F9ECD9]" style={{ overflowY: 'auto' }}>
      <Helmet>
        <title>Members | Rebase</title>
        <meta
          name="description"
          content="Your Rebase membership dashboard — tier, allowances, bookings and member perks."
        />
        <link rel="canonical" href={`${SITE_URL}/members`} />
        <meta name="robots" content="noindex" />
      </Helmet>

      <Navigation />

      <main className="pt-24 pb-16 min-h-screen">
        {authLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="h-7 w-7 animate-spin text-[#3B2712]/40" />
          </div>
        ) : !isAuthenticated ? (
          <SignedOutView onLogin={login} />
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="h-7 w-7 animate-spin text-[#3B2712]/40" />
            <p className="text-xs uppercase tracking-[0.2em] text-[#3B2712]/40">
              Loading your membership
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-6xl mx-auto px-4 md:px-8 space-y-5"
          >
            <TierHero
              membership={activeMembership}
              tier={tier}
              firstName={mbSession?.firstName || null}
            />

            <div className="grid md:grid-cols-3 gap-5">
              <Allowances tier={tier} clientServices={membershipData?.clientServices ?? []} />
              <NextSession next={upcoming[0]} />
              <QuickBook />
            </div>

            <UpcomingList upcoming={upcoming} />

            <Perks tier={tier} />

            <RecentSessions past={past} />

            <ConciergeAndAccount
              email={mbSession?.email || null}
              fullName={fullName}
              onLogout={logout}
            />
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MembersPage;
