/**
 * Translate raw Mindbody/edge-function error messages into user-friendly copy.
 */
export type BookingErrorKind =
  | 'payment_required'
  | 'duplicate'
  | 'slot_taken'
  | 'session_expired'
  | 'unknown';

export interface ClassifiedBookingError {
  kind: BookingErrorKind;
  message: string;
  /** Suggested follow-up action label for the UI (optional). */
  actionLabel?: string;
  /** Route to navigate to when the action is taken (optional). */
  actionRoute?: string;
}

export function classifyBookingError(raw: string | undefined | null): ClassifiedBookingError {
  const msg = (raw || '').toLowerCase();

  if (msg.includes('site id does not match')) {
    return {
      kind: 'session_expired',
      message:
        'We could not link your Mindbody sign-in to Rebase. Tap Sign In to Book again, or create a Mindbody account with the same email you use at the studio. If it keeps failing, email reception@rebaserecovery.com and we will book you in.',
    };
  }

  if (
    msg.includes('session not found') ||
    msg.includes('session expired') ||
    msg.includes('please log in again') ||
    msg.includes('please log in first')
  ) {
    return { kind: 'session_expired', message: 'Your sign-in expired. Please sign in again.' };
  }

  if (
    msg.includes('pricing option') ||
    msg.includes('no sessions remaining') ||
    msg.includes('package') ||
    msg.includes('payment') ||
    msg.includes('insufficient') ||
    msg.includes('does not have a valid') ||
    msg.includes('unable to apply')
  ) {
    return {
      kind: 'payment_required',
      message:
        "We couldn't complete this booking in Mindbody — you may need a session pass or payment on your account. Contact reception and we'll help you book.",
      actionLabel: 'Email reception',
      actionRoute: 'mailto:reception@rebaserecovery.com',
    };
  }

  if (
    msg.includes('already booked') ||
    msg.includes('duplicate') ||
    msg.includes('client is already')
  ) {
    return { kind: 'duplicate', message: 'You already have this booking.' };
  }

  if (
    msg.includes('no longer available') ||
    msg.includes('not available') ||
    msg.includes('time conflict') ||
    msg.includes('overlap') ||
    msg.includes('already booked at') ||
    msg.includes('slot')
  ) {
    return { kind: 'slot_taken', message: 'That time was just taken. Pick another slot.' };
  }

  return { kind: 'unknown', message: raw || 'Failed to complete booking. Please try again.' };
}
