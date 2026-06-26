import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

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

const IN_PROGRESS_MS = 90_000;

function hasMindbodyRecord(row: Record<string, unknown>): boolean {
  return Boolean(row.mindbody_appointment_id || row.mindbody_class_id);
}

/** Reserve an idempotency slot before calling Mindbody (prevents duplicate charges). */
export async function claimBookingIdempotency(
  supabase: SupabaseClient,
  params: BookingClaimInput,
  retryDepth = 0,
): Promise<BookingClaimResult> {
  const { data, error } = await supabase
    .from("bookings")
    .insert({
      session_id: params.sessionId,
      service_name: params.serviceName,
      start_time: params.startDateTime,
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

    const createdAt = new Date(String(existing.created_at)).getTime();
    if (Date.now() - createdAt < IN_PROGRESS_MS) {
      return { type: "in_progress" };
    }

    if (retryDepth < 1) {
      await supabase.from("bookings").delete().eq("id", existing.id).eq("status", "pending");
      return claimBookingIdempotency(supabase, params, retryDepth + 1);
    }

    return { type: "in_progress" };
  }

  if (retryDepth < 1 && !hasMindbodyRecord(existing as Record<string, unknown>)) {
    await supabase.from("bookings").delete().eq("id", existing.id);
    return claimBookingIdempotency(supabase, params, retryDepth + 1);
  }

  return { type: "in_progress" };
}

/** Drop a pending claim when Mindbody did not complete a paid booking. */
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

export function buildFallbackIdempotencyKey(parts: {
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
    parts.startDateTime || "",
  ].join(":");
}
