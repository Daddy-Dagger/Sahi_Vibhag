"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { MapPin, Navigation, Compass, ShieldCheck } from "lucide-react";

interface ComplaintMapViewerProps {
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  formattedAddress?: string | null;
  landmark?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  locationFallback?: string | null;
}

const DEFAULT_CENTER: [number, number] = [32.7266, 74.857];

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

export default function ComplaintMapViewer({
  latitude,
  longitude,
  accuracy,
  formattedAddress,
  landmark,
  city,
  state,
  pincode,
  locationFallback,
}: ComplaintMapViewerProps) {
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [customIcon, setCustomIcon] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("leaflet").then((L) => {
        const pinIcon = L.divIcon({
          className: "custom-leaflet-marker",
          html: `<div style="
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #ff671f, #ea580c);
            border: 3px solid #ffffff;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10px 25px -3px rgba(255, 103, 31, 0.5);
            margin-top: -18px;
            margin-left: -18px;
          ">
            <div style="
              width: 12px;
              height: 12px;
              background: #ffffff;
              border-radius: 50%;
              transform: rotate(45deg);
            "></div>
          </div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 36],
        });
        setCustomIcon(pinIcon);
        setLeafletLoaded(true);
      });
    }
  }, []);

  const hasCoords = latitude && longitude;
  const center: [number, number] = hasCoords
    ? [latitude, longitude]
    : DEFAULT_CENTER;

  const displayAddress = formattedAddress || locationFallback || "Location recorded";

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-premium overflow-hidden space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-extrabold uppercase text-muted tracking-wider flex items-center gap-1.5">
          <Navigation className="w-4 h-4 text-primary-blue animate-pulse" />
          Captured Geolocation & Interactive Map
        </h3>
        {accuracy && (
          <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-md font-extrabold border border-emerald-500/20 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            ±{accuracy}m GPS Accuracy
          </span>
        )}
      </div>

      {/* Map Container */}
      <div className="relative w-full h-[220px] rounded-xl overflow-hidden border border-border bg-slate-900 z-0">
        {leafletLoaded && customIcon ? (
          <MapContainer
            center={center}
            zoom={15}
            scrollWheelZoom={false}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={center} icon={customIcon}>
              <Popup>
                <div className="text-xs font-sans">
                  <strong>Complaint Location</strong>
                  <p className="m-0 text-[11px] text-gray-600">{displayAddress}</p>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-xs text-muted">
            <span>Loading map preview...</span>
          </div>
        )}

        <div className="absolute bottom-2 right-2 bg-slate-900/90 text-white backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono border border-slate-700 shadow-md">
          {hasCoords ? `${latitude?.toFixed(5)}° N, ${longitude?.toFixed(5)}° E` : "Approximate Location"}
        </div>
      </div>

      {/* Structured Address Metadata Grid */}
      <div className="bg-muted-background/40 p-4 rounded-xl border border-border text-xs space-y-2">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-primary-orange shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] text-muted uppercase font-bold block">Formatted Address</span>
            <span className="font-semibold text-foreground">{displayAddress}</span>
          </div>
        </div>

        {(landmark || city || state || pincode) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/60 text-[11px]">
            {landmark && (
              <div>
                <span className="text-[9px] text-muted uppercase font-bold block">Landmark</span>
                <span className="font-bold text-foreground">{landmark}</span>
              </div>
            )}
            {city && (
              <div>
                <span className="text-[9px] text-muted uppercase font-bold block">City</span>
                <span className="font-bold text-foreground">{city}</span>
              </div>
            )}
            {state && (
              <div>
                <span className="text-[9px] text-muted uppercase font-bold block">State</span>
                <span className="font-bold text-foreground">{state}</span>
              </div>
            )}
            {pincode && (
              <div>
                <span className="text-[9px] text-muted uppercase font-bold block">Pincode</span>
                <span className="font-bold text-foreground">{pincode}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
