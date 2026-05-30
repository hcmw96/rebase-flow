import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface BookingConfirmActionsProps {
  onChangeTime: () => void;
  onConfirm: () => void;
  isAuthenticated: boolean;
  isPending: boolean;
  changeTimeLabel?: string;
  sessionExpiredMessage?: string | null;
  /** Stash booking state then open Mindbody registration (same tab). */
  onCreateAccount?: () => void;
}

/**
 * Shared confirm-step actions: change selection, then Mindbody sign-in, then confirm.
 */
const BookingConfirmActions = ({
  onChangeTime,
  onConfirm,
  isAuthenticated,
  isPending,
  changeTimeLabel = 'Change Time',
  sessionExpiredMessage,
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

  return (
    <div className="space-y-3">
      {sessionExpiredMessage && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5">
          {sessionExpiredMessage}
        </p>
      )}
      {showGuestActions && (
        <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
          <p>
            {sessionExpiredMessage
              ? 'Sign in again with Mindbody to complete this booking.'
              : 'Sign in with your Mindbody account to complete this booking.'}
          </p>
          <p>
            <span className="font-medium text-foreground">New to Rebase?</span>{' '}
            Create a free Mindbody account first — it only takes a minute — then return here and tap{' '}
            <span className="font-medium text-foreground">Sign In to Book</span>.
          </p>
        </div>
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
            'Confirm Booking'
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
