import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://rebase-flow.lovable.app';

const PrivacyPolicy = () => {
  return (
    <div
      style={{ position: 'fixed', inset: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
      className="bg-[#F9ECD9] text-[#3B2712]"
    >
      <Helmet>
        <title>Privacy Policy — Rebase Recovery</title>
        <meta
          name="description"
          content="How Rebase Recovery collects, uses and protects your personal data."
        />
        <link rel="canonical" href={`${SITE_URL}/privacy-policy`} />
      </Helmet>

      <div
        className="sticky top-0 z-10 bg-[#F9ECD9]/90 backdrop-blur border-b border-[#3B2712]/[0.06]"
        style={{ paddingTop: 'var(--safe-area-top, env(safe-area-inset-top, 0px))' }}
      >
        <div className="max-w-2xl mx-auto px-5 py-3 flex items-center">
          <Link
            to="/"
            className="flex items-center gap-1 text-sm text-[#3B2712]/70 hover:text-[#3B2712] transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-5 sm:px-8 pt-6 pb-20">
        <h1 className="text-3xl font-light tracking-wide mb-2">Privacy Policy</h1>
        <p className="text-[#3B2712]/50 text-sm mb-10">Last updated: May 2026</p>

        <div className="space-y-8 text-[15px] leading-relaxed text-[#3B2712]/85">
          <section>
            <p>
              This Privacy Policy explains how Rebase Recovery Ltd ("Rebase", "we", "us")
              collects, uses and protects your personal data when you use the Rebase app and
              our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#3B2712] mb-3">Data we collect</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Name and email address</li>
              <li>Booking history (via Mindbody)</li>
              <li>Device identifiers</li>
              <li>Push notification tokens</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#3B2712] mb-3">Third-party services</h2>
            <p className="mb-2">We use the following providers to deliver the service:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <span className="font-medium">Mindbody</span> — bookings, account and
                membership data
              </li>
              <li>
                <span className="font-medium">OneSignal</span> — push notifications
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#3B2712] mb-3">Account deletion</h2>
            <p>
              You can request deletion of your account and personal data at any time by
              emailing{' '}
              <a
                href="mailto:reception@rebaserecovery.com"
                className="underline underline-offset-4 hover:text-[#3B2712]"
              >
                reception@rebaserecovery.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#3B2712] mb-3">Contact</h2>
            <p>
              For any privacy-related questions, contact us at{' '}
              <a
                href="mailto:reception@rebaserecovery.com"
                className="underline underline-offset-4 hover:text-[#3B2712]"
              >
                reception@rebaserecovery.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-[#3B2712] mb-3">Company</h2>
            <p>
              Rebase Recovery Ltd
              <br />
              1a St Vincent Street
              <br />
              London W1U 4DA
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
