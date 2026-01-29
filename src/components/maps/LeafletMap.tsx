import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapProps {
  onSelectLocation: (lat: number, lng: number, address: string) => void;
  isLocked?: boolean;
}

interface SearchResult {
  lat: string;
  lon: string;
  display_name: string;
}

/* ---------------- CUSTOM MARKER ICONS ---------------- */
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="position: relative;">
        <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26s16-14 16-26c0-8.837-7.163-16-16-16z" fill="${color}"/>
          <circle cx="16" cy="16" r="6" fill="white"/>
        </svg>
      </div>
    `,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
  });
};

/* ---------------- COMPONENT ---------------- */

const LeafletMap = ({ onSelectLocation, isLocked = false }: MapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [tempLocation, setTempLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  /* Reverse geocode */
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  /* Search locations */
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json` +
        `&q=${encodeURIComponent(query + ", Bangalore, Karnataka, India")}` +
        `&limit=8` +
        `&addressdetails=1` +
        `&bounded=1` +
        `&viewbox=77.4,13.1,77.8,12.8`
      );
      const data = await response.json();
      setSearchResults(data);
      setShowResults(true);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  /* Debounced search */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  /* Add temporary marker */
  const addTempMarker = async (lat: number, lng: number, addressFromSearch?: string) => {
    if (isLocked || !mapRef.current) return;

    if (markerRef.current) {
      markerRef.current.remove();
    }

    const address = addressFromSearch || await reverseGeocode(lat, lng);

    markerRef.current = L.marker([lat, lng], {
      icon: createCustomIcon("#EA4335"),
    })
      .addTo(mapRef.current)
      .bindPopup(
        `
        <div style="min-width: 200px; font-family: system-ui, -apple-system, sans-serif;">
          <div style="font-weight: 600; font-size: 14px; color: #202124; margin-bottom: 8px;">
            Selected Location
          </div>
          <div style="font-size: 12px; color: #5f6368; line-height: 1.4; margin-bottom: 8px;">
            ${address}
          </div>
          <div style="font-size: 11px; color: #80868b; padding-top: 8px; border-top: 1px solid #e8eaed;">
            ${lat.toFixed(6)}, ${lng.toFixed(6)}
          </div>
        </div>
      `,
        { maxWidth: 300, className: "custom-popup" }
      )
      .openPopup();

    setTempLocation({ lat, lng, address });
    onSelectLocation(lat, lng, address);
  };

  /* Select search result */
  const selectResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 17, { animate: true });
      addTempMarker(lat, lng, result.display_name);
    }

    setShowResults(false);
    setSearchQuery("");
  };

  /* Detect location */
  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        if (mapRef.current) {
          const address = await reverseGeocode(latitude, longitude);
          await addTempMarker(latitude, longitude, address);
          mapRef.current.setView([latitude, longitude], 16, { animate: true });
        }

        setIsDetectingLocation(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Unable to detect your location. Please check your browser permissions.");
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  /* Initialize map */
  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map("leaflet-map", {
      center: [12.9716, 77.5946],
      zoom: 13,
      zoomControl: false,
      dragging: !isLocked,
      touchZoom: !isLocked,
      doubleClickZoom: !isLocked,
      scrollWheelZoom: !isLocked,
      boxZoom: false,
      keyboard: !isLocked,
      // tap: true,
    });

    mapRef.current = map;

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution: '© OpenStreetMap',
        subdomains: "abcd",
        maxZoom: 20,
      }
    ).addTo(map);

    map.on("click", async (e: L.LeafletMouseEvent) => {
      if (!isLocked) {
        const { lat, lng } = e.latlng;
        await addTempMarker(lat, lng);
      }
    });

    setIsLoading(false);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [isLocked]);

  return (
    <div className="relative w-full z-[10]">
      {/* Search Bar */}
      <div className="absolute top-3 left-3 right-3 z-[1000] pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              placeholder="Search..."
              disabled={isLocked}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 pr-10 sm:pr-12 rounded-lg shadow-lg border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-xs sm:text-sm disabled:opacity-60"
            />
            
            <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {isSearching ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-500"></div>
              ) : (
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </div>
            
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  setShowResults(false);
                }}
                className="absolute right-8 sm:right-10 top-1/2 -translate-y-1/2 hover:bg-gray-100 rounded-full p-1"
              >
                <svg className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}

            {showResults && searchResults.length > 0 && (
              <div className="absolute w-full mt-2 bg-white rounded-lg shadow-2xl max-h-48 sm:max-h-64 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => selectResult(result)}
                    className="w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-start gap-2">
                      <svg className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm text-gray-900 font-medium truncate">
                          {result.display_name.split(",")[0]}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {result.display_name}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={detectLocation}
            disabled={isDetectingLocation || isLocked}
            className="px-2.5 sm:px-3 py-2 sm:py-2.5 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow disabled:opacity-60 flex-shrink-0"
            title="Detect my location"
          >
            {isDetectingLocation ? (
              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-gray-300 border-t-blue-500"></div>
            ) : (
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 z-[401] bg-white rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-4 border-gray-200 border-t-blue-500 mx-auto mb-2 sm:mb-3"></div>
            <p className="text-xs sm:text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      <div
        id="leaflet-map"
        className="w-full h-[300px] sm:h-[350px] lg:h-[400px] rounded-lg"
        style={{ background: "#f0f0f0" }}
      />

      {tempLocation && (
        <div className="mt-3 p-2.5 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <div className="text-xs text-green-700 font-medium">Location Selected</div>
              <div className="text-xs text-gray-700 mt-0.5 line-clamp-2">{tempLocation.address}</div>
            </div>
          </div>
        </div>
      )}

      {!tempLocation && !isLocked && (
        <div className="mt-2 text-center text-xs text-gray-500">
          Click map, search, or use GPS to select location
        </div>
      )}

      <style>{`
        .custom-marker {
          background: transparent;
          border: none;
        }
        
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .custom-popup .leaflet-popup-content {
          margin: 12px 14px;
        }
        
        .custom-popup .leaflet-popup-tip {
          background: white;
        }
        
        .leaflet-container {
          font-family: system-ui, -apple-system, sans-serif;
        }
        
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25) !important;
          margin: 8px !important;
        }
        
        .leaflet-control-zoom a {
          width: 28px !important;
          height: 28px !important;
          line-height: 28px !important;
          font-size: 16px !important;
          border: none !important;
          background-color: white !important;
          color: #666 !important;
        }
        
        @media (min-width: 640px) {
          .leaflet-control-zoom a {
            width: 30px !important;
            height: 30px !important;
            line-height: 30px !important;
          }
        }
        
        .leaflet-control-zoom a:hover {
          background-color: #f5f5f5 !important;
        }
        
        .leaflet-top,
        .leaflet-bottom {
          z-index: 399 !important;
        }

        .leaflet-popup-pane {
          z-index: 700 !important;
        }
      `}</style>
    </div>
  );
};

export default LeafletMap;