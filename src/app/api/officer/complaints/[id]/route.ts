import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUserFromRequest } from "@/lib/auth";

// Helper to parse JSON fields
const parseComplaintFields = (complaint: any) => {
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
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Controller-level authorization check
    const user = await getAuthUserFromRequest(req);
    if (!user || user.role !== "OFFICER") {
      return NextResponse.json(
        { error: "Forbidden: Officer privilege required for application processing and status mutation." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await db.complaint.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    const currentTimeline = parseComplaintFields(existing).timeline;
    const dataToUpdate: any = {};
    const timelineUpdates: any[] = [...currentTimeline];

    // Status Change
    if (body.status && body.status !== existing.status) {
      dataToUpdate.status = body.status;
      timelineUpdates.push({
        status: body.status,
        timestamp: new Date().toISOString(),
        note: body.officerNotes 
          ? `Status updated to ${body.status} by Officer ${user.name}. Notes: ${body.officerNotes}` 
          : `Status changed to ${body.status} by Officer ${user.name}.`,
      });
    }

    // Department Change
    if (body.department && body.department !== existing.department) {
      dataToUpdate.department = body.department;
      timelineUpdates.push({
        status: existing.status,
        timestamp: new Date().toISOString(),
        note: `Re-routed from ${existing.department} to ${body.department} by Officer ${user.name}.`,
      });
    }

    // Priority Change
    if (body.priority && body.priority !== existing.priority) {
      dataToUpdate.priority = body.priority;
    }

    // Officer Notes Update
    if (body.officerNotes !== undefined) {
      dataToUpdate.officerNotes = body.officerNotes;
      if (!body.status || body.status === existing.status) {
        timelineUpdates.push({
          status: existing.status,
          timestamp: new Date().toISOString(),
          note: `Officer ${user.name} added notes: ${body.officerNotes}`,
        });
      }
    }

    // Evidence checklist updates
    if (body.evidenceChecklist) {
      dataToUpdate.evidenceChecklist = JSON.stringify(body.evidenceChecklist);
    }

    if (timelineUpdates.length > currentTimeline.length) {
      dataToUpdate.timeline = JSON.stringify(timelineUpdates);
    }

    const updatedComplaint = await db.complaint.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(parseComplaintFields(updatedComplaint));
  } catch (error: any) {
    console.error("Officer Complaint Patch Error:", error);
    return NextResponse.json(
      { error: "Failed to update complaint: " + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUserFromRequest(req);
    if (!user || user.role !== "OFFICER") {
      return NextResponse.json(
        { error: "Forbidden: Officer privilege required to delete grievances." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await db.complaint.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    await db.complaint.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Complaint deleted successfully by Officer" });
  } catch (error: any) {
    console.error("Officer Complaint Delete Error:", error);
    return NextResponse.json(
      { error: "Failed to delete complaint: " + error.message },
      { status: 500 }
    );
  }
}
