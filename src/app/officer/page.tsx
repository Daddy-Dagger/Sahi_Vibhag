"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Building,
  ArrowRight,
  Filter,
  FileCheck2,
  Building2,
  Cpu,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  Inbox,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

export default function OfficerDashboard() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  
  // Filtering states
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Officer action form states
  const [officerNotes, setOfficerNotes] = useState("");
  const [updateStatus, setUpdateStatus] = useState("");
  const [updateDept, setUpdateDept] = useState("");
  const [actionSaving, setActionSaving] = useState(false);

  // Fetch complaints
  const fetchComplaints = async (selectId?: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/complaints");
      const data = await res.json();
      setComplaints(data);
      
      // If a specific complaint needs to remain selected, find and refresh it
      if (selectId) {
        const updated = data.find((c: any) => c.id === selectId);
        if (updated) {
          setSelectedComplaint(updated);
          setOfficerNotes(updated.officerNotes || "");
          setUpdateStatus(updated.status);
          setUpdateDept(updated.department);
        }
      } else if (data.length > 0 && !selectedComplaint) {
        // Default select first item
        setSelectedComplaint(data[0]);
        setOfficerNotes(data[0].officerNotes || "");
        setUpdateStatus(data[0].status);
        setUpdateDept(data[0].department);
      }
    } catch (e) {
      console.error("Failed to load complaints", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleSelectComplaint = (c: any) => {
    setSelectedComplaint(c);
    setOfficerNotes(c.officerNotes || "");
    setUpdateStatus(c.status);
    setUpdateDept(c.department);
  };

  const handleSaveAction = async () => {
    if (!selectedComplaint) return;
    setActionSaving(true);

    try {
      const response = await fetch(`/api/complaints/${selectedComplaint.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: updateStatus,
          department: updateDept,
          officerNotes: officerNotes,
        }),
      });

      if (response.ok) {
        // Refresh complaints list and keep current item selected
        await fetchComplaints(selectedComplaint.id);
        alert("Action logs updated and archived successfully.");
      } else {
        const errorData = await response.json();
        alert("Failed to update grievance: " + errorData.error);
      }
    } catch (e) {
      console.error(e);
      alert("Network error.");
    } finally {
      setActionSaving(false);
    }
  };

  // Compute metrics
  const totalCount = complaints.length;
  const pendingCount = complaints.filter((c) => c.status === "PENDING").length;
  const inProgressCount = complaints.filter((c) => c.status === "IN_PROGRESS").length;
  const resolvedCount = complaints.filter((c) => c.status === "RESOLVED").length;
  const highPriorityCount = complaints.filter(
    (c) => c.priority === "URGENT" || c.priority === "HIGH"
  ).length;

  // Department distribution calculation
  const deptMap: { [key: string]: number } = {};
  complaints.forEach((c) => {
    deptMap[c.department] = (deptMap[c.department] || 0) + 1;
  });
  const deptStats = Object.keys(deptMap).map((dept) => ({
    name: dept,
    count: deptMap[dept],
    percentage: Math.round((deptMap[dept] / (totalCount || 1)) * 100),
  })).sort((a, b) => b.count - a.count);

  // Category distribution
  const catMap: { [key: string]: number } = {};
  complaints.forEach((c) => {
    catMap[c.category] = (catMap[c.category] || 0) + 1;
  });
  const catStats = Object.keys(catMap).map((cat) => ({
    name: cat,
    count: catMap[cat],
  })).slice(0, 4);

  // Filter complaints list
  const filteredComplaints = complaints.filter((c) => {
    const matchesDept = deptFilter === "ALL" || c.department === deptFilter;
    const matchesPriority = priorityFilter === "ALL" || c.priority === priorityFilter;
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.citizenName && c.citizenName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesDept && matchesPriority && matchesStatus && matchesSearch;
  });

  const departmentOptions = [
    "Public Works Department (PWD)",
    "Municipal Corporation",
    "Power Development Department (PDD)",
    "Water Supply Department (Jal Shakti)",
    "Traffic Police",
    "General Administration"
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 flex-grow flex flex-col justify-start relative z-10 w-full">
      
      {/* Background elements */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-primary-orange/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Building className="w-8 h-8 text-primary-blue" />
            Officer Dashboard
          </h1>
          <p className="text-sm text-muted">
            Department administrative portal. Review, re-route, and sign off on civic grievances.
          </p>
        </div>
        <button
          onClick={() => fetchComplaints(selectedComplaint?.id)}
          className="flex items-center gap-2 px-4 py-2 border border-border bg-card rounded-xl text-xs font-semibold hover:bg-muted-background transition shadow-premium"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Database
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Card 1: Total */}
        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-2xl border border-border bg-card p-5 shadow-premium flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] text-muted uppercase font-bold tracking-wider block mb-1">
              Total Complaints
            </span>
            <span className="text-3xl font-extrabold text-foreground">{totalCount}</span>
            <span className="text-[10px] text-muted block mt-1">Archived in registry</span>
          </div>
          <div className="w-12 h-12 bg-primary-blue/10 text-primary-blue rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </motion.div>

        {/* Card 2: High Priority */}
        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-2xl border border-border bg-card p-5 shadow-premium flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] text-muted uppercase font-bold tracking-wider block mb-1">
              High Priority
            </span>
            <span className="text-3xl font-extrabold text-red-500">{highPriorityCount}</span>
            <span className="text-[10px] text-muted block mt-1">Urgent response needed</span>
          </div>
          <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </motion.div>

        {/* Card 3: Pending Review */}
        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-2xl border border-border bg-card p-5 shadow-premium flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] text-muted uppercase font-bold tracking-wider block mb-1">
              Pending Review
            </span>
            <span className="text-3xl font-extrabold text-primary-orange">{pendingCount}</span>
            <span className="text-[10px] text-muted block mt-1">Awaiting department action</span>
          </div>
          <div className="w-12 h-12 bg-primary-orange/10 text-primary-orange rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </motion.div>

        {/* Card 4: Resolved */}
        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-2xl border border-border bg-card p-5 shadow-premium flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] text-muted uppercase font-bold tracking-wider block mb-1">
              Resolved Cases
            </span>
            <span className="text-3xl font-extrabold text-emerald-500">{resolvedCount}</span>
            <span className="text-[10px] text-muted block mt-1">
              {totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0}% Resolution Rate
            </span>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </motion.div>
      </div>

      {/* Main Grid: Queue on Left, Detail Panel on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-grow">
        
        {/* Left Side: Charts & Table Queue */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Charts panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Department stats */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-premium">
              <h3 className="text-xs font-extrabold uppercase text-foreground mb-4 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-primary-blue" />
                Department Routing Split
              </h3>
              {deptStats.length === 0 ? (
                <p className="text-xs text-muted text-center py-4">No data available.</p>
              ) : (
                <div className="space-y-3">
                  {deptStats.slice(0, 3).map((stat, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="truncate max-w-[200px] text-muted">{stat.name}</span>
                        <span className="text-foreground">{stat.count} ({stat.percentage}%)</span>
                      </div>
                      <div className="w-full bg-muted-background h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-primary-blue h-full rounded-full"
                          style={{ width: `${stat.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category stats */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-premium">
              <h3 className="text-xs font-extrabold uppercase text-foreground mb-4 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-primary-orange" />
                Common Grievance Categories
              </h3>
              {catStats.length === 0 ? (
                <p className="text-xs text-muted text-center py-4">No data available.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3.5">
                  {catStats.map((stat, idx) => (
                    <div key={idx} className="bg-muted-background/40 border border-border/80 p-2.5 rounded-xl text-center">
                      <span className="block text-lg font-extrabold text-primary-orange">{stat.count}</span>
                      <span className="text-[10px] text-muted font-bold block truncate">{stat.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Grievance Queue Table */}
          <div className="rounded-2xl border border-border bg-card shadow-premium overflow-hidden">
            {/* Filters Header */}
            <div className="p-4 bg-muted-background/40 border-b border-border flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Search by ID, name, keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-border bg-background rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-blue/30"
                />
                <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-2.5" />
              </div>

              {/* Filters grid */}
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                {/* Priority Filter */}
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-border bg-background rounded-lg text-[10px] font-semibold text-muted"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="URGENT">Urgent</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-border bg-background rounded-lg text-[10px] font-semibold text-muted"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            {/* Complaints list table */}
            <div className="overflow-x-auto min-h-[300px]">
              {filteredComplaints.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted">
                  <Inbox className="w-12 h-12 text-muted/40 mb-2" />
                  <span className="text-xs font-semibold">No complaints match filters</span>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted-background/10 text-[9px] uppercase tracking-wider text-muted font-bold">
                      <th className="p-3 pl-4">Grievance Info</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Priority</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 pr-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs">
                    {filteredComplaints.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => handleSelectComplaint(c)}
                        className={`hover:bg-muted-background/35 cursor-pointer transition-colors ${
                          selectedComplaint?.id === c.id ? "bg-primary-blue/5" : ""
                        }`}
                      >
                        <td className="p-3 pl-4">
                          <span className="font-mono text-[10px] text-primary-blue block font-bold">#{c.id.slice(0, 8)}</span>
                          <span className="font-extrabold text-foreground block truncate max-w-[200px]">{c.title}</span>
                          <span className="text-[10px] text-muted font-medium">{c.citizenName}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold block text-foreground truncate max-w-[150px]">{c.department}</span>
                          <span className="text-[10px] text-muted font-medium block">{c.category}</span>
                        </td>
                        <td className="p-3">
                          <span className={`font-extrabold text-[9px] uppercase px-1.5 py-0.5 rounded ${
                            c.priority === "URGENT" ? "bg-red-500/10 text-red-500" :
                            c.priority === "HIGH" ? "bg-orange-500/10 text-orange-500" :
                            c.priority === "MEDIUM" ? "bg-yellow-500/10 text-yellow-600" :
                            "bg-blue-500/10 text-blue-500"
                          }`}>
                            {c.priority}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`font-extrabold text-[9px] uppercase px-1.5 py-0.5 rounded-full inline-block ${
                            c.status === "PENDING" ? "bg-s-pending/10 text-s-pending" :
                            c.status === "IN_PROGRESS" ? "bg-s-inprogress/10 text-s-inprogress" :
                            c.status === "RESOLVED" ? "bg-s-resolved/10 text-s-resolved" :
                            "bg-s-rejected/10 text-s-rejected"
                          }`}>
                            {c.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="p-3 pr-4">
                          <Link
                            href={`/complaint/${c.id}`}
                            className="inline-flex items-center text-primary-orange hover:text-primary-orange/80 font-bold gap-0.5"
                          >
                            <span>Inspect</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: AI Officer Recommendation Panel */}
        <div className="lg:col-span-4">
          <AnimatePresence mode="wait">
            {!selectedComplaint ? (
              <div className="rounded-2xl border border-border bg-muted-background/25 border-dashed border-2 p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
                <Cpu className="w-12 h-12 text-muted/40 mb-3" />
                <h3 className="font-bold text-sm">Select Grievance</h3>
                <p className="text-xs text-muted max-w-xs mt-1">
                  Choose a complaint from the active queue to view Gemini's routing details and update execution steps.
                </p>
              </div>
            ) : (
              <motion.div
                key={selectedComplaint.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-border bg-card p-6 shadow-premium space-y-6"
              >
                {/* Panel Header */}
                <div className="pb-3 border-b border-border flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-muted block uppercase font-bold">Inspect Panel</span>
                    <span className="text-xs font-bold text-foreground">AI Routing Recommendation</span>
                  </div>
                  <span className="text-[10px] bg-primary-orange/10 text-primary-orange font-bold px-2 py-0.5 rounded-full">
                    Match Confidence: {Math.round(selectedComplaint.confidence * 100)}%
                  </span>
                </div>

                {/* Grievance Core Details */}
                <div>
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">Grievance Title</h4>
                  <p className="text-sm font-extrabold text-foreground leading-snug">{selectedComplaint.title}</p>
                  
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider block mt-4 mb-1">Citizen Statement</h4>
                  <p className="text-xs text-foreground bg-muted-background/40 p-3 rounded-xl border border-border italic leading-relaxed">
                    "{selectedComplaint.description}"
                  </p>
                </div>

                {/* Official Translation (If any) */}
                {selectedComplaint.translatedDescription && (
                  <div className="bg-primary-orange/5 p-3 rounded-xl border border-primary-orange/20">
                    <span className="text-[9px] text-primary-orange block uppercase font-bold mb-1">Official Hindi Translation</span>
                    <p className="text-xs text-foreground font-semibold italic">{selectedComplaint.translatedDescription}</p>
                  </div>
                )}

                {/* AI Extracted parameters */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-muted block uppercase font-bold">Department</span>
                    <span className="font-extrabold text-primary-blue leading-tight">{selectedComplaint.department}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block uppercase font-bold">Category</span>
                    <span className="font-extrabold text-foreground leading-tight">{selectedComplaint.category}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block uppercase font-bold">Priority</span>
                    <span className={`font-extrabold text-[9px] uppercase px-1.5 py-0.5 rounded inline-block ${
                      selectedComplaint.priority === "URGENT" ? "bg-red-500/10 text-red-500" :
                      selectedComplaint.priority === "HIGH" ? "bg-orange-500/10 text-orange-500" :
                      selectedComplaint.priority === "MEDIUM" ? "bg-yellow-500/10 text-yellow-600" :
                      "bg-blue-500/10 text-blue-500"
                    }`}>
                      {selectedComplaint.priority}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block uppercase font-bold">Location Extracted</span>
                    <span className="font-extrabold text-foreground block truncate">{selectedComplaint.location || "None"}</span>
                  </div>
                </div>

                {/* Checklist (Read-only on dashboard) */}
                {selectedComplaint.evidenceChecklist && selectedComplaint.evidenceChecklist.length > 0 && (
                  <div>
                    <span className="text-[10px] text-muted block uppercase font-bold mb-1.5">Verification Checklist</span>
                    <div className="space-y-1.5">
                      {selectedComplaint.evidenceChecklist.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-xs p-2 bg-muted-background/20 rounded-lg border border-border">
                          <span className="font-medium text-foreground">{item.name}</span>
                          <span className={`h-4 w-4 rounded-full flex items-center justify-center text-white border ${
                            item.submitted ? "bg-emerald-500 border-emerald-500" : "bg-background border-border"
                          }`}>
                            {item.submitted && <FileCheck2 className="w-2.5 h-2.5" />}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Officer Action form */}
                <div className="pt-4 border-t border-border space-y-4">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Execute Resolution Step</h4>

                  {/* Status Dropdown */}
                  <div>
                    <label className="text-[10px] text-muted uppercase font-bold block mb-1">Update Status</label>
                    <select
                      value={updateStatus}
                      onChange={(e) => setUpdateStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-border bg-background rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary-blue/30"
                    >
                      <option value="PENDING">Pending Review</option>
                      <option value="IN_PROGRESS">In Progress / Assigned</option>
                      <option value="RESOLVED">Resolved / Closed</option>
                      <option value="REJECTED">Rejected / Cancelled</option>
                    </select>
                  </div>

                  {/* Re-route Department */}
                  <div>
                    <label className="text-[10px] text-muted uppercase font-bold block mb-1">Re-Route Department</label>
                    <select
                      value={updateDept}
                      onChange={(e) => setUpdateDept(e.target.value)}
                      className="w-full px-3 py-2 border border-border bg-background rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary-blue/30"
                    >
                      {departmentOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Officer Notes */}
                  <div>
                    <label className="text-[10px] text-muted uppercase font-bold block mb-1">Officer Update Notes</label>
                    <textarea
                      value={officerNotes}
                      onChange={(e) => setOfficerNotes(e.target.value)}
                      placeholder="Add official resolution notes, site inspection logs, or department transfer explanations..."
                      className="w-full min-h-[90px] p-3 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary-blue/30"
                    />
                  </div>

                  {/* Save button */}
                  <button
                    disabled={actionSaving}
                    onClick={handleSaveAction}
                    className="w-full py-3 bg-gradient-to-r from-primary-blue to-primary-orange hover:brightness-105 text-white font-bold rounded-xl text-xs shadow-glow-blue flex items-center justify-center gap-1.5 transition-all duration-200"
                  >
                    {actionSaving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Saving Logs...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        Archive Action Update
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
