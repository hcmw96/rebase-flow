import { describe, expect, it } from "vitest";
import {
  buildAddAppointmentBody,
  buildCheckoutAppointmentBookingRequest,
} from "./mindbodyAppointmentPayload.ts";

const BST_SLOT = "2026-10-14T09:30:00.000Z"; // 10:30 Europe/London

function assertMindbodyWireTime(value: unknown) {
  expect(value).toBe("2026-10-14T10:30:00");
  expect(String(value)).not.toMatch(/Z|[+-]\d{2}:\d{2}$/);
}

describe("Mindbody appointment payloads", () => {
  it("addappointment StartDateTime is London-naive for a BST 10:30 slot", () => {
    const body = buildAddAppointmentBody({
      locationId: 1,
      staffId: 2,
      sessionTypeId: 3,
      startDateTime: BST_SLOT,
      endDateTime: "2026-10-14T10:30:00.000Z",
    });
    assertMindbodyWireTime(body.StartDateTime);
    expect(body.EndDateTime).toBe("2026-10-14T11:30:00");
  });

  it("checkoutshoppingcart AppointmentBookingRequest StartDateTime is London-naive", () => {
    const req = buildCheckoutAppointmentBookingRequest({
      staffId: 2,
      locationId: 1,
      sessionTypeId: 3,
      startDateTime: BST_SLOT,
    });
    assertMindbodyWireTime(req.StartDateTime);
  });
});
