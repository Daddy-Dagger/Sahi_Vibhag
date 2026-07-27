import { NextRequest, NextResponse } from "next/server";
import { analyzeComplaint } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, latitude, longitude, selectedLocation } = body;

    if (!text || typeof text !== "string" || text.trim() === "") {
      return NextResponse.json(
        { error: "Complaint text is required" },
        { status: 400 }
      );
    }

    const analysis = await analyzeComplaint(text, {
      latitude: latitude !== undefined && latitude !== null ? Number(latitude) : undefined,
      longitude: longitude !== undefined && longitude !== null ? Number(longitude) : undefined,
      selectedLocation: typeof selectedLocation === "string" ? selectedLocation : undefined,
    });

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error("AI Analysis Endpoint Error:", error);
    return NextResponse.json(
      { error: "Failed to analyze complaint: " + error.message },
      { status: 500 }
    );
  }
}
