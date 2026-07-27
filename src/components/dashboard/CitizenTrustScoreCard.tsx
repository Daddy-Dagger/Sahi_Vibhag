"use client";

import React, { useState } from "react";
import { Award, ShieldCheck, Info, CheckCircle2, HelpCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CitizenTrustScoreCardProps {
  score: number;
}

export default function CitizenTrustScoreCard({ score = 94 }: CitizenTrustScoreCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // SVG Circular progress math
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative bg-gradient-to-br from-card via-card to-primary-blue/5 border border-border/80 rounded-3xl p-6 shadow-xl overflow-hidden flex flex-col justify-between">
      {/* Decorative Glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary-blue/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
            <Award className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground leading-tight">Citizen Trust Score</h3>
            <p className="text-[11px] text-muted">Civic Credibility Rating</p>
          </div>
        </div>

        <button
          onClick={() => setShowTooltip(!showTooltip)}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="p-1.5 rounded-lg bg-muted/40 hover:bg-muted text-muted hover:text-foreground transition relative"
          title="Score Breakdown Details"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Circular Progress & Rating */}
      <div className="flex items-center gap-5 py-2">
        <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
            {/* Background Track */}
            <circle
              cx="48"
              cy="48"
              r={radius}
              className="stroke-muted/20"
              strokeWidth="7"
              fill="transparent"
            />
            {/* Animated Progress Ring */}
            <motion.circle
              cx="48"
              cy="48"
              r={radius}
              className="stroke-primary-blue"
              strokeWidth="7"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-extrabold text-foreground tracking-tight leading-none">
              {score}
            </span>
            <span className="text-[9px] font-bold text-muted uppercase tracking-wider mt-0.5">
              / 100
            </span>
          </div>
        </div>

        <div className="space-y-1.5 flex-1">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold uppercase">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            Verified Credibility
          </div>
          <p className="text-xs text-muted leading-snug">
            High trust score prioritizes your civic grievances for immediate departmental inspection.
          </p>
        </div>
      </div>

      {/* Trust Breakdown Popup Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute left-4 right-4 bottom-4 bg-slate-900/95 text-white p-4 rounded-2xl border border-slate-700 shadow-2xl z-20 backdrop-blur-xl text-xs space-y-2"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Score Calculation Factors
              </span>
              <span className="text-[10px] text-slate-400">Max 100 pts</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-300">
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Verified Citizen Profile
                </span>
                <span className="font-mono text-emerald-400">+25 pts</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Complete Grievance Information
                </span>
                <span className="font-mono text-emerald-400">+25 pts</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Photo & Geo-Tag Evidence
                </span>
                <span className="font-mono text-emerald-400">+25 pts</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Clean Reporting History (No Spam)
                </span>
                <span className="font-mono text-emerald-400">+25 pts</span>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
