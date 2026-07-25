"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  MapPin,
  Search,
  AlertCircle,
  Loader2,
  ShieldCheck,
  LocateFixed
} from "lucide-react";

export interface LocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  formattedAddress: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  status: "idle" | "requesting" | "granted" | "denied" | "unavailable";
  errorMsg?: string;
}

interface LocationPickerProps {
  locationData: LocationState;
  onChange: (data: LocationState) => void;
}

// Default fallback coordinates (Jammu, India)
const DEFAULT_CENTER: [number, number] = [32.7266, 74.857];

// Dynamically import Leaflet components to avoid Next.js SSR window errors
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

// Map Event Helper Component to handle clicks and view auto-center
function MapController({
  center,
  onMapClick,
}: {
  center: [number, number];
  onMapClick: (lat: number, lng: number) => void;
}) {
  const { useMapEvents, useMap } = require("react-leaflet");
  const map = useMap();

  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom() || 16, { animate: true });
    }
  }, [center, map]);

  useMapEvents({
    click(e: any) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}

export default function LocationPicker({ locationData, onChange }: LocationPickerProps) {
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [customIcon, setCustomIcon] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const markerRef = useRef<any>(null);

  // Initialize Leaflet custom pin icon on client mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("leaflet").then((L) => {
        const pinIcon = L.divIcon({
          className: "custom-leaflet-marker",
          html: `<div style="
            width: 38px;
            height: 38px;
            background: linear-gradient(135deg, #ef4444, #dc2626);
            border: 3px solid #ffffff;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10px 25px -3px rgba(239, 68, 68, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.1);
            margin-top: -19px;
            margin-left: -19px;
            cursor: grab;
          ">
            <div style="
              width: 14px;
              height: 14px;
              background: #ffffff;
              border-radius: 50%;
              transform: rotate(45deg);
            "></div>
          </div>`,
          iconSize: [38, 38],
          iconAnchor: [19, 38],
        });
        setCustomIcon(pinIcon);
        setLeafletLoaded(true);
      });
    }
  }, []);

  // 1. Request browser location permission & position on mount
  useEffect(() => {
    if (locationData.status === "idle") {
      requestLocationPermission();
    }
  }, []);

  // Reverse Geocoding Function using OpenStreetMap Nominatim API
  const reverseGeocode = async (lat: number, lng: number, accuracy?: number | null) => {
    setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        { headers: { "Accept-Language": "en" } }
      );
      if (!res.ok) throw new Error("Failed to fetch address");
      const data = await res.json();

      const addr = data.address || {};
      const formatted = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.suburb ||
        addr.county ||
        "";
      const state = addr.state || addr.state_district || "";
      const pincode = addr.postcode || "";
      const landmarkSuggestion =
        addr.road || addr.suburb || addr.neighbourhood || addr.amenity || "";

      onChange({
        ...locationData,
        latitude: Number(lat.toFixed(6)),
        longitude: Number(lng.toFixed(6)),
        accuracy: accuracy !== undefined ? accuracy : locationData.accuracy,
        formattedAddress: formatted,
        city: city,
        state: state,
        pincode: pincode,
        landmark: locationData.landmark || landmarkSuggestion,
      });
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      // Fallback if reverse geocode fails
      onChange({
        ...locationData,
        latitude: Number(lat.toFixed(6)),
        longitude: Number(lng.toFixed(6)),
        accuracy: accuracy !== undefined ? accuracy : locationData.accuracy,
        formattedAddress: locationData.formattedAddress || `Latitude: ${lat.toFixed(5)}, Longitude: ${lng.toFixed(5)}`,
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  // Browser Geolocation API request
  const requestLocationPermission = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      onChange({
        ...locationData,
        status: "unavailable",
        errorMsg: "Geolocation is not supported by your browser.",
      });
      return;
    }

    onChange({
      ...locationData,
      status: "requesting",
      errorMsg: undefined,
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const roundedAcc = Math.round(accuracy);
        onChange({
          ...locationData,
          latitude: Number(latitude.toFixed(6)),
          longitude: Number(longitude.toFixed(6)),
          accuracy: roundedAcc,
          status: "granted",
        });
        reverseGeocode(latitude, longitude, roundedAcc);
      },
      (error) => {
        console.warn("Geolocation error code:", error.code, error.message);
        let errorMsg = "Unable to retrieve location.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Location permission was denied. You can manually select location on the map below.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = "Location information is unavailable.";
        } else if (error.code === error.TIMEOUT) {
          errorMsg = "Location request timed out.";
        }

        // Set status to denied or unavailable, fallback to default center if no coordinates
        const fallbackLat = locationData.latitude || DEFAULT_CENTER[0];
        const fallbackLng = locationData.longitude || DEFAULT_CENTER[1];

        onChange({
          ...locationData,
          latitude: fallbackLat,
          longitude: fallbackLng,
          accuracy: null,
          status: error.code === error.PERMISSION_DENIED ? "denied" : "unavailable",
          errorMsg,
        });

        if (!locationData.formattedAddress) {
          reverseGeocode(fallbackLat, fallbackLng, null);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Handle marker dragging
  const handleMarkerDragEnd = () => {
    const marker = markerRef.current;
    if (marker) {
      const latLng = marker.getLatLng();
      reverseGeocode(latLng.lat, latLng.lng, locationData.accuracy);
    }
  };

  // Handle click on map
  const handleMapClick = (lat: number, lng: number) => {
    reverseGeocode(lat, lng, locationData.accuracy);
  };

  // Address search query submit
  const handleAddressSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setShowSearchResults(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
          searchQuery
        )}&limit=5`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Select location from search dropdown
  const handleSelectSearchResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setShowSearchResults(false);
    setSearchQuery("");
    reverseGeocode(lat, lng, null);
  };

  // Current center coordinates for map view
  const currentCenter: [number, number] = useMemo(() => {
    if (locationData.latitude && locationData.longitude) {
      return [locationData.latitude, locationData.longitude];
    }
    return DEFAULT_CENTER;
  }, [locationData.latitude, locationData.longitude]);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-premium space-y-5">
      {/* Header with Permission Status & Auto Locate Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-orange animate-bounce" />
            Automatic Location Capture & Map Pin
          </h3>
          <p className="text-xs text-muted">
            Drag the pin or click on the map to fine-tune the exact complaint location.
          </p>
        </div>

        <button
          type="button"
          onClick={requestLocationPermission}
          disabled={locationData.status === "requesting"}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-blue/10 hover:bg-primary-blue/20 text-primary-blue text-xs font-bold transition-all border border-primary-blue/20 self-start sm:self-auto cursor-pointer"
        >
          {locationData.status === "requesting" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <LocateFixed className="w-3.5 h-3.5 text-primary-blue" />
          )}
          <span>{locationData.status === "requesting" ? "Locating..." : "Locate Me"}</span>
        </button>
      </div>

      {/* Permission & Status Banner */}
      <div>
        {locationData.status === "requesting" && (
          <div className="flex items-center gap-2 p-3 bg-blue-500/10 text-blue-600 rounded-xl text-xs font-medium border border-blue-500/20">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>Requesting browser location permission... Please click "Allow" on your browser prompt.</span>
          </div>
        )}

        {locationData.status === "granted" && (
          <div className="flex items-center justify-between p-3 bg-emerald-500/10 text-emerald-600 rounded-xl text-xs font-semibold border border-emerald-500/20">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Location permission granted & auto-captured!</span>
            </div>
            {locationData.accuracy && (
              <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                ±{locationData.accuracy}m accuracy
              </span>
            )}
          </div>
        )}

        {(locationData.status === "denied" || locationData.status === "unavailable") && (
          <div className="p-3 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-xl text-xs border border-amber-500/20 space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Location Permission Denied or Unavailable</span>
            </div>
            <p className="text-[11px] text-muted pl-6">
              {locationData.errorMsg || "Manual location selection enabled. Drop a pin on the map or search address below."}
            </p>
          </div>
        )}
      </div>

      {/* Location Search Bar */}
      <div className="relative">
        <form onSubmit={handleAddressSearch} className="flex gap-2">
          <div className="relative flex-grow">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search area, landmark or street address..."
              className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-blue/30"
            />
            <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
          </div>
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="px-3.5 py-2 bg-primary-blue text-white rounded-xl text-xs font-bold hover:bg-primary-blue/90 disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Search"}
          </button>
        </form>

        {/* Search Results Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden max-h-56 overflow-y-auto">
            {searchResults.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSearchResult(item)}
                className="w-full text-left px-3 py-2.5 text-xs text-foreground hover:bg-muted-background border-b border-border/50 last:border-0 flex items-start gap-2 transition-colors cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-primary-orange shrink-0 mt-0.5" />
                <span className="line-clamp-2">{item.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Leaflet Interactive Map */}
      <div className="relative w-full h-[260px] sm:h-[320px] rounded-xl overflow-hidden border border-border bg-slate-900 z-0">
        {isGeocoding && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-xs z-20 flex items-center justify-center gap-2 text-xs font-bold text-primary-blue">
            <Loader2 className="w-5 h-5 animate-spin" />
            Updating address details...
          </div>
        )}

        {leafletLoaded && customIcon ? (
          <MapContainer
            center={currentCenter}
            zoom={16}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {locationData.latitude && locationData.longitude && (
              <Marker
                position={[locationData.latitude, locationData.longitude]}
                draggable={true}
                icon={customIcon}
                ref={markerRef}
                eventHandlers={{
                  dragend: handleMarkerDragEnd,
                }}
              />
            )}
            <MapController center={currentCenter} onMapClick={handleMapClick} />
          </MapContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-xs text-muted gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary-blue" />
            <span>Loading interactive map...</span>
          </div>
        )}

        {/* Floating helper overlay */}
        <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none flex justify-between items-center">
          <span className="bg-card/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-foreground border border-border shadow-md">
            📍 Drag marker pin or click map to move
          </span>
          {locationData.latitude && locationData.longitude && (
            <span className="bg-slate-900/90 text-white backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono border border-slate-700 shadow-md hidden sm:inline">
              {locationData.latitude.toFixed(4)}, {locationData.longitude.toFixed(4)}
            </span>
          )}
        </div>
      </div>

      {/* Auto-Filled & Editable Address Fields */}
      <div className="space-y-3 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Formatted Address */}
          <div className="sm:col-span-12">
            <label className="text-[10px] uppercase font-bold text-muted block mb-1">
              Detected / Formatted Address <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              value={locationData.formattedAddress}
              onChange={(e) =>
                onChange({ ...locationData, formattedAddress: e.target.value })
              }
              placeholder="Full street address auto-filled from map pin"
              className="w-full p-2.5 border border-border bg-background rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-blue/30"
            />
          </div>

          {/* Optional Landmark */}
          <div className="sm:col-span-6">
            <label className="text-[10px] uppercase font-bold text-muted block mb-1">
              Landmark / Nearby Spot (Optional)
            </label>
            <input
              type="text"
              value={locationData.landmark}
              onChange={(e) => onChange({ ...locationData, landmark: e.target.value })}
              placeholder="e.g. Near Water Tank, Opposite Govt School"
              className="w-full px-3 py-2 border border-border bg-background rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-blue/30"
            />
          </div>

          {/* City */}
          <div className="sm:col-span-6">
            <label className="text-[10px] uppercase font-bold text-muted block mb-1">City / District</label>
            <input
              type="text"
              value={locationData.city}
              onChange={(e) => onChange({ ...locationData, city: e.target.value })}
              placeholder="e.g. Jammu"
              className="w-full px-3 py-2 border border-border bg-background rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-blue/30"
            />
          </div>

          {/* State */}
          <div className="sm:col-span-6">
            <label className="text-[10px] uppercase font-bold text-muted block mb-1">State / UT</label>
            <input
              type="text"
              value={locationData.state}
              onChange={(e) => onChange({ ...locationData, state: e.target.value })}
              placeholder="e.g. Jammu & Kashmir"
              className="w-full px-3 py-2 border border-border bg-background rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-blue/30"
            />
          </div>

          {/* Pincode */}
          <div className="sm:col-span-6">
            <label className="text-[10px] uppercase font-bold text-muted block mb-1">Pincode</label>
            <input
              type="text"
              value={locationData.pincode}
              onChange={(e) => onChange({ ...locationData, pincode: e.target.value })}
              placeholder="e.g. 180001"
              className="w-full px-3 py-2 border border-border bg-background rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-blue/30"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
