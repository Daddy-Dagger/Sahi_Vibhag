import { GoogleGenerativeAI } from "@google/generative-ai";
// import { OpenAI } from "openai";

interface AIAnalysisResult {
  title: string;
  translatedDescription: string | null;
  department: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  category: string;
  summary: string;
  missingInformation: string[];
  evidenceChecklist: Array<{ name: string; required: boolean; submitted: boolean }>;
  location: string | null;
  confidence: number;
}

// Fallback keyword-based analysis when Gemini key is not present
const performFallbackAnalysis = (text: string): AIAnalysisResult => {
  const t = text.toLowerCase();
  let department = "General Administration";
  let category = "General Grievance";
  let priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" = "MEDIUM";
  let summary = "Civic grievance received.";
  let missingInformation: string[] = [];
  let evidenceChecklist: Array<{ name: string; required: boolean; submitted: boolean }> = [
    { name: "Photograph of the issue", required: true, submitted: false }
  ];
  let location: string | null = null;
  let confidence = 0.75;
  let title = "Civic Grievance";

  // Title extraction
  if (text.length > 50) {
    title = text.slice(0, 47) + "...";
  } else {
    title = text;
  }

  // Basic Location extraction (looking for common keywords)
  const locationKeywords = ["near", "at", "in", "sector", "lane", "road", "colony", "nagar", "chowk"];
  for (const keyword of locationKeywords) {
    const idx = t.indexOf(keyword);
    if (idx !== -1) {
      const remaining = text.slice(idx);
      const words = remaining.split(" ");
      location = words.slice(0, 5).join(" "); // extract next few words
      break;
    }
  }

  // Keyword Matching
  if (t.includes("pothole") || t.includes("road") || t.includes("gadda") || t.includes("bridge") || t.includes("infrastructure")) {
    department = "Public Works Department (PWD)";
    category = "Roads & Infrastructure";
    priority = t.includes("accident") || t.includes("broken") ? "HIGH" : "MEDIUM";
    summary = "Complaint regarding road damage or potholes causing public inconvenience.";
    evidenceChecklist.push({ name: "Geo-tag/Coordinates", required: false, submitted: false });
    missingInformation.push("Specific landmark or street name");
    confidence = 0.88;
  } else if (t.includes("garbage") || t.includes("kachra") || t.includes("clean") || t.includes("sewer") || t.includes("drain") || t.includes("dog") || t.includes("kutta") || t.includes("waste")) {
    department = "Municipal Corporation";
    category = "Waste Management & Sanitation";
    priority = t.includes("overflow") || t.includes("smell") ? "HIGH" : "MEDIUM";
    summary = "Complaint regarding garbage accumulation, sewer blockage, or sanitation issues.";
    missingInformation.push("House number / lane number");
    confidence = 0.92;
  } else if (t.includes("light") || t.includes("electricity") || t.includes("power") || t.includes("bijli") || t.includes("wire") || t.includes("transformer")) {
    department = "Power Development Department (PDD)";
    category = "Electricity & Street Lighting";
    priority = t.includes("spark") || t.includes("hanging wire") || t.includes("danger") ? "URGENT" : "HIGH";
    summary = "Grievance related to power cuts, faulty streetlights, or electrical hazards.";
    evidenceChecklist.push({ name: "Electricity Bill (if billing issue)", required: false, submitted: false });
    missingInformation.push("Pole number or electricity connection ID");
    confidence = 0.95;
  } else if (t.includes("water") || t.includes("paani") || t.includes("leak") || t.includes("tap") || t.includes("dirty")) {
    department = "Water Supply Department (Jal Shakti)";
    category = "Water & Sewage";
    priority = t.includes("no water") || t.includes("dry") ? "HIGH" : "MEDIUM";
    summary = "Complaint concerning clean water supply, pipeline leakages, or contaminated water.";
    missingInformation.push("Zone / Sector name");
    confidence = 0.91;
  } else if (t.includes("traffic") || t.includes("parking") || t.includes("jam")) {
    department = "Traffic Police";
    category = "Traffic Control";
    priority = "MEDIUM";
    summary = "Grievance relating to severe traffic congestion or illegal parking blocking movement.";
    confidence = 0.85;
  }

  // Custom summary based on length
  if (text.length > 20) {
    summary = `Citizen reported: ${text.slice(0, 100)}${text.length > 100 ? "..." : ""}`;
  }

  // Detect simple regional languages to mock translation
  let translatedDescription: string | null = null;
  const hindiKeywords = ["hai", "ho", "gaya", "kuch", "pani", "sadak", "bijli", "gadda"];
  const hasHindiKeywords = hindiKeywords.some(keyword => t.includes(keyword));
  if (hasHindiKeywords) {
    translatedDescription = text; // Just mock the original text as Hindi
  }

  return {
    title,
    translatedDescription,
    department,
    priority,
    category,
    summary,
    missingInformation,
    evidenceChecklist,
    location,
    confidence
  };
};

