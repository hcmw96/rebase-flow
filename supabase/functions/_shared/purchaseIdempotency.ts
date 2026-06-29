import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type PurchaseClaimResult =
  | { type: "claimed"; claimId: string }
  | { type: "confirmed"; productName: string; amountGbp: number }
  | { type: "in_progress" };

export function resolvePurchaseProductKey(saleServiceId: number): string {
  return `service:${saleServiceId}`;
}

/** Reserve a purchase slot before charging Mindbody. */
export async function claimPassPurchase(
  supabase: SupabaseClient,
  params: {
    sessionId: string;
    mindbodySiteClientId: string;
    productKey: string;
    productName: string;
  },
): Promise<PurchaseClaimResult> {
  const { data, error } = await supabase
    .from("purchase_claims")
    .insert({
      session_id: params.sessionId,
      mindbody_site_client_id: params.mindbodySiteClientId,
      product_key: params.productKey,
      product_name: params.productName,
      status: "pending",
    })
    .select("id, status, product_name, amount_gbp")
    .single();

  if (!error && data?.id) {
    return { type: "claimed", claimId: String(data.id) };
  }

  if (error?.code !== "23505") {
    throw new Error(error?.message || "Failed to reserve purchase idempotency slot");
  }

  const { data: existing } = await supabase
    .from("purchase_claims")
    .select("id, status, product_name, amount_gbp")
    .eq("mindbody_site_client_id", params.mindbodySiteClientId)
    .eq("product_key", params.productKey)
    .maybeSingle();

  if (!existing) {
    throw new Error("Purchase idempotency conflict but existing claim not found");
  }

  if (existing.status === "confirmed" && existing.amount_gbp != null) {
    return {
      type: "confirmed",
      productName: String(existing.product_name),
      amountGbp: Number(existing.amount_gbp),
    };
  }

  return { type: "in_progress" };
}

export async function releasePurchaseClaim(
  supabase: SupabaseClient,
  claimId: string,
): Promise<void> {
  await supabase
    .from("purchase_claims")
    .delete()
    .eq("id", claimId)
    .eq("status", "pending");
}

export async function confirmPassPurchase(
  supabase: SupabaseClient,
  claimId: string,
  amountGbp: number,
): Promise<void> {
  await supabase
    .from("purchase_claims")
    .update({ status: "confirmed", amount_gbp: amountGbp })
    .eq("id", claimId)
    .eq("status", "pending");
}
