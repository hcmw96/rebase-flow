import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BookingConfirmActionsProps {
  onChangeTime: () => void;
  onConfirm: () => void;
  isAuthenticated: boolean;
  isPending: boolean;
  changeTimeLabel?: string;
  sessionExpiredMessage?: string | null;
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
}: BookingConfirmActionsProps) => (
  <div className="space-y-3">
    {sessionExpiredMessage && (
      <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5">
        {sessionExpiredMessage}
      </p>
    )}
    {!isAuthenticated && !sessionExpiredMessage && (
      <p className="text-sm text-muted-foreground leading-relaxed">
        Sign in with your Mindbody account to complete this booking.
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
          'Confirm Booking'
        ) : (
          'Sign In to Book'
        )}
      </Button>
    </div>
  </div>
);

export default BookingConfirmActions;
