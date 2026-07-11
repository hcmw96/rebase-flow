import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parseMindbodyLocalDateTime } from "./londonTime.ts";

export type BookingClaimInput = {
  idempotencyKey: string;
  sessionId: string;
  bookingType: "appointment" | "class";
  serviceName: string;
  startDateTime: string;
  endDateTime?: string | null;
  serviceId?: string | null;
  staffName?: string | null;
  locationName?: string | null;
};

export type BookingClaimResult =
  | { type: "claimed"; bookingId: string }
  | { type: "confirmed"; booking: Record<string, unknown> }
  | { type: "in_progress" };

export function normalizeBookingDateTime(value?: string | null): string {
  if (!value?.trim()) return "";
  const parsed = parseMindbodyLocalDateTime(value.trim());
  if (Number.isNaN(parsed.getTime())) return value.trim();
  return parsed.toISOString();
}

/** Server-authoritative idempotency key — ignores any client-supplied value. */
export function resolveServerIdempotencyKey(parts: {
  sessionId: string;
  bookingType: string;
  classId?: string;
  sessionTypeId?: string;
  staffId?: string;
  startDateTime?: string;
}): string {
  return [
    "slot",
    parts.sessionId,
    parts.bookingType,
    parts.classId || parts.sessionTypeId || "",
    parts.staffId || "",
    normalizeBookingDateTime(parts.startDateTime),
  ].join(":");
}

/** @deprecated Use resolveServerIdempotencyKey */
export function buildFallbackIdempotencyKey(parts: {
  sessionId: string;
  bookingType: string;
  classId?: string;
  sessionTypeId?: string;
  staffId?: string;
  startDateTime?: string;
}): string {
  return resolveServerIdempotencyKey(parts);
}

function hasMindbodyRecord(row: Record<string, unknown>): boolean {
  return Boolean(row.mindbody_appointment_id || row.mindbody_class_id);
}

/** Return an already-confirmed booking for this session + slot, if any. */
export async function findConfirmedSlotBooking(
  supabase: SupabaseClient,
  params: {
    sessionId: string;
    bookingType: "appointment" | "class";
    serviceId?: string | null;
    startDateTime: string;
  },
): Promise<Record<string, unknown> | null> {
  const normalizedStart = normalizeBookingDateTime(params.startDateTime);
  if (!normalizedStart) return null;

  let query = supabase
    .from("bookings")
    .select("*")
    .eq("session_id", params.sessionId)
    .eq("booking_type", params.bookingType)
    .eq("status", "confirmed")
    .eq("start_time", normalizedStart);

  if (params.serviceId) {
    query = query.eq("service_id", params.serviceId);
  } else {
    query = query.is("service_id", null);
  }

  const { data } = await query.maybeSingle();
  return (data as Record<string, unknown> | null) ?? null;
}

/** Cross-device guard: same Mindbody client must not book the same slot twice. */
export async function findConfirmedSlotBookingByMindbodyClient(
  supabase: SupabaseClient,
  params: {
    mindbodySiteClientId: string;
    bookingType: "appointment" | "class";
    serviceId?: string | null;
    startDateTime: string;
  },
): Promise<Record<string, unknown> | null> {
  const normalizedStart = normalizeBookingDateTime(params.startDateTime);
  if (!normalizedStart) return null;

  const { data: sessions } = await supabase
    .from("mb_sessions")
    .select("id")
    .eq("mindbody_site_client_id", params.mindbodySiteClientId);

  const sessionIds = (sessions || []).map((row) => row.id).filter(Boolean);
  if (!sessionIds.length) return null;

  let query = supabase
    .from("bookings")
    .select("*")
    .in("session_id", sessionIds)
    .eq("booking_type", params.bookingType)
    .eq("status", "confirmed")
    .eq("start_time", normalizedStart);

  if (params.serviceId) {
    query = query.eq("service_id", params.serviceId);
  } else {
    query = query.is("service_id", null);
  }

  const { data } = await query.order("created_at", { ascending: true }).limit(1).maybeSingle();
  return (data as Record<string, unknown> | null) ?? null;
}

