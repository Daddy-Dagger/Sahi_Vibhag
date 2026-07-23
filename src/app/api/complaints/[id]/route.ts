import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const complaint = await db.complaint.findUnique({
      where: { id },
    });

    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    return NextResponse.json(parseComplaintFields(complaint));
  } catch (error: any) {
    console.error("Fetch Single Complaint Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch complaint: " + error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Fetch existing complaint to update the timeline
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
        note: body.officerNotes ? `Status changed to ${body.status}. Officer noted: ${body.officerNotes}` : `Status changed to ${body.status} by assigned officer.`,
      });
    }

    // Department Change
    if (body.department && body.department !== existing.department) {
      dataToUpdate.department = body.department;
      timelineUpdates.push({
        status: existing.status,
        timestamp: new Date().toISOString(),
        note: `Re-routed from ${existing.department} to ${body.department}.`,
      });
    }

    // Priority Change
    if (body.priority && body.priority !== existing.priority) {
      dataToUpdate.priority = body.priority;
    }

    // Officer Notes Update
    if (body.officerNotes !== undefined) {
      dataToUpdate.officerNotes = body.officerNotes;
      // Only add timeline entry if status didn't change (as it is already covered above)
      if (!body.status || body.status === existing.status) {
        timelineUpdates.push({
          status: existing.status,
          timestamp: new Date().toISOString(),
          note: `Officer notes updated: ${body.officerNotes}`,
        });
      }
    }

    // Evidence checklist submission updates
    if (body.evidenceChecklist) {
      dataToUpdate.evidenceChecklist = JSON.stringify(body.evidenceChecklist);
    }

    // Include updated timeline
    if (timelineUpdates.length > currentTimeline.length) {
      dataToUpdate.timeline = JSON.stringify(timelineUpdates);
    }

    const updatedComplaint = await db.complaint.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(parseComplaintFields(updatedComplaint));
  } catch (error: any) {
    console.error("Update Complaint Error:", error);
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

    return NextResponse.json({ message: "Complaint deleted successfully" });
  } catch (error: any) {
    console.error("Delete Complaint Error:", error);
    return NextResponse.json(
      { error: "Failed to delete complaint: " + error.message },
      { status: 500 }
    );
  }
}
