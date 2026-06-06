import { CreditCard, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CONTRAST_PASS_OFFER, isContrastPassSaleActive } from '@/config/contrastPassOffer';
import { formatJunePassTermsReminder, type JunePassUsageSummary } from '@/lib/contrastPassUsage';
import { cn } from '@/lib/utils';

export type BookingCheckoutSummary = {
  priceGbp: number;
  /** Active pass/credit on the Mindbody account */
  pass?: {
    name: string;
    remaining: number | null;
    usage?: JunePassUsageSummary;
    termsReminder?: boolean;
  };
  /** Card on file could not be charged — rare fallback only */
  needsCardOnFile?: boolean;
  accountUrl?: string;
};

interface BookingConfirmCheckoutProps {
  summary: BookingCheckoutSummary;
  className?: string;
}

/**
 * Explains how payment works on the Rebase confirm step (no redirect to Mindbody pricing).
 */
const BookingConfirmCheckout = ({ summary, className }: BookingConfirmCheckoutProps) => {
  const { priceGbp, pass, needsCardOnFile, accountUrl } = summary;

  if (pass) {
    const usageLine =
      pass.usage && pass.termsReminder
        ? formatJunePassTermsReminder(pass.usage)
        : null;

    return (
      <div
        className={cn(
          'rounded-lg border border-primary/25 bg-primary/5 px-4 py-3.5 space-y-2',
          className,
        )}
      >
        <div className="flex items-start gap-2.5">
          <Ticket className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden />
          <div className="space-y-1 text-sm">
            <p className="font-medium text-foreground">Using your Mindbody pass</p>
            <p className="text-muted-foreground leading-relaxed">
              <span className="text-foreground/90">{pass.name}</span>
              {pass.remaining != null && (
                <>
                  {' '}
                  — {pass.remaining} session{pass.remaining !== 1 ? 's' : ''} remaining
                </>
              )}
              . Tap confirm to book this slot on Rebase.
            </p>
            {usageLine && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                Offer terms: {usageLine}. Mindbody enforces expiry and one session per day.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border border-border bg-secondary/40 px-4 py-3.5 space-y-2', className)}>
      <div className="flex items-start gap-2.5">
        <CreditCard className="h-4 w-4 text-foreground/70 shrink-0 mt-0.5" aria-hidden />
        <div className="space-y-1 text-sm">
          <p className="font-medium text-foreground">Pay &amp; book on Rebase</p>
          <p className="text-muted-foreground leading-relaxed">
            When you confirm, we&apos;ll charge <span className="font-medium text-foreground">£{priceGbp}</span>{' '}
            to the card saved on your Mindbody account and reserve this session — you won&apos;t leave this
            page.
          </p>
        </div>
      </div>
      {needsCardOnFile && accountUrl && (
        <p className="text-xs text-muted-foreground pl-6">
          No card on file?{' '}
          <a
            href={accountUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline underline-offset-2"
          >
            Add a payment method in Mindbody
          </a>{' '}
          (opens in a new tab), then return here and confirm.
        </p>
      )}
      {isContrastPassSaleActive() && (
        <p className="text-xs text-muted-foreground pl-6 border-t border-border/60 pt-2">
          Visiting often?{' '}
          <Link to={CONTRAST_PASS_OFFER.path} className="font-medium text-foreground underline underline-offset-2">
            View our 2-week unlimited pass offer
          </Link>
          .
        </p>
      )}
    </div>
  );
};

export default BookingConfirmCheckout;
