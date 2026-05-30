import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BookingConfirmActionsProps {
  onChangeTime: () => void;
  onConfirm: () => void;
  isAuthenticated: boolean;
  isPending: boolean;
  changeTimeLabel?: string;
  sessionExpiredMessage?: string | null;
  onCreateAccount?: () => void;
  showCreateAccount?: boolean;
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
  showCreateAccount = false,
}: BookingConfirmActionsProps) => (
  <div className="space-y-3">
    {sessionExpiredMessage && (
      <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5">
        {sessionExpiredMessage}
      </p>
    )}
    {!isAuthenticated && !sessionExpiredMessage && (
      <div className="space-y-1.5 text-sm text-muted-foreground leading-relaxed">
        <p>Sign in with your Mindbody account to complete this booking.</p>
        {showCreateAccount && onCreateAccount && (
          <p>
            New to Rebase?{' '}
            <button
              type="button"
              onClick={onCreateAccount}
              disabled={isPending}
              className="text-foreground font-medium underline underline-offset-2 hover:text-foreground/80"
            >
              Create a Mindbody account
            </button>
            {' '}first, then return here to sign in.
          </p>
        )}
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
    {!isAuthenticated && showCreateAccount && onCreateAccount && (
      <Button
        type="button"
        variant="outline"
        onClick={onCreateAccount}
        disabled={isPending}
        className="w-full min-h-11"
      >
        Create Mindbody Account
      </Button>
    )}
  </div>
);

export default BookingConfirmActions;
