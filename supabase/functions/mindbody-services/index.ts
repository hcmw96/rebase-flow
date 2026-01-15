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
    
    console.log(`Fetching prices for ${sessionTypes.length} session types`);

    // Map to store prices by session type ID
    const priceBySessionTypeId = new Map<number, number | null>();
    
    // Batch session type IDs and query sale/services with sessionTypeIds parameter
    const BATCH_SIZE = 20; // Keep batches small to avoid URL length limits
    const sessionTypeIds = sessionTypes.map((st: any) => st.Id);
    
    for (let i = 0; i < sessionTypeIds.length; i += BATCH_SIZE) {
      const batch = sessionTypeIds.slice(i, i + BATCH_SIZE);
      
      // Build query params with array syntax
      const params = batch.map((id: number) => `request.sessionTypeIds=${id}`).join('&');
      
      try {
        const servicesResponse = await fetch(
          `https://api.mindbodyonline.com/public/v6/sale/services?${params}`,
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

        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json();
          const services = servicesData.Services || [];
          
          console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: Requested ${batch.length} IDs, got ${services.length} services`);
          
          // Map each returned service to its session type
          // The API returns services that are linked to the requested session types
          for (const service of services) {
            const price = service.OnlinePrice ?? service.Price ?? null;
            if (price === null || price === 0) continue;
            
            // Check if service has SessionTypeIds array
            if (service.SessionTypeIds && Array.isArray(service.SessionTypeIds)) {
              for (const stId of service.SessionTypeIds) {
                if (batch.includes(stId) && !priceBySessionTypeId.has(stId)) {
                  priceBySessionTypeId.set(stId, price);
                  console.log(`Matched ID ${stId} -> £${price} (via SessionTypeIds)`);
                }
              }
            }
            
            // Also try matching by service name to session type name
            // This helps when SessionTypeIds isn't populated
            const serviceName = (service.Name || '').toLowerCase().trim();
            for (const stId of batch) {
              if (priceBySessionTypeId.has(stId)) continue;
              
              const st = sessionTypes.find((s: any) => s.Id === stId);
              if (!st) continue;
              
              const sessionName = (st.Name || '').toLowerCase().trim();
              
              // Check for exact or very close match (including duration)
              if (serviceName === sessionName || 
                  serviceName.includes(sessionName) || 
                  sessionName.includes(serviceName)) {
                // Additional check: if both have durations, they must match
                const serviceMinutes = extractMinutes(service.Name);
                const sessionMinutes = extractMinutes(st.Name);
                
                if (serviceMinutes && sessionMinutes && serviceMinutes !== sessionMinutes) {
                  continue; // Durations don't match, skip
                }
                
                priceBySessionTypeId.set(stId, price);
                console.log(`Matched ID ${stId} (${st.Name}) -> £${price} (via name match)`);
              }
            }
          }
        } else {
          console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, await servicesResponse.text());
        }
      } catch (err) {
        console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, err);
      }
      
      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < sessionTypeIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Fallback: Fetch ALL sale services and try name matching for any still unpriced
    const unpricedIds = sessionTypeIds.filter((id: number) => !priceBySessionTypeId.has(id));
    
    if (unpricedIds.length > 0) {
      console.log(`${unpricedIds.length} session types still unpriced, trying fallback name matching...`);
      
      const allSaleServices: any[] = [];
      let offset = 0;
      const limit = 100;
      
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

        if (!servicesResponse.ok) break;
        
        const servicesData = await servicesResponse.json();
        const services = servicesData.Services || [];
        allSaleServices.push(...services);
        
        if (services.length < limit) break;
        offset += limit;
      }
      
      // Build lookup maps including duration info
      const priceByNameWithDuration = new Map<string, number>();
      const priceByNameOnly = new Map<string, number>();
      
      for (const service of allSaleServices) {
        const price = service.OnlinePrice ?? service.Price ?? null;
        if (price === null || price === 0) continue;
        
        const name = (service.Name || '').toLowerCase().trim();
        const minutes = extractMinutes(service.Name);
        
        // Store with duration key if present
        if (minutes) {
          priceByNameWithDuration.set(`${stripDuration(name)}_${minutes}`, price);
        }
        // Only use no-duration fallback if the service itself has no duration in name
        if (!minutes) {
          priceByNameOnly.set(stripDuration(name), price);
        }
      }
      
      // Log available prices for debugging
      console.log("Available prices with duration:", JSON.stringify(Object.fromEntries(priceByNameWithDuration)));
      
      // Try to match unpriced session types
      for (const stId of unpricedIds) {
        const st = sessionTypes.find((s: any) => s.Id === stId);
        if (!st) continue;
        
        const sessionName = (st.Name || '').toLowerCase().trim();
        const sessionMinutes = extractMinutes(st.Name) || st.DefaultTimeLength;
        const strippedName = stripDuration(sessionName);
        
        // First try matching with duration
        if (sessionMinutes) {
          const keyWithDuration = `${strippedName}_${sessionMinutes}`;
          if (priceByNameWithDuration.has(keyWithDuration)) {
            priceBySessionTypeId.set(stId, priceByNameWithDuration.get(keyWithDuration)!);
            console.log(`Fallback matched ${st.Name} (${sessionMinutes}min) -> £${priceBySessionTypeId.get(stId)}`);
            continue;
          }
        }
        
        // Only use name-only match if session type has no explicit duration
        const hasExplicitDuration = extractMinutes(st.Name) !== null;
        if (!hasExplicitDuration && priceByNameOnly.has(strippedName)) {
          priceBySessionTypeId.set(stId, priceByNameOnly.get(strippedName)!);
          console.log(`Fallback matched ${st.Name} -> £${priceBySessionTypeId.get(stId)} (no duration match)`);
        }
      }
    }
    
    const matchedCount = [...priceBySessionTypeId.values()].filter(p => p !== null).length;
    console.log(`Price matching complete: ${matchedCount}/${sessionTypes.length} matched`);

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

// Extract minutes from a name like "Premium Suite (45 mins)" -> 45
function extractMinutes(name: string | undefined): number | null {
  if (!name) return null;
  const match = name.match(/(\d+)\s*(?:mins?|minutes?)/i);
  return match ? parseInt(match[1], 10) : null;
}

// Strip duration from name for matching: "Premium Suite (45 mins)" -> "premium suite"
function stripDuration(name: string): string {
  return name
    .replace(/\(\d+\s*(?:mins?|minutes?|hrs?|hours?)\)/gi, '')
    .replace(/\d+\s*(?:mins?|minutes?|hrs?|hours?)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

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
