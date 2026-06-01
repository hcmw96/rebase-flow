import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { BookingPaymentOption } from '@/lib/bookingPaymentOptions';
import { cn } from '@/lib/utils';

interface BookingPaymentPromptProps {
  options: BookingPaymentOption[];
  className?: string;
  /** Shown after a failed confirm vs before first confirm attempt */
  variant?: 'proactive' | 'after-error';
}

const BookingPaymentPrompt = ({
  options,
  className,
  variant = 'proactive',
}: BookingPaymentPromptProps) => {
  if (!options.length) return null;

  return (
    <div
      className={cn(
        'rounded-lg border px-4 py-3.5 space-y-3',
        variant === 'after-error'
          ? 'border-amber-500/30 bg-amber-500/10'
          : 'border-border bg-secondary/40',
        className,
      )}
    >
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          {variant === 'after-error' ? 'Payment required to book' : 'Pay before you confirm'}
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          A card on file in Mindbody is not enough on its own — you need a session pass or to pay for
          this visit. Choose an option below (checkout opens in Mindbody), then return here and tap{' '}
          <span className="font-medium text-foreground">Confirm Booking</span>.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {options.map((opt, index) => {
          const isPrimary = index === 0;
          const button = (
            <Button
              key={opt.id}
              asChild
              variant={isPrimary ? 'default' : 'outline'}
              className="w-full min-h-11 justify-between gap-2"
            >
              {opt.external ? (
                <a href={opt.href} target="_blank" rel="noopener noreferrer">
                  <span className="text-left">
                    <span className="block font-medium">{opt.label}</span>
                    <span className="block text-xs font-normal opacity-80">{opt.description}</span>
                  </span>
                  <ExternalLink className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                </a>
              ) : (
                <Link to={opt.href} className="flex w-full items-center justify-between gap-2">
                  <span className="text-left">
                    <span className="block font-medium">{opt.label}</span>
                    <span className="block text-xs font-normal opacity-80">{opt.description}</span>
                  </span>
                </Link>
              )}
            </Button>
          );
          return button;
        })}
      </div>
    </div>
  );
};

export default BookingPaymentPrompt;
