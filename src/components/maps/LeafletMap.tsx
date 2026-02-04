import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "@/lib/api";

interface MapProps {
  onSelectLocation: (
    lat: number,
    lng: number,
    address: string,
    city: string,
    postalCode: string
  ) => void;
  isLocked?: boolean;
}

interface SearchResult {
  lat: number;
  lng: number;
  title: string;
  description: string;
}

/* ---------------- CUSTOM MARKER ---------------- */

const createCustomIcon = (color: string) =>
  L.divIcon({
    className: "custom-marker",
    html: `
      <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26s16-14 16-26c0-8.837-7.163-16-16-16z" fill="${color}"/>
        <circle cx="16" cy="16" r="6" fill="white"/>
      </svg>
    `,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
  });

/* ---------------- COMPONENT ---------------- */

const LeafletMap = ({ onSelectLocation, isLocked = false }: MapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const isLockedRef = useRef(isLocked);
  const clickInProgressRef = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  /* ---------------- UTILS ---------------- */

  const cleanAddress = (text: string) =>
    text.split(",").slice(0, 4).join(",");

  /* ---------------- REVERSE GEOCODE ---------------- */

  const reverseGeocode = async (lat: number, lng: number) => {
    const res = await api.get("/user/reverse-geocode", {
      params: { lat, lng },
    });

    return {
      address: res.data.address,
      city: res.data.city,
      postalCode: res.data.postalCode,
    };
  };

  /* ---------------- MARKER HANDLER ---------------- */

  const addMarker = async (lat: number, lng: number) => {
    if (!mapRef.current || isLockedRef.current) return;

    if (markerRef.current) {
      mapRef.current.removeLayer(markerRef.current);
    }

    const geo = await reverseGeocode(lat, lng);

    const marker = L.marker([lat, lng], {
      icon: createCustomIcon("#EA4335"),
    }).addTo(mapRef.current);

    markerRef.current = marker;

    onSelectLocation(lat, lng, geo.address, geo.city, geo.postalCode);
  };

  /* ---------------- SEARCH ---------------- */

  const handleSearch = async (query: string) => {
    if (query.trim().length < 3) return;

    setIsSearching(true);
    try {
      const res = await api.get("/user/search-location", {
        params: { q: query },
      });
      setSearchResults(res.data);
      setShowResults(true);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 3) handleSearch(searchQuery);
      else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  /* ---------------- SEARCH SELECT ---------------- */
  const tryGeocode = async (address: string) => {
    return api.get("/user/geocode-address", {
      params: { address },
    });
  };
  
  const simplifyAddress = (address: string) => {
    return address
      .replace(/&/g, " ")
      .replace(/No\.?\s*\d+.*/i, "")
      .replace(/[0-9]/g, "")
      .replace(/[^a-zA-Z\s,]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };
  
const selectResult = async (result: SearchResult) => {
  if (!mapRef.current) return;

  const original = result.description;
  const simplified = simplifyAddress(original);

  try {
    // 1️⃣ Try full cleaned address
    let geoRes;
    try {
      geoRes = await tryGeocode(original);
    } catch {
      // 2️⃣ Retry with simplified address
      geoRes = await tryGeocode(simplified);
    }

    const { lat, lng } = geoRes.data;
    if (typeof lat !== "number" || typeof lng !== "number") return;

    await addMarker(lat, lng);
    mapRef.current.setView([lat, lng], 17);

    setShowResults(false);
    setSearchQuery("");
  } catch (err) {
    console.error("Search select failed even after fallback", err);
  }
};
  /* ---------------- GPS ---------------- */

  const detectLocation = () => {
    if (!navigator.geolocation) return;

    setIsDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        await addMarker(coords.latitude, coords.longitude);
        mapRef.current?.setView(
          [coords.latitude, coords.longitude],
          16
        );
        setIsDetectingLocation(false);
      },
      () => setIsDetectingLocation(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  /* ---------------- MAP INIT (ONCE) ---------------- */

  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map("leaflet-map", {
      center: [12.9716, 77.5946],
      zoom: 13,
      zoomControl: false,
    });

    mapRef.current = map;

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution: "© OpenStreetMap",
        subdomains: "abcd",
        maxZoom: 20,
      }
    ).addTo(map);

    map.on("click", async (e) => {
      if (clickInProgressRef.current || isLockedRef.current) return;
      clickInProgressRef.current = true;
      await addMarker(e.latlng.lat, e.latlng.lng);
      clickInProgressRef.current = false;
    });

    setIsLoading(false);

    return () => {
      map.off();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  /* ---------------- LOCK CONTROL ---------------- */

  useEffect(() => {
    isLockedRef.current = isLocked;
    if (!mapRef.current) return;

    const map = mapRef.current;

    if (isLocked) {
      map.dragging.disable();
      map.scrollWheelZoom.disable();
      map.doubleClickZoom.disable();
      map.touchZoom.disable();
    } else {
      map.dragging.enable();
      map.scrollWheelZoom.enable();
      map.doubleClickZoom.enable();
      map.touchZoom.enable();
    }
  }, [isLocked]);

  /* ---------------- UI ---------------- */

  return (
    <div className="relative w-full z-0 isolate">
      {/* Search UI */}
      <div className="absolute top-3 left-3 right-3 z-20">
        <div className="flex gap-2">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search location..."
            className="flex-1 px-3 py-2 rounded-lg shadow bg-white text-sm"
          />
          <button
            onClick={detectLocation}
            disabled={isDetectingLocation}
            className="px-3 py-2 bg-white rounded-lg shadow"
          >
            📍
          </button>
        </div>

        {showResults && searchResults.length > 0 && (
          <div className="mt-2 bg-white rounded-lg shadow max-h-64 overflow-y-auto">
            {searchResults.map((r, i) => (
              <button
                key={i}
                onClick={() => selectResult(r)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50"
              >
                <div className="text-sm font-medium">{r.title}</div>
                <div className="text-xs text-gray-500">{r.description}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading && (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
          Loading map...
        </div>
      )}

      <div
        id="leaflet-map"
        className="w-full h-[400px] rounded-lg  z-0"
      />
    </div>
  );
};

export default LeafletMap;
