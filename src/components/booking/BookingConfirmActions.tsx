import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BookingConfirmActionsProps {
  onChangeTime: () => void;
  onConfirm: () => void;
  isAuthenticated: boolean;
  isPending: boolean;
  changeTimeLabel?: string;
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
}: BookingConfirmActionsProps) => (
  <div className="space-y-3">
    {!isAuthenticated && (
      <p className="text-sm text-muted-foreground">
        Sign in with your Mindbody account to complete this booking.
      </p>
    )}
    <div className="flex gap-3">
      <Button variant="outline" onClick={onChangeTime} className="flex-1" disabled={isPending}>
        {changeTimeLabel}
      </Button>
      <Button onClick={onConfirm} disabled={isPending} className="flex-1">
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
