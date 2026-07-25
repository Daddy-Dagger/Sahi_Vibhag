"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldAlert, ShieldCheck, Lock, Mail, ArrowRight, AlertTriangle, CheckCircle2, Building2, KeyRound } from "lucide-react";
import Button from "@/components/Button";

function OfficerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/officer";
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam === "session_expired" ? "Your officer session has expired. Please log in again." : null
  );
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, portal: "officer" }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Officer authentication failed");
      }

      setSuccess("Officer credentials verified! Granting access to Department Dashboard...");
      setTimeout(() => {
        router.push(redirectUrl);
        router.refresh();
      }, 800);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoOfficer = () => {
    setEmail("officer@sahivibhag.gov.in");
    setPassword("officer123");
    setError(null);
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
      {/* Top Restricted Badge */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold tracking-wider uppercase">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>Restricted Access Portal</span>
        </div>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-600 to-slate-900 border border-amber-500/40 text-slate-950 shadow-glow-amber mb-4">
          <Building2 className="w-8 h-8 text-amber-200" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">
          Officer Authentication
        </h1>
        <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto">
          Sahi Vibhag Department Processing Portal. Requires valid departmental officer credentials.
        </p>
      </div>

      {/* Feedback Messages */}
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-6 p-4 rounded-xl bg-red-950/80 border border-red-800/60 text-red-300 text-xs flex items-start gap-3 shadow-lg"
        >
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-200 mb-0.5">Authentication Blocked</p>
            <p>{error}</p>
          </div>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-6 p-4 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-xs flex items-start gap-3 shadow-lg"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-200 mb-0.5">Access Granted</p>
            <p>{success}</p>
          </div>
        </motion.div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Official Officer Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="officer@sahivibhag.gov.in"
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Security Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full mt-3 py-3 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-glow-amber transition border border-amber-400/30"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              Verifying Officer Clearance...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Authorize & Access Dashboard
              <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </Button>
      </form>

      {/* Demo Credentials Helper for Testing */}
      <div className="mt-6 pt-6 border-t border-slate-800 text-center">
        <p className="text-[11px] text-slate-400 mb-2 font-medium">Quick Demo Testing:</p>
        <button
          type="button"
          onClick={fillDemoOfficer}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition"
        >
          <KeyRound className="w-3.5 h-3.5" />
          Fill Demo Officer Credentials (PWD)
        </button>
      </div>

      <div className="mt-4 text-center">
        <p className="text-[10px] text-slate-500">
          Authorized access only. All actions are logged and audited.
        </p>
      </div>
    </div>
  );
}

export default function OfficerLoginPage() {
  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-12 bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Dark Government Security Backdrop Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />

      {/* Decorative Security Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <Suspense fallback={
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-xs text-slate-400">
            Loading Officer Security Portal...
          </div>
        }>
          <OfficerLoginForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
