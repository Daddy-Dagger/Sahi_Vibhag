"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Button from "@/components/Button";
import LocationPicker, { LocationState } from "@/components/LocationPicker";
import {
  Mic,
  MicOff,
  Sparkles,
  Building,
  MapPin,
  AlertTriangle,
  FileCheck2,
  Send,
  User,
  Phone,
  ArrowLeft,
  CheckCircle,
  FileText,
  BadgeAlert,
  Loader2,
  Languages
} from "lucide-react";

export default function CitizenPortal() {
  const router = useRouter();
  
  // State variables
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [complaintText, setComplaintText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingLanguage, setRecordingLanguage] = useState("hi-IN"); // hi-IN or en-IN

  // Location state
  const [locationData, setLocationData] = useState<LocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    formattedAddress: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    status: "idle",
  });
  
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [createdId, setCreatedId] = useState("");

  const [recognition, setRecognition] = useState<any>(null);

  // Web Speech API initialization
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        
        rec.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setComplaintText((prev) => prev + " " + finalTranscript);
          }
        };

        rec.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsRecording(false);
        };

        rec.onend = () => {
          setIsRecording(false);
        };

        setRecognition(rec);
      }
    }
  }, []);

  // Update language when it changes
  useEffect(() => {
    if (recognition) {
      recognition.lang = recordingLanguage;
    }
  }, [recordingLanguage, recognition]);

  const toggleRecording = () => {
    if (!recognition) {
      alert("Speech recognition is not supported on this browser. Please type your complaint.");
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
    }
  };

  const handleAnalyze = async () => {
    if (!complaintText.trim()) return;
    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: complaintText }),
      });
      const data = await response.json();
      setAnalysisResult(data);
    } catch (error) {
      console.error("Error analyzing complaint:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  // Toggle evidence checklist item submission state
  const handleToggleChecklist = (index: number) => {
    if (!analysisResult) return;
    const updatedChecklist = [...analysisResult.evidenceChecklist];
    updatedChecklist[index].submitted = !updatedChecklist[index].submitted;
    setAnalysisResult({
      ...analysisResult,
      evidenceChecklist: updatedChecklist,
    });
  };

  const handleSubmit = async () => {
    if (!analysisResult) return;
    setSubmitting(true);

    try {
      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: analysisResult.title,
          description: complaintText,
          translatedDescription: analysisResult.translatedDescription,
          department: analysisResult.department,
          priority: analysisResult.priority,
          category: analysisResult.category,
          summary: analysisResult.summary,
          missingInformation: analysisResult.missingInformation,
          evidenceChecklist: analysisResult.evidenceChecklist,
          citizenName: name || "Anonymous Citizen",
          citizenPhone: phone || "Not Provided",
          location: locationData.formattedAddress || analysisResult.location || "Unknown Location",
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
          formattedAddress: locationData.formattedAddress || analysisResult.location || "",
          landmark: locationData.landmark || "",
          city: locationData.city || "",
          state: locationData.state || "",
          pincode: locationData.pincode || "",
          confidence: analysisResult.confidence,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSubmitSuccess(true);
        setCreatedId(data.id);
      } else {
        alert("Submission failed: " + data.error);
      }
    } catch (e) {
      console.error(e);
      alert("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 flex-grow flex flex-col justify-start relative z-10">
      
      {/* Background decoration */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-primary-blue/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center text-xs text-muted hover:text-primary-blue gap-1 mb-2 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Landing</span>
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Citizen Portal
        </h1>
        <p className="text-sm text-muted">
          Submit your civic complaints. Speak in your native language or type; our AI auto-translates and routes to the correct department.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!submitSuccess ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Input Form Panel (Left) */}
            <div className="lg:col-span-6 space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-premium">
                <h3 className="text-lg font-bold mb-4 text-foreground flex items-center gap-2">
                  <User className="w-5 h-5 text-primary-blue" />
                  Citizen Contact Info (Optional)
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted block mb-1">Your Full Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rajesh Kumar"
                        className="w-full pl-9 pr-3 py-2 border border-border bg-background rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/30"
                      />
                      <User className="w-4 h-4 text-muted absolute left-3 top-3" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted block mb-1">Phone Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +91 99060 XXXXX"
                        className="w-full pl-9 pr-3 py-2 border border-border bg-background rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/30"
                      />
                      <Phone className="w-4 h-4 text-muted absolute left-3 top-3" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Automatic Location Capture & Interactive Map */}
              <LocationPicker locationData={locationData} onChange={setLocationData} />

              <div className="rounded-2xl border border-border bg-card p-6 shadow-premium relative">
                <h3 className="text-lg font-bold mb-4 text-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-orange" />
                  Describe Grievance / शिकायत दर्ज करें
                </h3>

                {/* Voice recording configuration */}
                <div className="flex justify-between items-center bg-muted-background p-3 rounded-xl mb-4 border border-border">
                  <div className="text-xs">
                    <span className="font-bold block text-foreground">Speech Input Mode ("Bas Boliye...")</span>
                    <span className="text-muted text-[10px]">Speak clearly near your microphone.</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRecordingLanguage("hi-IN")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                        recordingLanguage === "hi-IN" ? "bg-primary-orange text-white border-transparent" : "bg-card text-muted border-border"
                      }`}
                    >
                      हिन्दी
                    </button>
                    <button
                      onClick={() => setRecordingLanguage("en-IN")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                        recordingLanguage === "en-IN" ? "bg-primary-blue text-white border-transparent" : "bg-card text-muted border-border"
                      }`}
                    >
                      English
                    </button>
                  </div>
                </div>

                {/* Recording UI */}
                <div className="flex flex-col items-center py-6 border border-dashed border-border rounded-xl bg-muted-background/25 mb-4">
                  <motion.button
                    onClick={toggleRecording}
                    animate={isRecording ? { scale: [1, 1.15, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg ${
                      isRecording ? "bg-red-500 shadow-red-500/20" : "bg-gradient-to-r from-primary-blue to-primary-orange"
                    }`}
                  >
                    {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6 animate-pulse" />}
                  </motion.button>
                  <span className={`text-xs mt-3 font-semibold ${isRecording ? "text-red-500 animate-pulse" : "text-muted"}`}>
                    {isRecording ? "Listening... Speak now" : "Click to speak grievance details"}
                  </span>
                </div>

                {/* Textarea */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted block mb-1">Grievance Text Description</label>
                  <textarea
                    value={complaintText}
                    onChange={(e) => setComplaintText(e.target.value)}
                    placeholder="Provide details about the issue (e.g. location, severity, duration). You can speak it or type it in Hindi/English/Hinglish."
                    className="w-full min-h-[160px] p-4 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/30 mb-4"
                  />

                  <Button
                    disabled={analyzing || !complaintText.trim()}
                    onClick={handleAnalyze}
                    variant="glow-blue"
                    size="md"
                    className="w-full"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        AI Analysis in Progress...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 text-primary-orange animate-pulse" />
                        Analyze & Route Grievance
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* AI Summary and Review Panel (Right) */}
            <div className="lg:col-span-6">
              <AnimatePresence mode="wait">
                {analyzing && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-2xl border border-border bg-card p-8 shadow-premium text-center flex flex-col items-center justify-center min-h-[300px]"
                  >
                    <Loader2 className="w-12 h-12 text-primary-blue animate-spin mb-4" />
                    <h3 className="font-bold text-lg mb-2">Analyzing Grievance</h3>
                    <p className="text-xs text-muted max-w-sm">
                      Gemini 2.5 Flash is parsing your input, translating dialects, identifying the target department, assessing safety priority levels, and preparing evidence guidelines...
                    </p>
                  </motion.div>
                )}

                {!analyzing && !analysisResult && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-2xl border border-border bg-muted-background/20 p-8 text-center flex flex-col items-center justify-center min-h-[400px] border-dashed border-2"
                  >
                    <Sparkles className="w-12 h-12 text-primary-orange/40 mb-4" />
                    <h3 className="font-bold text-foreground mb-1 text-sm">Grievance Dashboard Awaiting Analysis</h3>
                    <p className="text-xs text-muted max-w-xs">
                      Enter details or use the microphone on the left, then click "Analyze & Route Grievance" to preview the government routing draft here.
                    </p>
                  </motion.div>
                )}

                {!analyzing && analysisResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-border bg-card p-6 shadow-premium space-y-6"
                  >
                    {/* Routing Confidence Bar */}
                    <div className="flex justify-between items-center pb-3 border-b border-border">
                      <div>
                        <span className="text-[10px] text-muted block uppercase font-bold">Analysis Engine</span>
                        <span className="text-xs font-bold text-foreground">Gemini 2.5 routing sheet generated</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-muted block uppercase font-bold">Confidence Score</span>
                        <span className="text-sm font-extrabold text-primary-blue">
                          {Math.round(analysisResult.confidence * 100)}% Match
                        </span>
                      </div>
                    </div>

                    {/* Metadata Badges */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Department */}
                      <div className="p-3.5 bg-muted-background rounded-xl border border-border flex items-start gap-2.5">
                        <Building className="w-5 h-5 text-primary-blue mt-0.5" />
                        <div>
                          <span className="text-[9px] uppercase font-bold text-muted block">Suggested Department</span>
                          <span className="text-xs font-extrabold text-foreground">{analysisResult.department}</span>
                        </div>
                      </div>

                      {/* Priority */}
                      <div className="p-3.5 bg-muted-background rounded-xl border border-border flex items-start gap-2.5">
                        <BadgeAlert className={`w-5 h-5 mt-0.5 ${
                          analysisResult.priority === "URGENT" ? "text-red-500" :
                          analysisResult.priority === "HIGH" ? "text-orange-500" :
                          analysisResult.priority === "MEDIUM" ? "text-yellow-600" :
                          "text-blue-500"
                        }`} />
                        <div>
                          <span className="text-[9px] uppercase font-bold text-muted block">Grievance Priority</span>
                          <span className={`text-xs font-extrabold capitalize ${
                            analysisResult.priority === "URGENT" ? "text-red-500" :
                            analysisResult.priority === "HIGH" ? "text-orange-500" :
                            analysisResult.priority === "MEDIUM" ? "text-yellow-600" :
                            "text-blue-500"
                          }`}>
                            {analysisResult.priority.toLowerCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="p-3.5 bg-muted-background rounded-xl border border-border flex items-start gap-2.5">
                      <MapPin className="w-5 h-5 text-primary-orange mt-0.5" />
                      <div className="w-full">
                        <span className="text-[9px] uppercase font-bold text-muted block">Extracted Location Landmark</span>
                        <span className="text-xs font-bold text-foreground">
                          {analysisResult.location || "Not mentioned - Click evidence checklist to supply landmark"}
                        </span>
                      </div>
                    </div>

                    {/* Translation Section (If Applicable) */}
                    {analysisResult.translatedDescription && (
                      <div className="bg-primary-orange/5 p-4 rounded-xl border border-primary-orange/20">
                        <h4 className="text-xs font-bold text-primary-orange uppercase mb-1.5 flex items-center gap-1">
                          <Languages className="w-3.5 h-3.5" />
                          Government record translation (Hindi)
                        </h4>
                        <p className="text-xs text-foreground italic bg-background/50 p-2.5 rounded border border-border">
                          {analysisResult.translatedDescription}
                        </p>
                      </div>
                    )}

                    {/* AI Summary */}
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted block mb-1">Government-Ready Draft Summary</span>
                      <p className="text-xs text-foreground leading-relaxed bg-muted-background/30 p-3 rounded-xl border border-border italic">
                        "{analysisResult.summary}"
                      </p>
                    </div>

                    {/* Missing Info Callouts */}
                    {analysisResult.missingInformation && analysisResult.missingInformation.length > 0 && (
                      <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                        <h4 className="text-xs font-bold text-amber-600 uppercase mb-2 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" />
                          Missing Grievance Details Detected
                        </h4>
                        <ul className="list-disc pl-4 space-y-1 text-xs text-amber-700">
                          {analysisResult.missingInformation.map((info: string, idx: number) => (
                            <li key={idx}>{info}</li>
                          ))}
                        </ul>
                        <p className="text-[10px] text-amber-600 mt-2">
                          Providing these details below will speed up official investigations.
                        </p>
                      </div>
                    )}

                    {/* Evidence Checklist */}
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted block mb-2">Required Evidence / Verification Checklist</span>
                      <div className="space-y-2">
                        {analysisResult.evidenceChecklist.map((item: any, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => handleToggleChecklist(idx)}
                            className="w-full flex items-center justify-between p-3 border border-border bg-muted-background/20 rounded-xl hover:bg-muted-background/40 transition-colors text-left"
                          >
                            <span className="text-xs font-medium text-foreground">{item.name}</span>
                            <span className="flex items-center gap-1.5">
                              {item.required && (
                                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-red-500/10 text-red-500">
                                  Required
                                </span>
                              )}
                              <span className={`h-5 w-5 rounded-full flex items-center justify-center border text-white transition-colors ${
                                item.submitted ? "bg-emerald-500 border-emerald-500" : "bg-background border-border"
                              }`}>
                                {item.submitted && <FileCheck2 className="w-3.5 h-3.5" />}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                      disabled={submitting}
                      onClick={handleSubmit}
                      variant="glow-orange"
                      size="lg"
                      className="w-full"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Submitting to Department Portal...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Submit Complaint to Department
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          /* Submission Success Screen */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto rounded-3xl border border-border bg-card p-8 shadow-premium text-center space-y-6 my-12"
          >
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-10 h-10 animate-bounce" />
            </div>

            <h2 className="text-2xl font-extrabold text-foreground">
              Grievance Filed Successfully!
            </h2>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Your complaint has been processed by Sahi Vibhag AI and automatically routed to the correct government department. A unique tracking ID has been generated.
            </p>

            <div className="p-4 bg-muted-background rounded-2xl border border-border flex justify-between items-center text-xs">
              <span className="font-semibold text-muted">Tracking ID:</span>
              <span className="font-mono font-bold text-primary-blue bg-card px-3 py-1.5 rounded-lg border border-border shadow-inner select-all">
                {createdId}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              <Button
                onClick={() => router.push(`/complaint/${createdId}`)}
                variant="glow-blue"
                size="md"
              >
                Track Live Status
              </Button>
              <Button
                onClick={() => {
                  setSubmitSuccess(false);
                  setComplaintText("");
                  setAnalysisResult(null);
                }}
                variant="outline"
                size="md"
              >
                File Another Complaint
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
