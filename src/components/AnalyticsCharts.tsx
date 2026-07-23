"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { animate } from "animejs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  CheckCircle2,
  PieChart as PieIcon,
  BarChart3,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowUpRight,
} from "lucide-react";

// Helper component for Anime.js animated counters
function AnimatedCounter({ value, suffix = "", prefix = "", decimalPlaces = 0 }: { value: number; suffix?: string; prefix?: string; decimalPlaces?: number }) {
  const [displayVal, setDisplayVal] = useState(0);
  const prevValueRef = useRef(0);

  useEffect(() => {
    const obj = { val: prevValueRef.current };
    const anim = animate(obj, {
      val: value,
      duration: 1400,
      ease: "easeOutExpo",
      onUpdate: () => {
        setDisplayVal(obj.val);
      },
    });

    prevValueRef.current = value;
    return () => {
      anim.pause();
    };
  }, [value]);

  return (
    <span>
      {prefix}
      {decimalPlaces > 0
        ? displayVal.toFixed(decimalPlaces)
        : Math.round(displayVal).toLocaleString()}
      {suffix}
    </span>
  );
}

// Timeframe dataset type
type Timeframe = "7days" | "30days" | "quarter";

export default function AnalyticsCharts() {
  const [mounted, setMounted] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>("7days");
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Daily Complaints vs Resolved datasets
  const barDataMap = {
    "7days": [
      { day: "Mon", complaints: 142, resolved: 130, pending: 12 },
      { day: "Tue", complaints: 189, resolved: 175, pending: 14 },
      { day: "Wed", complaints: 215, resolved: 202, pending: 13 },
      { day: "Thu", complaints: 165, resolved: 158, pending: 7 },
      { day: "Fri", complaints: 240, resolved: 225, pending: 15 },
      { day: "Sat", complaints: 190, resolved: 182, pending: 8 },
      { day: "Sun", complaints: 110, resolved: 105, pending: 5 },
    ],
    "30days": [
      { day: "Week 1", complaints: 840, resolved: 790, pending: 50 },
      { day: "Week 2", complaints: 920, resolved: 865, pending: 55 },
      { day: "Week 3", complaints: 1050, resolved: 990, pending: 60 },
      { day: "Week 4", complaints: 1180, resolved: 1120, pending: 60 },
    ],
    quarter: [
      { day: "Month 1", complaints: 3200, resolved: 3010, pending: 190 },
      { day: "Month 2", complaints: 3850, resolved: 3620, pending: 230 },
      { day: "Month 3", complaints: 4100, resolved: 3890, pending: 210 },
    ],
  };

  // Department distribution pie chart data
  const pieData = [
    { name: "Public Works (PWD)", value: 438, percentage: 35, color: "#2563eb" },
    { name: "Municipal Sanitation", value: 350, percentage: 28, color: "#f97316" },
    { name: "Electricity Board (PDD)", value: 225, percentage: 18, color: "#8b5cf6" },
    { name: "Jal Shakti (Water)", value: 150, percentage: 12, color: "#06b6d4" },
    { name: "Traffic & Transport", value: 88, percentage: 7, color: "#10b981" },
  ];

  const currentBarData = barDataMap[timeframe];

  // Aggregated totals for stats cards
  const totalComplaints = currentBarData.reduce((acc, curr) => acc + curr.complaints, 0);
  const totalResolved = currentBarData.reduce((acc, curr) => acc + curr.resolved, 0);
  const resolutionRate = (totalResolved / (totalComplaints || 1)) * 100;

  // Custom Tooltip for Bar Chart
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-md border border-border p-3.5 rounded-xl shadow-xl text-xs space-y-1.5 z-50">
          <p className="font-extrabold text-foreground border-b border-border pb-1 mb-1">{label} Analytics</p>
          <div className="flex items-center justify-between gap-4 text-primary-blue font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary-blue" />
              Complaints Filed:
            </span>
            <span className="font-bold">{payload[0]?.value}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-emerald-500 font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Complaints Resolved:
            </span>
            <span className="font-bold">{payload[1]?.value}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Pie Chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card/95 backdrop-blur-md border border-border p-3 rounded-xl shadow-xl text-xs space-y-1">
          <p className="font-bold text-foreground flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
            {data.name}
          </p>
          <p className="text-muted">
            Total Grievances: <span className="font-bold text-foreground">{data.value}</span>
          </p>
          <p className="text-muted">
            Share: <span className="font-bold text-primary-orange">{data.percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 relative z-10">
      
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-primary-blue/20 bg-primary-blue/5 text-primary-blue text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-time Civic Impact Intelligence</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          Grievance Resolution & Routing Analytics
        </h2>

        <p className="mt-4 text-muted text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Monitor daily incoming complaints vs resolution throughput and department distribution powered by Sahi Vibhag AI.
        </p>

        {/* Timeframe selector tabs */}
        <div className="flex justify-center mt-6">
          <div className="inline-flex p-1 rounded-2xl bg-muted-background border border-border shadow-inner">
            <button
              onClick={() => setTimeframe("7days")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                timeframe === "7days"
                  ? "bg-card text-primary-blue shadow-md border border-border"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setTimeframe("30days")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                timeframe === "30days"
                  ? "bg-card text-primary-blue shadow-md border border-border"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setTimeframe("quarter")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                timeframe === "quarter"
                  ? "bg-card text-primary-blue shadow-md border border-border"
                  : "text-muted hover:text-foreground"
              }`}
            >
              This Quarter
            </button>
          </div>
        </div>
      </motion.div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        
        {/* Metric 1 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          whileHover={{ y: -3 }}
          className="rounded-2xl border border-border bg-card p-5 shadow-premium flex items-center justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary-blue/5 rounded-full blur-xl" />
          <div>
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1">
              Complaints Filed
            </span>
            <span className="text-3xl sm:text-4xl font-extrabold text-foreground block">
              <AnimatedCounter value={totalComplaints} />
            </span>
            <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-0.5 mt-1.5">
              <ArrowUpRight className="w-3 h-3" />
              100% captured via AI Voice/Text
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary-blue/10 text-primary-blue flex items-center justify-center shadow-sm">
            <BarChart3 className="w-6 h-6" />
          </div>
        </motion.div>

        {/* Metric 2 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ y: -3 }}
          className="rounded-2xl border border-border bg-card p-5 shadow-premium flex items-center justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl" />
          <div>
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1">
              Grievances Resolved
            </span>
            <span className="text-3xl sm:text-4xl font-extrabold text-emerald-500 block">
              <AnimatedCounter value={totalResolved} />
            </span>
            <span className="text-[10px] text-muted font-semibold block mt-1.5">
              Verified by field inspection
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </motion.div>

        {/* Metric 3 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ y: -3 }}
          className="rounded-2xl border border-border bg-card p-5 shadow-premium flex items-center justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary-orange/5 rounded-full blur-xl" />
          <div>
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1">
              Resolution Efficiency Rate
            </span>
            <span className="text-3xl sm:text-4xl font-extrabold text-primary-orange block">
              <AnimatedCounter value={resolutionRate} suffix="%" decimalPlaces={1} />
            </span>
            <span className="text-[10px] text-primary-orange font-semibold block mt-1.5">
              High department SLA compliance
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary-orange/10 text-primary-orange flex items-center justify-center shadow-sm">
            <TrendingUp className="w-6 h-6" />
          </div>
        </motion.div>

        {/* Metric 4 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          whileHover={{ y: -3 }}
          className="rounded-2xl border border-border bg-card p-5 shadow-premium flex items-center justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full blur-xl" />
          <div>
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1">
              Avg. AI Routing Latency
            </span>
            <span className="text-3xl sm:text-4xl font-extrabold text-purple-500 block">
              <AnimatedCounter value={1.2} suffix="s" decimalPlaces={1} />
            </span>
            <span className="text-[10px] text-muted font-semibold block mt-1.5">
              Gemini Flash Auto-Classifier
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center shadow-sm">
            <Zap className="w-6 h-6" />
          </div>
        </motion.div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left: Bar Graph - Daily Complaints vs Resolved */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-7 bg-card border border-border rounded-3xl p-6 sm:p-7 shadow-premium flex flex-col justify-between"
        >
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary-blue" />
                  Daily Complaints vs Resolved Rate
                </h3>
                <p className="text-xs text-muted">
                  Comparison between incoming grievances and completed field resolutions.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-foreground">
                  <span className="w-3 h-3 rounded bg-primary-blue" />
                  Complaints Filed
                </span>
                <span className="flex items-center gap-1.5 text-foreground">
                  <span className="w-3 h-3 rounded bg-emerald-500" />
                  Resolved
                </span>
              </div>
            </div>

            {/* Recharts Container */}
            <div className="w-full h-[320px] min-h-[300px]">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={currentBarData}
                    margin={{ top: 15, right: 10, left: -20, bottom: 0 }}
                    barGap={6}
                  >
                    <defs>
                      {/* Gradient for Complaints Filed */}
                      <linearGradient id="blueBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity={1} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.7} />
                      </linearGradient>
                      {/* Gradient for Resolved */}
                      <linearGradient id="emeraldBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                        <stop offset="100%" stopColor="#34d399" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.15)" />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "currentColor", fontSize: 12 }}
                      className="text-muted font-medium"
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "currentColor", fontSize: 12 }}
                      className="text-muted font-medium"
                    />
                    <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(37,99,235,0.05)" }} />
                    <Bar
                      dataKey="complaints"
                      name="Filed"
                      fill="url(#blueBarGrad)"
                      radius={[6, 6, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={1400}
                      animationEasing="ease-out"
                    />
                    <Bar
                      dataKey="resolved"
                      name="Resolved"
                      fill="url(#emeraldBarGrad)"
                      radius={[6, 6, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={1600}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted text-xs">
                  Loading chart engine...
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center justify-between text-xs text-muted">
            <span className="flex items-center gap-1 font-semibold text-primary-blue">
              <ShieldCheck className="w-4 h-4" />
              Automated Department Dispatch Active
            </span>
            <span>Avg. Daily Closure: <strong className="text-foreground">{Math.round(totalResolved / (currentBarData.length || 1))} cases/day</strong></span>
          </div>
        </motion.div>

        {/* Right: Pie Chart - Department Distribution */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="lg:col-span-5 bg-card border border-border rounded-3xl p-6 sm:p-7 shadow-premium flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <PieIcon className="w-5 h-5 text-primary-orange" />
                  Department Breakdown
                </h3>
                <p className="text-xs text-muted">Distribution of grievances routed across municipal sectors.</p>
              </div>
            </div>

            {/* Donut Pie Container with Center Stat */}
            <div className="relative w-full h-[220px] flex items-center justify-center">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      isAnimationActive={true}
                      animationDuration={1500}
                      animationEasing="ease-out"
                      onMouseEnter={(_, index) => setActivePieIndex(index)}
                      onMouseLeave={() => setActivePieIndex(null)}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="var(--card)"
                          strokeWidth={2}
                          className="transition-all duration-300 hover:opacity-90 cursor-pointer"
                          style={{
                            transform: activePieIndex === index ? "scale(1.05)" : "scale(1)",
                            transformOrigin: "center",
                          }}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-muted">Loading chart...</div>
              )}

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-xl font-extrabold text-foreground leading-none">
                  {activePieIndex !== null ? pieData[activePieIndex].percentage + "%" : "1,251"}
                </span>
                <span className="text-[10px] text-muted uppercase font-bold tracking-wider mt-0.5">
                  {activePieIndex !== null ? pieData[activePieIndex].name.split(" ")[0] : "Total Cases"}
                </span>
              </div>
            </div>

            {/* Department Breakdown List */}
            <div className="space-y-2.5 mt-2">
              {pieData.map((item, idx) => (
                <div
                  key={idx}
                  onMouseEnter={() => setActivePieIndex(idx)}
                  onMouseLeave={() => setActivePieIndex(null)}
                  className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-all duration-200 cursor-pointer ${
                    activePieIndex === idx
                      ? "bg-muted-background border-primary-blue/40 shadow-sm"
                      : "border-transparent hover:bg-muted-background/40"
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate max-w-[210px]">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="font-semibold text-foreground truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-foreground">{item.value}</span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${item.color}20`, color: item.color }}
                    >
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

    </section>
  );
}
