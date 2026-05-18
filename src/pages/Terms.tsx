import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://rebase-flow.lovable.app';

const Terms = () => {
  return (
    <div
      style={{ position: 'fixed', inset: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
      className="bg-[#F9ECD9] text-[#3B2712]"
    >
      <Helmet>
        <title>Terms & Conditions — Rebase Recovery</title>
        <meta name="description" content="Rebase Recovery terms and conditions." />
        <link rel="canonical" href={`${SITE_URL}/terms`} />
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
        <h1 className="text-3xl font-light tracking-wide mb-8">Terms & Conditions</h1>
        <p className="text-[15px] leading-relaxed text-[#3B2712]/85">
          Please contact{' '}
          <a
            href="mailto:reception@rebaserecovery.com"
            className="underline underline-offset-4 hover:text-[#3B2712]"
          >
            reception@rebaserecovery.com
          </a>{' '}
          for our full terms and conditions.
        </p>
      </main>
    </div>
  );
};

export default Terms;
