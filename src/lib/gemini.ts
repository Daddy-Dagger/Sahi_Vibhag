import { GoogleGenerativeAI } from "@google/generative-ai";
import { OpenAI } from "openai";
import { resolveJurisdictionAndRoute, RoutingOutput } from "./jurisdictionEngine";
import { CandidateLocation } from "./locationResolver";

export interface RawAIExtractedResult {
  title: string;
  translatedDescription: string | null;
  category: string;
  subcategory: string;
  locations: string[];
  landmarks: string[];
  location: string | null;
  state: string | null;
  city: string | null;
  district: string | null;
  landmark: string | null;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  summary: string;
  missingInformation: string[];
  evidenceChecklist: Array<{ name: string; required: boolean; submitted: boolean }>;
  confidence: number;
  provider?: "OpenAI" | "Gemini" | "Fallback";
}

export interface AIAnalysisResult extends RawAIExtractedResult {
  status: "RESOLVED" | "AMBIGUOUS_LOCATION";
  options?: string[];
  candidates?: CandidateLocation[];
  department: string; // Matches assignedAuthority for backwards compatibility
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"; // Matches urgency for backwards compatibility
  
  // Stage 2 Jurisdiction Engine outputs
  extractedLocation: string;
  detectedState: string;
  detectedDistrict: string;
  detectedCity: string;
  detectedMunicipality: string;
  assignedAuthority: string;
  reasonForRouting: string;
  locationConfidence: number;
  routingConfidence: number;
  locationMapped: boolean;
  locationSuggestions?: string[];
  locationErrorMessage?: string;
}

export interface AnalyzeOptions {
  latitude?: number | null;
  longitude?: number | null;
  selectedLocation?: string | null;
}

