import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import MembershipEnquiryDialog from '@/components/MembershipEnquiryDialog';
import MembershipPurchasePanel from '@/components/membership/MembershipPurchasePanel';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import SeoHead from '@/components/seo/SeoHead';
import {
  breadcrumbSchema,
  itemListServicesSchema,
  seoTitle,
  truncateDescription,
} from '@/lib/seo';
import {
  MEMBERSHIP_PERK_FOOTER,
  MEMBERSHIP_PLANS,
  formatMembershipPrice,
} from '@/config/membershipPlans';
import { useAuth } from '@/contexts/AuthContext';
import { useClientMembership } from '@/hooks/useMindbodyMembership';
import { clearMembershipCheckoutLocks } from '@/lib/membershipCheckoutGuard';
import { hasActiveRebaseMembership } from '@/lib/membershipOwnership';
import {
  clearSessionNeedsPaymentCard,
  sessionNeedsPaymentCard,
} from '@/lib/paymentCardSetupStorage';

const MEMBERSHIP_DESCRIPTION =
  'Rebase Recovery membership in Marylebone: Ultimate, Resident and Base tiers. Monthly subscriptions online; annual memberships via the studio. All prices include VAT.';

const Membership = () => {
  const { login, openMindbodySignUp, isAuthenticated, mbSession } = useAuth();
  const { data: membershipData, isLoading: membershipLoading, refetch: refetchMembership } =
    useClientMembership();
  const [enquiryTier, setEnquiryTier] = useState<string | null>(null);
  const [needsCardOnFile, setNeedsCardOnFile] = useState(false);

  useEffect(() => {
    if (isAuthenticated && sessionNeedsPaymentCard(mbSession?.sessionId)) {
      setNeedsCardOnFile(true);
    }
  }, [isAuthenticated, mbSession?.sessionId]);

  useEffect(() => {
    if (hasActiveRebaseMembership(membershipData) && mbSession?.sessionId) {
      clearMembershipCheckoutLocks(mbSession.sessionId);
    }
  }, [membershipData, mbSession?.sessionId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const onFocus = () => {
      void refetchMembership();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [isAuthenticated, refetchMembership]);

  const handleContinueAfterCard = () => {
    clearSessionNeedsPaymentCard();
    setNeedsCardOnFile(false);
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
      className="bg-[#1a1a1a]"
    >
      <SeoHead
        title={seoTitle('Membership Plans')}
        description={truncateDescription(MEMBERSHIP_DESCRIPTION)}
        path="/membership"
        jsonLd={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Membership', path: '/membership' },
          ]),
          itemListServicesSchema(
            '/membership',
            'Rebase Recovery Membership Plans',
            MEMBERSHIP_PLANS.map((plan) => ({
              name: `${plan.name} Membership`,
              description: `${formatMembershipPrice(plan.annualPriceGbp)} per year (contact studio) or ${formatMembershipPrice(plan.monthlyPriceGbp)} per month (subscribe online)`,
            })),
          ),
        ]}
      />
      <Navigation />
      <main id="main-content">
        <section className="pt-32 pb-10 px-5 sm:px-8" aria-labelledby="membership-heading">
          <div className="max-w-[1200px] mx-auto text-center">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-[#F9ECD9]/40 text-xs uppercase tracking-[0.3em] mb-4 font-light"
            >
              Membership
            </motion.p>
            <motion.h1
              id="membership-heading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-light text-[#F9ECD9] tracking-tight mb-6"
            >
              Elevate Your Recovery
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-[#F9ECD9]/50 text-base sm:text-lg max-w-2xl mx-auto font-light leading-relaxed"
            >
              Choose the membership tier that aligns with your wellness goals. Each level unlocks
              progressively greater access to our world-class recovery and performance services.
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-4 text-[#F9ECD9]/60 text-sm font-medium tracking-wide"
            >
              All prices include VAT · Monthly subscriptions online · Annual via the studio
            </motion.p>
          </div>
        </section>

        <section className="pb-16 px-5 sm:px-8 pt-5">
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-5 lg:items-stretch">
            {MEMBERSHIP_PLANS.map((plan, idx) => (
              <motion.article
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * idx }}
                className={`relative flex flex-col border rounded-sm overflow-visible ${
                  plan.highlighted
                    ? 'border-[#F9ECD9]/30 lg:scale-[1.02] lg:z-10'
                    : 'border-[#F9ECD9]/10'
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap bg-[#F9ECD9] text-[#1a1a1a] text-[10px] uppercase tracking-[0.2em] font-medium px-4 py-1">
                    Most Popular
                  </span>
                )}

                <header className="bg-[#F9ECD9]/[0.08] border-b border-[#F9ECD9]/10 px-6 py-5 text-center rounded-t-sm overflow-hidden">
                  <h2 className="text-xl sm:text-2xl font-light text-[#F9ECD9] tracking-[0.2em] uppercase">
                    {plan.name}
                  </h2>
                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#F9ECD9]/45 mb-1">
                        Annual · contact studio
                      </p>
                      <p className="text-2xl sm:text-3xl font-light text-[#F9ECD9]">
                        {formatMembershipPrice(plan.annualPriceGbp)}
                        <span className="text-sm text-[#F9ECD9]/50 font-light"> / year</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#F9ECD9]/45 mb-1">
                        Monthly · subscribe online
                      </p>
                      <p className="text-lg sm:text-xl font-light text-[#F9ECD9]/90">
                        {formatMembershipPrice(plan.monthlyPriceGbp)}
                        <span className="text-sm text-[#F9ECD9]/50 font-light"> / month</span>
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-[#F9ECD9]/45">
                    incl. VAT
                  </p>
                </header>

                {plan.image && (
                  <div className="h-36 overflow-hidden border-b border-[#F9ECD9]/10">
                    <img
                      src={plan.image}
                      alt={`${plan.name} membership at Rebase Recovery, London`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                <div className="flex flex-1 flex-col bg-white/[0.02] px-6 py-6 rounded-b-sm overflow-hidden">
                  <ul className="space-y-3 flex-1">
                    {plan.features.map((feature) => (
                      <li
                        key={feature.label}
                        className="flex items-start justify-between gap-3 text-sm"
                      >
                        <span className="flex items-start gap-2 text-[#F9ECD9]/75 font-light">
                          <Check
                            className="h-4 w-4 text-[#F9ECD9]/40 mt-0.5 shrink-0"
                            aria-hidden
                          />
                          {feature.label}
                        </span>
                        <span className="text-[#F9ECD9]/90 font-light text-right shrink-0">
                          {feature.value}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <p className="mt-6 pt-4 border-t border-[#F9ECD9]/10 text-center text-xs text-[#F9ECD9]/55 font-light leading-relaxed">
                    {MEMBERSHIP_PERK_FOOTER}
                  </p>

                  <div className="mt-6 pt-4 border-t border-[#F9ECD9]/10">
                    <MembershipPurchasePanel
                      plan={plan}
                      membershipData={membershipData}
                      membershipLoading={membershipLoading}
                      needsCardOnFile={needsCardOnFile}
                      onSignIn={() => login()}
                      onCreateAccount={openMindbodySignUp}
                      onContactStudio={() => setEnquiryTier(plan.name)}
                      onContinueAfterCard={handleContinueAfterCard}
                    />
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="pb-8 px-5 sm:px-8">
          <p className="text-center text-[#F9ECD9]/45 text-xs sm:text-sm font-light max-w-xl mx-auto leading-relaxed">
            Monthly memberships are purchased through Mindbody — we open checkout once per tier, so
            do not tap Subscribe monthly repeatedly or you may be charged more than once. Annual
            memberships are arranged directly with the studio. Payment is processed securely through
            your Mindbody account.
          </p>
        </section>

        <section className="pb-20 px-5 sm:px-8">
          <p className="text-center text-[#F9ECD9]/50 text-sm sm:text-base font-light max-w-xl mx-auto leading-relaxed">
            For corporate memberships please contact{' '}
            <a
              href="mailto:df@rebaserecovery.com"
              className="text-[#F9ECD9]/80 hover:text-[#F9ECD9] underline underline-offset-4 transition-colors"
            >
              df@rebaserecovery.com
            </a>
            .
          </p>
        </section>
      </main>

      <MembershipEnquiryDialog
        open={enquiryTier !== null}
        onOpenChange={(open) => {
          if (!open) setEnquiryTier(null);
        }}
        tierName={enquiryTier ?? ''}
        billingPeriod="annual"
      />

      <Footer />
    </div>
  );
};

export default Membership;
