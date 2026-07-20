import { CreditCard, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type MindbodyCheckoutHandoffStepProps = {
  priceGbp?: number | null;
  checkoutOpened: boolean;
  onOpenCheckout: () => void;
  onFinished: () => void;
  isChecking?: boolean;
  className?: string;
};

/**
 * Route class payment into Mindbody's consumer checkout (new card, Apple Pay, etc.)
 * instead of requiring a pre-saved StoredCard on Rebase.
 */
const MindbodyCheckoutHandoffStep = ({
  priceGbp,
  checkoutOpened,
  onOpenCheckout,
  onFinished,
  isChecking = false,
  className,
}: MindbodyCheckoutHandoffStepProps) => {
  const priceLabel =
    typeof priceGbp === 'number' && Number.isFinite(priceGbp) ? `£${priceGbp}` : null;

  return (
    <div className={cn('rounded-lg border border-border bg-secondary/40 px-4 py-3.5 space-y-3', className)}>
      <div className="flex items-start gap-2.5">
        <CreditCard className="h-4 w-4 text-foreground/70 shrink-0 mt-0.5" aria-hidden />
        <div className="space-y-1 text-sm">
          <p className="font-medium text-foreground">
            {checkoutOpened ? 'Finish payment in Mindbody' : 'Pay in Mindbody'}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            {checkoutOpened ? (
              <>
                Complete checkout there — new card, Apple Pay, or a saved method.
                {priceLabel ? (
                  <>
                    {' '}
                    Total <span className="font-medium text-foreground">{priceLabel}</span>.
                  </>
                ) : null}{' '}
                When you&apos;re done, return here and we&apos;ll confirm your booking.
              </>
            ) : (
              <>
                Mindbody&apos;s checkout lets you enter a new card or pay with Apple Pay
                {priceLabel ? (
                  <>
                    {' '}
                    (<span className="font-medium text-foreground">{priceLabel}</span>)
                  </>
                ) : null}
                . You won&apos;t need a card saved on file first.
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-0.5">
        <Button type="button" onClick={onOpenCheckout} disabled={isChecking} className="w-full min-h-11">
          <ExternalLink className="h-4 w-4 mr-2 shrink-0" aria-hidden />
          {checkoutOpened
            ? 'Open Mindbody checkout again'
            : priceLabel
              ? `Pay ${priceLabel} in Mindbody`
              : 'Pay in Mindbody'}
        </Button>
        {checkoutOpened && (
          <Button
            type="button"
            variant="outline"
            onClick={onFinished}
            disabled={isChecking}
            className="w-full min-h-11"
          >
            {isChecking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking bookings…
              </>
            ) : (
              "I've paid — check my bookings"
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default MindbodyCheckoutHandoffStep;
