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
    console.error("Missing creds - apiKey:", !!apiKey, "siteId:", !!siteId, "username:", !!username, "password:", !!password);
    throw new Error("Missing Mindbody staff credentials");
  }

  console.log("Debug - API Key length:", apiKey.length, "Prefix:", apiKey.substring(0, 8));
  console.log("Debug - Site ID:", siteId);
  console.log("Debug - Username length:", username.length, "Prefix:", username.substring(0, 3));
  console.log("Debug - Password length:", password.length);

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
    console.error("Staff token error (status", response.status, "):", errorText);
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

    // Fetch all session types with pagination
    const allSessionTypesRaw: any[] = [];
    let stOffset = 0;
    const stLimit = 100;
    
    while (true) {
      const sessionTypesResponse = await fetch(
        `https://api.mindbodyonline.com/public/v6/site/sessiontypes?Limit=${stLimit}&Offset=${stOffset}`,
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
      const batch = sessionTypesData.SessionTypes || [];
      allSessionTypesRaw.push(...batch);
      
      console.log(`Session types batch: offset=${stOffset}, got ${batch.length}`);
      
      if (batch.length < stLimit) break;
      stOffset += stLimit;
    }

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
    const allSessionTypes = allSessionTypesRaw;
    const sessionTypes = allSessionTypes.filter((st: any) => st.Active !== false);
    console.log(`Filtered: ${allSessionTypes.length} total -> ${sessionTypes.length} active session types`);
    
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
      
      // Build lookup maps including duration info - using normalized names
      const priceByNormalizedWithDuration = new Map<string, number>();
      const priceByNormalizedOnly = new Map<string, number>();
      const allServiceEntries: Array<{name: string, normalized: string, minutes: number | null, price: number}> = [];
      
      for (const service of allSaleServices) {
        const price = service.OnlinePrice ?? service.Price ?? null;
        if (price === null || price === 0) continue;
        
        const name = service.Name || '';
        const normalized = normalizeServiceName(name);
        const minutes = extractMinutes(name);
        
        allServiceEntries.push({ name, normalized, minutes, price });
        
        // Store with duration key if present
        if (minutes) {
          priceByNormalizedWithDuration.set(`${normalized}_${minutes}`, price);
        }
        // Store without duration for fallback
        if (!priceByNormalizedOnly.has(normalized)) {
          priceByNormalizedOnly.set(normalized, price);
        }
      }
      
      // Log available prices for debugging
      console.log("Available normalized prices:", JSON.stringify(Object.fromEntries(priceByNormalizedWithDuration)));
      
      // Try to match unpriced session types using multiple strategies
      for (const stId of unpricedIds) {
        if (priceBySessionTypeId.has(stId)) continue;
        
        const st = sessionTypes.find((s: any) => s.Id === stId);
        if (!st) continue;
        
        const sessionName = st.Name || '';
        const normalizedSession = normalizeServiceName(sessionName);
        const sessionMinutes = extractMinutes(sessionName) || st.DefaultTimeLength;
        
        // Strategy 1: Exact normalized name + duration match
        if (sessionMinutes) {
          const keyWithDuration = `${normalizedSession}_${sessionMinutes}`;
          if (priceByNormalizedWithDuration.has(keyWithDuration)) {
            priceBySessionTypeId.set(stId, priceByNormalizedWithDuration.get(keyWithDuration)!);
            console.log(`Strategy 1: ${st.Name} (${sessionMinutes}min) -> £${priceBySessionTypeId.get(stId)}`);
            continue;
          }
        }
        
        // Strategy 2: Fuzzy name match with duration
        let bestMatch: { price: number; score: number; name: string } | null = null;
        for (const entry of allServiceEntries) {
          const score = fuzzyNameMatch(sessionName, entry.name);
          
          // Require high similarity (70%+)
          if (score < 0.7) continue;
          
          // If both have durations, they must match
          if (sessionMinutes && entry.minutes && sessionMinutes !== entry.minutes) continue;
          
          // Prefer matches with matching duration
          const adjustedScore = (sessionMinutes && entry.minutes === sessionMinutes) ? score + 0.2 : score;
          
          if (!bestMatch || adjustedScore > bestMatch.score) {
            bestMatch = { price: entry.price, score: adjustedScore, name: entry.name };
          }
        }
        
        if (bestMatch) {
          priceBySessionTypeId.set(stId, bestMatch.price);
          console.log(`Strategy 2: ${st.Name} -> £${bestMatch.price} (fuzzy: ${bestMatch.score.toFixed(2)} from "${bestMatch.name}")`);
          continue;
        }
        
        // Strategy 3: Normalized name only (no duration requirement)
        if (priceByNormalizedOnly.has(normalizedSession)) {
          priceBySessionTypeId.set(stId, priceByNormalizedOnly.get(normalizedSession)!);
          console.log(`Strategy 3: ${st.Name} -> £${priceBySessionTypeId.get(stId)} (normalized name only)`);
          continue;
        }
        
        // Strategy 4: Partial word match for common service types
        const commonMappings: Record<string, string> = {
          'premium suite': 'premium suite',
          'infrared sauna': 'infrared sauna/ice bath',
          'ice bath': 'infrared sauna/ice bath',
          'osteopathy first': 'osteopathy',
          'osteopathy follow': 'osteopathy follow up',
          'hyperbaric': 'hyperbaric oxygen',
          'hbot': 'hyperbaric oxygen',
        };
        
        for (const [pattern, target] of Object.entries(commonMappings)) {
          if (normalizedSession.includes(pattern)) {
            // Find a matching service
            for (const entry of allServiceEntries) {
              if (entry.normalized.includes(target)) {
                // Check duration compatibility
                if (sessionMinutes && entry.minutes && sessionMinutes !== entry.minutes) continue;
                
                priceBySessionTypeId.set(stId, entry.price);
                console.log(`Strategy 4: ${st.Name} -> £${entry.price} (pattern "${pattern}" -> "${entry.name}")`);
                break;
              }
            }
            if (priceBySessionTypeId.has(stId)) break;
          }
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
  const match = name.match(/(\d+)\s*(?:mins?|minutes?|min|minute)/i);
  return match ? parseInt(match[1], 10) : null;
}

// Strip duration from name for matching: "Premium Suite (45 mins)" -> "premium suite"
function stripDuration(name: string): string {
  return name
    .replace(/\(\d+\s*(?:mins?|minutes?|min|minute|hrs?|hours?)\)/gi, '')
    .replace(/\d+\s*(?:mins?|minutes?|min|minute|hrs?|hours?)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Normalize service name by removing common suffixes and cleaning
function normalizeServiceName(name: string): string {
  return name
    .toLowerCase()
    // Remove staff/location suffixes like "- Utes", "- Minutes", etc.
    .replace(/\s*-\s*(utes|minutes|mins|staff|room\s*\d*)\s*$/gi, '')
    .replace(/\s*-\s*\d+\s*(min|mins|minutes|pack)\s*$/gi, '')
    // Remove duration patterns
    .replace(/\(\d+\s*(?:mins?|minutes?|min|minute|hrs?|hours?)\)/gi, '')
    .replace(/\d+\s*(?:mins?|minutes?|min|minute)\s*$/gi, '')
    // Remove pack info
    .replace(/\s*-?\s*\d+\s*(?:pack|session)s?\s*$/gi, '')
    // Remove extra whitespace and trailing dashes
    .replace(/\s*-\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Get core words from a name for fuzzy matching
function getCoreWords(name: string): Set<string> {
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'for', 'with', 'in', 'on', 'at', 'to', 'by']);
  return new Set(
    normalizeServiceName(name)
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
  );
}

// Fuzzy match: returns similarity score (0-1) based on word overlap
function fuzzyNameMatch(name1: string, name2: string): number {
  const words1 = getCoreWords(name1);
  const words2 = getCoreWords(name2);
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  let matches = 0;
  for (const word of words1) {
    if (words2.has(word)) {
      matches++;
    } else {
      // Check for partial word matches (e.g., "sculpting" vs "sculpt")
      for (const word2 of words2) {
        if (word.includes(word2) || word2.includes(word)) {
          matches += 0.8;
          break;
        }
      }
    }
  }
  
  const minSize = Math.min(words1.size, words2.size);
  return matches / minSize;
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
