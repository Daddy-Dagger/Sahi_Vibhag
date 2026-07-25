import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const complaints = await db.complaint.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    // Parse stringified JSON fields for safety (mainly for mockDb compatibility)
    const parsedComplaints = complaints.map((complaint) => {
      let missingInfo = [];
      let checklist = [];
      let timeline = [];

      try {
        missingInfo = typeof complaint.missingInformation === "string" 
          ? JSON.parse(complaint.missingInformation) 
          : complaint.missingInformation;
      } catch (e) {
        missingInfo = Array.isArray(complaint.missingInformation) ? complaint.missingInformation : [];
      }

      try {
        checklist = typeof complaint.evidenceChecklist === "string" 
          ? JSON.parse(complaint.evidenceChecklist) 
          : complaint.evidenceChecklist;
      } catch (e) {
        checklist = Array.isArray(complaint.evidenceChecklist) ? complaint.evidenceChecklist : [];
      }

      try {
        timeline = typeof complaint.timeline === "string" 
          ? JSON.parse(complaint.timeline) 
          : complaint.timeline;
      } catch (e) {
        timeline = Array.isArray(complaint.timeline) ? complaint.timeline : [];
      }

      return {
        ...complaint,
        missingInformation: missingInfo,
        evidenceChecklist: checklist,
        timeline: timeline,
      };
    });

    return NextResponse.json(parsedComplaints);
  } catch (error: any) {
    console.error("Fetch Complaints Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch complaints: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      title,
      description,
      translatedDescription,
      department,
      status = "PENDING",
      priority = "MEDIUM",
      category,
      summary,
      missingInformation = [],
      evidenceChecklist = [],
      citizenName,
      citizenPhone,
      location,
      latitude,
      longitude,
      accuracy,
      formattedAddress,
      landmark,
      city,
      state,
      pincode,
      confidence = 1.0,
      audioUrl = null,
    } = body;

    // Validation
    if (!title || !description || !department || !category || !summary) {
      return NextResponse.json(
        { error: "Missing required fields (title, description, department, category, summary)" },
        { status: 400 }
      );
    }

    // Prepare initial timeline event
    const initialTimeline = [
      {
        status: "SUBMITTED",
        timestamp: new Date().toISOString(),
        note: "Grievance received and auto-routed by Sahi Vibhag AI.",
      },
    ];

    const complaint = await db.complaint.create({
      data: {
        title,
        description,
        translatedDescription: translatedDescription || null,
        department,
        status,
        priority,
        category,
        summary,
        missingInformation: JSON.stringify(missingInformation),
        evidenceChecklist: JSON.stringify(evidenceChecklist),
        citizenName: citizenName || null,
        citizenPhone: citizenPhone || null,
        location: location || formattedAddress || null,
        latitude: latitude !== undefined && latitude !== null ? Number(latitude) : null,
        longitude: longitude !== undefined && longitude !== null ? Number(longitude) : null,
        accuracy: accuracy !== undefined && accuracy !== null ? Number(accuracy) : null,
        formattedAddress: formattedAddress || location || null,
        landmark: landmark || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        confidence,
        audioUrl,
        officerNotes: null,
        timeline: JSON.stringify(initialTimeline),
      },
    });

    return NextResponse.json(complaint, { status: 201 });
  } catch (error: any) {
    console.error("Create Complaint Error:", error);
    return NextResponse.json(
      { error: "Failed to create complaint: " + error.message },
      { status: 500 }
    );
  }
}
