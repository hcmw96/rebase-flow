export type BookingFailureFlags = {
  paymentRequired?: boolean;
  requiresLogin?: boolean;
  siteScopeIssue?: boolean;
  noPassOnFile?: boolean;
  /** No card saved on the Mindbody client profile */
  noStoredCard?: boolean;
};

export class BookingMutationError extends Error {
  readonly flags: BookingFailureFlags;

  constructor(message: string, flags: BookingFailureFlags = {}) {
    super(message);
    this.name = 'BookingMutationError';
    this.flags = flags;
  }
}
