"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, User, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2, Cpu, UserCheck } from "lucide-react";
import Button from "@/components/Button";

function ConsumerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/citizen";
  const forbiddenParam = searchParams.get("forbidden");

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    forbiddenParam ? "Access restricted: Your consumer account does not have officer privileges." : null
  );
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const endpoint = mode === "signin" ? "/api/auth/login" : "/api/auth/register";
      const payload = mode === "signin"
        ? { email, password, portal: "consumer" }
        : { email, name, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      setSuccess(mode === "signin" ? "Login successful! Redirecting..." : "Account created successfully! Redirecting...");
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

  const fillDemoConsumer = () => {
    setEmail("citizen@sahivibhag.gov.in");
    setPassword("consumer123");
    setError(null);
  };

  return (
    <div className="bg-card/80 backdrop-blur-xl border border-border/60 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
      {/* Subtle Glow Header Accent */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary-blue/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-primary-orange/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-blue via-primary-blue to-primary-orange text-white shadow-glow-blue mb-4">
          <Cpu className="w-7 h-7 animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Consumer Portal
        </h1>
        <p className="text-xs text-muted mt-1.5 max-w-xs mx-auto">
          Sign in to lodge grievances, track application status, and interact with AI resolution workflows.
        </p>
      </div>

      {/* Toggle Sign In / Sign Up */}
      <div className="flex bg-muted/40 p-1 rounded-xl mb-6 border border-border/40">
        <button
          type="button"
          onClick={() => { setMode("signin"); setError(null); }}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            mode === "signin"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => { setMode("signup"); setError(null); }}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            mode === "signup"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          New Citizen Account
        </button>
      </div>

      {/* Feedback Messages */}
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-start gap-2.5"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{success}</span>
        </motion.div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-muted absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Amit Sharma"
                className="w-full bg-background/60 border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted/60 focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue transition"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-muted absolute left-3.5 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="citizen@sahivibhag.gov.in"
              className="w-full bg-background/60 border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted/60 focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-muted absolute left-3.5 top-3" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-background/60 border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted/60 focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue transition"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 text-xs font-bold rounded-xl bg-gradient-to-r from-primary-blue to-primary-orange hover:opacity-95 text-white shadow-glow-blue transition"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Authenticating...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              {mode === "signin" ? "Sign In to Consumer Portal" : "Create Consumer Account"}
              <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </Button>
      </form>

      {/* Quick Demo Fill Button */}
      <div className="mt-6 pt-6 border-t border-border/40 text-center">
        <p className="text-[11px] text-muted mb-2 font-medium">Quick Demo Testing:</p>
        <button
          type="button"
          onClick={fillDemoConsumer}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-blue/10 border border-primary-blue/20 text-primary-blue text-xs font-medium hover:bg-primary-blue/20 transition"
        >
          <UserCheck className="w-3.5 h-3.5" />
          Fill Demo Consumer (Amit Sharma)
        </button>
      </div>

      <div className="mt-4 text-center">
        <Link href="/citizen" className="text-[11px] text-muted hover:text-primary-blue transition">
          Back to Grievance Portal →
        </Link>
      </div>
    </div>
  );
}

export default function ConsumerLoginPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-radial-gradient">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Suspense fallback={
          <div className="bg-card/80 border border-border/60 rounded-3xl p-8 text-center text-xs text-muted">
            Loading Consumer Portal...
          </div>
        }>
          <ConsumerLoginForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
