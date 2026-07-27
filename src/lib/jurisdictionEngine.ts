import { AUTHORITY_MAPPING, StateConfig } from "@/config/authorityMapping";
import {
  resolveLocationCandidates,
  CandidateLocation,
  LocationResolverResult,
} from "./locationResolver";

export interface JurisdictionInput {
  text: string;
  category: string;
  subcategory?: string;
  locations?: string[];
  landmarks?: string[];
  location?: string | null;
  state?: string | null;
  city?: string | null;
  district?: string | null;
  landmark?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  selectedLocation?: string | null;
  aiConfidence?: number;
}

export interface RoutingOutput {
  status: "RESOLVED" | "AMBIGUOUS_LOCATION";
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
  locationConfidence: number;
  locationMapped: boolean;
  options?: string[];
  candidates?: CandidateLocation[];
  locationSuggestions?: string[];
  locationErrorMessage?: string;
}

export async function resolveJurisdictionAndRoute(
  input: JurisdictionInput
): Promise<RoutingOutput> {
  const fullText = (input.text || "").toLowerCase();
  
  // Prepare list of locations and landmarks for location resolver
  const locations = input.locations || (input.location ? [input.location] : []);
  const landmarks = input.landmarks || (input.landmark ? [input.landmark] : []);

  // 1. DEDICATED LOCATION RESOLUTION & CANDIDATE RANKING
  const locationResult: LocationResolverResult = await resolveLocationCandidates({
    text: input.text,
    locations,
    landmarks,
    state: input.state,
    city: input.city,
    district: input.district,
    latitude: input.latitude,
    longitude: input.longitude,
    selectedLocation: input.selectedLocation,
    aiConfidence: input.aiConfidence,
  });

  const category = input.category || "General";
  const subcategory = input.subcategory || input.category || "General Grievance";
  const aiConfidence = input.aiConfidence || 0.90;

  // 2. IF LOCATION IS AMBIGUOUS (< 90% confidence & multiple options)
  if (locationResult.status === "AMBIGUOUS_LOCATION") {
    console.log("[JurisdictionEngine] Halting department assignment: Location is AMBIGUOUS.");
    
    return {
      status: "AMBIGUOUS_LOCATION",
      category,
      subcategory,
      extractedLocation: locationResult.extractedLocation,
      detectedState: "Ambiguous",
      detectedDistrict: "Ambiguous",
      detectedCity: "Ambiguous",
      detectedMunicipality: "Ambiguous",
      assignedAuthority: "Unassigned (Awaiting Disambiguation)",
      reasonForRouting: locationResult.reason,
      aiConfidence,
      routingConfidence: locationResult.locationConfidence,
      locationConfidence: locationResult.locationConfidence,
      locationMapped: false,
      options: locationResult.options,
      candidates: locationResult.candidates,
      locationErrorMessage: "We found multiple locations matching this name. Please select the correct one.",
      locationSuggestions: locationResult.options,
    };
  }

  // 3. LOCATION IS RESOLVED (>= 90% confidence or explicit selection or GPS)
  const candidate = locationResult.resolvedCandidate!;
  const detectedState = candidate.state;
  const detectedDistrict = candidate.district;
  const detectedCity = candidate.city;
  const detectedMunicipality = candidate.municipality;
  const locationConfidence = locationResult.locationConfidence;

  // 4. DETERMINISTIC AUTHORITY MAPPING (State + Category -> Authority)
  const normalizedStateKey = detectedState.toLowerCase();
  let stateConfig: StateConfig = AUTHORITY_MAPPING.states[normalizedStateKey];

  if (!stateConfig) {
    for (const [key, cfg] of Object.entries(AUTHORITY_MAPPING.states)) {
      if (cfg.aliases.some((alias) => normalizedStateKey.includes(alias) || alias.includes(normalizedStateKey))) {
        stateConfig = cfg;
        break;
      }
    }
  }

  if (!stateConfig) {
    stateConfig = AUTHORITY_MAPPING.defaultFallbackState;
  }

  // Map Category
  const inputCategoryLower = category.toLowerCase();
  const normalizedCategoryKey = AUTHORITY_MAPPING.categoryAliases[inputCategoryLower] || category;
  
  let categoryRule = stateConfig.categories[normalizedCategoryKey];

  if (!categoryRule) {
    categoryRule = AUTHORITY_MAPPING.defaultFallbackState.categories[normalizedCategoryKey] || {
      authority: stateConfig.defaultAuthority?.authority || "General Grievance Redressal Cell",
      reason: stateConfig.defaultAuthority?.reason || `Grievance routed to ${detectedState} general administration.`,
    };
  }

  let assignedAuthority = categoryRule.authority;
  let reasonForRouting = categoryRule.reason;

  // Locality specific rules (e.g. BSES vs TPDDL in Delhi, JPDCL vs KPDCL in J&K)
  if (categoryRule.localityRules && categoryRule.localityRules.length > 0) {
    for (const locRule of categoryRule.localityRules) {
      if (
        locRule.keywords.some(
          (kw) =>
            fullText.includes(kw) ||
            candidate.formattedAddress.toLowerCase().includes(kw) ||
            detectedCity.toLowerCase().includes(kw)
        )
      ) {
        assignedAuthority = locRule.authority;
        reasonForRouting = locRule.reason;
        break;
      }
    }
  }

  // Handle generic "Municipal Corporation" replacement with actual municipality name
  if (assignedAuthority === "Municipal Corporation" && detectedMunicipality) {
    assignedAuthority = detectedMunicipality;
    reasonForRouting = `Local civic and sanitation grievances in ${detectedCity} are handled by ${detectedMunicipality}.`;
  }

  const routingConfidence = Number((locationConfidence * 0.98).toFixed(2));

  return {
    status: "RESOLVED",
    category: normalizedCategoryKey,
    subcategory,
    extractedLocation: candidate.rawLocation || locationResult.extractedLocation,
    detectedState,
    detectedDistrict,
    detectedCity,
    detectedMunicipality,
    assignedAuthority,
    reasonForRouting,
    aiConfidence,
    routingConfidence,
    locationConfidence,
    locationMapped: true,
  };
}
