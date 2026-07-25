"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Button from "@/components/Button";
import ComplaintMapViewer from "@/components/ComplaintMapViewer";
import {
  ArrowLeft,
  Building,
  MapPin,
  Clock,
  BadgeAlert,
  FileCheck2,
  Cpu,
  CheckCircle2,
  Languages,
  Calendar,
  User,
  Phone,
  FileText,
  Navigation,
  CheckCircle
} from "lucide-react";
import Link from "next/link";

interface ComplaintDetailsProps {
  params: Promise<{ id: string }>;
}

export default function ComplaintDetails({ params }: ComplaintDetailsProps) {
  const router = useRouter();
  const { id } = use(params); // Next.js 15 pattern to unwrap params
  
  const [complaint, setComplaint] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingChecklist, setSavingChecklist] = useState(false);

  const fetchComplaint = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/complaints/${id}`);
      if (!response.ok) {
        throw new Error("Complaint not found");
      }
      const data = await response.json();
      setComplaint(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const handleToggleChecklistItem = async (idx: number) => {
    if (!complaint) return;
    
    // Toggle state locally
    const updatedChecklist = [...complaint.evidenceChecklist];
    updatedChecklist[idx].submitted = !updatedChecklist[idx].submitted;
    
    setSavingChecklist(true);
    try {
      const response = await fetch(`/api/complaints/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evidenceChecklist: updatedChecklist,
        }),
      });

      if (response.ok) {
        setComplaint({
          ...complaint,
          evidenceChecklist: updatedChecklist,
        });
      } else {
        alert("Failed to update checklist.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingChecklist(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col justify-center items-center flex-grow text-center">
        <div className="h-10 w-10 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs text-muted font-semibold animate-pulse">Loading grievance record...</span>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col justify-center items-center flex-grow text-center">
        <BadgeAlert className="h-16 w-16 text-red-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold">Complaint Record Not Found</h2>
        <p className="text-xs text-muted mt-2 mb-6">The tracking ID may be incorrect or the record was archived.</p>
        <Button href="/" variant="glow-blue" size="md">
          Go back Home
        </Button>
      </div>
    );
  }

  // Format date
  const creationDate = new Date(complaint.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 flex-grow flex flex-col justify-start relative z-10 w-full">
      {/* Background overlay */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-primary-blue/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Navigation & Status Title */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-xs text-muted hover:text-primary-blue gap-1 mb-2 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to previous screen</span>
        </button>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] bg-muted-background border border-border px-2 py-0.5 rounded font-mono text-muted font-bold">
                Tracking ID: {complaint.id}
              </span>
              <span className={`font-extrabold text-[9px] uppercase px-2 py-0.5 rounded-full inline-block ${
                complaint.status === "PENDING" ? "bg-s-pending/10 text-s-pending" :
                complaint.status === "IN_PROGRESS" ? "bg-s-inprogress/10 text-s-inprogress" :
                complaint.status === "RESOLVED" ? "bg-s-resolved/10 text-s-resolved" :
                "bg-s-rejected/10 text-s-rejected"
              }`}>
                {complaint.status.replace("_", " ")}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {complaint.title}
            </h1>
            <span className="text-xs text-muted flex items-center gap-1 mt-1">
              <Calendar className="w-3.5 h-3.5" />
              Filed on: {creationDate}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted font-semibold">Routing quality:</span>
            <span className="text-xs bg-primary-blue/10 text-primary-blue px-2.5 py-1 rounded-full font-bold">
              {Math.round(complaint.confidence * 100)}% Confidence
            </span>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Summary, Statement, MAP Simulation */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* AI Summary card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-premium relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2.5 bg-primary-orange/10 text-primary-orange text-[9px] font-bold rounded-bl-xl border-l border-b border-border flex items-center gap-0.5">
              <Cpu className="w-3 h-3 animate-pulse" />
              <span>Gemini 2.5 Extract</span>
            </div>
            
            <h3 className="text-xs font-extrabold uppercase text-muted tracking-wider mb-3">
              Administrative AI Summary
            </h3>
            <p className="text-sm text-foreground italic font-semibold leading-relaxed border-l-4 border-primary-orange pl-4 bg-muted-background/30 py-3 rounded-r-xl">
              "{complaint.summary}"
            </p>
          </div>

          {/* Citizen Details Statement */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-premium">
            <h3 className="text-xs font-extrabold uppercase text-muted tracking-wider mb-4 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-primary-blue" />
              Original Grievance Statement
            </h3>
            <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
              {complaint.description}
            </p>

            {/* Contact details */}
            <div className="mt-6 pt-4 border-t border-border grid grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted" />
                <div>
                  <span className="text-[10px] text-muted block">Citizen Name</span>
                  <span className="font-bold text-foreground">{complaint.citizenName || "Anonymous"}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted" />
                <div>
                  <span className="text-[10px] text-muted block">Phone Number</span>
                  <span className="font-bold text-foreground">{complaint.citizenPhone || "Not Provided"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Translation Sheet */}
          {complaint.translatedDescription && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-premium relative">
              <h3 className="text-xs font-extrabold uppercase text-muted tracking-wider mb-3 flex items-center gap-1.5">
                <Languages className="w-4 h-4 text-primary-orange" />
                AI Local Language Translation (Hindi)
              </h3>
              <p className="text-xs text-foreground italic bg-primary-orange/5 p-3 rounded-xl border border-primary-orange/15 font-medium leading-relaxed">
                {complaint.translatedDescription}
              </p>
            </div>
          )}

          {/* OpenStreetMap Interactive Map & Captured Geolocation */}
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

        {/* Right Side: Timeline & Verification Checklist */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Timeline Tracking */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-premium">
            <h3 className="text-xs font-extrabold uppercase text-muted tracking-wider mb-5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary-blue" />
              Grievance Tracking Timeline
            </h3>

            <div className="relative pl-6 border-l border-border space-y-6 ml-3">
              {complaint.timeline && complaint.timeline.map((event: any, idx: number) => {
                const eventDate = new Date(event.timestamp).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                
                return (
                  <div key={idx} className="relative">
                    {/* Circle marker */}
                    <div className={`absolute left-[-31px] top-0.5 h-4.5 w-4.5 rounded-full border-4 bg-card ${
                      event.status === "RESOLVED" ? "border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" :
                      event.status === "IN_PROGRESS" ? "border-primary-blue shadow-[0_0_8px_rgba(59,130,246,0.4)]" :
                      event.status === "REJECTED" ? "border-slate-500" :
                      "border-primary-orange shadow-[0_0_8px_rgba(249,115,22,0.4)]"
                    }`} />

                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs font-extrabold text-foreground uppercase tracking-tight">
                        {event.status.replace("_", " ")}
                      </span>
                      <span className="text-[9px] text-muted font-bold font-mono">{eventDate}</span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      {event.note}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Evidence Upload/Checklist */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-premium">
            <h3 className="text-xs font-extrabold uppercase text-muted tracking-wider mb-2 flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-primary-orange" />
              Verification Documents Checklist
            </h3>
            <p className="text-[10px] text-muted mb-4">
              Toggle items to simulate citizen uploading evidence photographs or location markers.
            </p>

            <div className="space-y-2">
              {complaint.evidenceChecklist && complaint.evidenceChecklist.map((item: any, idx: number) => (
                <button
                  key={idx}
                  disabled={savingChecklist}
                  onClick={() => handleToggleChecklistItem(idx)}
                  className="w-full flex items-center justify-between p-3 border border-border bg-muted-background/30 rounded-xl hover:bg-muted-background/60 transition-colors text-left disabled:opacity-50"
                >
                  <span className="text-xs font-semibold text-foreground">{item.name}</span>
                  <span className="flex items-center gap-1.5">
                    {item.required && (
                      <span className="text-[8px] font-extrabold uppercase px-1 py-0.5 rounded bg-red-500/10 text-red-500">
                        Required
                      </span>
                    )}
                    <span className={`h-4.5 w-4.5 rounded-full flex items-center justify-center text-white border text-[10px] font-bold ${
                      item.submitted ? "bg-emerald-500 border-emerald-500" : "bg-background border-border"
                    }`}>
                      {item.submitted && <CheckCircle className="w-3.5 h-3.5" />}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Officer updates (If present) */}
          {complaint.officerNotes && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-premium">
              <h3 className="text-xs font-extrabold uppercase text-muted tracking-wider mb-3">
                Assigned Officer Notes
              </h3>
              <p className="text-xs text-foreground bg-primary-blue/5 p-3.5 rounded-xl border border-primary-blue/15 leading-relaxed font-medium">
                "{complaint.officerNotes}"
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
