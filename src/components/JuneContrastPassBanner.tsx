import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { CONTRAST_PASS_OFFER } from '@/config/contrastPassOffer';
import { useContrastPassOffer } from '@/hooks/useContrastPassOffer';

const JuneContrastPassBanner = () => {
  const { saleActive, displayPrice } = useContrastPassOffer();

  if (!saleActive) return null;

  return (
    <section
      className="relative z-20 border-b border-[#F9ECD9]/15 bg-[#3B2712]"
      aria-label="June offer: 2 Week Unlimited Communal Contrast Pass"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-4 sm:flex-row sm:items-center sm:py-5">
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#F9ECD9]/70">
            June only
          </p>
          <p className="font-serif text-lg text-[#F9ECD9] sm:text-xl">
            {CONTRAST_PASS_OFFER.headline}
            <span className="ml-2 font-sans text-base font-medium text-[#F9ECD9]/90">
              — £{displayPrice}
            </span>
          </p>
          <p className="max-w-xl text-sm font-light leading-relaxed text-[#F9ECD9]/75">
            One communal contrast session per day for 14 days from purchase. Buy now — valid into July
            if you purchase at the end of June.
          </p>
        </div>
        <Link
          to={CONTRAST_PASS_OFFER.path}
          className="inline-flex shrink-0 items-center gap-2 border border-[#F9ECD9]/30 bg-[#F9ECD9]/10 px-6 py-3 text-xs font-medium uppercase tracking-[0.12em] text-[#F9ECD9] transition-colors hover:bg-[#F9ECD9]/20"
        >
          View offer
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
};

export default JuneContrastPassBanner;
