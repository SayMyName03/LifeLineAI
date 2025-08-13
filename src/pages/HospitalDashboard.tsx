import React from "react";
import HospitalHeader from "@/components/HospitalHeader";
import PatientCard from "@/components/PatientCard";
import PatientDetails from "@/components/PatientDetails";
import { Hospital, Patient } from "@/types/patient";

const mockHospital: Hospital = {
  name: "St. Mary's General Hospital",
  location: { lat: 0, lng: 0 },
  totalBeds: 120,
  availableBeds: 28,
  status: "online",
};

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
  const patients = mockPatients;
  const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <HospitalHeader hospital={mockHospital} totalPatients={patients.length} />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold mb-2 text-foreground">Incoming Patients</h2>
        <p className="text-muted-foreground mb-6">Static mock dashboard (sockets removed)</p>
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
