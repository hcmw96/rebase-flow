import { CreditCard, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { openMindbodyClientAccount } from '@/lib/mindbodyAuth';
import { cn } from '@/lib/utils';

type PaymentCardSetupStepProps = {
  accountUrl: string;
  onContinue: () => void;
  isRetrying: boolean;
  variant?: 'default' | 'offer';
  continueLabel?: string;
  description?: string;
  retryingLabel?: string;
  footerNote?: string;
  retryHint?: string | null;
  className?: string;
};

const PaymentCardSetupStep = ({
  accountUrl: _accountUrl,
  onContinue,
  isRetrying,
  variant = 'default',
  continueLabel = "I've added my card — continue booking",
  description = 'Add a payment card to your Mindbody account to complete your booking.',
  retryingLabel = 'Completing your booking…',
  footerNote = "Mindbody opens in a new tab. Return here when you're done — we'll finish your booking on Rebase.",
  retryHint,
  className,
}: PaymentCardSetupStepProps) => {
  const isOffer = variant === 'offer';

  const openAccountPage = () => {
    openMindbodyClientAccount();
  };

  return (
    <div
      className={cn(
        'rounded-lg border px-4 py-3.5 space-y-3',
        isOffer
          ? 'border-[#F9ECD9]/15 bg-[#F9ECD9]/5'
          : 'border-border bg-secondary/40',
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        <CreditCard
          className={cn(
            'h-4 w-4 shrink-0 mt-0.5',
            isOffer ? 'text-[#F9ECD9]/80' : 'text-foreground/70',
          )}
          aria-hidden
        />
        <div className="space-y-1 text-sm">
          <p className={cn('font-medium', isOffer ? 'text-[#F9ECD9]' : 'text-foreground')}>
            One quick step
          </p>
          <p
            className={cn(
              'leading-relaxed',
              isOffer ? 'text-[#F9ECD9]/75' : 'text-muted-foreground',
            )}
          >
            {description}
          </p>
        </div>
      </div>

      <p
        className={cn(
          'text-xs leading-relaxed',
          isOffer ? 'text-[#F9ECD9]/60' : 'text-muted-foreground',
        )}
      >
        {footerNote}
      </p>

      {retryHint && (
        <p
          className={cn(
            'text-xs leading-relaxed rounded-md px-3 py-2',
            isOffer
              ? 'text-[#F9ECD9]/80 bg-[#F9ECD9]/10 border border-[#F9ECD9]/15'
              : 'text-muted-foreground bg-background/60 border border-border/80',
          )}
        >
          {retryHint}
        </p>
      )}

      <div className="flex flex-col gap-2 pt-0.5">
        <Button
          type="button"
          onClick={openAccountPage}
          disabled={isRetrying}
          className={cn(
            'w-full min-h-11',
            isOffer && 'rounded-none bg-[#F9ECD9] text-[#3B2712] hover:bg-[#F9ECD9]/90',
          )}
        >
          <ExternalLink className="h-4 w-4 mr-2 shrink-0" aria-hidden />
          Add payment card
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onContinue}
          disabled={isRetrying}
          className={cn(
            'w-full min-h-11',
            isOffer &&
              'rounded-none border-[#F9ECD9]/30 bg-transparent text-[#F9ECD9] hover:bg-[#F9ECD9]/10',
          )}
        >
          {isRetrying ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {retryingLabel}
            </>
          ) : (
            continueLabel
          )}
        </Button>
      </div>
    </div>
  );
};

export default PaymentCardSetupStep;