/** Reserve an idempotency slot before calling Mindbody (prevents duplicate charges). */
export async function claimBookingIdempotency(
  supabase: SupabaseClient,
  params: BookingClaimInput,
): Promise<BookingClaimResult> {
  const normalizedStart = normalizeBookingDateTime(params.startDateTime);

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      session_id: params.sessionId,
      service_name: params.serviceName,
      start_time: normalizedStart || params.startDateTime,
      end_time: params.endDateTime ?? null,
      status: "pending",
      booking_type: params.bookingType,
      idempotency_key: params.idempotencyKey,
      service_id: params.serviceId ?? null,
      staff_name: params.staffName ?? null,
      location_name: params.locationName ?? null,
    })
    .select("*")
    .single();

  if (!error && data?.id) {
    return { type: "claimed", bookingId: String(data.id) };
  }

  if (error?.code !== "23505") {
    throw new Error(error?.message || "Failed to reserve booking idempotency slot");
  }

  const { data: existing, error: fetchError } = await supabase
    .from("bookings")
    .select("*")
    .eq("idempotency_key", params.idempotencyKey)
    .maybeSingle();

  if (fetchError || !existing) {
    throw new Error("Idempotency conflict but existing booking not found");
  }

  if (existing.status === "confirmed") {
    return { type: "confirmed", booking: existing as Record<string, unknown> };
  }

  if (existing.status === "pending") {
    const row = existing as Record<string, unknown>;
    if (hasMindbodyRecord(row)) {
      const { data: confirmed } = await supabase
        .from("bookings")
        .update({ status: "confirmed" })
        .eq("id", existing.id)
        .select("*")
        .single();
      return { type: "confirmed", booking: (confirmed ?? existing) as Record<string, unknown> };
    }

    // Never delete a pending claim — a charge may have succeeded in Mindbody.
    return { type: "in_progress" };
  }

  return { type: "in_progress" };
}

/** Drop a pending claim only when Mindbody did not complete a paid booking. */
export async function releaseBookingClaim(
  supabase: SupabaseClient,
  bookingId: string,
): Promise<void> {
  await supabase
    .from("bookings")
    .delete()
    .eq("id", bookingId)
    .eq("status", "pending");
}

export type PersistCheckoutInput = {
  sessionId: string;
  bookingId: string;
  idempotencyKey: string;
  bookingType: "appointment" | "class";
  mindbodyAppointmentId?: string | null;
  mindbodyClassId?: string | null;
  serviceName: string;
  serviceId?: string | null;
  staffName?: string | null;
  locationName?: string | null;
  startDateTime: string;
  endDateTime?: string | null;
  paymentMethod?: string | null;
  mindbodyClientServiceId?: string | null;
};

/** Persist Mindbody success immediately so retries cannot create a second charge. */
export async function persistBookingCheckout(
  supabase: SupabaseClient,
  params: PersistCheckoutInput,
): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from("bookings")
    .update({
      mindbody_appointment_id: params.mindbodyAppointmentId ?? null,
      mindbody_class_id: params.mindbodyClassId ?? null,
      service_name: params.serviceName,
      service_id: params.serviceId ?? null,
      staff_name: params.staffName ?? null,
      location_name: params.locationName ?? null,
      start_time: normalizeBookingDateTime(params.startDateTime) || params.startDateTime,
      end_time: params.endDateTime ?? null,
      status: "confirmed",
      idempotency_key: params.idempotencyKey,
      payment_method: params.paymentMethod ?? null,
      mindbody_client_service_id: params.mindbodyClientServiceId ?? null,
    })
    .eq("id", params.bookingId)
    .select("*")
    .single();

  if (error) {
    console.error("persistBookingCheckout error:", error);
    if (error.code === "23505") {
      const existing = await findConfirmedSlotBooking(supabase, {
        sessionId: params.sessionId,
        bookingType: params.bookingType,
        serviceId: params.serviceId,
        startDateTime: params.startDateTime,
      });
      if (existing) return existing;
    }
    return null;
  }

  return data as Record<string, unknown>;
}

export function confirmedBookingResponse(
  booking: Record<string, unknown>,
  payment?: unknown,
  idempotent = true,
): Response {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  return new Response(
    JSON.stringify({
      success: true,
      idempotent,
      booking: {
        id: booking.id,
        mindbodyId: booking.mindbody_appointment_id || booking.mindbody_class_id,
        serviceName: booking.service_name,
        startTime: booking.start_time,
        status: booking.status,
      },
      payment,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
  );
}

export function bookingInProgressResponse(): Response {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  return new Response(
    JSON.stringify({
      error: "Your booking is already being processed. Please wait a moment — do not tap Confirm again.",
      bookingInProgress: true,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 },
  );
}
