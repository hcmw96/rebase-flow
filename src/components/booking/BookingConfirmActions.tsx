import { useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import type { BookingCheckoutSummary } from '@/components/booking/BookingConfirmCheckout';
import BookingConfirmCheckout from '@/components/booking/BookingConfirmCheckout';
import MindbodyCheckoutHandoffStep from '@/components/payment/MindbodyCheckoutHandoffStep';
import PaymentCardSetupStep from '@/components/payment/PaymentCardSetupStep';
import { cn } from '@/lib/utils';

interface BookingConfirmActionsProps {
  onChangeTime: () => void;
  onConfirm: () => void;
  isAuthenticated: boolean;
  isPending: boolean;
  changeTimeLabel?: string;
  bookingError?: string | null;
  bookingErrorRequiresSignIn?: boolean;
  /** Mindbody may have charged — hide Confirm retry */
  bookingOutcomeUncertain?: boolean;
  checkoutSummary?: BookingCheckoutSummary | null;
  onCreateAccount?: () => void;
  /** Appointments: add card on Mindbody, then charge the selected slot on Rebase. */
  needsCardOnFile?: boolean;
  accountUrl?: string;
  onContinueAfterCard?: () => void;
  cardSetupRetryHint?: string | null;
  /** Classes: pay via Mindbody consumer checkout instead of StoredCard on Rebase. */
  mindbodyCheckoutUrl?: string | null;
  mindbodyCheckoutOpened?: boolean;
  onOpenMindbodyCheckout?: () => void;
  onMindbodyCheckoutFinished?: () => void;
  mindbodyCheckoutChecking?: boolean;
  /** Price still resolving — Confirm must wait rather than charge an unknown amount. */
  priceLoading?: boolean;
  /** No price could be resolved — Confirm must stay disabled. */
  priceUnavailable?: boolean;
}

const BookingConfirmActions = ({
  onChangeTime,
  onConfirm,
  isAuthenticated,
  isPending,
  changeTimeLabel = 'Change Time',
  bookingError,
  bookingErrorRequiresSignIn = false,
  bookingOutcomeUncertain = false,
  checkoutSummary = null,
  onCreateAccount,
  needsCardOnFile = false,
  accountUrl,
  onContinueAfterCard,
  cardSetupRetryHint = null,
  mindbodyCheckoutUrl = null,
  mindbodyCheckoutOpened = false,
  onOpenMindbodyCheckout,
  onMindbodyCheckoutFinished,
  mindbodyCheckoutChecking = false,
  priceLoading = false,
  priceUnavailable = false,
}: BookingConfirmActionsProps) => {
  const { openMindbodySignUp } = useAuth();
  const confirmLockedRef = useRef(false);

  const handleCreateAccount = () => {
    if (onCreateAccount) {
      onCreateAccount();
      return;
    }
    openMindbodySignUp();
  };

  const showGuestActions = !isAuthenticated;
  const showCardSetup =
    isAuthenticated && needsCardOnFile && Boolean(accountUrl) && Boolean(onContinueAfterCard);
  // Class bookings only — appointments keep the selected slot and charge on Rebase.
  const useMindbodyPay =
    isAuthenticated &&
    !showCardSetup &&
    Boolean(onOpenMindbodyCheckout) &&
    Boolean(mindbodyCheckoutUrl) &&
    !checkoutSummary?.pass;

  // Never offer to take money without a figure on screen.
  const blockedOnPrice = priceLoading || priceUnavailable;

  const confirmLabel =
    priceLoading
      ? 'Checking price…'
      : priceUnavailable
      ? 'Price unavailable'
      : useMindbodyPay
      ? checkoutSummary && checkoutSummary.priceGbp > 0
        ? `Pay £${checkoutSummary.priceGbp} in Mindbody`
        : 'Pay in Mindbody'
      : checkoutSummary && !checkoutSummary.pass
        ? `Confirm & pay £${checkoutSummary.priceGbp}`
        : 'Confirm booking';

  const handleConfirmClick = useCallback(() => {
    if (isPending || confirmLockedRef.current || blockedOnPrice) return;
    confirmLockedRef.current = true;
    if (useMindbodyPay && onOpenMindbodyCheckout) {
      onOpenMindbodyCheckout();
    } else {
      onConfirm();
    }
    window.setTimeout(() => {
      confirmLockedRef.current = false;
    }, 3000);
  }, [isPending, onConfirm, onOpenMindbodyCheckout, useMindbodyPay, blockedOnPrice]);

  return (
    <div className="space-y-3">
      {isAuthenticated &&
        checkoutSummary &&
        !bookingErrorRequiresSignIn &&
        !showCardSetup &&
        !useMindbodyPay && (
          <BookingConfirmCheckout summary={checkoutSummary} />
        )}

      {showCardSetup && accountUrl && onContinueAfterCard && (
        <PaymentCardSetupStep
          accountUrl={accountUrl}
          onContinue={onContinueAfterCard}
          isRetrying={isPending}
          retryHint={cardSetupRetryHint}
        />
      )}

      {useMindbodyPay && onOpenMindbodyCheckout && onMindbodyCheckoutFinished && mindbodyCheckoutOpened ? (
        <MindbodyCheckoutHandoffStep
          priceGbp={checkoutSummary?.priceGbp}
          checkoutOpened
          onOpenCheckout={onOpenMindbodyCheckout}
          onFinished={onMindbodyCheckoutFinished}
          isChecking={mindbodyCheckoutChecking}
        />
      ) : null}

      {useMindbodyPay && !mindbodyCheckoutOpened && (
        <BookingConfirmCheckout
          summary={{
            priceGbp: checkoutSummary?.priceGbp ?? 0,
            payInMindbody: true,
          }}
        />
      )}

      {priceUnavailable && !bookingError && (
        <p className="text-sm rounded-lg px-3 py-2.5 leading-relaxed text-foreground bg-amber-500/10 border border-amber-500/25">
          We couldn&apos;t confirm the price for this session, so we can&apos;t take payment. Please try
          again shortly, or email{' '}
          <a
            href="mailto:reception@rebaserecovery.com"
            className="font-medium text-foreground underline underline-offset-2"
          >
            reception@rebaserecovery.com
          </a>{' '}
          and we&apos;ll book it for you.
        </p>
      )}

      {bookingError && !showCardSetup && !useMindbodyPay && (
        <p
          className={cn(
            'text-sm rounded-lg px-3 py-2.5 leading-relaxed',
            bookingErrorRequiresSignIn
              ? 'text-destructive bg-destructive/10 border border-destructive/20'
              : 'text-foreground/90 bg-amber-500/10 border border-amber-500/25',
          )}
        >
          {bookingError}
        </p>
      )}

      {showGuestActions && (
        <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
          <p>
            Sign in or create a Mindbody account to book — we&apos;ll open Mindbody briefly, then bring
            you straight back here to finish this booking.
          </p>
        </div>
      )}

      {isAuthenticated && bookingError && !bookingErrorRequiresSignIn && !showCardSetup && !useMindbodyPay && (
        <p className="text-sm text-muted-foreground">
          {bookingOutcomeUncertain ? (
            <>
              We&apos;re not asking you to retry — that protects you from a double charge. Most of
              the time the booking did go through; check My Bookings, or email{' '}
              <a
                href="mailto:reception@rebaserecovery.com"
                className="font-medium text-foreground underline underline-offset-2"
              >
                reception@rebaserecovery.com
              </a>{' '}
              and we&apos;ll confirm within a few minutes.
            </>
          ) : (
            <>
              Tap <span className="font-medium text-foreground">{confirmLabel}</span> to try again, or
              email{' '}
              <a
                href="mailto:reception@rebaserecovery.com"
                className="font-medium text-foreground underline underline-offset-2"
              >
                reception@rebaserecovery.com
              </a>
              .
            </>
          )}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:gap-3">
        <Button
          variant="outline"
          onClick={onChangeTime}
          className="w-full sm:flex-1 min-h-11"
          disabled={isPending || mindbodyCheckoutChecking}
        >
          {changeTimeLabel}
        </Button>
        {!showCardSetup && !useMindbodyPay && (
          <Button
            type="button"
            onClick={handleConfirmClick}
            disabled={isPending || bookingOutcomeUncertain || blockedOnPrice}
            aria-busy={isPending}
            className="w-full sm:flex-1 min-h-11 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Booking...
              </>
            ) : isAuthenticated ? (
              confirmLabel
            ) : (
              'Sign in to book'
            )}
          </Button>
        )}
        {useMindbodyPay && !mindbodyCheckoutOpened && (
          <Button
            type="button"
            onClick={handleConfirmClick}
            disabled={isPending || blockedOnPrice}
            className="w-full sm:flex-1 min-h-11 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {confirmLabel}
          </Button>
        )}
      </div>

      {showGuestActions && (
        <Button
          type="button"
          variant="outline"
          onClick={handleCreateAccount}
          disabled={isPending}
          className="w-full min-h-11"
        >
          Create account &amp; return here
        </Button>
      )}

      {showGuestActions && (
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          New to Rebase? Choose create account on the Mindbody screen — we&apos;ll bring you back to
          this booking when you&apos;re done.
        </p>
      )}
    </div>
  );
};

export default BookingConfirmActions;
