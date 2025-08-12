import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Patient } from "@/types/patient";

// Note: Replace with actual Mapbox token
const MAPBOX_TOKEN = "your-mapbox-token-here";

interface PatientMapProps {
  patient: Patient;
}

const PatientMap: React.FC<PatientMapProps> = ({ patient }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // For demo purposes, we'll create a simple map without Mapbox
    // In production, you would set mapboxgl.accessToken = MAPBOX_TOKEN;

    // Create a simple placeholder map
    const mapElement = mapContainer.current;
    mapElement.innerHTML = `
      <div class="flex items-center justify-center h-full bg-muted rounded-lg">
        <div class="text-center p-4">
          <div class="w-12 h-12 bg-primary rounded-full mx-auto mb-2 flex items-center justify-center">
            <svg class="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
          <p class="text-sm font-medium">Live Location Tracking</p>
          <p class="text-xs text-muted-foreground mt-1">
            Lat: ${patient.location.lat.toFixed(4)}<br/>
            Lng: ${patient.location.lng.toFixed(4)}
          </p>
          <div class="mt-3 text-xs text-muted-foreground">
            <div class="w-2 h-2 bg-green-500 rounded-full inline-block mr-1 animate-pulse"></div>
            Ambulance ${patient.ambulanceId} - En Route
          </div>
        </div>
      </div>
    `;

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [patient]);

  return <div ref={mapContainer} className="w-full h-full" />;
};

export default PatientMap;
