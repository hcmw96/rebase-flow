import { toMindbodyLocal } from "./londonTime.ts";

/** Body for POST /appointment/addappointment */
export function buildAddAppointmentBody(opts: {
  locationId: number;
  staffId: number;
  sessionTypeId: number;
  startDateTime: string;
  endDateTime?: string;
  applyPayment?: boolean;
  sendConfirmationEmail?: boolean;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    LocationId: opts.locationId,
    StaffId: opts.staffId,
    SessionTypeId: opts.sessionTypeId,
    StartDateTime: toMindbodyLocal(opts.startDateTime),
    ApplyPayment: opts.applyPayment ?? true,
    SendConfirmationEmail: opts.sendConfirmationEmail ?? true,
  };
  if (opts.endDateTime) {
    body.EndDateTime = toMindbodyLocal(opts.endDateTime);
  }
  return body;
}

/** One entry in CheckoutShoppingCart AppointmentBookingRequests */
export function buildCheckoutAppointmentBookingRequest(opts: {
  staffId: number;
  locationId: number;
  sessionTypeId: number;
  startDateTime: string;
  endDateTime?: string;
}): Record<string, unknown> {
  const appointmentRequest: Record<string, unknown> = {
    StaffId: opts.staffId,
    LocationId: opts.locationId,
    SessionTypeId: opts.sessionTypeId,
    StartDateTime: toMindbodyLocal(opts.startDateTime),
  };
  if (opts.endDateTime) {
    appointmentRequest.EndDateTime = toMindbodyLocal(opts.endDateTime);
  }
  return appointmentRequest;
}
