import { useEffect, useRef } from 'react';
import { formatMindbodyDate, formatMindbodyTime, formatAppointmentTimeRange } from '@/lib/sessionTimes';
import { Calendar, CheckCircle, Clock, MapPin, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { resolveDisplayName } from '@/config/serviceConfig';
import { cn } from '@/lib/utils';

export interface BookingConfirmationDetails {
  serviceName: string;
  startDateTime: string;
  endDateTime?: string | null;
  staffName?: string | null;
  locationName?: string | null;
}

interface BookingConfirmationSuccessProps {
  details: BookingConfirmationDetails;
  durationMinutes?: number | null;
  onDone: () => void;
  doneLabel?: string;
  className?: string;
  children?: React.ReactNode;
}

const normaliseBrand = (value: string | null | undefined): string =>
  (value ?? '').replace(/re[\s-]?base/gi, 'Rebase');

/**
 * Full-screen replacement after a successful mindbody-book response.
 */
const BookingConfirmationSuccess = ({
  details,
  durationMinutes,
  onDone,
  doneLabel = 'Done',
  className,
  children,
}: BookingConfirmationSuccessProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const serviceLabel = resolveDisplayName(details.serviceName);

  useEffect(() => {
    rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <motion.div
      ref={rootRef}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={cn('text-center space-y-6 py-4 sm:py-6', className)}
      role="status"
      aria-live="polite"
    >
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center ring-4 ring-primary/10">
          <CheckCircle className="h-10 w-10 text-primary" strokeWidth={2} aria-hidden />
        </div>
      </div>

      <div className="space-y-2 px-1">
        <h3 className="text-2xl font-semibold text-foreground tracking-tight">Booking confirmed</h3>
        <p className="text-base text-foreground/85 leading-relaxed">
          We&apos;ve reserved your spot. See you at the studio.
        </p>
      </div>

      <div className="bg-secondary/50 rounded-xl border border-border/60 p-4 sm:p-5 space-y-3 text-left text-sm">
        <p className="font-semibold text-base text-foreground">{serviceLabel}</p>
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
          <span>{formatMindbodyDate(details.startDateTime)}</span>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
          <span>
            {formatAppointmentTimeRange(
              details.startDateTime,
              details.endDateTime,
              durationMinutes,
            )}
          </span>
        </div>
        {details.staffName && (
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
            <span>{resolveDisplayName(details.staffName)}</span>
          </div>
        )}
        {details.locationName && (
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
            <span>{normaliseBrand(details.locationName)}</span>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed px-2">
        A confirmation email is on its way. If you don&apos;t see it, check your spam folder.
      </p>

      <Button onClick={onDone} className="w-full min-h-11 text-base">
        {doneLabel}
      </Button>

      {children}
    </motion.div>
  );
};

export default BookingConfirmationSuccess;
