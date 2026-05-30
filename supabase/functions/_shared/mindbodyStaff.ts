/** Issue a Mindbody staff API token (server-side only). */
export async function getStaffToken(): Promise<string> {
  const apiKey = Deno.env.get("MINDBODY_API_KEY")?.trim();
  const siteId = Deno.env.get("MINDBODY_SITE_ID")?.trim();
  const username = Deno.env.get("MINDBODY_STAFF_USERNAME")?.trim();
  const password = Deno.env.get("MINDBODY_STAFF_PASSWORD")?.trim();
  const sourceName = Deno.env.get("MINDBODY_SOURCE_NAME")?.trim();
  const sourcePassword = Deno.env.get("MINDBODY_SOURCE_PASSWORD")?.trim();

  if (!apiKey || !siteId || !username || !password) {
    throw new Error("Missing Mindbody staff credentials");
  }

  const body: Record<string, string> = { Username: username, Password: password };
  if (sourceName && sourcePassword) {
    body.SourceName = sourceName;
    body.SourcePassword = sourcePassword;
  }

  const res = await fetch("https://api.mindbodyonline.com/public/v6/usertoken/issue", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Api-Key": apiKey, "SiteId": siteId },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Mindbody staff auth failed (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  return data.AccessToken as string;
}
