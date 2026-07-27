import { AUTHORITY_MAPPING } from "@/config/authorityMapping";

export interface CandidateLocation {
  label: string;
  formattedAddress: string;
  state: string;
  district: string;
  city: string;
  municipality: string;
  latitude?: number | null;
  longitude?: number | null;
  rawLocation: string;
  confidence: number;
}

export interface LocationResolverInput {
  text: string;
  locations?: string[];
  landmarks?: string[];
  state?: string | null;
  city?: string | null;
  district?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  selectedLocation?: string | null;
  aiConfidence?: number;
}

export interface LocationResolverResult {
  status: "RESOLVED" | "AMBIGUOUS_LOCATION";
  extractedLocation: string;
  resolvedCandidate?: CandidateLocation;
  options?: string[];
  candidates?: CandidateLocation[];
  locationConfidence: number;
  reason: string;
}

// Built-in gazetteer for known ambiguous & common Indian locations
// Serves as fallback and candidate source alongside OpenStreetMap Nominatim
const KNOWN_INDIAN_LOCATIONS: CandidateLocation[] = [
  {
    label: "Jagti, Jammu",
    formattedAddress: "Jagti, Nagrota, Jammu District, Jammu and Kashmir",
    state: "Jammu & Kashmir",
    district: "Jammu",
    city: "Jammu",
    municipality: "Jammu Municipal Corporation",
    rawLocation: "Jagti",
    confidence: 0.5,
  },
  {
    label: "Jagti, Punjab",
    formattedAddress: "Jagti, SAS Nagar, Punjab",
    state: "Punjab",
    district: "SAS Nagar",
    city: "Mohali",
    municipality: "Mohali Municipal Corporation",
    rawLocation: "Jagti",
    confidence: 0.5,
  },
  {
    label: "Jagti, Madhya Pradesh",
    formattedAddress: "Jagti, Shivpuri, Madhya Pradesh",
    state: "Madhya Pradesh",
    district: "Shivpuri",
    city: "Shivpuri",
    municipality: "Shivpuri Municipal Board",
    rawLocation: "Jagti",
    confidence: 0.5,
  },
  {
    label: "Rohini, Delhi",
    formattedAddress: "Rohini, North West Delhi, Delhi",
    state: "Delhi",
    district: "North West Delhi",
    city: "Delhi",
    municipality: "Municipal Corporation of Delhi (MCD)",
    rawLocation: "Rohini",
    confidence: 0.95,
  },
  {
    label: "Mohali, Punjab",
    formattedAddress: "Mohali (SAS Nagar), Punjab",
    state: "Punjab",
    district: "SAS Nagar",
    city: "Mohali",
    municipality: "Mohali Municipal Corporation",
    rawLocation: "Mohali",
    confidence: 0.95,
  },
  {
    label: "Phase 5, Mohali",
    formattedAddress: "Phase 5, Mohali, SAS Nagar, Punjab",
    state: "Punjab",
    district: "SAS Nagar",
    city: "Mohali",
    municipality: "Mohali Municipal Corporation",
    rawLocation: "Phase 5",
    confidence: 0.95,
  },
  {
    label: "Civil Lines, Delhi",
    formattedAddress: "Civil Lines, North Delhi, Delhi",
    state: "Delhi",
    district: "North Delhi",
    city: "Delhi",
    municipality: "Municipal Corporation of Delhi (MCD)",
    rawLocation: "Civil Lines",
    confidence: 0.5,
  },
  {
    label: "Civil Lines, Punjab",
    formattedAddress: "Civil Lines, Ludhiana, Punjab",
    state: "Punjab",
    district: "Ludhiana",
    city: "Ludhiana",
    municipality: "Ludhiana Municipal Corporation",
    rawLocation: "Civil Lines",
    confidence: 0.5,
  },
];

function normalizeState(stateStr?: string | null): string {
  if (!stateStr) return "";
  const s = stateStr.trim().toLowerCase();
  for (const [key, cfg] of Object.entries(AUTHORITY_MAPPING.states)) {
    if (cfg.aliases.some((a) => s.includes(a) || a.includes(s))) {
      return cfg.stateName;
    }
  }
  return stateStr.trim();
}

