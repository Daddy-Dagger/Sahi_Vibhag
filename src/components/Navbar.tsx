"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Cpu, ShieldCheck, Database, Award, User, LogOut, Lock, LogIn } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; role: string; department?: string } | null>(null);

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

  // Fetch current user session
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null));
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
    router.refresh();
  };

  // Discrete consumer navbar items (Officer links MUST NOT appear on main navbar)
  const navItems = [
    { name: "Home", path: "/" },
    { name: "Grievance Portal", path: "/citizen" },
    ...(user && user.role === "CONSUMER" ? [{ name: "Citizen Dashboard", path: "/dashboard" }] : []),
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

        {/* Public Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link key={item.path} href={item.path} className="relative px-4 py-2 text-sm font-medium transition-colors">
                <span className={isActive ? "text-primary-blue dark:text-white font-semibold" : "text-muted hover:text-foreground"}>
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

          {/* Render Officer Dashboard link ONLY if user is currently authenticated as an OFFICER */}
          {user && user.role === "OFFICER" && (
            <Link href="/officer" className="relative px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1.5 ml-2 hover:bg-amber-500/20 transition">
              <Lock className="w-3 h-3" />
              <span>Officer Portal</span>
            </Link>
          )}
        </nav>

        {/* Right Status & Auth Panel */}
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

          {/* User Profile / Auth State */}
          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-foreground leading-tight">{user.name}</span>
                <span className="text-[10px] text-muted font-medium uppercase tracking-wider">{user.role}</span>
              </div>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-medium text-muted hover:text-foreground transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-blue to-primary-blue/90 text-white text-xs font-semibold shadow-glow-blue hover:opacity-95 transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Consumer Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  );
}

