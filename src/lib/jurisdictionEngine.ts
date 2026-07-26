import { AUTHORITY_MAPPING, StateConfig } from "@/config/authorityMapping";

export interface JurisdictionInput {
  text: string;
  category: string;
  subcategory?: string;
  location?: string | null;
  state?: string | null;
  city?: string | null;
  district?: string | null;
  landmark?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  aiConfidence?: number;
}

export interface RoutingOutput {
  category: string;
  subcategory: string;
  extractedLocation: string;
  detectedState: string;
  detectedDistrict: string;
  detectedCity: string;
  detectedMunicipality: string;
  assignedAuthority: string;
  reasonForRouting: string;
  aiConfidence: number;
  routingConfidence: number;
  locationMapped: boolean;
  locationSuggestions?: string[];
  locationErrorMessage?: string;
}

interface GazetteerEntry {
  keywords: string[];
  state: string;
  district: string;
  city: string;
  municipality: string;
}

const INDIAN_GAZETTEER: GazetteerEntry[] = [
  {
    keywords: ["mohali", "phase 5 mohali", "sas nagar", "sahibzada ajit singh nagar", "phase 1 mohali", "phase 2 mohali", "phase 3 mohali", "phase 7 mohali", "kharar", "zirakpur"],
    state: "Punjab",
    district: "SAS Nagar",
    city: "Mohali",
    municipality: "Mohali Municipal Corporation",
  },
  {
    keywords: ["amritsar", "golden temple", "ranjit avenue"],
    state: "Punjab",
    district: "Amritsar",
    city: "Amritsar",
    municipality: "Amritsar Municipal Corporation",
  },
  {
    keywords: ["ludhiana", "model town ludhiana", "sarabha nagar"],
    state: "Punjab",
    district: "Ludhiana",
    city: "Ludhiana",
    municipality: "Ludhiana Municipal Corporation",
  },
  {
    keywords: ["jalandhar", "cantt jalandhar", "model town jalandhar"],
    state: "Punjab",
    district: "Jalandhar",
    city: "Jalandhar",
    municipality: "Jalandhar Municipal Corporation",
  },
  {
    keywords: ["patiala", "urban estate patiala"],
    state: "Punjab",
    district: "Patiala",
    city: "Patiala",
    municipality: "Patiala Municipal Corporation",
  },
  {
    keywords: ["rohini", "pitampura", "civil lines", "model town delhi", "shalimar bagh", "narela", "jahangirpuri", "wazirabad", "badli", "tis hazari", "kamla nagar"],
    state: "Delhi",
    district: "North West Delhi",
    city: "Delhi",
    municipality: "Municipal Corporation of Delhi (MCD)",
  },
  {
    keywords: ["saket", "hauz khas", "dwarka", "janakpuri", "laxmi nagar", "preet vihar", "mayur vihar", "lajpat nagar", "kalkaji", "connaught place", "karol bagh", "new delhi", "delhi"],
    state: "Delhi",
    district: "South Delhi",
    city: "Delhi",
    municipality: "Municipal Corporation of Delhi (MCD)",
  },
  {
    keywords: ["jammu", "gandhi nagar jammu", "bakshi nagar", "trikuta nagar", "bahu fort", "janipur", "shastri nagar", "channi himmat"],
    state: "Jammu & Kashmir",
    district: "Jammu",
    city: "Jammu",
    municipality: "Jammu Municipal Corporation",
  },
  {
    keywords: ["srinagar", "lal chowk", "rajbagh", "karan nagar", "hyderpora", "dal lake", "hazratbal", "soura"],
    state: "Jammu & Kashmir",
    district: "Srinagar",
    city: "Srinagar",
    municipality: "Srinagar Municipal Corporation",
  },
  {
    keywords: ["noida", "greater noida", "sector 62 noida", "sector 18 noida"],
    state: "Uttar Pradesh",
    district: "Gautam Buddha Nagar",
    city: "Noida",
    municipality: "Noida Authority",
  },
  {
    keywords: ["gurugram", "gurgaon", "cyber city", "dlf phase"],
    state: "Haryana",
    district: "Gurugram",
    city: "Gurugram",
    municipality: "Municipal Corporation Gurugram (MCG)",
  }
];

