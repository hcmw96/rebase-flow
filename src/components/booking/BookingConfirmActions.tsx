import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import type { BookingCheckoutSummary } from '@/components/booking/BookingConfirmCheckout';
import BookingConfirmCheckout from '@/components/booking/BookingConfirmCheckout';
import { cn } from '@/lib/utils';

interface BookingConfirmActionsProps {
  onChangeTime: () => void;
  onConfirm: () => void;
  isAuthenticated: boolean;
  isPending: boolean;
  changeTimeLabel?: string;
  bookingError?: string | null;
  bookingErrorRequiresSignIn?: boolean;
  checkoutSummary?: BookingCheckoutSummary | null;
  onCreateAccount?: () => void;
}

const BookingConfirmActions = ({
  onChangeTime,
  onConfirm,
  isAuthenticated,
  isPending,
  changeTimeLabel = 'Change Time',
  bookingError,
  bookingErrorRequiresSignIn = false,
  checkoutSummary = null,
  onCreateAccount,
}: BookingConfirmActionsProps) => {
  const { openMindbodySignUp, mindbodySignUpUrl } = useAuth();

  const handleCreateAccount = () => {
    if (onCreateAccount) {
      onCreateAccount();
      return;
    }
    openMindbodySignUp();
  };

  const showGuestActions = !isAuthenticated;
  const confirmLabel =
    checkoutSummary && !checkoutSummary.pass
      ? `Confirm & pay £${checkoutSummary.priceGbp}`
      : 'Confirm booking';

  return (
    <div className="space-y-3">
      {isAuthenticated && checkoutSummary && !bookingErrorRequiresSignIn && (
        <BookingConfirmCheckout summary={checkoutSummary} />
      )}

      {bookingError && (
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
            Sign in with your Mindbody account to book here — we&apos;ll open Mindbody in a new window,
            then bring you back to confirm your session on Rebase.
          </p>
          <p>
            <span className="font-medium text-foreground">New to Rebase?</span>{' '}
            Create a free Mindbody account first, then return and tap{' '}
            <span className="font-medium text-foreground">Sign in to book</span>.
          </p>
        </div>
      )}

      {isAuthenticated && bookingError && !bookingErrorRequiresSignIn && (
        <p className="text-sm text-muted-foreground">
          Tap <span className="font-medium text-foreground">{confirmLabel}</span> to try again, or email{' '}
          <a
            href="mailto:reception@rebaserecovery.com"
            className="font-medium text-foreground underline underline-offset-2"
          >
            reception@rebaserecovery.com
          </a>
          .
        </p>
      )}

      <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:gap-3">
        <Button
          variant="outline"
          onClick={onChangeTime}
          className="w-full sm:flex-1 min-h-11"
          disabled={isPending}
        >
          {changeTimeLabel}
        </Button>
        <Button onClick={onConfirm} disabled={isPending} className="w-full sm:flex-1 min-h-11">
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
      </div>

      {showGuestActions && (
        <Button
          type="button"
          variant="outline"
          onClick={handleCreateAccount}
          disabled={isPending}
          className="w-full min-h-11"
        >
          Create Mindbody account
        </Button>
      )}

      {showGuestActions && mindbodySignUpUrl && (
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          Account creation opens Mindbody in a new tab. Booking and payment stay on Rebase.
        </p>
      )}
    </div>
  );
};

export default BookingConfirmActions;
