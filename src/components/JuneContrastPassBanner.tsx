import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { CONTRAST_PASS_OFFER } from '@/config/contrastPassOffer';
import { useContrastPassOffer } from '@/hooks/useContrastPassOffer';

const JuneContrastPassBanner = () => {
  const { saleActive, displayPrice } = useContrastPassOffer();

  if (!saleActive) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] h-9 border-b border-[#F9ECD9]/15 bg-[#3B2712]"
      role="region"
      aria-label="June offer: 2 Week Unlimited Communal Contrast Pass"
    >
      <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between gap-3 px-5 sm:px-8">
        <p className="min-w-0 truncate text-[11px] leading-none text-[#F9ECD9] sm:text-xs">
          <span className="font-medium uppercase tracking-[0.14em] text-[#F9ECD9]/65">
            June only
          </span>
          <span className="mx-1.5 text-[#F9ECD9]/40" aria-hidden>
            ·
          </span>
          <span className="font-medium">
            {CONTRAST_PASS_OFFER.headline} — £{displayPrice}
          </span>
        </p>
        <Link
          to={CONTRAST_PASS_OFFER.path}
          className="inline-flex shrink-0 items-center gap-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[#F9ECD9] transition-opacity hover:opacity-80 sm:text-[11px]"
        >
          View offer
          <ChevronRight className="h-3 w-3" aria-hidden />
        </Link>
      </div>
    </div>
  );
};

export default JuneContrastPassBanner;