function normalizeStateName(inputState?: string | null): string | null {
  if (!inputState) return null;
  const s = inputState.trim().toLowerCase();

  for (const [key, config] of Object.entries(AUTHORITY_MAPPING.states)) {
    if (config.aliases.some((alias) => s.includes(alias) || alias.includes(s))) {
      return config.stateName;
    }
  }
  return inputState.trim();
}

async function reverseGeocodeCoords(lat: number, lng: number): Promise<{
  state?: string;
  district?: string;
  city?: string;
  municipality?: string;
} | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      {
        headers: {
          "Accept-Language": "en",
          "User-Agent": "SahiVibhag-Grievance-Engine/1.0",
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (!response.ok) return null;
    const data = await response.json();
    const addr = data.address || {};

    const state = addr.state || addr.state_district;
    const district = addr.state_district || addr.county || addr.district || addr.city_district;
    const city = addr.city || addr.town || addr.village || addr.municipality || addr.suburb || addr.county;
    const municipality = addr.municipality || (city ? `${city} Municipal Corporation` : undefined);

    return { state, district, city, municipality };
  } catch (e) {
    return null;
  }
}

async function geocodeTextLocation(query: string): Promise<{
  state?: string;
  district?: string;
  city?: string;
  municipality?: string;
} | null> {
  // Ignore generic words that are not real places
  const genericWords = ["road issue", "water issue", "electricity issue", "road", "pothole", "bijli", "water", "garbage", "clean", "light"];
  if (genericWords.some(g => query.toLowerCase().trim() === g)) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=in&q=${encodeURIComponent(query)}&limit=1`,
      {
        headers: {
          "Accept-Language": "en",
          "User-Agent": "SahiVibhag-Grievance-Engine/1.0",
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (!response.ok) return null;
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const first = data[0];
    const lat = parseFloat(first.lat);
    const lon = parseFloat(first.lon);

    if (!isNaN(lat) && !isNaN(lon)) {
      return await reverseGeocodeCoords(lat, lon);
    }

    return null;
  } catch (e) {
    return null;
  }
}

export async function resolveJurisdictionAndRoute(input: JurisdictionInput): Promise<RoutingOutput> {
  const fullText = (input.text || "").toLowerCase();
  const rawLoc = (input.location || "").trim();

  let detectedState: string | null = normalizeStateName(input.state);
  let detectedDistrict: string | null = input.district ? input.district.trim() : null;
  let detectedCity: string | null = input.city ? input.city.trim() : null;
  let detectedMunicipality: string | null = null;
  let routingConfidence = input.aiConfidence || 0.90;
  let gazetteerMatched = false;

  // 1. Coordinates reverse geocoding
  if (input.latitude !== undefined && input.latitude !== null && input.longitude !== undefined && input.longitude !== null) {
    const geoResult = await reverseGeocodeCoords(input.latitude, input.longitude);
    if (geoResult) {
      if (geoResult.state) detectedState = normalizeStateName(geoResult.state);
      if (geoResult.district) detectedDistrict = geoResult.district;
      if (geoResult.city) detectedCity = geoResult.city;
      if (geoResult.municipality) detectedMunicipality = geoResult.municipality;
      routingConfidence = 0.98;
      gazetteerMatched = true;
    }
  }

  // 2. Gazetteer lookup
  if (!detectedState || !detectedDistrict) {
    for (const entry of INDIAN_GAZETTEER) {
      if (entry.keywords.some((kw) => fullText.includes(kw) || rawLoc.toLowerCase().includes(kw))) {
        detectedState = entry.state;
        if (!detectedDistrict) detectedDistrict = entry.district;
        if (!detectedCity) detectedCity = entry.city;
        if (!detectedMunicipality) detectedMunicipality = entry.municipality;
        routingConfidence = Math.max(routingConfidence, 0.95);
        gazetteerMatched = true;
        break;
      }
    }
  }

  // 3. Web Geocoding on raw location string if present and not matched
  if (!detectedState && rawLoc.length > 2) {
    const webGeo = await geocodeTextLocation(rawLoc);
    if (webGeo && webGeo.state) {
      detectedState = normalizeStateName(webGeo.state);
      if (webGeo.district) detectedDistrict = webGeo.district;
      if (webGeo.city) detectedCity = webGeo.city;
      if (webGeo.municipality) detectedMunicipality = webGeo.municipality;
      routingConfidence = Math.max(routingConfidence, 0.92);
      gazetteerMatched = true;
    }
  }

  // 4. Ambiguity Detection (Bonus Requirement)
  const isAmbiguous = !gazetteerMatched && (!detectedState || !input.location || rawLoc.length < 3);
  let locationMapped = true;
  let locationErrorMessage: string | undefined;
  let locationSuggestions: string[] | undefined;

  if (isAmbiguous) {
    locationMapped = false;
    locationErrorMessage = "Location could not be mapped confidently.";
    locationSuggestions = ["Nearby landmark", "Pin location on map", "Pincode"];
    routingConfidence = 0.40;
    if (!detectedState) {
      detectedState = "Punjab"; // Default northern state fallback for routing determination
    }
  }

  // Fallback defaults for missing district/city/municipality
  if (!detectedDistrict) {
    detectedDistrict = detectedCity || (detectedState ? `${detectedState} District` : "Central District");
  }
  if (!detectedCity) {
    detectedCity = detectedDistrict || "Urban City";
  }
  if (!detectedMunicipality && detectedState && detectedCity) {
    const stateKey = detectedState.toLowerCase();
    const stateConfig = AUTHORITY_MAPPING.states[stateKey] || AUTHORITY_MAPPING.defaultFallbackState;
    const pattern = stateConfig.defaultMunicipalityPattern || "{city} Municipal Corporation";
    detectedMunicipality = pattern.replace("{city}", detectedCity);
  } else if (!detectedMunicipality) {
    detectedMunicipality = "Municipal Corporation";
  }

  // 5. Match State Config in AUTHORITY_MAPPING
  const normalizedStateKey = (detectedState || "").toLowerCase();
  let stateConfig: StateConfig = AUTHORITY_MAPPING.states[normalizedStateKey];

  if (!stateConfig) {
    for (const [key, cfg] of Object.entries(AUTHORITY_MAPPING.states)) {
      if (cfg.aliases.some((alias) => normalizedStateKey.includes(alias) || alias.includes(normalizedStateKey))) {
        stateConfig = cfg;
        detectedState = cfg.stateName;
        break;
      }
    }
  }

  if (!stateConfig) {
    stateConfig = AUTHORITY_MAPPING.defaultFallbackState;
  }

  // 6. Match Category in State Config
  const inputCategoryLower = (input.category || "General").toLowerCase();
  const normalizedCategoryKey = AUTHORITY_MAPPING.categoryAliases[inputCategoryLower] || input.category || "General";
  
  let categoryRule = stateConfig.categories[normalizedCategoryKey];

  if (!categoryRule) {
    categoryRule = AUTHORITY_MAPPING.defaultFallbackState.categories[normalizedCategoryKey] || {
      authority: stateConfig.defaultAuthority?.authority || "General Grievance Redressal Cell",
      reason: stateConfig.defaultAuthority?.reason || `Grievance routed to ${detectedState} general administration.`,
    };
  }

  let assignedAuthority = categoryRule.authority;
  let reasonForRouting = categoryRule.reason;

  // Check locality specific rules (e.g. BSES vs TPDDL in Delhi)
  if (categoryRule.localityRules && categoryRule.localityRules.length > 0) {
    for (const locRule of categoryRule.localityRules) {
      if (locRule.keywords.some((kw) => fullText.includes(kw) || rawLoc.toLowerCase().includes(kw))) {
        assignedAuthority = locRule.authority;
        reasonForRouting = locRule.reason;
        break;
      }
    }
  }

  // If authority is generic "Municipal Corporation", replace with specific municipality name
  if (assignedAuthority === "Municipal Corporation" && detectedMunicipality) {
    assignedAuthority = detectedMunicipality;
    reasonForRouting = `Local civic and sanitation grievances in ${detectedCity} are handled by ${detectedMunicipality}.`;
  }

  return {
    category: normalizedCategoryKey,
    subcategory: input.subcategory || input.category || "General Grievance",
    extractedLocation: input.location || rawLoc || "Not specified",
    detectedState: detectedState || "Punjab",
    detectedDistrict: detectedDistrict || "SAS Nagar",
    detectedCity: detectedCity || "Mohali",
    detectedMunicipality: detectedMunicipality || "Municipal Corporation",
    assignedAuthority: assignedAuthority,
    reasonForRouting: reasonForRouting,
    aiConfidence: input.aiConfidence || 0.90,
    routingConfidence: Number(routingConfidence.toFixed(2)),
    locationMapped,
    locationSuggestions,
    locationErrorMessage,
  };
}
