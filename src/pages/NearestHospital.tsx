import React, { useEffect, useState } from "react";
import { Hospital, MapPin } from "lucide-react";

// Example static hospital list
const hospitals = [
  { name: "City Hospital", lat: 12.9716, lng: 77.5946 },
  { name: "General Hospital", lat: 12.9352, lng: 77.6245 },
  { name: "Metro Hospital", lat: 12.9867, lng: 77.5531 },
];

const apiKey = import.meta.env.VITE_OLA_MAPS_API_KEY;

function getDistance(lat1, lng1, lat2, lng2) {
  // Haversine formula
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const NearestHospital = () => {
  const [userLoc, setUserLoc] = useState(null);
  const [nearest, setNearest] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLoc(loc);
        // Find nearest hospital
        const sorted = hospitals
          .map((h) => ({ ...h, dist: getDistance(loc.lat, loc.lng, h.lat, h.lng) }))
          .sort((a, b) => a.dist - b.dist);
        setNearest(sorted[0]);
      },
      () => setError("Location access denied. Please enable location services."),
      { enableHighAccuracy: true }
    );
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-medical-50 via-blue-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 p-8">
      <h1 className="text-5xl font-extrabold mb-10 text-medical-800 dark:text-medical-100 tracking-tight drop-shadow-lg">Nearest Hospitals</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {!userLoc && !error && <div className="text-gray-500 animate-pulse">Getting your location...</div>}
      {userLoc && (
        <div className="flex flex-col md:flex-row w-full max-w-6xl gap-10 items-start justify-center">
          {/* Hospital List */}
          <div className="flex-1 w-full md:w-1/2">
            <div className="bg-gradient-to-r from-medical-100 via-blue-50 to-blue-100 dark:from-gray-800 dark:via-gray-900 dark:to-slate-900 rounded-2xl shadow-xl p-6">
              <div className="text-lg font-bold text-medical-700 dark:text-medical-200 mb-6 flex items-center gap-2">
                <Hospital className="w-6 h-6 text-emergency-500" /> Hospital List
              </div>
              <div className="space-y-6">
                {hospitals
                  .map((h) => ({
                    ...h,
                    dist: getDistance(userLoc.lat, userLoc.lng, h.lat, h.lng),
                  }))
                  .sort((a, b) => a.dist - b.dist)
                  .map((h, idx) => (
                    <div
                      key={idx}
                      className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl border border-gray-100 dark:border-gray-700 ${idx === 0 ? 'border-2 border-emergency-500' : ''}`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Hospital className="w-7 h-7 text-medical-500" />
                        <h2 className="text-2xl font-bold text-medical-700 dark:text-medical-200">{h.name}</h2>
                        {idx === 0 && (
                          <span className="ml-2 px-3 py-1 rounded-full bg-emergency-500 text-white text-xs font-bold animate-pulse">Nearest</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2 text-gray-700 dark:text-gray-300">
                        <MapPin className="w-5 h-5 text-blue-500" />
                        <span>Distance: {h.dist.toFixed(2)} km</span>
                      </div>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&origin=${userLoc.lat},${userLoc.lng}&destination=${h.lat},${h.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 px-6 py-3 bg-emergency-500 text-white rounded-lg font-bold shadow hover:bg-emergency-600 transition"
                      >
                        Get Directions with Google Maps
                      </a>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          {/* Divider */}
          <div className="hidden md:block w-0.5 h-[440px] bg-gradient-to-b from-blue-200 via-medical-200 to-blue-100 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900 mx-2 rounded-full shadow" />
          {/* Map Component */}
          <div className="flex-1 w-full md:w-1/2 flex items-center justify-center">
            <div className="bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-xl p-2 w-full h-[440px] flex items-center justify-center">
              <iframe
                title="Google Map"
                src={`https://maps.google.com/maps?q=${userLoc.lat},${userLoc.lng}&z=13&output=embed`}
                width="100%"
                height="400"
                style={{ border: 0, borderRadius: "1rem" }}
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NearestHospital;
