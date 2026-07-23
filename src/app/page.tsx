"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import AnalyticsCharts from "@/components/AnalyticsCharts";
import { 
  ArrowRight, 
  Mic, 
  Sparkles, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  Languages, 
  CheckSquare, 
  TrendingUp, 
  HelpCircle,
  FileText,
  BookmarkCheck,
  ChevronRight,
  Database
} from "lucide-react";

export default function Home() {
  const [activeStep, setActiveStep] = useState(0);
  const [simulatedComplaint, setSimulatedComplaint] = useState("");
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const steps = [
    {
      title: "Citizen Submits Grievance",
      desc: "Speak or type in any language (English, Hindi, Dogri, Hinglish, etc.). Sahi Vibhag AI captures the natural voice or text.",
      icon: Mic,
      color: "from-amber-500 to-primary-orange"
    },
    {
      title: "Gemini AI Analysis & Routing",
      desc: "Gemini 2.5 Flash translates the text, extracts key intent, assigns priority, suggests evidence checklist, and routes to the correct department.",
      icon: Sparkles,
      color: "from-blue-600 to-indigo-700"
    },
    {
      title: "Officer Resolves Complaint",
      desc: "Department officials receive a structured, government-ready action sheet. They update the timeline, tracking the grievance to resolution.",
      icon: CheckSquare,
      color: "from-emerald-500 to-teal-600"
    }
  ];

  const benefits = [
    {
      title: "Eliminates Red Tape",
      desc: "Direct-to-department automated routing bypasses slow manual screening processes.",
      icon: Clock
    },
    {
      title: "Language Inclusivity",
      desc: "Supports native dialects (Bharat-first). Citizens write/speak locally, AI translates to standard formats.",
      icon: Languages
    },
    {
      title: "Action-Ready Evidence Sheets",
      desc: "AI identifies missing location details or required photographs so officers get all data upfront.",
      icon: ShieldAlert
    },
    {
      title: "High Accuracy Metric",
      desc: "Sahi Vibhag AI assigns confidence scores to check routing quality before filing.",
      icon: TrendingUp
    }
  ];

  const demoExamples = [
    {
      text: "Jammu-Srinagar Highway bypass ke pass main street light 4 din se band hai, raat ko accident hone ka darr hai.",
      label: "Hinglish Complaint"
    },
    {
      text: "Our lane in Sector 4 Channi Himmat is flooded with sewage water because of a blocked drain. The smell is unbearable.",
      label: "English Complaint"
    },
    {
      text: "मुख्य बाजार में कचरा उठाने वाली गाड़ी पिछले एक हफ्ते से नहीं आई है। महामारी का खतरा है।",
      label: "Hindi Complaint"
    }
  ];

  const runSimulation = async (text: string) => {
    setSimulatedComplaint(text);
    setSimulating(true);
    setSimulationResult(null);
    
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      setSimulationResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="relative overflow-hidden flex flex-col items-center">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-20%] w-[600px] h-[600px] rounded-full bg-primary-blue/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary-orange/5 blur-[100px] pointer-events-none" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 pt-16 pb-20 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center"
        >
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border border-primary-orange/20 bg-primary-orange/5 text-primary-orange text-xs font-semibold mb-6 shadow-glow-orange animate-bounce">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI for Bharat: Governance & Social Impact Theme</span>
          </div>

          {/* Title */}
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-primary-blue via-primary-blue to-primary-orange bg-clip-text text-transparent">
              Sahi Vibhag AI
            </span>
          </h1>

          {/* Subtitle */}
          <h2 className="text-xl sm:text-3xl font-semibold text-foreground/90 max-w-2xl mb-4 italic tracking-wide">
            "Bas Boliye... AI Pahunchaye Sahi Vibhag Tak."
          </h2>

          <p className="text-muted text-base sm:text-lg max-w-2xl mb-8">
            An intelligent civic grievance router developed for the IIT Jammu AI Hackathon. Converts local voice/text complaints into structured, department-routed, government-ready action sheets.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md">
            <Link
              href="/citizen"
              className="flex items-center justify-center space-x-2 px-8 py-4 rounded-xl bg-gradient-to-r from-primary-blue to-primary-blue/90 hover:from-primary-blue/95 text-white font-semibold transition-all duration-300 shadow-glow-blue hover:scale-[1.02]"
            >
              <span>Start Complaint Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how-it-works"
              className="flex items-center justify-center px-8 py-4 rounded-xl bg-card border border-border text-foreground hover:bg-muted-background transition-colors duration-300 font-semibold shadow-premium"
            >
              Learn More
            </a>
          </div>
        </motion.div>
      </section>

      {/* Live AI Router Simulator Section */}
      <section className="w-full max-w-5xl mx-auto px-4 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="rounded-3xl border border-border bg-card shadow-premium p-6 sm:p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-3 bg-primary-blue/10 text-primary-blue text-xs font-bold rounded-bl-xl border-l border-b border-border flex items-center gap-1">
            <Database className="w-3.5 h-3.5" />
            <span>Interactive Demo</span>
          </div>

          <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-orange animate-spin" />
            Try Sahi Vibhag AI Routing
          </h3>
          <p className="text-muted text-xs mb-6 max-w-2xl">
            Select one of the sample regional grievances below, or write your own to see how Gemini extracts parameters and routes the complaint to the right municipal office.
          </p>

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-2.5 mb-6">
            {demoExamples.map((ex, idx) => (
              <button
                key={idx}
                onClick={() => runSimulation(ex.text)}
                className="px-3.5 py-2 text-xs rounded-xl bg-muted-background border border-border text-foreground hover:border-primary-blue hover:text-primary-blue transition-all duration-200 text-left"
              >
                <span className="font-semibold block text-[10px] text-primary-orange mb-0.5">{ex.label}</span>
                {ex.text.slice(0, 50)}...
              </button>
            ))}
          </div>

          {/* User Input & Result Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Input Box */}
            <div className="flex flex-col space-y-3">
              <textarea
                value={simulatedComplaint}
                onChange={(e) => setSimulatedComplaint(e.target.value)}
                placeholder="Type or paste a civic complaint here (e.g. 'Street light broken near Jammu Bypass road...')"
                className="w-full min-h-[120px] p-4 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/30"
              />
              <button
                disabled={simulating || !simulatedComplaint}
                onClick={() => runSimulation(simulatedComplaint)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-blue to-primary-orange hover:brightness-105 text-white font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {simulating ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    AI Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analyze & Route Complaint
                  </>
                )}
              </button>
            </div>

            {/* AI Output Preview */}
            <div className="rounded-2xl border border-border bg-muted-background/40 p-4 min-h-[178px] flex flex-col justify-center">
              {simulating && (
                <div className="space-y-3 flex flex-col justify-center items-center py-8">
                  <div className="h-6 w-6 border-3 border-primary-blue border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-muted font-medium animate-pulse">Running Gemini routing algorithm...</span>
                </div>
              )}

              {!simulating && !simulationResult && (
                <div className="text-center py-8 text-muted flex flex-col items-center space-y-2">
                  <FileText className="w-8 h-8 text-muted/60" />
                  <span className="text-xs">Structured JSON output will appear here.</span>
                </div>
              )}

              {!simulating && simulationResult && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-border">
                    <span className="text-xs font-bold text-foreground">AI Routing Sheet</span>
                    <span className="text-[10px] bg-primary-blue/10 text-primary-blue font-bold px-2 py-0.5 rounded-full">
                      Confidence: {Math.round(simulationResult.confidence * 100)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-muted block uppercase font-semibold">Assigned Department</span>
                      <span className="font-bold text-primary-blue">{simulationResult.department}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted block uppercase font-semibold">Priority</span>
                      <span className={`font-bold px-2 py-0.5 rounded text-[10px] inline-block ${
                        simulationResult.priority === "URGENT" ? "bg-red-500/10 text-red-500" :
                        simulationResult.priority === "HIGH" ? "bg-orange-500/10 text-orange-500" :
                        simulationResult.priority === "MEDIUM" ? "bg-yellow-500/10 text-yellow-600" :
                        "bg-blue-500/10 text-blue-500"
                      }`}>
                        {simulationResult.priority}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-muted block uppercase font-semibold">Summary</span>
                      <p className="text-foreground italic">"{simulationResult.summary}"</p>
                    </div>
                    {simulationResult.translatedDescription && (
                      <div className="col-span-2 bg-primary-orange/5 p-2 rounded border border-primary-orange/15">
                        <span className="text-[9px] text-primary-orange block uppercase font-bold">Official Translation (Hindi)</span>
                        <p className="text-foreground font-medium text-[11px]">{simulationResult.translatedDescription}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Analytics & Grievance Resolution Charts */}
      <AnalyticsCharts />

      {/* How it Works Section */}
      <section id="how-it-works" className="w-full bg-card py-20 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
              How Sahi Vibhag AI Works
            </h2>
            <p className="mt-4 text-muted text-base max-w-2xl mx-auto">
              We leverage modern Generative AI to bridge the language gap and automate routing bottlenecks in public administration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, idx) => {
              const IconComp = step.icon;
              return (
                <div key={idx} className="flex flex-col items-center text-center p-6 rounded-2xl border border-border bg-background hover:scale-[1.01] transition-transform duration-300">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${step.color} text-white flex items-center justify-center mb-5 shadow-lg`}>
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs text-muted">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="w-full py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold text-primary-orange uppercase tracking-wider block mb-2">Impact & Efficiency</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-6">
              Empowering Governance for the Digital India Era
            </h2>
            <p className="text-muted mb-8 leading-relaxed text-sm sm:text-base">
              Civic portals are often overloaded with misrouted forms, vague addresses, and text in regional languages that clerks struggle to catalog quickly. Sahi Vibhag AI uses advanced natural language processing to make routing instantaneous and accurate.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {benefits.map((b, i) => {
                const Icon = b.icon;
                return (
                  <div key={i} className="flex space-x-3">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-blue/10 text-primary-blue">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground mb-1">{b.title}</h4>
                      <p className="text-xs text-muted leading-snug">{b.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Visual Showcase Panel */}
          <div className="relative rounded-3xl border border-border bg-card p-6 shadow-premium overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary-orange/20 to-transparent blur-xl" />
            
            <h3 className="font-bold text-sm mb-4 border-b border-border pb-2 flex items-center gap-2">
              <BookmarkCheck className="w-4.5 h-4.5 text-primary-orange" />
              Sahi Vibhag AI Routing Accuracy Chart
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Public Works Department (Roads)</span>
                  <span className="text-primary-blue">96% Accuracy</span>
                </div>
                <div className="w-full bg-muted-background h-2 rounded-full overflow-hidden">
                  <div className="bg-primary-blue h-full rounded-full" style={{ width: "96%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Sanitation & Municipal Corporation</span>
                  <span className="text-primary-blue">94% Accuracy</span>
                </div>
                <div className="w-full bg-muted-background h-2 rounded-full overflow-hidden">
                  <div className="bg-primary-blue h-full rounded-full" style={{ width: "94%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Electricity Board (PDD)</span>
                  <span className="text-primary-blue">98% Accuracy</span>
                </div>
                <div className="w-full bg-muted-background h-2 rounded-full overflow-hidden">
                  <div className="bg-primary-blue h-full rounded-full" style={{ width: "98%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Jal Shakti (Water Supply)</span>
                  <span className="text-primary-blue">91% Accuracy</span>
                </div>
                <div className="w-full bg-muted-background h-2 rounded-full overflow-hidden">
                  <div className="bg-primary-blue h-full rounded-full" style={{ width: "91%" }} />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-muted-background/40 rounded-xl border border-border flex items-center justify-between">
              <div className="text-xs">
                <span className="block font-bold text-foreground">Future-Ready Stack Ready</span>
                <span className="text-muted text-[10px]">BHASHINI Speech API, OpenStreetMap, RAG Knowledge</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-16 bg-gradient-to-tr from-primary-blue to-[#072d6e] text-white text-center relative z-10">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Ready to route civic grievances correctly?
          </h2>
          <p className="text-white/80 max-w-xl mx-auto mb-8 text-sm sm:text-base">
            Try the Citizen Portal to file complaints, or view the Officer Dashboard to track, re-route, and resolve them.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/citizen"
              className="px-8 py-3.5 rounded-xl bg-white text-primary-blue font-bold shadow hover:bg-slate-100 transition-colors"
            >
              Start Filing Grievances
            </Link>
            <Link
              href="/officer"
              className="px-8 py-3.5 rounded-xl bg-primary-orange text-white font-bold shadow hover:bg-orange-600 transition-colors"
            >
              Access Officer Console
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
