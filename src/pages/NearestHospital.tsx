import React, { useEffect, useState } from "react";

// Example static hospital list
const hospitals = [
  { name: "City Hospital", lat: 12.9716, lng: 77.5946 },
  { name: "General Hospital", lat: 12.9352, lng: 77.6245 },
  { name: "Metro Hospital", lat: 12.9867, lng: 77.5531 },
];

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-medical-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 p-8">
      <h1 className="text-4xl font-bold mb-6 text-medical-800 dark:text-medical-100">Nearest Hospital</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {!userLoc && !error && <div className="text-gray-500">Getting your location...</div>}
      {userLoc && nearest && (
        <div className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-2 text-medical-700 dark:text-medical-200">{nearest.name}</h2>
          <p className="mb-2 text-gray-700 dark:text-gray-300">Distance: {nearest.dist.toFixed(2)} km</p>
          <a
            href={`https://maps.ola.com/?saddr=${userLoc.lat},${userLoc.lng}&daddr=${nearest.lat},${nearest.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emergency-500 text-white px-6 py-3 rounded-lg font-bold shadow hover:bg-emergency-600 transition"
          >
            Get Directions with Ola Maps
          </a>
        </div>
      )}
      {userLoc && (
        <iframe
          title="Ola Map"
          src={`https://maps.ola.com/?center=${userLoc.lat},${userLoc.lng}&zoom=13`}
          width="100%"
          height="400"
          style={{ border: 0, borderRadius: "1rem" }}
          allowFullScreen
        ></iframe>
      )}
    </div>
  );
};

export default NearestHospital;
