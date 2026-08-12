import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import SeoHead from '@/components/seo/SeoHead';
import { breadcrumbSchema, seoTitle, truncateDescription } from '@/lib/seo';

const GIFTING_DESCRIPTION =
  'Gift Rebase Recovery in Marylebone: purchase gift cards or gift a membership so friends and family can experience luxury recovery.';

/** TODO: replace with the live gift-card purchase URL when available. */
const TODO_GIFT_CARD_URL = 'TODO_GIFT_CARD_URL';

const Gifting = () => {
  return (
    <div
      style={{ position: 'fixed', inset: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
      className="dark bg-[#1a1a1a]"
    >
      <SeoHead
        title={seoTitle('Gifting')}
        description={truncateDescription(GIFTING_DESCRIPTION)}
        path="/gifting"
        jsonLd={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Gifting', path: '/gifting' },
          ]),
        ]}
      />
      <Navigation />
      <main id="main-content">
        <section className="pt-32 pb-8 px-5 sm:px-8" aria-labelledby="gifting-heading">
          <div className="max-w-[1200px] mx-auto text-center">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-[#F9ECD9]/40 text-xs uppercase tracking-[0.3em] mb-4 font-light"
            >
              Gifting
            </motion.p>
            <motion.h1
              id="gifting-heading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-light text-[#F9ECD9] tracking-tight"
            >
              Share the Gift of Recovery
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-[#F9ECD9]/50 text-base sm:text-lg max-w-2xl mx-auto font-light leading-relaxed"
            >
              Treat someone you care about to Rebase — from flexible gift cards to a full membership
              experience.
            </motion.p>
          </div>
        </section>

        <section className="pb-20 px-5 sm:px-8">
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-5 lg:items-stretch">
            <motion.article
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0 }}
              className="relative flex flex-col border border-[#F9ECD9]/10 rounded-sm overflow-hidden"
            >
              <header className="bg-[#F9ECD9]/[0.08] border-b border-[#F9ECD9]/10 px-6 py-5 text-center">
                <h2 className="text-xl sm:text-2xl font-light text-[#F9ECD9] tracking-[0.2em] uppercase">
                  Gift Cards
                </h2>
              </header>

              <div className="h-36 overflow-hidden border-b border-[#F9ECD9]/10">
                <img
                  src="/images/rebase-suite.webp"
                  alt="Rebase Recovery suite — gift cards"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>

              <div className="flex flex-1 flex-col bg-white/[0.02] px-6 py-6 text-center space-y-4">
                <p className="text-[#F9ECD9]/75 text-sm sm:text-base font-light leading-relaxed">
                  Give the gift of recovery with our Rebase Gift Cards.
                </p>
                <p className="text-[#F9ECD9]/75 text-sm sm:text-base font-light leading-relaxed">
                  <a
                    href={TODO_GIFT_CARD_URL}
                    className="text-[#F9ECD9]/80 hover:text-[#F9ECD9] underline underline-offset-4 transition-colors"
                  >
                    Purchase here
                  </a>{' '}
                  or email{' '}
                  <a
                    href="mailto:info@rebaserecovery.com"
                    className="text-[#F9ECD9]/80 hover:text-[#F9ECD9] underline underline-offset-4 transition-colors"
                  >
                    info@rebaserecovery.com
                  </a>{' '}
                  for more personalised options.
                </p>
              </div>
            </motion.article>

            <motion.article
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative flex flex-col border border-[#F9ECD9]/10 rounded-sm overflow-hidden"
            >
              <header className="bg-[#F9ECD9]/[0.08] border-b border-[#F9ECD9]/10 px-6 py-5 text-center">
                <h2 className="text-xl sm:text-2xl font-light text-[#F9ECD9] tracking-[0.2em] uppercase">
                  Give the Gift of Membership
                </h2>
              </header>

              <div className="h-36 overflow-hidden border-b border-[#F9ECD9]/10">
                <img
                  src="/images/rebase-resident-membership.webp"
                  alt="Rebase Recovery membership — gift a membership"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>

              <div className="flex flex-1 flex-col bg-white/[0.02] px-6 py-6 text-center space-y-4">
                <p className="text-[#F9ECD9]/75 text-sm sm:text-base font-light leading-relaxed">
                  Gift a Rebase membership to a loved one and let them experience recovery at its best.
                </p>
                <p className="text-[#F9ECD9]/75 text-sm sm:text-base font-light leading-relaxed">
                  Email{' '}
                  <a
                    href="mailto:membership@rebaserecovery.com"
                    className="text-[#F9ECD9]/80 hover:text-[#F9ECD9] underline underline-offset-4 transition-colors"
                  >
                    membership@rebaserecovery.com
                  </a>{' '}
                  to discuss options.
                </p>
              </div>
            </motion.article>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Gifting;
