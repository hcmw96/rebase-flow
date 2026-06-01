import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import type { BookingPaymentOption } from '@/lib/bookingPaymentOptions';
import { cn } from '@/lib/utils';
import BookingPaymentPrompt from './BookingPaymentPrompt';

interface BookingConfirmActionsProps {
  onChangeTime: () => void;
  onConfirm: () => void;
  isAuthenticated: boolean;
  isPending: boolean;
  changeTimeLabel?: string;
  bookingError?: string | null;
  bookingErrorRequiresSignIn?: boolean;
  /** Show pay-before-book options (proactive or after payment error). */
  showPaymentOptions?: boolean;
  paymentOptions?: BookingPaymentOption[];
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
  showPaymentOptions = false,
  paymentOptions = [],
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
  const paymentBlocked =
    showPaymentOptions && paymentOptions.length > 0 && isAuthenticated && !bookingErrorRequiresSignIn;

  return (
    <div className="space-y-3">
      {paymentBlocked && (
        <BookingPaymentPrompt
          options={paymentOptions}
          variant={bookingError ? 'after-error' : 'proactive'}
        />
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
          <p>Sign in with your Mindbody account to complete this booking.</p>
          <p>
            <span className="font-medium text-foreground">New to Rebase?</span>{' '}
            Create a free Mindbody account first — it only takes a minute — then return here and tap{' '}
            <span className="font-medium text-foreground">Sign In to Book</span>.
          </p>
        </div>
      )}

      {isAuthenticated && bookingError && !bookingErrorRequiresSignIn && !paymentBlocked && (
        <p className="text-sm text-muted-foreground">
          Tap <span className="font-medium text-foreground">Confirm Booking</span> to try again, or
          email{' '}
          <a
            href="mailto:reception@rebaserecovery.com"
            className="font-medium text-foreground underline underline-offset-2"
          >
            reception@rebaserecovery.com
          </a>
          .
        </p>
      )}

      {paymentBlocked && !bookingError && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          Already paid or have a pass on your account? Tap confirm — we&apos;ll check your Mindbody
          credits.
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
            paymentBlocked ? "I've paid — confirm booking" : 'Confirm Booking'
          ) : (
            'Sign In to Book'
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
          Create Mindbody Account
        </Button>
      )}

      {showGuestActions && mindbodySignUpUrl && (
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          You&apos;ll register on Mindbody (Rebase&apos;s booking system), then come back to this
          page to sign in.
        </p>
      )}
    </div>
  );
};

export default BookingConfirmActions;
