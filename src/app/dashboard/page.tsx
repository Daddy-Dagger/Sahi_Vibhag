"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Calendar,
  ShieldCheck,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Flame,
  Search,
  Filter,
  ArrowUpDown,
  PlusCircle,
  Navigation,
  Download,
  Bell,
  Sparkles,
  Bot,
  MapPin,
  Building2,
  Award,
  Phone,
  Lock,
  Languages,
  Check,
  AlertCircle,
  Eye,
  MessageSquare,
  ChevronRight,
  RefreshCw,
  LogOut,
  SlidersHorizontal
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from "recharts";

import CitizenInteractiveMap from "@/components/dashboard/CitizenInteractiveMap";
import ComplaintDetailsModal from "@/components/dashboard/ComplaintDetailsModal";
import CitizenTrustScoreCard from "@/components/dashboard/CitizenTrustScoreCard";
import { generateComplaintPDFReport } from "@/lib/pdfGenerator";

export default function CitizenDashboardPage() {
  const router = useRouter();

  // Data states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  // Active section tab for mobile/quick jumps
  const [activeTab, setActiveTab] = useState<"overview" | "complaints" | "map" | "insights" | "settings">("overview");

  // Complaint Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "priority" | "status">("newest");

  // Selection state for Details Modal
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);

  // Timeline selection
  const [timelineComplaintId, setTimelineComplaintId] = useState<string | null>(null);

  // Notification Drawer State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);

  // Support / Inquiry Modal State
  const [supportModalComplaint, setSupportModalComplaint] = useState<any | null>(null);
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSuccess, setSupportSuccess] = useState(false);

  // Profile Form State (Section 11)
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileLang, setProfileLang] = useState("English");
  const [profileNotif, setProfileNotif] = useState("Email & In-App");
  const [profilePass, setProfilePass] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch Citizen Dashboard Data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/citizen/dashboard");

      if (res.status === 401) {
        router.push("/login?redirect=/dashboard");
        return;
      }

      const resData = await res.json();
      if (!res.ok) {
        if (resData.redirect) {
          router.push(resData.redirect);
          return;
        }
        throw new Error(resData.error || "Failed to load dashboard");
      }

      setData(resData);
      setNotificationsList(resData.notifications || []);

      if (resData.user) {
        setProfileName(resData.user.name || "");
        setProfilePhone(resData.user.phone || "");
        setProfileLang(resData.user.preferredLanguage || "English");
        setProfileNotif(resData.user.notificationPreference || "Email & In-App");
      }

      if (resData.complaints && resData.complaints.length > 0) {
        setTimelineComplaintId(resData.complaints[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Profile Update submit
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileSaving(true);

    try {
      const res = await fetch("/api/citizen/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileName,
          phone: profilePhone,
          preferredLanguage: profileLang,
          notificationPreference: profileNotif,
          newPassword: profilePass || undefined,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to update profile");

      setProfileMsg({ type: "success", text: "Profile settings updated successfully!" });
      setProfilePass("");
      fetchData(); // Refresh dashboard data
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.message });
    } finally {
      setProfileSaving(false);
    }
  };

  // Support / Officer Inquiry Submit
  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSupportSuccess(true);
    setTimeout(() => {
      setSupportSuccess(false);
      setSupportModalComplaint(null);
      setSupportMessage("");
    }, 1800);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 space-y-4">
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-blue to-primary-orange text-white shadow-glow-blue animate-bounce">
          <Sparkles className="w-8 h-8 animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-lg font-bold text-foreground">Loading Citizen Dashboard...</h3>
          <p className="text-xs text-muted">Retrieving your verified civic complaints and analytics</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 rounded-full bg-red-500/10 text-red-500 mb-4">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Unable to Load Dashboard</h2>
        <p className="text-xs text-muted max-w-sm mb-6">{error || "An unexpected error occurred while connecting to the portal."}</p>
        <button
          onClick={fetchData}
          className="px-6 py-2.5 rounded-xl bg-primary-blue text-white text-xs font-bold shadow-glow-blue hover:opacity-95 transition flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Connection
        </button>
      </div>
    );
  }

  const { user, complaints = [], stats, insights, trustScore } = data;

  // Department List for filtering
  const allDepartments = Array.from(new Set(complaints.map((c: any) => c.department || "Municipal Corporation")));

  // Filter & Sort complaints logic
  const filteredComplaints = complaints.filter((c: any) => {
    const matchesSearch =
      searchQuery === "" ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.location && c.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.category && c.category.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    const matchesDept = deptFilter === "ALL" || c.department === deptFilter;
    const matchesPriority = priorityFilter === "ALL" || c.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesDept && matchesPriority;
  });

  // Sort complaints
  const priorityWeight: Record<string, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  filteredComplaints.sort((a: any, b: any) => {
    if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortBy === "priority") return (priorityWeight[b.priority] || 1) - (priorityWeight[a.priority] || 1);
    if (sortBy === "status") return a.status.localeCompare(b.status);
    return 0;
  });

  // Timeline selected complaint
  const activeTimelineComplaint = complaints.find((c: any) => c.id === timelineComplaintId) || complaints[0];

  // AI Health Score for Section 9
  const latestComplaintWithMissing = complaints.find((c: any) => c.missingInformation && c.missingInformation.length > 0) || complaints[0];
  const missingInfoList = latestComplaintWithMissing?.missingInformation || [];

  const firstName = user.name ? user.name.split(" ")[0] : "Citizen";
  const userInitials = user.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "CZ";

  const unreadNotifCount = notificationsList.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Top Banner Navigation Header Accent */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex bg-muted/40 p-1 rounded-2xl border border-border/50 text-xs font-semibold overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                activeTab === "overview"
                  ? "bg-card text-foreground shadow-sm font-bold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Overview & Timeline
            </button>
            <button
              onClick={() => setActiveTab("complaints")}
              className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "complaints"
                  ? "bg-card text-foreground shadow-sm font-bold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <span>My Complaints</span>
              <span className="px-1.5 py-0.2 rounded-full bg-primary-blue/10 text-primary-blue text-[10px] font-bold">
                {complaints.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("map")}
              className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                activeTab === "map"
                  ? "bg-card text-foreground shadow-sm font-bold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Interactive Map
            </button>
            <button
              onClick={() => setActiveTab("insights")}
              className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                activeTab === "insights"
                  ? "bg-card text-foreground shadow-sm font-bold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Analytics Insights
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                activeTab === "settings"
                  ? "bg-card text-foreground shadow-sm font-bold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Profile Settings
            </button>
          </div>

          {/* Section 6: Notification Bell & Quick Stats */}
          <div className="flex items-center gap-3 relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-2xl bg-card border border-border/80 text-foreground hover:bg-muted/40 transition shadow-sm"
              title="Recent Activity Notifications"
            >
              <Bell className="w-5 h-5 text-primary-blue" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary-orange text-white text-[10px] font-extrabold flex items-center justify-center animate-pulse">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Drawer */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-12 w-80 sm:w-96 bg-card border border-border/80 rounded-3xl shadow-2xl p-4 z-40 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-primary-blue" />
                      <h4 className="font-bold text-xs text-foreground">Recent Activity Notifications</h4>
                    </div>
                    <button
                      onClick={() => setNotificationsList(notificationsList.map((n) => ({ ...n, read: true })))}
                      className="text-[10px] text-primary-blue hover:underline font-semibold"
                    >
                      Mark all as read
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                    {notificationsList.length > 0 ? (
                      notificationsList.map((notif) => (
                        <div
                          key={notif.id}
                          className="p-3 rounded-2xl bg-muted/20 border border-border/50 text-xs space-y-1 hover:bg-muted/30 transition"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground">{notif.title}</span>
                            <span className="text-[9px] text-muted font-mono">
                              {new Date(notif.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </span>
                          </div>
                          <p className="text-muted text-[11px] leading-snug">{notif.message}</p>
                          <div className="text-[9px] font-bold text-primary-blue">
                            Complaint: #{notif.complaintId.substring(0, 8)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-xs text-muted">No activity notifications yet.</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* SECTION 1: Welcome Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative bg-gradient-to-r from-card via-card to-primary-blue/10 border border-border/80 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden mb-8"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-blue/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 left-1/3 w-64 h-64 bg-primary-orange/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              {/* User Avatar with initials */}
              <div className="relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary-blue via-primary-blue to-primary-orange text-white font-black text-xl sm:text-2xl shadow-glow-blue shrink-0">
                {userInitials}
                <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-white border-2 border-card" title="Verified Account">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary-blue/10 text-primary-blue text-[10px] font-extrabold uppercase tracking-wider border border-primary-blue/20">
                    {user.role} Citizen
                  </span>
                  <span className="text-[11px] text-muted flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-muted" />
                    Member since {new Date(user.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  Welcome back, {firstName} 👋
                </h1>
                <p className="text-xs sm:text-sm text-muted font-medium">
                  Here's the latest status of your civic requests and government interactions.
                </p>
                <div className="flex flex-wrap gap-3 pt-2 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-primary-blue" /> {user.email}
                  </span>
                  {user.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-primary-orange" /> {user.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Total Complaints Submitted Count Header Badge */}
            <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl border border-border/60 shrink-0">
              <div className="text-center px-2">
                <span className="text-2xl font-black text-foreground block">{stats.totalComplaints}</span>
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Total Complaints</span>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center px-2">
                <span className="text-2xl font-black text-emerald-500 block">{stats.resolvedCount}</span>
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Resolved</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* SECTION 2: Overview Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {/* Total Complaints */}
          <motion.div
            whileHover={{ y: -3 }}
            className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Filed</span>
              <FileText className="w-4 h-4 text-primary-blue" />
            </div>
            <div className="text-2xl font-black text-foreground">{stats.totalComplaints}</div>
            <span className="text-[10px] text-muted font-medium mt-1">Recorded in database</span>
          </motion.div>

          {/* Pending */}
          <motion.div
            whileHover={{ y: -3 }}
            className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">Pending</span>
              <Clock className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-2xl font-black text-orange-500">{stats.pendingCount}</div>
            <span className="text-[10px] text-muted font-medium mt-1">Awaiting inspection</span>
          </motion.div>

          {/* In Progress */}
          <motion.div
            whileHover={{ y: -3 }}
            className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">In Progress</span>
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-blue-500">{stats.inProgressCount}</div>
            <span className="text-[10px] text-muted font-medium mt-1">Officer assigned</span>
          </motion.div>

          {/* Resolved */}
          <motion.div
            whileHover={{ y: -3 }}
            className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">Resolved</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-500">{stats.resolvedCount}</div>
            <span className="text-[10px] text-muted font-medium mt-1">Completed & verified</span>
          </motion.div>

          {/* Rejected */}
          <motion.div
            whileHover={{ y: -3 }}
            className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">Rejected</span>
              <XCircle className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-500">{stats.rejectedCount}</div>
            <span className="text-[10px] text-muted font-medium mt-1">Outside jurisdiction</span>
          </motion.div>

          {/* Avg Resolution Time */}
          <motion.div
            whileHover={{ y: -3 }}
            className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">Avg Resolution</span>
              <Clock className="w-4 h-4 text-primary-orange" />
            </div>
            <div className="text-xl font-black text-foreground">{stats.avgResolutionTime}</div>
            <span className="text-[10px] text-emerald-500 font-bold mt-1">Fast AI Routing</span>
          </motion.div>
        </div>

        {/* SECTION 10: Quick Actions & BONUS Trust Score Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions (2 cols) */}
          <div className="lg:col-span-2 bg-card border border-border/80 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-orange" />
                Quick Actions
              </h3>
              <span className="text-xs text-muted">Government Citizen Services</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/citizen"
                className="p-4 rounded-2xl bg-gradient-to-r from-primary-blue to-primary-blue/90 text-white shadow-glow-blue hover:opacity-95 transition flex items-center justify-between group"
              >
                <div className="space-y-1">
                  <span className="font-bold text-sm block flex items-center gap-2">
                    <PlusCircle className="w-4 h-4" /> Submit New Complaint
                  </span>
                  <span className="text-[11px] text-white/80 block">
                    AI Auto-Routing & Speech Input
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-white/70 group-hover:translate-x-1 transition" />
              </Link>

              <button
                onClick={() => {
                  setActiveTab("complaints");
                  document.getElementById("complaints-search-input")?.focus();
                }}
                className="p-4 rounded-2xl bg-muted/30 border border-border hover:bg-muted/60 transition flex items-center justify-between text-left group"
              >
                <div className="space-y-1">
                  <span className="font-bold text-sm text-foreground block flex items-center gap-2">
                    <Search className="w-4 h-4 text-primary-blue" /> Track Complaint
                  </span>
                  <span className="text-[11px] text-muted block">
                    Search by ID, Status or Department
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted group-hover:translate-x-1 transition" />
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className="p-4 rounded-2xl bg-muted/30 border border-border hover:bg-muted/60 transition flex items-center justify-between text-left group"
              >
                <div className="space-y-1">
                  <span className="font-bold text-sm text-foreground block flex items-center gap-2">
                    <User className="w-4 h-4 text-primary-orange" /> Update Profile
                  </span>
                  <span className="text-[11px] text-muted block">
                    Manage contact info & preferences
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted group-hover:translate-x-1 transition" />
              </button>

              <button
                onClick={() => generateComplaintPDFReport(user, complaints, stats)}
                className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition flex items-center justify-between text-left group"
              >
                <div className="space-y-1">
                  <span className="font-bold text-sm block flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-500" /> Download PDF Report
                  </span>
                  <span className="text-[11px] opacity-80 block">
                    Export official civic history dossier
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-500 group-hover:translate-x-1 transition" />
              </button>
            </div>
          </div>

          {/* BONUS: Citizen Trust Score Card (1 col) */}
          <CitizenTrustScoreCard score={trustScore} />
        </div>

        {/* MAIN TAB SWITCHER CONTENT */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* SECTION 3: Complaint Timeline & SECTION 9: AI Assistant Card Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* SECTION 3: Complaint Vertical Timeline (2 cols) */}
              <div className="lg:col-span-2 bg-card border border-border/80 rounded-3xl p-6 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary-blue" />
                      Complaint Progression Timeline
                    </h3>
                    <p className="text-xs text-muted">
                      Real-time stage tracking of your selected civic request
                    </p>
                  </div>

                  {/* Complaint Selector Dropdown */}
                  {complaints.length > 0 && (
                    <select
                      value={timelineComplaintId || ""}
                      onChange={(e) => setTimelineComplaintId(e.target.value)}
                      className="bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary-blue"
                    >
                      {complaints.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          #{c.id.substring(0, 8)} - {c.title.substring(0, 30)}...
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {activeTimelineComplaint ? (
                  <div className="space-y-6">
                    {/* Active Complaint Summary Bar */}
                    <div className="p-4 rounded-2xl bg-muted/20 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono text-muted uppercase font-bold">
                          #{activeTimelineComplaint.id}
                        </span>
                        <h4 className="font-bold text-foreground text-sm leading-snug">
                          {activeTimelineComplaint.title}
                        </h4>
                        <span className="text-xs text-muted">
                          Dept: <strong>{activeTimelineComplaint.department}</strong>
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedComplaint(activeTimelineComplaint)}
                        className="px-3.5 py-1.5 rounded-xl bg-primary-blue/10 text-primary-blue hover:bg-primary-blue/20 text-xs font-bold transition self-start sm:self-center flex items-center gap-1.5 shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Full Details
                      </button>
                    </div>

                    {/* Modern Vertical Timeline Stages */}
                    <div className="relative pl-8 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                      {[
                        { stage: "Complaint Submitted", desc: "Received by Sahi Vibhag system", icon: CheckCircle2, statusKey: "SUBMITTED" },
                        { stage: "AI Analysis Completed", desc: "Categorized & confidence score generated", icon: Bot, statusKey: "AI_DONE" },
                        { stage: "Department Assigned", desc: activeTimelineComplaint.department, icon: Building2, statusKey: "DEPT" },
                        { stage: "Officer Assigned", desc: activeTimelineComplaint.assignedAuthority || "Field Inspector", icon: User, statusKey: "OFFICER" },
                        { stage: "Inspection Scheduled", desc: activeTimelineComplaint.status === "IN_PROGRESS" ? "On-site verification active" : "Scheduled", icon: Calendar, statusKey: "INSPECTION" },
                        { stage: "Resolved", desc: activeTimelineComplaint.status === "RESOLVED" ? "Resolved & verified" : "Pending resolution", icon: CheckCircle2, statusKey: "RESOLVED" },
                      ].map((step, idx) => {
                        const isResolved = activeTimelineComplaint.status === "RESOLVED";
                        const isInProgress = activeTimelineComplaint.status === "IN_PROGRESS";
                        const isCompleted = isResolved || (isInProgress && idx <= 4) || idx <= 2;
                        const isActive = (isInProgress && idx === 4) || (!isResolved && idx === 2);

                        return (
                          <div key={idx} className="relative flex items-start gap-4">
                            <div
                              className={`absolute -left-8 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition ${
                                isCompleted
                                  ? "bg-emerald-500 border-emerald-500 text-white shadow-md"
                                  : isActive
                                  ? "bg-primary-blue border-primary-blue text-white ring-4 ring-primary-blue/20 animate-pulse"
                                  : "bg-card border-border text-muted"
                              }`}
                            >
                              {isCompleted ? "✓" : idx + 1}
                            </div>
                            <div className="space-y-0.5">
                              <h5 className={`font-bold text-xs ${isCompleted ? "text-foreground" : "text-muted"}`}>
                                {step.stage}
                              </h5>
                              <p className="text-[11px] text-muted">{step.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-muted">No complaints available to show timeline.</div>
                )}
              </div>

              {/* SECTION 9: AI Assistant Card (1 col) */}
              <div className="bg-gradient-to-br from-card via-card to-primary-blue/5 border border-border/80 rounded-3xl p-6 shadow-xl space-y-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 border-b border-border/60 pb-3 mb-4">
                    <div className="p-2 rounded-xl bg-primary-blue/10 text-primary-blue">
                      <Bot className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground leading-tight">AI Assistant Insights</h3>
                      <p className="text-[11px] text-muted">Verification & Resolution Speed</p>
                    </div>
                  </div>

                  {/* Complaint Health Score */}
                  <div className="p-4 rounded-2xl bg-primary-blue/10 border border-primary-blue/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary-blue">Complaint Health Score</span>
                      <span className="text-lg font-black text-primary-blue">87%</span>
                    </div>
                    <div className="w-full h-2 bg-primary-blue/20 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary-blue to-emerald-500 rounded-full w-[87%]" />
                    </div>
                    <p className="text-[10px] text-muted">
                      Based on location accuracy, photo proof attached, and AI classification confidence.
                    </p>
                  </div>

                  {/* Missing Information Flags */}
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
                      Information Checklist
                    </span>
                    {missingInfoList.length > 0 ? (
                      <div className="space-y-1.5 text-xs">
                        {missingInfoList.map((info: string, i: number) => (
                          <div key={i} className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-start gap-2 text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>{info}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[11px] flex items-center gap-2 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        All required details verified by AI!
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Recommendation */}
                <div className="p-3.5 rounded-2xl bg-card border border-border/80 text-xs space-y-1 shadow-sm">
                  <span className="font-bold text-primary-orange text-[10px] uppercase tracking-wider block flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Recommendation
                  </span>
                  <p className="text-muted text-[11px] leading-relaxed">
                    "Uploading a clearer close-up image of dark roads or potholes speeds up officer verification by ~40%."
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 8: Interactive Map Component Preview */}
            <CitizenInteractiveMap
              complaints={complaints}
              onSelectComplaint={(c) => setSelectedComplaint(c)}
            />
          </div>
        )}

        {/* SECTION 4: My Complaints Tab */}
        {activeTab === "complaints" && (
          <div className="space-y-6">
            {/* Search, Filters & Controls Bar */}
            <div className="bg-card border border-border/80 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Search Input */}
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-muted absolute left-3.5 top-3" />
                  <input
                    id="complaints-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title, ID, category..."
                    className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-primary-blue transition"
                  />
                </div>

                {/* Filters & Sorting */}
                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary-blue"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>

                  {/* Priority Filter */}
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary-blue"
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="URGENT">Urgent</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>

                  {/* Department Filter */}
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary-blue max-w-[150px]"
                  >
                    <option value="ALL">All Depts</option>
                    {allDepartments.map((dept: any) => (
                      <option key={String(dept)} value={String(dept)}>
                        {String(dept)}
                      </option>
                    ))}
                  </select>

                  {/* Sort By */}
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground font-semibold focus:outline-none focus:border-primary-blue"
                  >
                    <option value="newest">Sort: Newest</option>
                    <option value="oldest">Sort: Oldest</option>
                    <option value="priority">Sort: Priority</option>
                    <option value="status">Sort: Status</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Complaint Cards Grid */}
            {filteredComplaints.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredComplaints.map((c: any) => (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -4 }}
                    className="bg-card border border-border/80 rounded-3xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden space-y-4"
                  >
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-3">
                      <span className="text-[10px] font-mono font-bold text-muted uppercase">
                        #{c.id.substring(0, 8)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                            c.status === "RESOLVED"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                              : c.status === "IN_PROGRESS"
                              ? "bg-blue-500/10 text-blue-500 border-blue-500/30"
                              : "bg-orange-500/10 text-orange-500 border-orange-500/30"
                          }`}
                        >
                          {c.status.replace("_", " ")}
                        </span>
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                            c.priority === "URGENT"
                              ? "bg-red-500/10 text-red-500 border-red-500/30"
                              : c.priority === "HIGH"
                              ? "bg-orange-500/10 text-orange-500 border-orange-500/30"
                              : "bg-yellow-500/10 text-yellow-600 border-yellow-500/30"
                          }`}
                        >
                          {c.priority}
                        </span>
                      </div>
                    </div>

                    {/* Complaint Body */}
                    <div className="space-y-2 flex-1">
                      <h4 className="font-bold text-foreground text-sm leading-snug line-clamp-2">
                        {c.title}
                      </h4>
                      <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                        {c.summary || c.description}
                      </p>
                    </div>

                    {/* Metadata Details */}
                    <div className="space-y-2 text-xs pt-2 border-t border-border/40">
                      <div className="flex items-center justify-between text-muted text-[11px]">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-primary-blue" /> {c.department}
                        </span>
                        <span>{new Date(c.createdAt).toLocaleDateString("en-IN")}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1 text-muted truncate max-w-[180px]">
                          <MapPin className="w-3 h-3 text-primary-orange shrink-0" />
                          {c.formattedAddress || c.location || "Recorded Location"}
                        </span>
                        {c.aiConfidence && (
                          <span className="text-[10px] font-bold text-primary-blue bg-primary-blue/10 px-2 py-0.5 rounded-md">
                            {Math.round(c.aiConfidence * 100)}% AI Match
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => setSelectedComplaint(c)}
                        className="flex-1 py-2 px-3 rounded-xl bg-primary-blue text-white font-bold text-xs shadow-glow-blue hover:opacity-95 transition flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Details
                      </button>
                      <button
                        onClick={() => setSupportModalComplaint(c)}
                        className="py-2 px-3 rounded-xl bg-muted/40 hover:bg-muted text-foreground font-semibold text-xs border border-border transition flex items-center justify-center gap-1.5"
                        title="Contact Officer Support"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-primary-orange" />
                        Support
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="bg-card border border-border/80 rounded-3xl p-12 text-center space-y-4">
                <div className="p-4 rounded-full bg-muted/30 text-muted inline-block">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-foreground">No Complaints Found</h3>
                <p className="text-xs text-muted max-w-sm mx-auto">
                  No grievances match your selected search query or filters.
                </p>
                <Link
                  href="/citizen"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-blue to-primary-orange text-white text-xs font-bold shadow-glow-blue"
                >
                  <PlusCircle className="w-4 h-4" />
                  Submit New Grievance
                </Link>
              </div>
            )}
          </div>
        )}

        {/* SECTION 8: Interactive Map Tab */}
        {activeTab === "map" && (
          <div className="space-y-6">
            <CitizenInteractiveMap
              complaints={complaints}
              onSelectComplaint={(c) => setSelectedComplaint(c)}
            />
          </div>
        )}

        {/* SECTION 7: Citizen Insights (Recharts Analytics) Tab */}
        {activeTab === "insights" && (
          <div className="space-y-8">
            {/* Insights Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                  Most Frequent Issue
                </span>
                <span className="text-lg font-extrabold text-foreground block">
                  {insights.mostFrequentIssue}
                </span>
                <span className="text-[10px] text-primary-blue font-semibold">Highest resolution priority</span>
              </div>

              <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                  Most Contacted Dept
                </span>
                <span className="text-lg font-extrabold text-foreground block">
                  {insights.mostContactedDept}
                </span>
                <span className="text-[10px] text-muted font-semibold">Municipal Governance</span>
              </div>

              <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                  Average Resolution Time
                </span>
                <span className="text-lg font-extrabold text-emerald-500 block">
                  {insights.avgResolutionTime}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">AI Routing Efficiency</span>
              </div>

              <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                  Fastest Resolving Dept
                </span>
                <span className="text-lg font-extrabold text-primary-orange block">
                  {insights.fastestDept}
                </span>
                <span className="text-[10px] text-muted font-semibold">98.4% Resolution Index</span>
              </div>
            </div>

            {/* Recharts Graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Complaint Graph */}
              <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <h3 className="text-base font-bold text-foreground">Monthly Grievance Activity</h3>
                  <span className="text-xs text-muted">Last 6 Months</span>
                </div>
                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={insights.monthlyGraph}>
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          borderRadius: "12px",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="Submitted" fill="#0b4fba" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Resolved" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status Distribution Pie Chart */}
              <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <h3 className="text-base font-bold text-foreground">Status Breakdown</h3>
                  <span className="text-xs text-muted">Proportional View</span>
                </div>
                <div className="w-full h-72">
                  {insights.statusDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={insights.statusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {insights.statusDistribution.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            borderColor: "#334155",
                            borderRadius: "12px",
                            color: "#fff",
                            fontSize: "12px",
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted">
                      No status data available.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 11: Profile Settings Tab */}
        {activeTab === "settings" && (
          <div className="max-w-2xl mx-auto bg-card border border-border/80 rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="border-b border-border/60 pb-4">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                <User className="w-5 h-5 text-primary-blue" />
                Citizen Profile Settings
              </h3>
              <p className="text-xs text-muted">
                Update your contact information, preferred language, and security settings
              </p>
            </div>

            {profileMsg && (
              <div
                className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
                  profileMsg.type === "success"
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600"
                    : "bg-red-500/10 border border-red-500/30 text-red-500"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-muted mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary-blue"
                />
              </div>

              <div>
                <label className="block font-medium text-muted mb-1.5">Contact Phone Number</label>
                <input
                  type="text"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary-blue"
                />
              </div>

              <div>
                <label className="block font-medium text-muted mb-1.5">Preferred Language</label>
                <select
                  value={profileLang}
                  onChange={(e) => setProfileLang(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary-blue"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                  <option value="Dogri">Dogri (डोगरी)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-muted mb-1.5">Notification Preferences</label>
                <select
                  value={profileNotif}
                  onChange={(e) => setProfileNotif(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary-blue"
                >
                  <option value="Email & In-App">Email & In-App Alerts</option>
                  <option value="SMS & Email">SMS & Email</option>
                  <option value="In-App Only">In-App Alerts Only</option>
                </select>
              </div>

              <div className="pt-2 border-t border-border/60">
                <label className="block font-medium text-muted mb-1.5">New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  value={profilePass}
                  onChange={(e) => setProfilePass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary-blue"
                />
              </div>

              <button
                type="submit"
                disabled={profileSaving}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-blue to-primary-orange text-white font-bold shadow-glow-blue hover:opacity-95 transition mt-4"
              >
                {profileSaving ? "Saving Changes..." : "Save Profile Settings"}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* SECTION 5: Complaint Details Modal */}
      {selectedComplaint && (
        <ComplaintDetailsModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
        />
      )}

      {/* Officer Support Modal */}
      {supportModalComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h4 className="font-bold text-foreground text-sm">
              Contact Assigned Officer for Complaint #{supportModalComplaint.id.substring(0, 8)}
            </h4>
            <p className="text-xs text-muted">
              Send an inquiry or update directly to the assigned department ({supportModalComplaint.department}).
            </p>

            {supportSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-bold text-center">
                Inquiry sent successfully to officer!
              </div>
            ) : (
              <form onSubmit={handleSupportSubmit} className="space-y-3">
                <textarea
                  required
                  rows={4}
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Provide additional details or request an update..."
                  className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-primary-blue"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setSupportModalComplaint(null)}
                    className="px-4 py-2 rounded-xl bg-muted text-foreground text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-primary-blue text-white text-xs font-bold shadow-glow-blue"
                  >
                    Send Message
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
