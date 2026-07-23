import Link from "next/link";
import { Award, Cpu, ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: App Info */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-6 h-6 rounded bg-primary-blue text-white font-bold text-xs">
                S
              </div>
              <span className="font-semibold text-foreground text-sm tracking-tight">
                Sahi Vibhag AI
              </span>
            </div>
            <p className="text-xs text-muted max-w-sm">
              An intelligent, multilingual civic grievance assistant converting voice and text inputs into structured, action-ready routing drafts for government officials.
            </p>
          </div>

          {/* Column 2: Hackathon info */}
          <div className="flex flex-col space-y-2">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Hackathon Metadata
            </h3>
            <div className="flex flex-col space-y-1.5 text-xs text-muted">
              <span className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-primary-orange" />
                IIT Jammu AI Hackathon 2026
              </span>
              <span>Theme: AI for Bharat: Governance & Social Impact</span>
              <span className="flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-primary-blue" />
                Powered by Gemini 2.5 Flash
              </span>
            </div>
          </div>

          {/* Column 3: Quick Links */}
          <div className="flex flex-col space-y-2">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Portals
            </h3>
            <div className="flex space-x-4 text-xs text-muted">
              <Link href="/" className="hover:text-primary-blue transition-colors">
                Home
              </Link>
              <Link href="/citizen" className="hover:text-primary-blue transition-colors">
                Citizen Portal
              </Link>
              <Link href="/officer" className="hover:text-primary-blue transition-colors">
                Officer Dashboard
              </Link>
            </div>
            <p className="text-[10px] text-muted-foreground pt-2">
              Future Ready: Bhashini speech translation API, OpenStreetMap location routing, and RAG citizen guide.
            </p>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-muted">
          <span>
            &copy; {new Date().getFullYear()} Sahi Vibhag AI. All rights reserved.
          </span>
          <span className="mt-2 sm:mt-0 flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Secured Government Technology Interface</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
