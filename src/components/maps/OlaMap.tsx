// import { useEffect, useState } from "react";
// import { OlaMaps } from "olamaps-web-sdk";

// interface OlaMapProps {
//   onSelectLocation: (lat: number, lng: number) => void;
// }

// const OlaMap = ({ onSelectLocation }: OlaMapProps) => {
//   const [mapError, setMapError] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     const apiKey = import.meta.env.VITE_OLA_MAPS_API_KEY;

//     // Validate API key exists
//     if (!apiKey) {
//       setMapError("Ola Maps API key is missing. Please add VITE_OLA_MAPS_API_KEY to your .env file");
//       setIsLoading(false);
//       return;
//     }

//     const initMap = async () => {
//       try {
//         const olaMaps = new OlaMaps({
//           apiKey: apiKey,
//         });

//         const map = await olaMaps.init({
//           container: "ola-map",
//           // DON'T add api_key to style URL - SDK adds it automatically
//           style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
//           center: [77.5946, 12.9716], // Bangalore default
//           zoom: 13,
//         });

//         // Add a marker that moves on click
//         let marker: any = null;

//         map.on("click", (e: any) => {
//           const { lat, lng } = e.lngLat;
          
//           // Remove existing marker
//           if (marker) {
//             marker.remove();
//           }

//           // Add new marker at clicked location
//           marker = olaMaps.addMarker({
//             offset: [0, -10],
//             anchor: "bottom",
//             color: "red",
//             draggable: false,
//           })
//           .setLngLat([lng, lat])
//           .addTo(map);

//           // Notify parent component
//           onSelectLocation(lat, lng);
//         });

//         setIsLoading(false);
//       } catch (error) {
//         console.error("Map initialization error:", error);
//         setMapError(
//           error instanceof Error 
//             ? `Failed to load map: ${error.message}` 
//             : "Failed to load map. Please check your API key and try again."
//         );
//         setIsLoading(false);
//       }
//     };

//     initMap();

//     // Cleanup
//     return () => {
//       const mapContainer = document.getElementById("ola-map");
//       if (mapContainer) {
//         mapContainer.innerHTML = "";
//       }
//     };
//   }, [onSelectLocation]);

//   if (mapError) {
//     return (
//       <div className="w-full h-[300px] rounded-lg border bg-red-50 flex items-center justify-center p-4">
//         <div className="text-center">
//           <p className="text-red-600 font-semibold mb-2">Map Error</p>
//           <p className="text-sm text-red-500">{mapError}</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="relative">
//       {isLoading && (
//         <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center z-10">
//           <p className="text-gray-600">Loading map...</p>
//         </div>
//       )}
//       <div
//         id="ola-map"
//         className="w-full h-[300px] rounded-lg border"
//       />
//     </div>
//   );
// };

// export default OlaMap;

