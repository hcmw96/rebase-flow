import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { formatMindbodyDate, formatAppointmentTimeRange } from '@/lib/sessionTimes';
import { Calendar, CheckCircle, Clock, CreditCard, MapPin, Ticket, User } from 'lucide-react';
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

/** How the booking was paid — from mindbody-book `payment` + local list price. */
export type BookingConfirmationPayment = {
  method?: 'pass' | 'stored_card' | null;
  /** Amount charged (or £0 when a pass covered it). */
  amountGbp?: number | null;
  /** Catalogue / pre-discount price when higher than amount charged. */
  listPriceGbp?: number | null;
  /** Pass/credit name when method is pass. */
  passName?: string | null;
};

interface BookingConfirmationSuccessProps {
  details: BookingConfirmationDetails;
  payment?: BookingConfirmationPayment | null;
  /** From mindbody-book when known; omit when older responses don't include it. */
  confirmationEmailSent?: boolean | null;
  durationMinutes?: number | null;
  onDone: () => void;
  doneLabel?: string;
  className?: string;
  children?: React.ReactNode;
}

const normaliseBrand = (value: string | null | undefined): string =>
  (value ?? '').replace(/re[\s-]?base/gi, 'Rebase');

function formatGbp(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  return Number.isInteger(rounded) ? `£${rounded}` : `£${rounded.toFixed(2)}`;
}

function PaymentSummary({ payment }: { payment: BookingConfirmationPayment }) {
  const method = payment.method;
  const amount =
    typeof payment.amountGbp === 'number' && Number.isFinite(payment.amountGbp)
      ? payment.amountGbp
      : null;
  const list =
    typeof payment.listPriceGbp === 'number' && Number.isFinite(payment.listPriceGbp)
      ? payment.listPriceGbp
      : null;
  const discounted =
    amount != null && list != null && list > amount + 0.009;

  if (method === 'pass') {
    return (
      <div className="flex items-start gap-3 pt-3 border-t border-border">
        <Ticket className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-medium text-foreground">Covered by pass</span>
            <span className="font-semibold text-foreground tabular-nums">£0</span>
          </div>
          {payment.passName && (
            <p className="text-muted-foreground text-xs leading-relaxed truncate">
              {payment.passName}
            </p>
          )}
          {list != null && list > 0 && (
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="text-muted-foreground">Usual price</span>
              <span className="text-muted-foreground line-through tabular-nums">{formatGbp(list)}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (amount == null && list == null) return null;

  const charged = amount ?? list!;

  return (
    <div className="flex items-start gap-3 pt-3 border-t border-border">
      <CreditCard className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-muted-foreground">
            {method === 'stored_card' ? 'Charged' : 'Price'}
          </span>
          <span className="font-semibold text-foreground tabular-nums">{formatGbp(charged)}</span>
        </div>
        {discounted && (
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="text-muted-foreground">Member discount applied</span>
            <span className="text-muted-foreground tabular-nums">
              <span className="line-through mr-1.5">{formatGbp(list!)}</span>
              <span className="text-primary font-medium">
                −{formatGbp(list! - charged)}
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Full-screen replacement after a successful mindbody-book response.
 */
const BookingConfirmationSuccess = ({
  details,
  payment,
  confirmationEmailSent,
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
        {payment && <PaymentSummary payment={payment} />}
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed px-2">
        {confirmationEmailSent === false
          ? 'Your booking is confirmed in our calendar. If you need a copy emailed, contact reception@rebaserecovery.com.'
          : "A confirmation email is on its way. If you don't see it, check your spam folder."}
      </p>

      <Button onClick={onDone} className="w-full min-h-11 text-base">
        {doneLabel}
      </Button>

      {children}
    </motion.div>
  );
};

export default BookingConfirmationSuccess;