// Fallback keyword-based extraction when AI keys are not present or fail
const performFallbackExtraction = (text: string): RawAIExtractedResult => {
  const t = text.toLowerCase();
  let category = "General Grievance";
  let subcategory = "General Issue";
  let urgency: "LOW" | "MEDIUM" | "HIGH" | "URGENT" = "MEDIUM";
  let summary = "Civic grievance received.";
  let missingInformation: string[] = [];
  let evidenceChecklist: Array<{ name: string; required: boolean; submitted: boolean }> = [
    { name: "Photograph of the issue", required: true, submitted: false }
  ];
  let locations: string[] = [];
  let landmarks: string[] = [];
  let location: string | null = null;
  let landmark: string | null = null;
  let city: string | null = null;
  let state: string | null = null;
  let district: string | null = null;
  let confidence = 0.75;
  let title = "Civic Grievance";

  if (text.length > 50) {
    title = text.slice(0, 47) + "...";
  } else {
    title = text;
  }

  // Known place checks
  if (t.includes("jagti")) {
    locations.push("Jagti");
    location = "Jagti";
  }
  if (t.includes("iit jammu")) {
    landmarks.push("IIT Jammu");
    landmark = "IIT Jammu";
  } else if (t.includes("phase 5")) {
    landmarks.push("Phase 5");
    landmark = "Phase 5";
  }

  if (t.includes("punjab") || t.includes("mohali") || t.includes("amritsar") || t.includes("ludhiana")) {
    state = "Punjab";
  } else if (t.includes("delhi") || t.includes("rohini") || t.includes("dwarka") || t.includes("saket")) {
    state = "Delhi";
  } else if (t.includes("jammu") || t.includes("srinagar") || t.includes("kashmir")) {
    state = "Jammu & Kashmir";
  }

  if (t.includes("mohali")) {
    city = "Mohali";
    district = "SAS Nagar";
  } else if (t.includes("jammu")) {
    city = "Jammu";
    district = "Jammu";
  } else if (t.includes("delhi")) {
    city = "Delhi";
  }

  if (!location) {
    const locationKeywords = ["near", "at", "in", "sector", "lane", "road", "colony", "nagar", "chowk", "phase"];
    for (const keyword of locationKeywords) {
      const idx = t.indexOf(keyword);
      if (idx !== -1) {
        const remaining = text.slice(idx);
        const words = remaining.split(" ");
        location = words.slice(0, 3).join(" ");
        locations.push(location);
        break;
      }
    }
  }

  // Keyword Extraction for Category
  if (t.includes("pothole") || t.includes("road") || t.includes("gadda") || t.includes("bridge") || t.includes("infrastructure")) {
    category = "Roads";
    subcategory = "Road Damage / Potholes";
    urgency = t.includes("accident") || t.includes("broken") ? "HIGH" : "MEDIUM";
    summary = "Complaint regarding road damage or potholes causing public inconvenience.";
    evidenceChecklist.push({ name: "Geo-tag/Coordinates", required: false, submitted: false });
    missingInformation.push("Specific landmark or street name");
    confidence = 0.88;
  } else if (t.includes("garbage") || t.includes("kachra") || t.includes("clean") || t.includes("sewer") || t.includes("drain") || t.includes("dog") || t.includes("kutta") || t.includes("waste")) {
    category = "Garbage";
    subcategory = "Waste Accumulation & Sanitation";
    urgency = t.includes("overflow") || t.includes("smell") ? "HIGH" : "MEDIUM";
    summary = "Complaint regarding garbage accumulation, sewer blockage, or sanitation issues.";
    missingInformation.push("House number / lane number");
    confidence = 0.92;
  } else if (t.includes("light") || t.includes("electricity") || t.includes("power") || t.includes("bijli") || t.includes("wire") || t.includes("transformer")) {
    category = "Electricity";
    subcategory = t.includes("light") ? "Streetlight Malfunction" : "Power Outage / Transformer";
    urgency = t.includes("spark") || t.includes("hanging wire") || t.includes("danger") ? "URGENT" : "HIGH";
    summary = "Grievance related to power cuts, faulty streetlights, or electrical hazards.";
    evidenceChecklist.push({ name: "Electricity Bill (if billing issue)", required: false, submitted: false });
    missingInformation.push("Pole number or electricity connection ID");
    confidence = 0.95;
  } else if (t.includes("water") || t.includes("paani") || t.includes("pani") || t.includes("leak") || t.includes("tap") || t.includes("dirty")) {
    category = "Water Supply";
    subcategory = "Water Supply & Sewage";
    urgency = t.includes("no water") || t.includes("dry") ? "HIGH" : "MEDIUM";
    summary = "Complaint concerning clean water supply, pipeline leakages, or contaminated water.";
    missingInformation.push("Zone / Sector name");
    confidence = 0.91;
  } else if (t.includes("traffic") || t.includes("parking") || t.includes("jam")) {
    category = "Traffic";
    subcategory = "Traffic Control & Parking";
    urgency = "MEDIUM";
    summary = "Grievance relating to severe traffic congestion or illegal parking blocking movement.";
    confidence = 0.85;
  }

  if (text.length > 20) {
    summary = `Citizen reported: ${text.slice(0, 100)}${text.length > 100 ? "..." : ""}`;
  }

  let translatedDescription: string | null = null;
  const hindiKeywords = ["hai", "ho", "gaya", "kuch", "pani", "sadak", "bijli", "gadda", "nahi", "aa", "rahi"];
  const hasHindiKeywords = hindiKeywords.some((kw) => t.includes(kw));
  if (hasHindiKeywords) {
    translatedDescription = text;
  }

  return {
    title,
    translatedDescription,
    category,
    subcategory,
    locations: locations.length > 0 ? locations : location ? [location] : [],
    landmarks: landmarks.length > 0 ? landmarks : landmark ? [landmark] : [],
    location,
    state,
    city,
    district,
    landmark,
    urgency,
    summary,
    missingInformation,
    evidenceChecklist,
    confidence,
    provider: "Fallback",
  };
};

