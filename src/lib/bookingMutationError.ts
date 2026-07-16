export type BookingFailureFlags = {
  paymentRequired?: boolean;
  requiresLogin?: boolean;
  siteScopeIssue?: boolean;
  noPassOnFile?: boolean;
  /** No card saved on the Mindbody client profile */
  noStoredCard?: boolean;
  /** Card on file exists but charge was declined or expired */
  cardDeclined?: boolean;
  /** Another request with the same idempotency key is still processing */
  bookingInProgress?: boolean;
  /** Pass purchase request still processing */
  purchaseInProgress?: boolean;
};

export class BookingMutationError extends Error {
  readonly flags: BookingFailureFlags;

  constructor(message: string, flags: BookingFailureFlags = {}) {
    super(message);
    this.name = 'BookingMutationError';
    this.flags = flags;
  }
}
