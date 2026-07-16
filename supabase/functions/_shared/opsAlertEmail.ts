type OpsAlertInput = {
  category: string;
  title: string;
  summary: string;
  details?: Record<string, string | number | boolean | null | undefined>;
  dedupeKey?: string;
};

const DEDUPE_MS = 15 * 60 * 1000;
const recentAlerts = new Map<string, number>();

function formatUkNow(): string {
  return new Date().toLocaleString("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function shouldSend(dedupeKey: string | undefined): boolean {
  if (!dedupeKey) return true;
  const now = Date.now();
  const last = recentAlerts.get(dedupeKey);
  if (last != null && now - last < DEDUPE_MS) return false;
  recentAlerts.set(dedupeKey, now);
  if (recentAlerts.size > 200) {
    for (const [key, ts] of recentAlerts) {
      if (now - ts > DEDUPE_MS) recentAlerts.delete(key);
    }
  }
  return true;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildHtml(alert: OpsAlertInput): string {
  const rows = Object.entries(alert.details ?? {})
    .filter(([, value]) => value != null && value !== "")
    .map(([key, value]) => {
      const label = escapeHtml(key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()));
      const cell = escapeHtml(String(value));
      return `<tr><td style="padding:4px 12px 4px 0;color:#666;vertical-align:top;">${label}</td><td>${cell}</td></tr>`;
    })
    .join("");

  return `
    <div style="font-family:Inter,system-ui,sans-serif;color:#1a1a1a;line-height:1.6;max-width:640px;">
      <p style="margin:0 0 8px;color:#b45309;font-weight:600;">Rebase website alert</p>
      <h2 style="margin:0 0 12px;font-size:18px;">${escapeHtml(alert.title)}</h2>
      <p style="margin:0 0 16px;">${escapeHtml(alert.summary)}</p>
      ${rows ? `<table style="margin:0 0 16px;border-collapse:collapse;">${rows}</table>` : ""}
      <p style="margin:0;color:#666;font-size:13px;">Sent ${escapeHtml(formatUkNow())} (UK time)</p>
    </div>
  `.trim();
}

/** Fire-and-forget ops alert via Resend (same credentials as booking emails). */
export function sendOpsAlert(alert: OpsAlertInput): void {
  const to = Deno.env.get("OPS_ALERT_EMAIL")?.trim() || "henrycmwilson@gmail.com";
  const resendKey = Deno.env.get("RESEND_API_KEY")?.trim();
  if (!resendKey) {
    console.warn("OPS alert skipped: RESEND_API_KEY not set");
    return;
  }
  if (!shouldSend(alert.dedupeKey)) {
    console.log("OPS alert deduped:", alert.category, alert.title);
    return;
  }

  const from = Deno.env.get("BOOKING_EMAIL_FROM")?.trim() ||
    "Rebase Recovery <reception@rebaserecovery.com>";
  const subject = `[Rebase alert] ${alert.title}`;
  const html = buildHtml(alert);

  fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  })
    .then(async (res) => {
      if (!res.ok) {
        console.error("OPS alert email failed:", res.status, await res.text().catch(() => ""));
        return;
      }
      console.log("OPS alert email sent:", alert.category, "→", to);
    })
    .catch((err) => console.error("OPS alert email error:", err));
}

export async function alertOnHttpFailure(
  response: Response,
  context: {
    category: string;
    title: string;
    dedupeKey?: string;
    details?: Record<string, string | number | boolean | null | undefined>;
  },
): Promise<void> {
  if (response.status < 400 || response.status === 409) return;

  let body: Record<string, unknown> = {};
  try {
    body = await response.clone().json();
  } catch {
    /* ignore */
  }

  if (response.status === 401 && body.requiresLogin) return;

  const errorMessage =
    (typeof body.error === "string" && body.error) ||
    (typeof body.message === "string" && body.message) ||
    `HTTP ${response.status}`;

  sendOpsAlert({
    category: context.category,
    title: context.title,
    summary: errorMessage,
    dedupeKey: context.dedupeKey || `${context.category}:${errorMessage.slice(0, 120)}`,
    details: {
      ...context.details,
      httpStatus: response.status,
      paymentRequired: Boolean(body.paymentRequired),
      noStoredCard: Boolean(body.noStoredCard),
      cardDeclined: Boolean(body.cardDeclined),
      siteScopeIssue: Boolean(body.siteScopeIssue),
      profileNotFound: Boolean(body.profileNotFound),
      requiresLogin: Boolean(body.requiresLogin),
    },
  });
}
