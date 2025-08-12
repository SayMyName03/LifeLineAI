export interface Patient {
  id: string;
  ticketNumber: string;
  severity: "critical" | "serious" | "moderate";
  eta: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  vitals: {
    heartRate: number;
    bloodPressure: {
      systolic: number;
      diastolic: number;
    };
    oxygenSaturation: number;
    temperature: number;
    respiratoryRate: number;
  };
  condition: string;
  ambulanceId: string;
  age: number;
  gender: "M" | "F";
  arrivalTime?: string;
  status: "incoming" | "arrived" | "rejected";
}

export interface Hospital {
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  totalBeds: number;
  availableBeds: number;
  status: "online" | "offline";
}
