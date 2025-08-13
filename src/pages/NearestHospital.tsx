import React, { useEffect, useState } from "react";
import { useToast } from '@/hooks/use-toast';
import { Hospital, MapPin, RefreshCw } from "lucide-react";

interface HospitalDoc {
  _id: string;
  name: string;
  location?: { type: string; coordinates: [number, number] }; // [lng, lat]
  address?: string;
  services?: string[];
  contactPhone?: string;
  distKm?: number; // computed client-side
}

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
  const [userLoc, setUserLoc] = useState<{lat:number; lng:number} | null>(null);
  const [hospitals, setHospitals] = useState<HospitalDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [maxKm, setMaxKm] = useState(25);
  const [selectedHospitalId,setSelectedHospitalId] = useState<string | null>(null);
  const [dispatchingId,setDispatchingId] = useState<string | null>(null);
  const [dispatchedIds,setDispatchedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const currentTriage = React.useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem('currentTriage') || 'null'); } catch { return null; }
  },[]);

  const fetchHospitals = async (lat:number,lng:number, radiusKm:number) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5001/api/hospitals/nearby?lat=${lat}&lng=${lng}&maxKm=${radiusKm}`);
      if(!res.ok) throw new Error('Failed loading hospitals');
      const data: any[] = await res.json();
      // convert to HospitalDoc list adding distKm using coordinates
      const list: HospitalDoc[] = data.map(h => {
        const coords = h.location?.coordinates;
        let distKm: number | undefined;
        if (coords && userLoc) {
          distKm = getDistance(userLoc.lat, userLoc.lng, coords[1], coords[0]);
        }
        return { ...h, distKm };
      });
      setHospitals(list.sort((a,b)=> (a.distKm ?? 0) - (b.distKm ?? 0)));
    } catch(e:any){
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLoc(loc);
        fetchHospitals(loc.lat, loc.lng, maxKm);
      },
      () => setError("Location access denied. Please enable location services."),
      { enableHighAccuracy: true }
    );
  }, [maxKm]);

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-medical-50 via-blue-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 p-8">
      <div className="w-full max-w-6xl">
        <h1 className="text-5xl font-extrabold mb-6 text-medical-800 dark:text-medical-100 tracking-tight drop-shadow-lg">Nearest Hospitals</h1>
        {currentTriage && currentTriage.patient && (
          <div className="mb-8 rounded-2xl shadow-lg border border-medical-200/60 dark:border-gray-700 bg-white/80 dark:bg-gray-900/70 backdrop-blur-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-medical-700 dark:text-medical-100">Patient: {currentTriage.patient.patientName || 'Unknown'}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Age: {currentTriage.patient.age || '—'} • Gender: {currentTriage.patient.gender || '—'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Heart Rate: {currentTriage.patient.heartRate || '—'} bpm • BP: {currentTriage.patient.systolicBP || '—'}/{currentTriage.patient.diastolicBP || '—'} • Temp: {currentTriage.patient.temperature || '—'}° • SpO₂: {currentTriage.patient.oxygenSaturation || '—'}%
                </p>
                {Array.isArray(currentTriage.patient.symptoms) && currentTriage.patient.symptoms.length > 0 && (
                  <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    Symptoms: {currentTriage.patient.symptoms.join(', ')}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-start md:items-end gap-2 min-w-[180px]">
                {currentTriage.aiScore != null && (
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emergency-500 text-white shadow">
                    AI Score: {currentTriage.aiScore}/10
                  </span>
                )}
                <button
                  onClick={()=> { sessionStorage.removeItem('currentTriage'); window.location.reload(); }}
                  className="text-xs px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >Clear Patient</button>
              </div>
            </div>
          </div>
        )}
      </div>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {!userLoc && !error && <div className="text-gray-500 animate-pulse">Getting your location...</div>}
      {userLoc && (
        <div className="flex flex-col md:flex-row w-full max-w-6xl gap-10 items-start justify-center">
          {/* Hospital List */}
          <div className="flex-1 w-full md:w-1/2">
            <div className="bg-gradient-to-r from-medical-100 via-blue-50 to-blue-100 dark:from-gray-800 dark:via-gray-900 dark:to-slate-900 rounded-2xl shadow-xl p-6">
              <div className="text-lg font-bold text-medical-700 dark:text-medical-200 mb-6 flex items-center gap-2">
                <Hospital className="w-6 h-6 text-emergency-500" /> Nearby Hospitals
              </div>
              <div className="flex items-center gap-3 mb-4 text-sm">
                <label className="font-medium">Radius:</label>
                <select value={maxKm} onChange={e=> setMaxKm(Number(e.target.value))} className="border rounded px-2 py-1 bg-white dark:bg-gray-800">
                  {[5,10,15,25,50].map(v=> <option key={v} value={v}>{v} km</option>)}
                </select>
                <button onClick={()=> userLoc && fetchHospitals(userLoc.lat, userLoc.lng, maxKm)} className="flex items-center gap-1 text-blue-600 hover:underline disabled:opacity-50" disabled={loading}>
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>
              <div className="space-y-6">
                {loading && <div className="text-gray-500">Loading hospitals...</div>}
                {!loading && hospitals.length === 0 && <div className="text-gray-500">No hospitals found in this radius.</div>}
                {!loading && hospitals.map((h, idx) => {
                  const lat = h.location?.coordinates?.[1];
                  const lng = h.location?.coordinates?.[0];
                  const dist = h.distKm ?? (lat && lng && userLoc ? getDistance(userLoc.lat,userLoc.lng,lat,lng) : undefined);
                  return (
                    <div key={h._id || idx} className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl border ${selectedHospitalId === h._id ? 'border-2 border-blue-600' : idx === 0 ? 'border-2 border-emergency-500' : 'border-gray-100 dark:border-gray-700'}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <Hospital className="w-7 h-7 text-medical-500" />
                        <h2 className="text-2xl font-bold text-medical-700 dark:text-medical-200">{h.name}</h2>
                        {idx === 0 && <span className="ml-2 px-3 py-1 rounded-full bg-emergency-500 text-white text-xs font-bold animate-pulse">Nearest</span>}
                      </div>
                      <div className="flex gap-2 mb-2">
                        <button
                          onClick={()=> setSelectedHospitalId(h._id)}
                          className={`px-3 py-1 text-xs rounded transition ${selectedHospitalId === h._id ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'}`}
                        >
                          {selectedHospitalId === h._id ? 'Selected' : 'Select'}
                        </button>
                        {dispatchedIds.has(h._id) && (
                          <span className="px-2 py-1 text-[10px] rounded bg-green-600 text-white font-semibold">Notified</span>
                        )}
                      </div>
                      {dist !== undefined && (
                        <div className="flex items-center gap-2 mb-2 text-gray-700 dark:text-gray-300">
                          <MapPin className="w-5 h-5 text-blue-500" />
                          <span>Distance: {dist.toFixed(2)} km</span>
                        </div>
                      )}
                      {lat && lng && (
                        <button
                          onClick={async ()=> {
                            const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLoc.lat},${userLoc.lng}&destination=${lat},${lng}`;
                            // dispatch only if not done yet and triage available
                            if(!dispatchedIds.has(h._id) && currentTriage){
                              try {
                                setDispatchingId(h._id);
                                const res = await fetch('http://localhost:5001/api/alerts/dispatch', {
                                  method:'POST',
                                  headers:{'Content-Type':'application/json'},
                                  credentials:'include',
                                  body: JSON.stringify({
                                    hospitalId: h._id,
                                    triageId: currentTriage.triageId,
                                    patient: currentTriage.patient,
                                    aiScore: currentTriage.aiScore,
                                    aiInstructions: currentTriage.aiInstructions
                                  })
                                });
                                if(!res.ok) throw new Error('Dispatch failed');
                                sessionStorage.removeItem('currentTriage');
                                setDispatchedIds(prev => new Set(prev).add(h._id));
                                toast({ title: 'Hospital Notified', description: `${h.name} has been notified.` });
                              } catch(e){
                                console.error(e);
                                toast({ title: 'Dispatch Failed', description: 'Could not notify hospital.', variant: 'destructive' });
                              } finally {
                                setDispatchingId(null);
                                window.open(mapsUrl,'_blank','noopener,noreferrer');
                              }
                            } else {
                              window.open(mapsUrl,'_blank','noopener,noreferrer');
                            }
                          }}
                          disabled={dispatchingId === h._id}
                          className="inline-block mt-2 px-6 py-3 bg-emergency-500 text-white rounded-lg font-bold shadow hover:bg-emergency-600 transition disabled:opacity-60"
                        >
                          {dispatchingId === h._id ? 'Notifying...' : dispatchedIds.has(h._id) ? 'Open Directions' : 'Get Directions & Notify'}
                        </button>
                      )}
                    </div>
                  );
                })}
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
