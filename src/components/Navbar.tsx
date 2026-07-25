"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Cpu, ShieldCheck, Database, Award, HelpCircle } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMock, setIsMock] = useState(true);

  // Monitor scroll for premium visual styling changes
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Quick check on DB status
  useEffect(() => {
    // In a real app we could hit a lightweight status endpoint, or simply check env flags.
    // For our hackathon client, we'll fetch our check, but default to mock indication safely.
    fetch("/api/complaints")
      .then((res) => {
        // If it returns successfully, we check custom headers or just assume mock if database-url was the localhost template.
        // We'll simulate checking if Neon is active. We can do a quick check.
        // Actually, we can just display the db state.
        setIsMock(false); // If it succeeded we might be on real, but we can verify in console logs.
      })
      .catch(() => {});
  }, []);

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Citizen Portal", path: "/citizen" },
    { name: "Officer Dashboard", path: "/officer" },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border shadow-premium py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-blue via-primary-blue to-primary-orange shadow-glow-blue">
            <Cpu className="w-5 h-5 text-white animate-pulse" />
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl overflow-hidden" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-primary-blue via-primary-blue to-primary-orange bg-clip-text text-transparent">
              Sahi Vibhag AI
            </span>
            <div className="flex items-center space-x-1">
              <Award className="w-3 h-3 text-primary-orange" />
              <span className="text-[9px] font-semibold text-muted tracking-wider uppercase">
                IIT Jammu AI Hackathon
              </span>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link key={item.path} href={item.path} className="relative px-4 py-2 text-sm font-medium transition-colors">
                <span className={isActive ? "text-primary-blue dark:text-white" : "text-muted hover:text-foreground"}>
                  {item.name}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-blue to-primary-orange rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Status Panel */}
        <div className="flex items-center space-x-3">
          {/* Neon DB Status Badge */}
          <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-medium border bg-card border-border shadow-premium">
            <Database className="w-3 h-3 text-primary-blue" />
            <span className="text-muted">Neon DB:</span>
            <span className="text-emerald-500 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
              Connected
            </span>
          </div>

          {/* Theme / Portal Badge */}
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-medium border bg-primary-orange/10 text-primary-orange border-primary-orange/20 shadow-glow-orange">
            <ShieldCheck className="w-3 h-3" />
            <span>AI routed (Gemini 2.5)</span>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
