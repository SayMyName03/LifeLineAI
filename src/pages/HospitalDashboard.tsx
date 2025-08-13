import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HospitalHeader from "@/components/HospitalHeader";
import PatientCard from "@/components/PatientCard";
import PatientDetails from "@/components/PatientDetails";
import { Hospital, Patient } from "@/types/patient";

interface HospitalData {
  _id: string;
  name: string;
  email: string;
  address?: string;
  services?: string[];
  contactPhone?: string;
  type: string;
}

const mockPatients: Patient[] = [
  {
    id: "PAT-001",
    ticketNumber: "T0001",
    severity: "moderate",
    eta: "1 min",
    location: { lat: 0, lng: 0, address: "Medical Plaza" },
    vitals: {
      heartRate: 80,
      bloodPressure: { systolic: 120, diastolic: 80 },
      oxygenSaturation: 98,
      temperature: 37,
      respiratoryRate: 16,
    },
    condition: "Severe Laceration",
    ambulanceId: "AMB-19",
    age: 39,
    gender: "F",
    status: "incoming",
  }
];

const HospitalDashboard: React.FC = () => {
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [hospitalData, setHospitalData] = useState<HospitalData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const patients = mockPatients;
  const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  // Fetch authenticated hospital data
  useEffect(() => {
    fetch('http://localhost:5001/auth/me', { credentials: 'include' })
      .then(res => {
        if (res.status === 401) {
          navigate('/login');
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data?.hospital) {
          setHospitalData(data.hospital);
          // Convert hospital data to the format expected by HospitalHeader
          const hospitalInfo: Hospital = {
            name: data.hospital.name,
            location: { lat: 0, lng: 0 }, // Default location
            totalBeds: 120, // Mock data for now
            availableBeds: 28, // Mock data for now
            status: "online",
          };
          setHospital(hospitalInfo);
        }
        setLoading(false);
      })
      .catch(() => {
        navigate('/login');
      });
  }, [navigate]);

  const handleCardClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedPatient(null);
  };

  const handleRejectPatient = (patientId: string) => {
    setModalOpen(false);
    setSelectedPatient(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-lg">Loading hospital dashboard...</div>
      </div>
    );
  }

  if (!hospital || !hospitalData) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-lg text-red-600">Failed to load hospital information</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <HospitalHeader hospital={hospital} totalPatients={patients.length} />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 text-foreground">Welcome, {hospitalData.name}</h2>
          <p className="text-muted-foreground mb-4">Hospital Dashboard - Incoming Patients</p>
          {hospitalData.address && (
            <p className="text-sm text-muted-foreground">📍 {hospitalData.address}</p>
          )}
          {hospitalData.contactPhone && (
            <p className="text-sm text-muted-foreground">📞 {hospitalData.contactPhone}</p>
          )}
        </div>
        
        <h3 className="text-xl font-semibold mb-4 text-foreground">Incoming Patients</h3>
        <p className="text-muted-foreground mb-6">Monitor and manage incoming emergency transfers</p>
        <div className="grid md:grid-cols-4 sm:grid-cols-2 gap-6">
          {patients.map((patient) => (
            <PatientCard key={patient.id} patient={patient} onClick={() => handleCardClick(patient)} />
          ))}
        </div>
      </div>
      <PatientDetails
        patient={selectedPatient}
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onReject={handleRejectPatient}
      />
    </div>
  );
};

export default HospitalDashboard;
