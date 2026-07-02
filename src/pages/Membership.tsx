import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import MembershipEnquiryDialog from '@/components/MembershipEnquiryDialog';
import MembershipPurchasePanel from '@/components/membership/MembershipPurchasePanel';
import { motion } from 'framer-motion';
import SeoHead from '@/components/seo/SeoHead';
import {
  breadcrumbSchema,
  itemListServicesSchema,
  seoTitle,
  truncateDescription,
} from '@/lib/seo';
import {
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
  'Rebase Recovery membership in Marylebone: Ultimate, Resident and Base tiers. Monthly subscriptions online; annual memberships via the studio.';

const Membership = () => {
  const { login, isAuthenticated, mbSession } = useAuth();
  const { data: membershipData, isLoading: membershipLoading, refetch: refetchMembership } =
    useClientMembership();
  const [annualEnquiryOpen, setAnnualEnquiryOpen] = useState(false);
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
              description: `${formatMembershipPrice(plan.monthlyPriceGbp)} per month (subscribe online) or ${formatMembershipPrice(plan.annualPriceGbp)} per year (contact studio)`,
            })),
          ),
        ]}
      />
      <Navigation />
      <main id="main-content">
        <section className="pt-32 pb-8 px-5 sm:px-8" aria-labelledby="membership-heading">
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
              className="text-3xl sm:text-4xl lg:text-5xl font-light text-[#F9ECD9] tracking-tight"
            >
              Elevate Your Recovery
            </motion.h1>
          </div>
        </section>

        <section className="pb-16 px-5 sm:px-8">
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-5 lg:items-stretch">
            {MEMBERSHIP_PLANS.map((plan, idx) => (
              <motion.article
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * idx }}
                className="relative flex flex-col border border-[#F9ECD9]/10 rounded-sm overflow-hidden"
              >
                <header className="bg-[#F9ECD9]/[0.08] border-b border-[#F9ECD9]/10 px-6 py-5 text-center">
                  <h2 className="text-xl sm:text-2xl font-light text-[#F9ECD9] tracking-[0.2em] uppercase">
                    {plan.name}
                  </h2>
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

                <div className="flex flex-1 flex-col bg-white/[0.02] px-6 py-6">
                  <ul className="space-y-3 flex-1">
                    {plan.features.map((feature) => (
                      <li
                        key={feature.label}
                        className="flex items-start justify-between gap-3 text-sm"
                      >
                        <span className="text-[#F9ECD9]/75 font-light">{feature.label}</span>
                        <span className="text-[#F9ECD9]/90 font-light text-right shrink-0">
                          {feature.value}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 pt-4 border-t border-[#F9ECD9]/10 text-center space-y-0.5">
                    <p className="text-sm font-light text-[#F9ECD9]/75">
                      {formatMembershipPrice(plan.monthlyPriceGbp)} / month
                    </p>
                    <p className="text-sm font-light text-[#F9ECD9]/75">
                      or {formatMembershipPrice(plan.annualPriceGbp)} per year
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#F9ECD9]/10">
                    <MembershipPurchasePanel
                      plan={plan}
                      membershipData={membershipData}
                      membershipLoading={membershipLoading}
                      needsCardOnFile={needsCardOnFile}
                      onSignIn={() => login()}
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
            do not tap Apply for membership repeatedly or you may be charged more than once. Payment is
            processed securely through your Mindbody account.
          </p>
        </section>

        <section className="pb-6 px-5 sm:px-8">
          <p className="text-center text-[#F9ECD9]/50 text-sm sm:text-base font-light max-w-xl mx-auto leading-relaxed">
            For annual membership please{' '}
            <button
              type="button"
              onClick={() => setAnnualEnquiryOpen(true)}
              className="text-[#F9ECD9]/80 hover:text-[#F9ECD9] underline underline-offset-4 transition-colors"
            >
              contact the studio directly
            </button>
            .
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
        open={annualEnquiryOpen}
        onOpenChange={setAnnualEnquiryOpen}
        billingPeriod="annual"
        showTierSelect
      />

      <Footer />
    </div>
  );
};

export default Membership;
