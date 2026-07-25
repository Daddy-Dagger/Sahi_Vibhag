import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req);

    if (!user || user.role !== "OFFICER") {
      return NextResponse.json(
        { error: "Forbidden: Access restricted to authorized Officer accounts only." },
        { status: 403 }
      );
    }

    const complaints = await db.complaint.findMany({
      orderBy: { createdAt: "desc" },
    });

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

    return NextResponse.json({
      officer: {
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
      },
      complaints: parsedComplaints,
    });
  } catch (error: any) {
    console.error("Officer Complaints Fetch Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch officer complaints: " + error.message },
      { status: 500 }
    );
  }
}
