import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

type LogPurchaseOpts = {
  sessionId: string;
  mindbodyClientId: string;
  mindbodySiteClientId: string | null;
  mindbodySaleServiceId: number;
  mindbodyClientServiceId?: number | null;
  amountGbp: number;
  productName: string;
};

type LogClassBookingOpts = {
  sessionId: string;
  mindbodyClientId: string;
  mindbodySiteClientId: string | null;
  mindbodyClientServiceId?: number | null;
  mindbodyClassId: string;
  bookingId?: string | null;
  serviceName?: string | null;
  classStartTime?: string | null;
  amountGbp?: number | null;
};

export async function logContrastPassPurchase(
  supabase: SupabaseClient,
  opts: LogPurchaseOpts,
): Promise<void> {
  const { error } = await supabase.from("contrast_pass_usage_events").insert({
    event_type: "purchase",
    session_id: opts.sessionId,
    mindbody_client_id: opts.mindbodyClientId,
    mindbody_site_client_id: opts.mindbodySiteClientId,
    mindbody_sale_service_id: opts.mindbodySaleServiceId,
    mindbody_client_service_id: opts.mindbodyClientServiceId ?? null,
    amount_gbp: opts.amountGbp,
    product_name: opts.productName,
  });
  if (error) console.warn("contrast_pass_usage_events purchase:", error.message);
}

export async function logJunePassClassBooking(
  supabase: SupabaseClient,
  opts: LogClassBookingOpts,
): Promise<void> {
  const { error } = await supabase.from("contrast_pass_usage_events").insert({
    event_type: "class_booking",
    session_id: opts.sessionId,
    mindbody_client_id: opts.mindbodyClientId,
    mindbody_site_client_id: opts.mindbodySiteClientId,
    mindbody_client_service_id: opts.mindbodyClientServiceId ?? null,
    mindbody_class_id: opts.mindbodyClassId,
    booking_id: opts.bookingId ?? null,
    service_name: opts.serviceName ?? null,
    class_start_time: opts.classStartTime ?? null,
    amount_gbp: opts.amountGbp ?? null,
  });
  if (error) console.warn("contrast_pass_usage_events class_booking:", error.message);
}
