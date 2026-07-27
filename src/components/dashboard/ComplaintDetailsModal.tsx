"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  Languages,
  Sparkles,
  Building2,
  UserCheck,
  Compass,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  MapPin,
  ShieldCheck,
  Bot,
  Info,
  ChevronRight
} from "lucide-react";
import ComplaintMapViewer from "@/components/ComplaintMapViewer";

interface ComplaintDetailsModalProps {
  complaint: any | null;
  onClose: () => void;
}

export default function ComplaintDetailsModal({
  complaint,
  onClose,
}: ComplaintDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "evidence" | "location">("overview");

  if (!complaint) return null;

  const priorityColors: Record<string, string> = {
    URGENT: "bg-red-500/10 text-red-500 border-red-500/30",
    HIGH: "bg-orange-500/10 text-orange-500 border-orange-500/30",
    MEDIUM: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
    LOW: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  };

  const statusColors: Record<string, string> = {
    PENDING: "bg-orange-500/10 text-orange-500 border-orange-500/30",
    IN_PROGRESS: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    RESOLVED: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    REJECTED: "bg-slate-500/10 text-slate-500 border-slate-500/30",
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-background/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-4xl bg-card border border-border/80 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-border/60 bg-muted/20 flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-muted/60 text-muted uppercase">
                  ID: #{complaint.id}
                </span>
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${statusColors[complaint.status] || statusColors.PENDING}`}>
                  {complaint.status.replace("_", " ")}
                </span>
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${priorityColors[complaint.priority] || priorityColors.MEDIUM}`}>
                  Priority: {complaint.priority}
                </span>
                {complaint.aiConfidence && (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary-blue/10 text-primary-blue border border-primary-blue/20 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-primary-orange" />
                    {Math.round(complaint.aiConfidence * 100)}% AI Match
                  </span>
                )}
              </div>
              <h2 className="text-xl font-extrabold text-foreground leading-snug">
                {complaint.title}
              </h2>
              <p className="text-xs text-muted flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-primary-blue" />
                {complaint.department}
                <span className="text-border">•</span>
                <Clock className="w-3.5 h-3.5 text-muted" />
                Filed on {new Date(complaint.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-muted/50 hover:bg-muted text-muted hover:text-foreground transition shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-border/60 bg-muted/10 px-6 gap-2 text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-3 px-4 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === "overview"
                  ? "border-primary-blue text-primary-blue font-bold"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              <FileText className="w-4 h-4" />
              Overview & AI Routing
            </button>
            <button
              onClick={() => setActiveTab("timeline")}
              className={`py-3 px-4 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === "timeline"
                  ? "border-primary-blue text-primary-blue font-bold"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              <Clock className="w-4 h-4" />
              Timeline & Officer Notes
            </button>
            <button
              onClick={() => setActiveTab("evidence")}
              className={`py-3 px-4 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === "evidence"
                  ? "border-primary-blue text-primary-blue font-bold"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              <FileCheck className="w-4 h-4" />
              Evidence Checklist
            </button>
            <button
              onClick={() => setActiveTab("location")}
              className={`py-3 px-4 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === "location"
                  ? "border-primary-blue text-primary-blue font-bold"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              <MapPin className="w-4 h-4" />
              Location & Map
            </button>
          </div>

          {/* Tab Contents */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* AI Routing Analysis Banner */}
                <div className="bg-gradient-to-r from-primary-blue/10 via-primary-blue/5 to-transparent p-4 rounded-2xl border border-primary-blue/20 space-y-2">
                  <div className="flex items-center gap-2 text-primary-blue font-bold text-sm">
                    <Bot className="w-5 h-5 text-primary-orange animate-pulse" />
                    AI Resolution & Routing Explanation
                  </div>
                  <p className="text-muted leading-relaxed">
                    {complaint.routingReason || "Grievance auto-classified based on semantic analysis and deterministic department domain mapping."}
                  </p>
                  <div className="flex flex-wrap gap-4 pt-2 border-t border-border/40 text-[11px]">
                    <div>
                      <span className="text-muted font-medium">Assigned Authority: </span>
                      <span className="font-bold text-foreground">{complaint.assignedAuthority || complaint.department}</span>
                    </div>
                    <div>
                      <span className="text-muted font-medium">Category: </span>
                      <span className="font-bold text-foreground">{complaint.category}</span>
                    </div>
                  </div>
                </div>

                {/* Original & Translated Complaint */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-4 rounded-2xl border border-border/60 space-y-2">
                    <h4 className="font-bold text-foreground flex items-center gap-2 text-xs uppercase tracking-wider text-muted">
                      <FileText className="w-4 h-4 text-primary-blue" />
                      Original Complaint
                    </h4>
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {complaint.description}
                    </p>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-2xl border border-border/60 space-y-2">
                    <h4 className="font-bold text-foreground flex items-center gap-2 text-xs uppercase tracking-wider text-muted">
                      <Languages className="w-4 h-4 text-primary-orange" />
                      Translated Complaint (Hindi / Regional)
                    </h4>
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap italic">
                      {complaint.translatedDescription || "Translation unavailable (submitted in primary language)."}
                    </p>
                  </div>
                </div>

                {/* AI Summary */}
                <div className="bg-card p-4 rounded-2xl border border-border space-y-2 shadow-sm">
                  <h4 className="font-bold text-foreground flex items-center gap-2 text-xs uppercase tracking-wider text-muted">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    AI Summary
                  </h4>
                  <p className="text-muted leading-relaxed font-medium">
                    {complaint.summary}
                  </p>
                </div>
              </div>
            )}

            {/* TIMELINE TAB */}
            {activeTab === "timeline" && (
              <div className="space-y-6">
                {/* Officer Notes if available */}
                {complaint.officerNotes && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <UserCheck className="w-4 h-4" />
                      Officer Remarks & Progress Notes
                    </div>
                    <p className="text-xs text-foreground/90 font-medium leading-relaxed">
                      {complaint.officerNotes}
                    </p>
                  </div>
                )}

                {/* Vertical Timeline */}
                <div className="space-y-4">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted mb-4">
                    Audit Log & Resolution Timeline
                  </h4>

                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                    {Array.isArray(complaint.timeline) && complaint.timeline.length > 0 ? (
                      complaint.timeline.map((step: any, idx: number) => (
                        <div key={idx} className="relative flex items-start gap-4">
                          <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-primary-blue text-white flex items-center justify-center text-[10px] font-bold shadow-md">
                            ✓
                          </div>
                          <div className="bg-muted/30 p-3.5 rounded-2xl border border-border/60 flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-foreground text-xs">{step.status.replace("_", " ")}</span>
                              <span className="text-[10px] text-muted font-mono">
                                {new Date(step.timestamp).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                              </span>
                            </div>
                            <p className="text-muted text-xs">{step.note || "Stage updated."}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-muted">No timeline entries recorded yet.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* EVIDENCE TAB */}
            {activeTab === "evidence" && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted">
                    Submitted vs Required Verification Checklist
                  </h4>
                  {Array.isArray(complaint.evidenceChecklist) && complaint.evidenceChecklist.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {complaint.evidenceChecklist.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl border border-border bg-muted/20 flex items-center justify-between"
                        >
                          <div className="space-y-0.5">
                            <span className="font-semibold text-foreground text-xs block">{item.name}</span>
                            <span className="text-[10px] text-muted">
                              {item.required ? "Mandatory requirement" : "Optional supporting document"}
                            </span>
                          </div>
                          {item.submitted ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Submitted
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-bold border border-amber-500/20 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Pending Upload
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted p-4 bg-muted/20 rounded-xl">No evidence checklist specified.</div>
                  )}
                </div>

                {/* Missing Information Flags */}
                {Array.isArray(complaint.missingInformation) && complaint.missingInformation.length > 0 && (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-2">
                    <h4 className="font-bold text-red-500 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Missing Information Details
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-muted text-xs">
                      {complaint.missingInformation.map((info: string, i: number) => (
                        <li key={i}>{info}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* LOCATION TAB */}
            {activeTab === "location" && (
              <div className="space-y-6">
                <ComplaintMapViewer
                  latitude={complaint.latitude}
                  longitude={complaint.longitude}
                  accuracy={complaint.accuracy}
                  formattedAddress={complaint.formattedAddress}
                  landmark={complaint.landmark}
                  city={complaint.city}
                  state={complaint.state}
                  pincode={complaint.pincode}
                  locationFallback={complaint.location}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border/60 bg-muted/20 flex items-center justify-between">
            <span className="text-[11px] text-muted font-medium">
              Citizen Support Reference: #{complaint.id}
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold transition"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