async function reverseGeocodeGPS(lat: number, lng: number): Promise<CandidateLocation | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      {
        headers: {
          "Accept-Language": "en",
          "User-Agent": "SahiVibhag-LocationResolver/1.0",
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address || {};

    const rawState = addr.state || addr.state_district || "Punjab";
    const state = normalizeState(rawState);
    const district = addr.state_district || addr.county || addr.district || addr.city_district || "District";
    const city = addr.city || addr.town || addr.village || addr.municipality || addr.suburb || addr.county || district;
    const municipality = addr.municipality || `${city} Municipal Corporation`;

    const label = `${city}, ${district}, ${state}`;

    return {
      label,
      formattedAddress: data.display_name || label,
      state,
      district,
      city,
      municipality,
      latitude: lat,
      longitude: lng,
      rawLocation: city,
      confidence: 0.98,
    };
  } catch (err) {
    return null;
  }
}

async function fetchNominatimCandidates(query: string): Promise<CandidateLocation[]> {
  const genericWords = ["water", "electricity", "road", "pothole", "problem", "issue", "pani", "bijli", "near", "at", "in"];
  if (genericWords.includes(query.toLowerCase().trim())) return [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=in&q=${encodeURIComponent(
        query
      )}&limit=6`,
      {
        headers: {
          "Accept-Language": "en",
          "User-Agent": "SahiVibhag-LocationResolver/1.0",
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return [];

    const candidates: CandidateLocation[] = [];

    for (const item of data) {
      const displayName = item.display_name || "";
      const parts = displayName.split(",").map((p: string) => p.trim());
      
      // Extract state/district/city from Nominatim display name
      const statePart = parts.length > 2 ? parts[parts.length - 2] : "";
      const state = normalizeState(statePart) || "Punjab";
      const district = parts.length > 3 ? parts[parts.length - 3] : parts[0];
      const city = parts.length > 4 ? parts[parts.length - 4] : parts[0];
      const municipality = `${city} Municipal Corporation`;

      // Create human readable candidate label (e.g. "Jagti, Jammu" or "Jagti, Shivpuri")
      const label = `${parts[0]}, ${city !== parts[0] ? city : district}`;

      candidates.push({
        label,
        formattedAddress: displayName,
        state,
        district,
        city,
        municipality,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        rawLocation: query,
        confidence: 0.5,
      });
    }

    return candidates;
  } catch (e) {
    return [];
  }
}

export async function resolveLocationCandidates(
  input: LocationResolverInput
): Promise<LocationResolverResult> {
  const fullText = (input.text || "").toLowerCase();
  
  // 1. HIGHEST PRIORITY: Browser GPS Coordinates
  if (
    input.latitude !== undefined &&
    input.latitude !== null &&
    input.longitude !== undefined &&
    input.longitude !== null
  ) {
    console.log("[LocationResolver] Resolving location via browser GPS coordinates...");
    const gpsLocation = await reverseGeocodeGPS(input.latitude, input.longitude);
    if (gpsLocation) {
      return {
        status: "RESOLVED",
        extractedLocation: input.locations?.[0] || gpsLocation.rawLocation || "GPS Coordinates",
        resolvedCandidate: gpsLocation,
        locationConfidence: 0.98,
        reason: "Location resolved with high precision using browser GPS coordinates.",
      };
    }
  }

  // 2. USER SELECTION PRIORITY: Frontend explicit option choice
  if (input.selectedLocation && input.selectedLocation.trim() !== "") {
    const sel = input.selectedLocation.trim();
    console.log(`[LocationResolver] User explicitly selected candidate option: "${sel}"`);
    
    // Check if selection matches one of our known gazetteer or format strings
    const selLower = sel.toLowerCase();
    
    let matchedCandidate: CandidateLocation | undefined;
    
    // Match against KNOWN_INDIAN_LOCATIONS
    matchedCandidate = KNOWN_INDIAN_LOCATIONS.find((c) =>
      selLower.includes(c.label.toLowerCase()) || c.label.toLowerCase().includes(selLower)
    );

    if (!matchedCandidate) {
      // Parse selection string, e.g. "Jagti, Jammu" or "Jagti, Punjab"
      const parts = sel.split(",").map((p) => p.trim());
      const rawLoc = parts[0] || "Location";
      const secondPart = parts[1] || "";
      
      const state = normalizeState(secondPart) || (selLower.includes("jammu") ? "Jammu & Kashmir" : selLower.includes("punjab") ? "Punjab" : "Punjab");
      const city = secondPart || "City";
      const district = secondPart || "District";
      
      matchedCandidate = {
        label: sel,
        formattedAddress: `${sel}, India`,
        state,
        district,
        city,
        municipality: `${city} Municipal Corporation`,
        rawLocation: rawLoc,
        confidence: 1.0,
      };
    } else {
      matchedCandidate = { ...matchedCandidate, confidence: 1.0 };
    }

    return {
      status: "RESOLVED",
      extractedLocation: matchedCandidate.rawLocation,
      resolvedCandidate: matchedCandidate,
      locationConfidence: 1.0,
      reason: `Location explicitly confirmed by user as "${sel}".`,
    };
  }

  // 3. CANDIDATE SEARCH & RANKING PIPELINE
  const rawLocationList = input.locations && input.locations.length > 0 ? input.locations : [];
  let primaryLocationQuery = rawLocationList[0] || input.city || input.district || "";
  
  if (!primaryLocationQuery) {
    // Attempt basic extraction from text if empty
    const locationKeywords = ["in ", "at ", "near ", "sector ", "phase ", "chowk "];
    for (const kw of locationKeywords) {
      const idx = fullText.indexOf(kw);
      if (idx !== -1) {
        const after = input.text.slice(idx + kw.length).trim();
        const words = after.split(" ");
        primaryLocationQuery = words.slice(0, 2).join(" ");
        break;
      }
    }
  }

  if (!primaryLocationQuery) {
    primaryLocationQuery = input.text.slice(0, 30);
  }

  const queryClean = primaryLocationQuery.trim();

  // Gather candidate locations from Nominatim and Known Indian Gazetteer
  const candidatesMap = new Map<string, CandidateLocation>();

  // A. Include Known Indian gazetteer candidates matching query
  for (const known of KNOWN_INDIAN_LOCATIONS) {
    if (
      known.rawLocation.toLowerCase() === queryClean.toLowerCase() ||
      queryClean.toLowerCase().includes(known.rawLocation.toLowerCase()) ||
      known.label.toLowerCase().includes(queryClean.toLowerCase())
    ) {
      candidatesMap.set(known.label, { ...known });
    }
  }

  // B. Fetch web geocoding candidates from OpenStreetMap Nominatim
  const webCandidates = await fetchNominatimCandidates(queryClean);
  for (const webC of webCandidates) {
    if (!candidatesMap.has(webC.label)) {
      candidatesMap.set(webC.label, webC);
    }
  }

  const allCandidates = Array.from(candidatesMap.values());

  if (allCandidates.length === 0) {
    // Fallback default candidate if no results found anywhere
    const fallbackState = input.state ? normalizeState(input.state) : "Punjab";
    const defaultCand: CandidateLocation = {
      label: `${queryClean}, ${fallbackState}`,
      formattedAddress: `${queryClean}, ${fallbackState}, India`,
      state: fallbackState,
      district: input.district || "District",
      city: input.city || "City",
      municipality: `${input.city || "Local"} Municipal Corporation`,
      rawLocation: queryClean,
      confidence: 0.85,
    };
    return {
      status: "RESOLVED",
      extractedLocation: queryClean,
      resolvedCandidate: defaultCand,
      locationConfidence: 0.85,
      reason: `Location assigned based on available context in ${fallbackState}.`,
    };
  }

  // 4. LOCATION RANKING ALGORITHM
  // Score candidates based on:
  // - Mentioned Landmark (+45 pts)
  // - Mentioned City (+30 pts)
  // - Mentioned District (+20 pts)
  // - Mentioned State (+20 pts)
  const landmarkList = input.landmarks || [];
  const mentionedLandmarksText = landmarkList.join(" ").toLowerCase();
  const mentionedState = input.state ? normalizeState(input.state) : null;
  const mentionedCity = input.city ? input.city.toLowerCase() : null;
  const mentionedDistrict = input.district ? input.district.toLowerCase() : null;

  let hasExplicitDisambiguator = false;

  const scoredCandidates = allCandidates.map((cand) => {
    let score = 50; // base score for candidate match

    // A. Mentioned Landmark check (Highest priority text score)
    // Example: "IIT Jammu" mentioned -> strongly favors Jagti, Jammu (+45 pts)
    const candText = `${cand.label} ${cand.formattedAddress} ${cand.city} ${cand.district} ${cand.state}`.toLowerCase();
    
    if (landmarkList.length > 0) {
      for (const lm of landmarkList) {
        const lmLower = lm.toLowerCase();
        if (candText.includes(lmLower) || (lmLower.includes("jammu") && cand.state === "Jammu & Kashmir")) {
          score += 45;
          hasExplicitDisambiguator = true;
        } else if (lmLower.includes("mohali") || lmLower.includes("punjab")) {
          if (cand.state === "Punjab") {
            score += 45;
            hasExplicitDisambiguator = true;
          }
        }
      }
    }

    // Direct check if landmark keywords appear in full complaint text (e.g. "IIT Jammu")
    if (fullText.includes("iit jammu") || fullText.includes("jammu")) {
      if (cand.state === "Jammu & Kashmir" || cand.city.toLowerCase() === "jammu") {
        score += 45;
        hasExplicitDisambiguator = true;
      }
    } else if (fullText.includes("mohali") || fullText.includes("amritsar") || fullText.includes("punjab")) {
      if (cand.state === "Punjab") {
        score += 45;
        hasExplicitDisambiguator = true;
      }
    }

    // B. Mentioned City check
    if (mentionedCity && candText.includes(mentionedCity)) {
      score += 30;
      hasExplicitDisambiguator = true;
    }

    // C. Mentioned District check
    if (mentionedDistrict && candText.includes(mentionedDistrict)) {
      score += 20;
      hasExplicitDisambiguator = true;
    }

    // D. Mentioned State check
    if (mentionedState && cand.state.toLowerCase() === mentionedState.toLowerCase()) {
      score += 20;
      hasExplicitDisambiguator = true;
    }

    // Compute normalized confidence percentage (capped at 0.98 for auto-rank)
    const confidence = Math.min(0.98, Number((score / 100).toFixed(2)));

    return {
      ...cand,
      score,
      confidence,
    };
  });

  // Sort candidates by score descending
  scoredCandidates.sort((a, b) => b.score - a.score);

  const topCandidate = scoredCandidates[0];
  const secondCandidate = scoredCandidates.length > 1 ? scoredCandidates[1] : null;

  // 5. AMBIGUITY EVALUATION
  // If confidence < 90% (0.90) and no explicit landmark/state/city disambiguated:
  const isAmbiguous = topCandidate.confidence < 0.90 && !hasExplicitDisambiguator;

  if (isAmbiguous && scoredCandidates.length >= 2) {
    console.log(`[LocationResolver] Location "${queryClean}" is AMBIGUOUS. Top candidate confidence ${Math.round(topCandidate.confidence * 100)}% < 90%.`);

    // Format human readable choices (e.g. ["Jagti, Jammu", "Jagti, Punjab"])
    const options = Array.from(
      new Set(scoredCandidates.slice(0, 3).map((c) => c.label))
    );

    return {
      status: "AMBIGUOUS_LOCATION",
      extractedLocation: queryClean,
      options,
      candidates: scoredCandidates.slice(0, 3),
      locationConfidence: topCandidate.confidence,
      reason: `Multiple locations named '${queryClean}' were found across jurisdictions. User selection is required to determine exact authority.`,
    };
  }

  // Single candidate or high confidence (>= 90%)
  console.log(`[LocationResolver] Location resolved to "${topCandidate.label}" with confidence ${Math.round(topCandidate.confidence * 100)}%`);

  return {
    status: "RESOLVED",
    extractedLocation: queryClean,
    resolvedCandidate: topCandidate,
    locationConfidence: topCandidate.confidence,
    reason: `Location resolved to ${topCandidate.label} in ${topCandidate.state} with ${Math.round(topCandidate.confidence * 100)}% confidence.`,
  };
}
