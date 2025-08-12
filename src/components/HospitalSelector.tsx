import React, { useEffect, useState } from "react";
import { Hospital, MapPin, RefreshCw, Phone, Navigation, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Hospital {
  _id?: string;
  place_id?: string;
  uniqueId?: string;  // Added for reliable selection tracking
  name: string;
  location?: { type: string; coordinates: [number, number] }; // [lng, lat]
  address?: string;
  services?: string[];
  contactPhone?: string;
  distKm?: number;
  rating?: number;
  isOpen?: boolean;
}

interface PatientData {
  patientName: string;
  age: string;
  gender: string;
  heartRate: string;
  systolicBP: string;
  diastolicBP: string;
  temperature: string;
  oxygenSaturation: string;
  symptoms: string[];
  additionalInfo?: string;
}

interface HospitalSelectorProps {
  patientData: PatientData;
  onHospitalSelected: (hospital: Hospital, patientData: PatientData) => void;
  onBack: () => void;
}

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  // Haversine formula
  const toRad = (v: number) => (v * Math.PI) / 180;
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

const HospitalSelector: React.FC<HospitalSelectorProps> = ({ 
  patientData, 
  onHospitalSelected, 
  onBack 
}) => {
  const [userLoc, setUserLoc] = useState<{lat: number; lng: number} | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [maxKm, setMaxKm] = useState(10);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const { toast } = useToast();

  // Get nearby hospitals using Google Places API
  const fetchNearbyHospitals = async (lat: number, lng: number, radiusKm: number) => {
    setLoading(true);
    setError("");
    setSelectedHospital(null); // Reset selection when fetching new hospitals
    
    try {
      // First try to get from our database
      const dbResponse = await fetch(
        `http://localhost:5001/api/hospitals/nearby?lat=${lat}&lng=${lng}&maxKm=${radiusKm}`
      );
      
      let hospitalList: Hospital[] = [];
      
      if (dbResponse.ok) {
        const dbHospitals = await dbResponse.json();
        hospitalList = dbHospitals.map((h: any, index: number) => ({
          ...h,
          uniqueId: h._id || `db_${index}`, // Create unique identifier
          distKm: h.location?.coordinates ? 
            getDistance(lat, lng, h.location.coordinates[1], h.location.coordinates[0]) : 
            undefined
        }));
      }

      // Also get from Google Places API for more comprehensive results
      try {
        const placesResponse = await fetch(
          `http://localhost:5001/api/hospitals/places-nearby?lat=${lat}&lng=${lng}&radius=${radiusKm * 1000}`
        );
        
        if (placesResponse.ok) {
          const placesHospitals = await placesResponse.json();
          const placesFormatted = placesHospitals.map((place: any, index: number) => ({
            place_id: place.place_id,
            uniqueId: place.place_id || `places_${index}`, // Create unique identifier
            name: place.name,
            address: place.vicinity || place.formatted_address,
            location: {
              type: 'Point',
              coordinates: [place.geometry.location.lng, place.geometry.location.lat]
            },
            rating: place.rating,
            isOpen: place.opening_hours?.open_now,
            distKm: getDistance(lat, lng, place.geometry.location.lat, place.geometry.location.lng),
            services: place.types?.filter((type: string) => 
              ['hospital', 'emergency_room', 'medical_center', 'clinic'].includes(type)
            )
          }));
          
          // Merge and deduplicate
          const allHospitals = [...hospitalList, ...placesFormatted];
          const uniqueHospitals = allHospitals.reduce((acc: Hospital[], current) => {
            const exists = acc.find(h => 
              h.name.toLowerCase() === current.name.toLowerCase() ||
              (h.location && current.location && 
               Math.abs(h.location.coordinates[0] - current.location.coordinates[0]) < 0.001 &&
               Math.abs(h.location.coordinates[1] - current.location.coordinates[1]) < 0.001)
            );
            if (!exists) {
              acc.push(current);
            }
            return acc;
          }, []);
          
          hospitalList = uniqueHospitals;
        }
      } catch (placesError) {
        console.warn('Google Places API failed, using database results only:', placesError);
      }

      // Sort by distance and filter by radius
      hospitalList = hospitalList
        .filter(h => h.distKm && h.distKm <= radiusKm)
        .sort((a, b) => (a.distKm || 0) - (b.distKm || 0))
        .map((h, index) => ({
          ...h,
          uniqueId: h.uniqueId || `hospital_${index}` // Ensure every hospital has a unique ID
        }));

      setHospitals(hospitalList);
      
      if (hospitalList.length === 0) {
        setError(`No hospitals found within ${radiusKm}km. Try increasing the search radius.`);
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to fetch hospitals');
      console.error('Error fetching hospitals:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get user's location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLoc(loc);
        fetchNearbyHospitals(loc.lat, loc.lng, maxKm);
      },
      (err) => {
        setError("Location access denied. Please enable location services to find nearby hospitals.");
        console.error('Geolocation error:', err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, [maxKm]);

  const handleRefresh = () => {
    if (userLoc) {
      fetchNearbyHospitals(userLoc.lat, userLoc.lng, maxKm);
    }
  };

  const handleSelectHospital = (hospital: Hospital) => {
    setSelectedHospital(hospital);
  };

  const handleConfirmSelection = () => {
    if (selectedHospital) {
      onHospitalSelected(selectedHospital, patientData);
      toast({
        title: "Hospital Selected",
        description: `Alert will be sent to ${selectedHospital.name}`,
      });
    }
  };

  const getDirectionsUrl = (hospital: Hospital) => {
    if (!userLoc || !hospital.location) return '#';
    const lat = hospital.location.coordinates[1];
    const lng = hospital.location.coordinates[0];
    return `https://www.google.com/maps/dir/?api=1&origin=${userLoc.lat},${userLoc.lng}&destination=${lat},${lng}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 via-blue-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold mb-4 text-medical-800 dark:text-medical-100 tracking-tight drop-shadow-lg">
            Select Destination Hospital
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Choose the hospital to receive the emergency alert for patient: <strong>{patientData.patientName}</strong>
          </p>
        </div>

        {/* Patient Summary Card */}
        <Card className="mb-8 bg-gradient-to-r from-medical-100 to-blue-100 dark:from-gray-800 dark:to-gray-700 border-2 border-medical-200">
          <CardHeader>
            <CardTitle className="text-xl text-medical-800 dark:text-medical-200">Patient Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Name</p>
              <p className="font-semibold">{patientData.patientName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Age</p>
              <p className="font-semibold">{patientData.age}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Primary Symptoms</p>
              <p className="font-semibold">{patientData.symptoms.slice(0, 2).join(", ")}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Heart Rate</p>
              <p className="font-semibold">{patientData.heartRate || 'N/A'} bpm</p>
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex items-center gap-2">
            <label className="font-medium text-gray-700 dark:text-gray-300">Search Radius:</label>
            <Select value={maxKm.toString()} onValueChange={(value) => setMaxKm(Number(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 km</SelectItem>
                <SelectItem value="10">10 km</SelectItem>
                <SelectItem value="15">15 km</SelectItem>
                <SelectItem value="25">25 km</SelectItem>
                <SelectItem value="50">50 km</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={handleRefresh} 
            disabled={loading || !userLoc}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button onClick={onBack} variant="outline">
            ← Back to Review
          </Button>

          {selectedHospital && (
            <Button 
              onClick={handleConfirmSelection}
              className="ml-auto bg-emergency-600 hover:bg-emergency-700 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Send Alert to {selectedHospital.name}
            </Button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Location Status */}
        {!userLoc && !error && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-blue-700 dark:text-blue-300 animate-pulse">Getting your location...</p>
          </div>
        )}

        {/* Hospitals List */}
        {userLoc && (
          <div className="grid gap-6">
            {loading && (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Loading hospitals...</p>
              </div>
            )}
            
            {!loading && hospitals.length === 0 && !error && (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No hospitals found in this radius.</p>
              </div>
            )}
            
            {!loading && hospitals.map((hospital, idx) => {
              const isSelected = selectedHospital?.uniqueId === hospital.uniqueId;
              const lat = hospital.location?.coordinates?.[1];
              const lng = hospital.location?.coordinates?.[0];
              
              return (
                <Card 
                  key={hospital.uniqueId || hospital._id || hospital.place_id || idx} 
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    isSelected 
                      ? 'border-2 border-emergency-500 bg-emergency-50 dark:bg-emergency-900/20' 
                      : 'border border-gray-200 dark:border-gray-700'
                  } ${idx === 0 ? 'ring-2 ring-medical-400' : ''}`}
                  onClick={() => handleSelectHospital(hospital)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Hospital className="w-6 h-6 text-medical-500" />
                          <h3 className="text-xl font-bold text-medical-700 dark:text-medical-200">
                            {hospital.name}
                          </h3>
                          {idx === 0 && (
                            <Badge variant="outline" className="bg-medical-100 text-medical-700 border-medical-300">
                              Nearest
                            </Badge>
                          )}
                          {hospital.isOpen && (
                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                              Open
                            </Badge>
                          )}
                          {isSelected && (
                            <Badge className="bg-emergency-500 text-white">
                              Selected
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="space-y-2">
                            {hospital.address && (
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                <MapPin className="w-4 h-4" />
                                <span className="text-sm">{hospital.address}</span>
                              </div>
                            )}
                            
                            {hospital.distKm !== undefined && (
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                <Navigation className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                  {hospital.distKm.toFixed(1)} km away
                                </span>
                              </div>
                            )}
                            
                            {hospital.contactPhone && (
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                <Phone className="w-4 h-4" />
                                <span className="text-sm">{hospital.contactPhone}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            {hospital.rating && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600 dark:text-gray-300">Rating:</span>
                                <span className="font-medium">⭐ {hospital.rating.toFixed(1)}</span>
                              </div>
                            )}
                            
                            {hospital.services && hospital.services.length > 0 && (
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Services:</p>
                                <div className="flex flex-wrap gap-1">
                                  {hospital.services.slice(0, 3).map((service, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {service}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4 flex flex-col gap-2">
                        {lat && lng && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(getDirectionsUrl(hospital), '_blank');
                            }}
                          >
                            <Navigation className="w-4 h-4 mr-1" />
                            Directions
                          </Button>
                        )}
                        
                        <Button 
                          size="sm"
                          variant={isSelected ? "default" : "outline"}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectHospital(hospital);
                          }}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HospitalSelector;
