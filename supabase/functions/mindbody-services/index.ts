import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StaffCredentials {
  TokenType: string;
  AccessToken: string;
  ExpiresIn: number;
}

async function getStaffToken(): Promise<string> {
  const apiKey = Deno.env.get("MINDBODY_API_KEY");
  const siteId = Deno.env.get("MINDBODY_SITE_ID");
  const username = Deno.env.get("MINDBODY_STAFF_USERNAME");
  const password = Deno.env.get("MINDBODY_STAFF_PASSWORD");

  if (!apiKey || !siteId || !username || !password) {
    throw new Error("Missing Mindbody staff credentials");
  }

  const response = await fetch("https://api.mindbodyonline.com/public/v6/usertoken/issue", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": apiKey,
      "SiteId": siteId,
    },
    body: JSON.stringify({
      Username: username,
      Password: password,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Staff token error:", errorText);
    throw new Error("Failed to get staff token");
  }

  const data: StaffCredentials = await response.json();
  return data.AccessToken;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("MINDBODY_API_KEY");
    const siteId = Deno.env.get("MINDBODY_SITE_ID");

    if (!apiKey || !siteId) {
      throw new Error("Missing Mindbody API configuration");
    }

    const staffToken = await getStaffToken();

    // Fetch session types (services)
    const sessionTypesResponse = await fetch(
      `https://api.mindbodyonline.com/public/v6/site/sessiontypes`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": apiKey,
          "SiteId": siteId,
          "Authorization": `Bearer ${staffToken}`,
        },
      }
    );

    if (!sessionTypesResponse.ok) {
      const errorText = await sessionTypesResponse.text();
      console.error("Session types error:", errorText);
      throw new Error("Failed to fetch session types");
    }

    const sessionTypesData = await sessionTypesResponse.json();

    // Fetch programs for categorization
    const programsResponse = await fetch(
      `https://api.mindbodyonline.com/public/v6/site/programs`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": apiKey,
          "SiteId": siteId,
          "Authorization": `Bearer ${staffToken}`,
        },
      }
    );

    let programs = [];
    if (programsResponse.ok) {
      const programsData = await programsResponse.json();
      programs = programsData.Programs || [];
    }

    // Fetch pricing from /sale/services
    const servicesResponse = await fetch(
      `https://api.mindbodyonline.com/public/v6/sale/services`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": apiKey,
          "SiteId": siteId,
          "Authorization": `Bearer ${staffToken}`,
        },
      }
    );

    let saleServices = [];
    if (servicesResponse.ok) {
      const servicesData = await servicesResponse.json();
      saleServices = servicesData.Services || [];
      console.log("Sale services fetched:", saleServices.length);
    } else {
      console.log("Failed to fetch sale services, prices may be unavailable");
    }

    // Normalize names for better matching
    const normalizeName = (name: string | undefined): string => {
      return name?.toLowerCase().trim().replace(/\s+/g, ' ') || '';
    };

    // Create a map of normalized service name to price
    const priceMap = new Map();
    for (const service of saleServices) {
      const normalizedName = normalizeName(service.Name);
      if (normalizedName) {
        priceMap.set(normalizedName, {
          price: service.OnlinePrice ?? service.Price ?? null,
          productId: service.ProductId,
          originalName: service.Name,
        });
      }
    }

    console.log("Sale services available:", Array.from(priceMap.entries()).map(([name, info]) => `${name}: £${info.price}`).slice(0, 20));

    // Map session types to services with category info and pricing
    const unmatchedServices: string[] = [];
    const services = (sessionTypesData.SessionTypes || []).map((st: any) => {
      const program = programs.find((p: any) => p.Id === st.ProgramId);
      const normalizedSessionName = normalizeName(st.Name);
      
      // Try exact normalized match first
      let priceInfo = priceMap.get(normalizedSessionName);
      
      // If no exact match, try partial matching
      if (!priceInfo) {
        for (const [saleName, info] of priceMap.entries()) {
          // Check if one contains the other
          if (saleName.includes(normalizedSessionName) || normalizedSessionName.includes(saleName)) {
            priceInfo = info;
            break;
          }
        }
      }
      
      if (!priceInfo) {
        unmatchedServices.push(st.Name);
      }

      return {
        id: st.Id.toString(),
        name: st.Name,
        description: st.Description || "",
        defaultTimeLength: st.DefaultTimeLength,
        programId: st.ProgramId,
        programName: program?.Name || "General",
        category: mapProgramToCategory(program?.Name),
        numDeducted: st.NumDeducted,
        onlineDescription: st.OnlineDescription || st.Description || "",
        price: priceInfo?.price ?? null,
      };
    });

    if (unmatchedServices.length > 0) {
      console.log("Unmatched session types (no price found):", unmatchedServices);
    }

    return new Response(
      JSON.stringify({ services }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Services fetch error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

function mapProgramToCategory(programName: string | undefined): string {
  if (!programName) return "General";
  
  const lower = programName.toLowerCase();
  if (lower.includes("recovery") || lower.includes("cryo") || lower.includes("hbot")) {
    return "Recovery";
  }
  if (lower.includes("class") || lower.includes("group")) {
    return "Classes";
  }
  if (lower.includes("private") || lower.includes("suite")) {
    return "Private";
  }
  if (lower.includes("wellness") || lower.includes("sauna") || lower.includes("ice")) {
    return "Wellness";
  }
  return "General";
}
