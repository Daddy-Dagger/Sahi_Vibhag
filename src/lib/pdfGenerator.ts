export function generateComplaintPDFReport(user: any, complaints: any[], stats: any) {
  if (typeof window === "undefined") return;

  const printWindow = window.open("", "_blank", "width=900,height=1000");
  if (!printWindow) {
    alert("Please allow popups to download your Complaint History PDF.");
    return;
  }

  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const complaintRows = complaints
    .map(
      (c, index) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px; font-weight: bold; color: #0f172a; font-family: monospace;">#${c.id.substring(0, 8)}</td>
        <td style="padding: 10px; color: #0f172a; font-weight: 600;">${c.title}</td>
        <td style="padding: 10px; color: #475569;">${c.department}</td>
        <td style="padding: 10px; text-align: center;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; background: ${
            c.status === "RESOLVED"
              ? "#dcfce7; color: #15803d;"
              : c.status === "IN_PROGRESS"
              ? "#dbeafe; color: #1e40af;"
              : "#ffedd5; color: #c2410c;"
          }">
            ${c.status.replace("_", " ")}
          </span>
        </td>
        <td style="padding: 10px; text-align: center; color: #475569;">${c.priority}</td>
        <td style="padding: 10px; text-align: right; color: #64748b; font-size: 11px;">
          ${new Date(c.createdAt).toLocaleDateString("en-IN")}
        </td>
      </tr>
    `
    )
    .join("");

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Sahi Vibhag AI - Official Citizen Grievance Dossier</title>
        <style>
          @body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; background: #ffffff; padding: 30px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0b4fba; padding-bottom: 15px; margin-bottom: 20px; }
          .brand { font-size: 22px; font-weight: 800; color: #0b4fba; }
          .sub { font-size: 12px; color: #64748b; margin-top: 2px; }
          .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; font-size: 12px; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 25px; }
          .stat-card { background: #f1f5f9; padding: 12px; border-radius: 8px; text-align: center; font-size: 11px; }
          .stat-num { font-size: 20px; font-weight: bold; color: #0b4fba; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
          th { background: #0b4fba; color: #ffffff; padding: 10px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; }
          .footer { margin-top: 40px; padding-top: 15px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 10px; color: #94a3b8; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div className="no-print" style="margin-bottom: 15px; text-align: right;">
          <button onclick="window.print()" style="background: #0b4fba; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer;">
            Print / Save as PDF
          </button>
        </div>

        <div class="header">
          <div>
            <div class="brand">🇮🇳 Sahi Vibhag AI</div>
            <div class="sub">Unified Citizen Governance & Grievance Redressal Portal</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; font-weight: bold; color: #475569;">OFFICIAL CIVIC DOSSIER</div>
            <div style="font-size: 11px; color: #64748b;">Generated: ${dateStr}</div>
          </div>
        </div>

        <div class="meta-box">
          <div>
            <strong>Citizen Name:</strong> ${user.name}<br/>
            <strong>Email:</strong> ${user.email}<br/>
            <strong>Contact Phone:</strong> ${user.phone || "Verified Citizen"}
          </div>
          <div style="text-align: right;">
            <strong>Account Role:</strong> ${user.role}<br/>
            <strong>Preferred Language:</strong> ${user.preferredLanguage || "English"}<br/>
            <strong>Verification Status:</strong> Government Verified
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div>Total Filed</div>
            <div class="stat-num">${stats.totalComplaints || complaints.length}</div>
          </div>
          <div class="stat-card">
            <div>Pending</div>
            <div class="stat-num" style="color: #ea580c;">${stats.pendingCount || 0}</div>
          </div>
          <div class="stat-card">
            <div>In Progress</div>
            <div class="stat-num" style="color: #2563eb;">${stats.inProgressCount || 0}</div>
          </div>
          <div class="stat-card">
            <div>Resolved</div>
            <div class="stat-num" style="color: #16a34a;">${stats.resolvedCount || 0}</div>
          </div>
        </div>

        <h3 style="font-size: 14px; color: #0f172a; margin-bottom: 8px; font-weight: 800;">Detailed Grievance History Record</h3>
        
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Grievance Title</th>
              <th>Department</th>
              <th style="text-align: center;">Status</th>
              <th style="text-align: center;">Priority</th>
              <th style="text-align: right;">Filing Date</th>
            </tr>
          </thead>
          <tbody>
            ${complaintRows}
          </tbody>
        </table>

        <div class="footer">
          This is an official computer-generated document issued by Sahi Vibhag AI Grievance Governance Engine.<br/>
          IIT Jammu AI Hackathon Edition • Encrypted & Authenticated
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 500);
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
