import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getStaffToken } from "../_shared/mindbodyStaff.ts";
import {
  buildCacheKey,
  CACHE_TTL,
  getCachedJson,
  setCachedJson,
} from "../_shared/mindbodyResponseCache.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const cacheKey = buildCacheKey("services:v1");
    const cached = await getCachedJson<{ services: unknown[] }>(cacheKey);
    if (cached?.services) {
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
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

    // Full sale catalog (used for duration-aware matching and fallback)
    const allSaleServices: any[] = [];
    let saleOffset = 0;
    const saleLimit = 100;
    while (true) {
      const catalogResponse = await fetch(
        `https://api.mindbodyonline.com/public/v6/sale/services?Limit=${saleLimit}&Offset=${saleOffset}`,
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
      if (!catalogResponse.ok) break;
      const catalogData = await catalogResponse.json();
      const batch = catalogData.Services || [];
      allSaleServices.push(...batch);
      if (batch.length < saleLimit) break;
      saleOffset += saleLimit;
    }
    console.log(`Loaded ${allSaleServices.length} sale/pricing options`);

    type SaleCatalogEntry = { name: string; normalized: string; minutes: number | null; price: number };
    const saleCatalog: SaleCatalogEntry[] = [];
    for (const service of allSaleServices) {
      const price = service.OnlinePrice ?? service.Price ?? null;
      if (price === null || price === 0) continue;
      const name = service.Name || "";
      saleCatalog.push({
        name,
        normalized: normalizeServiceName(name),
        minutes: extractMinutes(name),
        price,
      });
    }

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
            if (isSessionPack(service.Name || "")) continue;

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
                const serviceMinutes = extractMinutes(service.Name);
                const sessionMinutes = extractMinutes(st.Name);
                const normalizedBase = normalizeServiceName(st.Name || "");
                if (!durationsCompatible(serviceMinutes, sessionMinutes, normalizedBase, saleCatalog)) {
                  continue;
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
      
      // Build lookup maps including duration info - using normalized names
      const priceByNormalizedWithDuration = new Map<string, number>();
      const priceByNormalizedOnly = new Map<string, number>();
      const allServiceEntries = saleCatalog;
      
      for (const entry of allServiceEntries) {
        if (isSessionPack(entry.name)) continue;

        // Store with duration key if present (single-session retail only)
        if (entry.minutes) {
          priceByNormalizedWithDuration.set(`${entry.normalized}_${entry.minutes}`, entry.price);
        }
        // Store without duration for fallback
        if (!priceByNormalizedOnly.has(entry.normalized)) {
          priceByNormalizedOnly.set(entry.normalized, entry.price);
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
        const sessionMinutesInName = extractMinutes(sessionName);
        const sessionMinutesForLookup = sessionMinutesInName || st.DefaultTimeLength;
        
        // Strategy 1: Exact normalized name + duration match
        if (sessionMinutesForLookup) {
          const keyWithDuration = `${normalizedSession}_${sessionMinutesForLookup}`;
          if (priceByNormalizedWithDuration.has(keyWithDuration)) {
            priceBySessionTypeId.set(stId, priceByNormalizedWithDuration.get(keyWithDuration)!);
            console.log(`Strategy 1: ${st.Name} (${sessionMinutesForLookup}min) -> £${priceBySessionTypeId.get(stId)}`);
            continue;
          }
        }
        
        // Strategy 2: Fuzzy name match with duration
        let bestMatch: { price: number; score: number; name: string } | null = null;
        for (const entry of allServiceEntries) {
          if (isSessionPack(entry.name)) continue;

          const score = fuzzyNameMatch(sessionName, entry.name);
          
          // Require high similarity (70%+)
          if (score < 0.7) continue;
          
          if (!durationsCompatible(entry.minutes, sessionMinutesInName, normalizedSession, saleCatalog)) continue;
          
          // Prefer matches with matching duration
          const adjustedScore = (sessionMinutesInName && entry.minutes === sessionMinutesInName) ? score + 0.2 : score;
          
          if (!bestMatch || adjustedScore > bestMatch.score) {
            bestMatch = { price: entry.price, score: adjustedScore, name: entry.name };
          }
        }
        
        if (bestMatch) {
          priceBySessionTypeId.set(stId, bestMatch.price);
          console.log(`Strategy 2: ${st.Name} -> £${bestMatch.price} (fuzzy: ${bestMatch.score.toFixed(2)} from "${bestMatch.name}")`);
          continue;
        }
        
        // Strategy 3: Normalized name only — only when session type has no duration in its name
        if (!sessionMinutesInName && priceByNormalizedOnly.has(normalizedSession)) {
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
                if (!durationsCompatible(entry.minutes, sessionMinutesInName, normalizedSession, saleCatalog)) continue;
                
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

    // Retail packs (pricing options) that are not session types — e.g. Cryo 10-pack
    const sessionTypeNames = new Set(
      sessionTypes.map((st: any) => (st.Name || "").toLowerCase().trim()),
    );
    for (const saleService of allSaleServices) {
      const name = saleService.Name || "";
      if (!isSessionPack(name)) continue;
      if (sessionTypeNames.has(name.toLowerCase().trim())) continue;

      const price = saleService.OnlinePrice ?? saleService.Price ?? null;
      if (price === null || price === 0) continue;
      if (saleService.SellOnline === false) continue;

      const linkedIds: number[] = saleService.SessionTypeIds || [];
      const linkedSt = sessionTypes.find((st: any) => linkedIds.includes(st.Id));
      const programId = linkedSt?.ProgramId ?? saleService.ProgramId ?? null;
      const program = programs.find((p: any) => p.Id === programId);

      services.push({
        id: `pack-${saleService.Id}`,
        name,
        description: saleService.Description || "",
        defaultTimeLength: linkedSt?.DefaultTimeLength ?? 0,
        programId: programId ?? 0,
        programName: program?.Name || "General",
        category: mapProgramToCategory(program?.Name),
        numDeducted: saleService.Count ?? 1,
        onlineDescription: saleService.Description || "",
        price,
        isPack: true,
        packSessionCount: saleService.Count ?? null,
        linkedSessionTypeId: linkedSt?.Id ?? linkedIds[0] ?? null,
      });
      console.log(`Added retail pack: ${name} -> £${price}`);
    }

    const payload = { services };
    await setCachedJson(cacheKey, payload, CACHE_TTL.services);

    return new Response(
      JSON.stringify(payload),
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

function isSessionPack(name: string): boolean {
  return (
    /\bpack\b/i.test(name) ||
    /\d+\s*[-–]?\s*session\s*pack/i.test(name) ||
    /\bpass\b/i.test(name) ||
    /unlimited\s*\d+\s*week/i.test(name)
  );
}

function hasSpecificDurationPricing(
  catalog: Array<{ normalized: string; minutes: number | null; name: string }>,
  normalizedBase: string,
  minutes: number,
): boolean {
  return catalog.some(
    (e) =>
      !isSessionPack(e.name) &&
      e.normalized === normalizedBase &&
      e.minutes === minutes,
  );
}

// Prevent e.g. sale "Hyperbaric Oxygen" (£200) matching "Hyperbaric Oxygen (90 mins)"
// when "Hyperbaric Oxygen - 90 minutes" (£300) exists in the catalog.
function durationsCompatible(
  serviceMinutes: number | null,
  sessionMinutes: number | null,
  normalizedBase: string,
  catalog: Array<{ normalized: string; minutes: number | null; name: string }>,
): boolean {
  if (serviceMinutes != null && sessionMinutes != null) {
    return serviceMinutes === sessionMinutes;
  }
  if (serviceMinutes != null && sessionMinutes == null) return false;
  if (sessionMinutes != null && serviceMinutes == null) {
    return !hasSpecificDurationPricing(catalog, normalizedBase, sessionMinutes);
  }
  return true;
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
