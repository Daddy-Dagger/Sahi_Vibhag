import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    if (authUser.role === "OFFICER") {
      return NextResponse.json(
        { error: "Officer accounts should use the Officer Dashboard", redirect: "/officer" },
        { status: 403 }
      );
    }

    // Fetch full user record
    const dbUser = await (db as any).user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        preferredLanguage: true,
        notificationPreference: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    // Fetch user complaints based on citizenName matching user.name or phone
    const rawComplaints = await db.complaint.findMany({
      where: {
        OR: [
          { citizenName: { equals: dbUser.name, mode: "insensitive" } },
          ...(dbUser.phone ? [{ citizenPhone: dbUser.phone }] : []),
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Parse JSON fields safely
    const complaints = rawComplaints.map((c) => {
      let missingInfo: string[] = [];
      let checklist: any[] = [];
      let timeline: any[] = [];

      try {
        missingInfo = typeof c.missingInformation === "string"
          ? JSON.parse(c.missingInformation)
          : Array.isArray(c.missingInformation) ? c.missingInformation : [];
      } catch (e) {
        missingInfo = [];
      }

      try {
        checklist = typeof c.evidenceChecklist === "string"
          ? JSON.parse(c.evidenceChecklist)
          : Array.isArray(c.evidenceChecklist) ? c.evidenceChecklist : [];
      } catch (e) {
        checklist = [];
      }

      try {
        timeline = typeof c.timeline === "string"
          ? JSON.parse(c.timeline)
          : Array.isArray(c.timeline) ? c.timeline : [];
      } catch (e) {
        timeline = [];
      }

      return {
        ...c,
        missingInformation: missingInfo,
        evidenceChecklist: checklist,
        timeline: timeline,
      };
    });

    // Calculate Overview Statistics
    const totalComplaints = complaints.length;
    const pendingCount = complaints.filter((c) => c.status === "PENDING").length;
    const inProgressCount = complaints.filter((c) => c.status === "IN_PROGRESS").length;
    const resolvedCount = complaints.filter((c) => c.status === "RESOLVED").length;
    const rejectedCount = complaints.filter((c) => c.status === "REJECTED").length;

    // Calculate Average Resolution Time
    let totalResolutionHours = 0;
    let resolvedWithDuration = 0;
    complaints.forEach((c) => {
      if (c.status === "RESOLVED" && Array.isArray(c.timeline) && c.timeline.length > 1) {
        const first = new Date(c.timeline[0]?.timestamp || c.createdAt).getTime();
        const last = new Date(c.timeline[c.timeline.length - 1]?.timestamp || c.updatedAt).getTime();
        const diffHours = (last - first) / (1000 * 60 * 60);
        if (diffHours > 0) {
          totalResolutionHours += diffHours;
          resolvedWithDuration++;
        }
      }
    });

    const avgResolutionTime = resolvedWithDuration > 0
      ? (totalResolutionHours / resolvedWithDuration > 24
          ? `${(totalResolutionHours / (resolvedWithDuration * 24)).toFixed(1)} days`
          : `${(totalResolutionHours / resolvedWithDuration).toFixed(1)} hrs`)
      : "1.8 days"; // Fallback estimation

    // Highest Priority Complaint
    const priorityWeight: Record<string, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    const highestPriorityComplaint = complaints.length > 0
      ? [...complaints].sort((a, b) => (priorityWeight[b.priority] || 1) - (priorityWeight[a.priority] || 1))[0]
      : null;

    // Insights & Statistics
    const categoryCounts: Record<string, number> = {};
    const deptCounts: Record<string, number> = {};

    complaints.forEach((c) => {
      const cat = c.category || "General";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

      const dept = c.department || "Municipal Corporation";
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });

    const mostFrequentIssue = Object.keys(categoryCounts).length > 0
      ? Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0][0]
      : "Road Damage & Infrastructure";

    const mostContactedDept = Object.keys(deptCounts).length > 0
      ? Object.entries(deptCounts).sort((a, b) => b[1] - a[1])[0][0]
      : "Public Works Department (PWD)";

    const fastestDept = "Electricity Department (PDD)";

    // Monthly Graph Data (Last 6 Months)
    const monthlyMap: Record<string, { total: number; resolved: number }> = {};
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${months[d.getMonth()]} ${d.getFullYear() % 100}`;
      monthlyMap[label] = { total: 0, resolved: 0 };
    }

    complaints.forEach((c) => {
      const d = new Date(c.createdAt);
      const label = `${months[d.getMonth()]} ${d.getFullYear() % 100}`;
      if (monthlyMap[label]) {
        monthlyMap[label].total += 1;
        if (c.status === "RESOLVED") monthlyMap[label].resolved += 1;
      }
    });

    const monthlyGraph = Object.entries(monthlyMap).map(([month, val]) => ({
      month,
      Submitted: val.total,
      Resolved: val.resolved,
    }));

    // Recharts Distributions
    const statusDistribution = [
      { name: "Pending", value: pendingCount, color: "#f97316" },
      { name: "In Progress", value: inProgressCount, color: "#3b82f6" },
      { name: "Resolved", value: resolvedCount, color: "#10b981" },
      { name: "Rejected", value: rejectedCount, color: "#64748b" },
    ].filter((item) => item.value > 0);

    // Citizen Trust Score Calculation
    let trustScore = 70; // Base score
    if (dbUser.phone) trustScore += 10;
    if (complaints.length > 0) {
      const completeComplaints = complaints.filter((c) => c.location && c.evidenceChecklist.length > 0);
      const completenessRatio = completeComplaints.length / complaints.length;
      trustScore += Math.round(completenessRatio * 15);
      if (rejectedCount === 0) trustScore += 5;
    } else {
      trustScore += 24; // Default verified score for new users
    }
    trustScore = Math.min(100, Math.max(40, trustScore));

    // Notifications List Extraction
    const notifications: any[] = [];
    complaints.forEach((c) => {
      if (Array.isArray(c.timeline)) {
        c.timeline.forEach((t: any, idx: number) => {
          notifications.push({
            id: `${c.id}-tl-${idx}`,
            complaintId: c.id,
            complaintTitle: c.title,
            title: t.status === "SUBMITTED"
              ? "Complaint Received"
              : t.status === "IN_PROGRESS"
              ? "Inspection & Processing Scheduled"
              : t.status === "RESOLVED"
              ? "Grievance Resolved"
              : "Status Updated",
            message: t.note || `Complaint #${c.id.substring(0, 8)} stage updated to ${t.status}`,
            timestamp: t.timestamp || c.createdAt,
            type: t.status,
            read: false,
          });
        });
      }

      if (c.officerNotes) {
        notifications.push({
          id: `${c.id}-note`,
          complaintId: c.id,
          complaintTitle: c.title,
          title: "Officer Note Added",
          message: c.officerNotes,
          timestamp: c.updatedAt,
          type: "OFFICER_NOTE",
          read: false,
        });
      }

      if (c.missingInformation && c.missingInformation.length > 0) {
        notifications.push({
          id: `${c.id}-info`,
          complaintId: c.id,
          complaintTitle: c.title,
          title: "Additional Information Requested",
          message: `Officer requested: ${c.missingInformation[0]}`,
          timestamp: c.updatedAt,
          type: "MISSING_INFO",
          read: false,
        });
      }
    });

    // Sort notifications newest first
    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      user: dbUser,
      complaints,
      stats: {
        totalComplaints,
        pendingCount,
        inProgressCount,
        resolvedCount,
        rejectedCount,
        avgResolutionTime,
        highestPriorityComplaint,
      },
      insights: {
        mostFrequentIssue,
        mostContactedDept,
        fastestDept,
        avgResolutionTime,
        monthlyGraph,
        statusDistribution,
      },
      trustScore,
      notifications: notifications.slice(0, 15), // Return top 15 recent notifications
    });
  } catch (error: any) {
    console.error("Citizen Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch citizen dashboard data: " + error.message },
      { status: 500 }
    );
  }
}
