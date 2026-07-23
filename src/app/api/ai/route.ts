import { NextRequest, NextResponse } from "next/server";
import { analyzeComplaint } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string" || text.trim() === "") {
      return NextResponse.json(
        { error: "Complaint text is required" },
        { status: 400 }
      );
    }

    const analysis = await analyzeComplaint(text);
    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error("AI Analysis Endpoint Error:", error);
    return NextResponse.json(
      { error: "Failed to analyze complaint: " + error.message },
      { status: 500 }
    );
  }
}
