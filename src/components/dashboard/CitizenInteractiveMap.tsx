"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { MapPin, Navigation, Eye, CheckCircle2, Clock, AlertTriangle, ShieldCheck } from "lucide-react";

interface ComplaintMapMarker {
  id: string;
  title: string;
  department: string;
  priority: string;
  status: string;
  location?: string | null;
  formattedAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface CitizenInteractiveMapProps {
  complaints: ComplaintMapMarker[];
  onSelectComplaint?: (complaint: ComplaintMapMarker) => void;
}

const DEFAULT_CENTER: [number, number] = [32.7266, 74.857]; // Jammu default coordinates

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

export default function CitizenInteractiveMap({
  complaints,
  onSelectComplaint,
}: CitizenInteractiveMapProps) {
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [icons, setIcons] = useState<Record<string, any>>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("leaflet").then((L) => {
        const createMarkerIcon = (color: string, glow: string) => {
          return L.divIcon({
            className: "custom-dashboard-marker",
            html: `<div style="
              width: 34px;
              height: 34px;
              background: ${color};
              border: 3px solid #ffffff;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 8px 20px ${glow};
              margin-top: -17px;
              margin-left: -17px;
              cursor: pointer;
            ">
              <div style="
                width: 10px;
                height: 10px;
                background: #ffffff;
                border-radius: 50%;
                transform: rotate(45deg);
              "></div>
            </div>`,
            iconSize: [34, 34],
            iconAnchor: [17, 34],
          });
        };

        setIcons({
          RESOLVED: createMarkerIcon("linear-gradient(135deg, #10b981, #059669)", "rgba(16, 185, 129, 0.5)"),
          IN_PROGRESS: createMarkerIcon("linear-gradient(135deg, #3b82f6, #2563eb)", "rgba(59, 130, 246, 0.5)"),
          PENDING: createMarkerIcon("linear-gradient(135deg, #ef4444, #dc2626)", "rgba(239, 68, 68, 0.5)"),
          REJECTED: createMarkerIcon("linear-gradient(135deg, #64748b, #475569)", "rgba(100, 116, 139, 0.4)"),
        });

        setLeafletLoaded(true);
      });
    }
  }, []);

  // Filter complaints that have valid coordinates
  const validMapComplaints = complaints.filter(
    (c) => c.latitude && c.longitude && !isNaN(Number(c.latitude)) && !isNaN(Number(c.longitude))
  );

  // Compute center from markers or fallback
  const center: [number, number] = validMapComplaints.length > 0
    ? [Number(validMapComplaints[0].latitude), Number(validMapComplaints[0].longitude)]
    : DEFAULT_CENTER;

  return (
    <div className="bg-card/90 backdrop-blur-xl border border-border/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-border/50">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary-blue/10 text-primary-blue">
              <Navigation className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Interactive Civic Map</h3>
              <p className="text-xs text-muted">
                Visualizing all your filed complaints mapped geographically across departments
              </p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Resolved</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-medium">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>Pending</span>
          </div>
        </div>
      </div>

      {/* Map display */}
      <div className="relative w-full h-[380px] rounded-2xl overflow-hidden border border-border bg-slate-950 shadow-inner z-0">
        {leafletLoaded ? (
          <MapContainer
            center={center}
            zoom={validMapComplaints.length > 0 ? 13 : 11}
            scrollWheelZoom={false}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {validMapComplaints.map((complaint) => {
              const markerIcon = icons[complaint.status] || icons["PENDING"];
              return (
                <Marker
                  key={complaint.id}
                  position={[Number(complaint.latitude), Number(complaint.longitude)]}
                  icon={markerIcon}
                >
                  <Popup>
                    <div className="text-xs font-sans min-w-[200px] p-1 space-y-2">
                      <div className="flex items-center justify-between gap-2 border-b pb-1.5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                          #{complaint.id.substring(0, 8)}
                        </span>
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            complaint.status === "RESOLVED"
                              ? "bg-emerald-100 text-emerald-700"
                              : complaint.status === "IN_PROGRESS"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {complaint.status.replace("_", " ")}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-900 leading-snug">{complaint.title}</h4>
                      <p className="text-[11px] text-gray-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                        {complaint.formattedAddress || complaint.location || "Location recorded"}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        Dept: <strong>{complaint.department}</strong>
                      </p>
                      {onSelectComplaint && (
                        <button
                          onClick={() => onSelectComplaint(complaint)}
                          className="w-full mt-1.5 py-1 px-2 rounded-lg bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center gap-1 hover:bg-blue-700 transition"
                        >
                          <Eye className="w-3 h-3" />
                          View Complaint Details
                        </button>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-xs text-muted gap-2">
            <span className="w-6 h-6 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
            <span>Loading interactive map markers...</span>
          </div>
        )}

        {validMapComplaints.length === 0 && (
          <div className="absolute top-4 left-4 right-4 bg-background/90 backdrop-blur-md p-3 rounded-xl border border-border text-center text-xs text-muted z-10 shadow-lg">
            No mapped complaint locations found. Create a new grievance with GPS location to see map markers.
          </div>
        )}
      </div>
    </div>
  );
}
