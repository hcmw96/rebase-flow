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

    // Get all session type IDs
    const sessionTypes = sessionTypesData.SessionTypes || [];
    const sessionTypeIds = sessionTypes.map((st: any) => st.Id);
    
    console.log(`Fetching prices for ${sessionTypeIds.length} session types`);

    // Fetch ALL sale services for pricing (don't filter by sessionTypeIds since it doesn't add SessionTypeIds to response)
    const priceBySessionTypeId = new Map<number, number | null>();
    const allSaleServices: any[] = [];
    let offset = 0;
    const limit = 100;
    
    // Paginate through all sale services
    while (true) {
      const servicesResponse = await fetch(
        `https://api.mindbodyonline.com/public/v6/sale/services?Limit=${limit}&Offset=${offset}`,
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

      if (!servicesResponse.ok) {
        console.log(`Failed to fetch sale services at offset ${offset}:`, await servicesResponse.text());
        break;
      }
      
      const servicesData = await servicesResponse.json();
      const services = servicesData.Services || [];
      allSaleServices.push(...services);
      
      console.log(`Fetched ${services.length} sale services (offset: ${offset}, total: ${allSaleServices.length})`);
      
      if (services.length < limit) break; // No more pages
      offset += limit;
    }

    // Normalize name for matching
    const normalizeName = (name: string | undefined): string => {
      if (!name) return '';
      return name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[^a-z0-9\s]/g, '') // Remove special chars
        .replace(/\b(mins?|minutes?|hrs?|hours?)\b/g, '') // Remove time units
        .replace(/\b\d+\b/g, match => match) // Keep numbers
        .trim();
    };

    // Create multiple lookup maps for better matching
    const priceByExactName = new Map<string, number>();
    const priceByNormalizedName = new Map<string, number>();
    const priceByKeywords = new Map<string, number>();
    
    for (const service of allSaleServices) {
      const price = service.OnlinePrice ?? service.Price ?? null;
      if (price === null || price === 0) continue;
      
      const exactName = service.Name?.toLowerCase().trim() || '';
      const normalizedName = normalizeName(service.Name);
      
      priceByExactName.set(exactName, price);
      priceByNormalizedName.set(normalizedName, price);
      
      // Extract key words (3+ chars) for fuzzy matching
      const keywords = normalizedName.split(' ').filter((w: string) => w.length >= 4);
      if (keywords.length >= 2) {
        priceByKeywords.set(keywords.slice(0, 2).join(' '), price);
      }
    }
    
    console.log(`Built price maps: exact=${priceByExactName.size}, normalized=${priceByNormalizedName.size}, keywords=${priceByKeywords.size}`);

    // Match session types to prices
    const matchResults: Record<string, string[]> = { exact: [], normalized: [], keywords: [], none: [] };
    
    for (const st of sessionTypes) {
      const sessionName = st.Name || '';
      const exactName = sessionName.toLowerCase().trim();
      const normalizedName = normalizeName(sessionName);
      const keywords = normalizedName.split(' ').filter((w: string) => w.length >= 4).slice(0, 2).join(' ');
      
      let price: number | null = null;
      let matchType = 'none';
      
      // Try exact match first
      if (priceByExactName.has(exactName)) {
        price = priceByExactName.get(exactName)!;
        matchType = 'exact';
      }
      // Try normalized match
      else if (priceByNormalizedName.has(normalizedName)) {
        price = priceByNormalizedName.get(normalizedName)!;
        matchType = 'normalized';
      }
      // Try keyword match (first two significant words)
      else if (keywords && priceByKeywords.has(keywords)) {
        price = priceByKeywords.get(keywords)!;
        matchType = 'keywords';
      }
      // Try partial match - session name contains sale name or vice versa
      else {
        for (const [saleName, salePrice] of priceByNormalizedName.entries()) {
          if (normalizedName.includes(saleName) || saleName.includes(normalizedName)) {
            price = salePrice;
            matchType = 'normalized';
            break;
          }
        }
      }
      
      priceBySessionTypeId.set(st.Id, price);
      matchResults[matchType].push(`${st.Name} (ID: ${st.Id})${price ? ` = £${price}` : ''}`);
    }
    
    console.log(`Match results: exact=${matchResults.exact.length}, normalized=${matchResults.normalized.length}, keywords=${matchResults.keywords.length}, none=${matchResults.none.length}`);

    // Map session types to services with category info and pricing
    const unmatchedServices: string[] = [];
    const services = sessionTypes.map((st: any) => {
      const program = programs.find((p: any) => p.Id === st.ProgramId);
      const price = priceBySessionTypeId.get(st.Id) ?? null;
      
      if (price === null) {
        unmatchedServices.push(`${st.Name} (ID: ${st.Id})`);
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
        price: price,
      };
    });

    if (unmatchedServices.length > 0) {
      console.log(`${unmatchedServices.length} session types without price:`, unmatchedServices.slice(0, 20));
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
