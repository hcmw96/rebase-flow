export type BookingConfirmationDetails = {
  to?: string | null;
  firstName?: string | null;
  serviceName: string;
  startTime?: string | null;
  endTime?: string | null;
  locationName?: string | null;
  bookingType: "class" | "appointment";
};

function mindbodyHeaders(apiKey: string, siteId: string, bearerToken: string) {
  return {
    "Content-Type": "application/json",
    "Api-Key": apiKey,
    "SiteId": siteId,
    Authorization: `Bearer ${bearerToken}`,
  };
}

function formatUkDateTime(iso: string | undefined | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      timeZone: "Europe/London",
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

function buildEmailHtml(details: BookingConfirmationDetails): string {
  const name = details.firstName?.trim() || "there";
  const when = formatUkDateTime(details.startTime);
  const end = details.endTime ? formatUkDateTime(details.endTime) : "";
  const timeLine = when && end ? `${when} – ${end}` : when || "See your Mindbody account for times";
  const location = details.locationName?.trim() || "Rebase Recovery, Marylebone";

  return `
    <div style="font-family: Inter, system-ui, sans-serif; color: #1a1a1a; line-height: 1.6; max-width: 560px;">
      <p>Hi ${name},</p>
      <p>Your booking at <strong>Rebase Recovery</strong> is confirmed.</p>
      <table style="margin: 16px 0; border-collapse: collapse;">
        <tr><td style="padding: 4px 12px 4px 0; color: #666;">Service</td><td><strong>${details.serviceName}</strong></td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #666;">When</td><td>${timeLine}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #666;">Where</td><td>${location}</td></tr>
      </table>
      <p>Please arrive a few minutes early. If you need to change or cancel, contact us at
        <a href="mailto:reception@rebaserecovery.com">reception@rebaserecovery.com</a>.</p>
      <p style="color: #666; font-size: 14px;">Rebase Recovery · Marylebone, London</p>
    </div>
  `.trim();
}

/** Rebase-branded confirmation (requires RESEND_API_KEY on Supabase). */
export async function sendRebaseBookingConfirmation(
  details: BookingConfirmationDetails,
): Promise<boolean> {
  const to = details.to?.trim();
  if (!to) {
    console.warn("Booking confirmation email skipped: no recipient address");
    return false;
  }

  const resendKey = Deno.env.get("RESEND_API_KEY")?.trim();
  if (!resendKey) {
    console.warn("RESEND_API_KEY not set — skipping Rebase booking confirmation email");
    return false;
  }

  const from = Deno.env.get("BOOKING_EMAIL_FROM")?.trim() ||
    "Rebase Recovery <reception@rebaserecovery.com>";
  const bcc = Deno.env.get("BOOKING_EMAIL_BCC")?.trim();

  const subject = `Booking confirmed — ${details.serviceName} at Rebase Recovery`;
  const html = buildEmailHtml(details);

  const body: Record<string, unknown> = {
    from,
    to: [to],
    subject,
    html,
  };
  if (bcc) body.bcc = [bcc];

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error("Resend booking email failed:", res.status, await res.text().catch(() => ""));
    return false;
  }

  console.log("Rebase booking confirmation email sent to", to);
  return true;
}

/** Ensure Mindbody has the client's email (needed for MB automatic emails). */
export async function ensureMindbodyClientEmail(
  apiKey: string,
  siteId: string,
  staffToken: string,
  clientId: string,
  email: string | undefined | null,
): Promise<void> {
  const trimmed = email?.trim();
  if (!trimmed) return;

  try {
    const res = await fetch("https://api.mindbodyonline.com/public/v6/client/updateclient", {
      method: "POST",
      headers: mindbodyHeaders(apiKey, siteId, staffToken),
      body: JSON.stringify({
        Client: {
          Id: clientId,
          Email: trimmed,
          SendScheduleEmails: true,
          SendAccountEmails: true,
        },
      }),
    });
    if (!res.ok) {
      console.warn("Mindbody updateclient (email) failed:", res.status, await res.text().catch(() => ""));
    }
  } catch (e) {
    console.warn("Mindbody updateclient (email) error:", e);
  }
}

/** Send all confirmation channels after a successful booking (non-blocking for HTTP response). */
export async function sendBookingConfirmationEmails(
  details: BookingConfirmationDetails,
  _opts?: {
    apiKey: string;
    siteId: string;
    mindbodyClientId?: string | null;
    classId?: string;
  },
): Promise<void> {
  // Rebase email only. Do not call addclienttoclass with a staff token + RequirePayment:false —
  // that can enroll clients without payment if the consumer booking did not complete.
  await sendRebaseBookingConfirmation(details);
}