export async function analyzeComplaint(text: string): Promise<AIAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === "MOCK_KEY" || apiKey.trim() === "") {
    console.log("[Sahi Vibhag AI] No GEMINI_API_KEY found. Using fallback keyword analysis.");
    return performFallbackAnalysis(text);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const prompt = `You are "Sahi Vibhag AI", a production-grade AI-powered multilingual civic grievance assistant for the Government of India, developed for the IIT Jammu AI Hackathon.
Your goal is to parse a citizen's complaint (which might be in Hindi, English, Hinglish, Urdu, Dogri, or other regional languages), translate regional complaints to Hindi for government records, extract key structured information, determine the correct department, assign an appropriate priority, summarize it in a professional government-ready format, and detect missing information.

Analyze this citizen complaint:
"${text}"

Return a structured JSON object strictly matching this TypeScript type:
{
  "title": string; // A concise, clear title in English summarizing the issue
  "translatedDescription": string | null; // If the original text is in Hindi/Hinglish/Urdu/Dogri etc, translate it to clear formal Hindi. If the original text is in English, this should be null.
  "department": string; // Must be one of: "Public Works Department (PWD)", "Municipal Corporation", "Power Development Department (PDD)", "Water Supply Department (Jal Shakti)", "Traffic Police", "General Administration"
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT"; // Choose priority. Safety/hazards/broken electric wires are URGENT. Public blockages are HIGH. Standard issues are MEDIUM. General feedback is LOW.
  "category": string; // A 2-3 word category like "Sewerage Overflows", "Road Potholes", "Streetlight Malfunction", "Drinking Water Supply"
  "summary": string; // A concise, formal, government-ready summary (1-2 sentences) of the grievance in English.
  "missingInformation": string[]; // Critical details not mentioned in the complaint that are needed to fix it (e.g. ["Specific house number", "Pole identification number", "Landmark"])
  "evidenceChecklist": Array<{ name: string, required: boolean, submitted: boolean }>; // Suggest 1-2 evidence files that could be uploaded, e.g. [{ name: "Photo of pothole", required: true, submitted: false }]
  "location": string | null; // Extracted landmark, street, sector, or city mentioned in the text. Null if none found.
  "confidence": number; // Float between 0.0 and 1.0 indicating AI routing confidence
}

Do not include any markdown backticks or explanation. Return ONLY the JSON object.`;

    const modelName = "gemini-2.0-flash";

    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
        }
      });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const jsonResult = JSON.parse(responseText.trim());

      return {
        title: jsonResult.title || "Civic Complaint",
        translatedDescription: jsonResult.translatedDescription || null,
        department: jsonResult.department || "General Administration",
        priority: jsonResult.priority || "MEDIUM",
        category: jsonResult.category || "General",
        summary: jsonResult.summary || "",
        missingInformation: jsonResult.missingInformation || jsonResult.missing_information || [],
        evidenceChecklist: jsonResult.evidenceChecklist || jsonResult.evidence_checklist || [
          { name: "Photograph of the issue", required: true, submitted: false }
        ],
        location: jsonResult.location || null,
        confidence: jsonResult.confidence || 0.90
      };
    } catch (error) {
      console.warn(`[Sahi Vibhag AI] Gemini model ${modelName} failed, using fallback.`, error);
      throw error;
    }
  } catch (error) {
    console.error("[Sahi Vibhag AI] Error calling Gemini API:", error);
    return performFallbackAnalysis(text);
  }
}