async function extractWithOpenAI(text: string, apiKey: string): Promise<RawAIExtractedResult> {
  const openai = new OpenAI({ apiKey });
  const modelName = process.env.OPENAI_MODEL || "gpt-4o";

  const prompt = `You are "Sahi Vibhag AI Stage 1 Extractor", an AI information extraction engine for Indian civic grievances.
Your ONLY role is to extract structured information from the citizen's complaint.
CRITICAL: DO NOT DECIDE THE FINAL GOVERNMENT AUTHORITY OR DEPARTMENT (e.g. Do NOT output PSPCL, MCD, PWD, JPDCL, etc.).

Analyze this citizen complaint:
"${text}"

Return a JSON object with this exact schema:
{
  "title": "Concise English title summarizing the complaint",
  "translatedDescription": "If original is in Hindi/Hinglish/Urdu/Dogri etc, translate to formal Hindi. If already English, return null.",
  "category": "Broad complaint category, e.g. 'Electricity', 'Roads', 'Water Supply', 'Garbage', 'Streetlights', 'Traffic'",
  "subcategory": "2-3 word subcategory, e.g. 'Power Outage', 'Potholes', 'Pipeline Leakage', 'Waste Accumulation'",
  "locations": ["List of all detected place, village, locality, town, or area names mentioned in text, e.g. ['Jagti']"],
  "landmarks": ["List of all detected landmarks, institutions, or specific spots mentioned in text, e.g. ['IIT Jammu']"],
  "location": "Primary extracted location string or null",
  "state": "State mentioned in text if any, e.g. 'Punjab', 'Delhi', 'Jammu & Kashmir' (or null)",
  "city": "City/town mentioned in text if any, e.g. 'Mohali', 'Jammu', 'New Delhi' (or null)",
  "district": "District mentioned in text if any, e.g. 'SAS Nagar' (or null)",
  "landmark": "Primary landmark mentioned if any (or null)",
  "urgency": "Choose one: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'",
  "summary": "1-2 sentence formal government summary of the grievance in English",
  "missingInformation": ["Critical missing details, e.g. Pole ID, House No"],
  "evidenceChecklist": [{"name": "Photo of issue", "required": true, "submitted": false}],
  "confidence": 0.95
}`;

  const completion = await openai.chat.completions.create({
    model: modelName,
    messages: [
      { role: "system", content: "You extract structured information from civic complaints into JSON. Do not determine final government authorities." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
  });

  const responseText = completion.choices[0]?.message?.content || "";
  const json = JSON.parse(responseText.trim());

  const locs = Array.isArray(json.locations) ? json.locations : json.location ? [json.location] : [];
  const lms = Array.isArray(json.landmarks) ? json.landmarks : json.landmark ? [json.landmark] : [];

  return {
    title: json.title || "Civic Complaint",
    translatedDescription: json.translatedDescription || null,
    category: json.category || "General",
    subcategory: json.subcategory || json.category || "General Grievance",
    locations: locs,
    landmarks: lms,
    location: json.location || (locs[0] ?? null),
    state: json.state || null,
    city: json.city || null,
    district: json.district || null,
    landmark: json.landmark || (lms[0] ?? null),
    urgency: json.urgency || "MEDIUM",
    summary: json.summary || "",
    missingInformation: json.missingInformation || json.missing_information || [],
    evidenceChecklist: json.evidenceChecklist || json.evidence_checklist || [
      { name: "Photograph of the issue", required: true, submitted: false },
    ],
    confidence: json.confidence || 0.95,
    provider: "OpenAI",
  };
}

async function extractWithGemini(text: string, apiKey: string): Promise<RawAIExtractedResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";

  const prompt = `You are "Sahi Vibhag AI Stage 1 Extractor", an AI information extraction engine for Indian civic grievances.
Your ONLY role is to extract structured information from the citizen's complaint.
CRITICAL: DO NOT DECIDE THE FINAL GOVERNMENT AUTHORITY OR DEPARTMENT (e.g. Do NOT output PSPCL, MCD, PWD, JPDCL, etc.).

Analyze this citizen complaint:
"${text}"

Return a JSON object with this exact schema:
{
  "title": "Concise English title summarizing the complaint",
  "translatedDescription": "If original is in Hindi/Hinglish/Urdu/Dogri etc, translate to formal Hindi. If already English, return null.",
  "category": "Broad complaint category, e.g. 'Electricity', 'Roads', 'Water Supply', 'Garbage', 'Streetlights', 'Traffic'",
  "subcategory": "2-3 word subcategory, e.g. 'Power Outage', 'Potholes', 'Pipeline Leakage', 'Waste Accumulation'",
  "locations": ["List of all detected place, village, locality, town, or area names mentioned in text, e.g. ['Jagti']"],
  "landmarks": ["List of all detected landmarks, institutions, or specific spots mentioned in text, e.g. ['IIT Jammu']"],
  "location": "Primary extracted location string or null",
  "state": "State mentioned in text if any, e.g. 'Punjab', 'Delhi', 'Jammu & Kashmir' (or null)",
  "city": "City/town mentioned in text if any, e.g. 'Mohali', 'Jammu', 'New Delhi' (or null)",
  "district": "District mentioned in text if any, e.g. 'SAS Nagar' (or null)",
  "landmark": "Primary landmark mentioned if any (or null)",
  "urgency": "Choose one: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'",
  "summary": "1-2 sentence formal government summary of the grievance in English",
  "missingInformation": ["Critical missing details, e.g. Pole ID, House No"],
  "evidenceChecklist": [{"name": "Photo of issue", "required": true, "submitted": false}],
  "confidence": 0.95
}

Return ONLY valid JSON. No markdown code blocks.`;

  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  const json = JSON.parse(responseText.trim());

  const locs = Array.isArray(json.locations) ? json.locations : json.location ? [json.location] : [];
  const lms = Array.isArray(json.landmarks) ? json.landmarks : json.landmark ? [json.landmark] : [];

  return {
    title: json.title || "Civic Complaint",
    translatedDescription: json.translatedDescription || null,
    category: json.category || "General",
    subcategory: json.subcategory || json.category || "General Grievance",
    locations: locs,
    landmarks: lms,
    location: json.location || (locs[0] ?? null),
    state: json.state || null,
    city: json.city || null,
    district: json.district || null,
    landmark: json.landmark || (lms[0] ?? null),
    urgency: json.urgency || "MEDIUM",
    summary: json.summary || "",
    missingInformation: json.missingInformation || json.missing_information || [],
    evidenceChecklist: json.evidenceChecklist || json.evidence_checklist || [
      { name: "Photograph of the issue", required: true, submitted: false },
    ],
    confidence: json.confidence || 0.90,
    provider: "Gemini",
  };
}

export async function analyzeComplaint(
  text: string,
  options?: AnalyzeOptions
): Promise<AIAnalysisResult> {
  const openAiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  let extraction: RawAIExtractedResult;

  // 1. Stage 1 Extraction: OpenAI -> Gemini -> Fallback
  if (openAiKey && openAiKey !== "MOCK_KEY" && openAiKey.trim() !== "") {
    try {
      console.log("[Sahi Vibhag AI] Stage 1 AI Extraction using OpenAI...");
      extraction = await extractWithOpenAI(text, openAiKey);
    } catch (error) {
      console.warn("[Sahi Vibhag AI] OpenAI failed. Falling back to Gemini...", error);
      if (geminiKey && geminiKey !== "MOCK_KEY" && geminiKey.trim() !== "") {
        try {
          extraction = await extractWithGemini(text, geminiKey);
        } catch (gErr) {
          console.warn("[Sahi Vibhag AI] Gemini failed. Falling back to keyword extraction...", gErr);
          extraction = performFallbackExtraction(text);
        }
      } else {
        extraction = performFallbackExtraction(text);
      }
    }
  } else if (geminiKey && geminiKey !== "MOCK_KEY" && geminiKey.trim() !== "") {
    try {
      console.log("[Sahi Vibhag AI] Stage 1 AI Extraction using Gemini...");
      extraction = await extractWithGemini(text, geminiKey);
    } catch (gErr) {
      console.warn("[Sahi Vibhag AI] Gemini failed. Falling back to keyword extraction...", gErr);
      extraction = performFallbackExtraction(text);
    }
  } else {
    console.log("[Sahi Vibhag AI] No AI keys present. Using Fallback keyword extraction.");
    extraction = performFallbackExtraction(text);
  }

  // 2. Stage 2 Deterministic Location Resolver & Authority Engine
  console.log("[Sahi Vibhag AI] Stage 2 Deterministic Jurisdiction Engine running...");
  const routingResult: RoutingOutput = await resolveJurisdictionAndRoute({
    text: text,
    category: extraction.category,
    subcategory: extraction.subcategory,
    locations: extraction.locations,
    landmarks: extraction.landmarks,
    location: extraction.location,
    state: extraction.state,
    city: extraction.city,
    district: extraction.district,
    landmark: extraction.landmark,
    latitude: options?.latitude,
    longitude: options?.longitude,
    selectedLocation: options?.selectedLocation,
    aiConfidence: extraction.confidence,
  });

  return {
    ...extraction,
    status: routingResult.status,
    options: routingResult.options,
    candidates: routingResult.candidates,
    priority: extraction.urgency,
    department: routingResult.assignedAuthority, // For backwards compatibility
    
    // Stage 2 Routing Engine attributes
    extractedLocation: routingResult.extractedLocation,
    detectedState: routingResult.detectedState,
    detectedDistrict: routingResult.detectedDistrict,
    detectedCity: routingResult.detectedCity,
    detectedMunicipality: routingResult.detectedMunicipality,
    assignedAuthority: routingResult.assignedAuthority,
    reasonForRouting: routingResult.reasonForRouting,
    locationConfidence: routingResult.locationConfidence,
    routingConfidence: routingResult.routingConfidence,
    locationMapped: routingResult.locationMapped,
    locationSuggestions: routingResult.locationSuggestions,
    locationErrorMessage: routingResult.locationErrorMessage,
  };
}
