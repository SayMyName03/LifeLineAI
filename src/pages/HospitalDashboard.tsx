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
  },
  {
    id: "PAT-002",
    ticketNumber: "T0002",
    severity: "moderate",
    eta: "1 min",
    location: { lat: 0, lng: 0, address: "5th Street Bridge" },
    vitals: {
      heartRate: 85,
      bloodPressure: { systolic: 118, diastolic: 78 },
      oxygenSaturation: 97,
      temperature: 36.8,
      respiratoryRate: 18,
    },
    condition: "Respiratory Distress",
    ambulanceId: "AMB-2",
    age: 43,
    gender: "F",
    status: "incoming",
  },
  {
    id: "PAT-003",
    ticketNumber: "T0003",
    severity: "serious",
    eta: "1 min",
    location: { lat: 0, lng: 0, address: "456 Pine Avenue" },
    vitals: {
      heartRate: 110,
      bloodPressure: { systolic: 130, diastolic: 85 },
      oxygenSaturation: 95,
      temperature: 38.2,
      respiratoryRate: 22,
    },
    condition: "Respiratory Distress",
    ambulanceId: "AMB-2",
    age: 38,
    gender: "M",
    status: "incoming",
  },
  {
    id: "PAT-004",
    ticketNumber: "T0004",
    severity: "critical",
    eta: "1 min",
    location: { lat: 0, lng: 0, address: "Medical Plaza" },
    vitals: {
      heartRate: 120,
      bloodPressure: { systolic: 140, diastolic: 90 },
      oxygenSaturation: 92,
      temperature: 39,
      respiratoryRate: 28,
    },
    condition: "Respiratory Distress",
    ambulanceId: "AMB-13",
    age: 18,
    gender: "M",
    status: "incoming",
  },
  {
    id: "PAT-005",
    ticketNumber: "T0005",
    severity: "moderate",
    eta: "1 min",
    location: { lat: 0, lng: 0, address: "1st Ave & Main St" },
    vitals: {
      heartRate: 78,
      bloodPressure: { systolic: 115, diastolic: 75 },
      oxygenSaturation: 99,
      temperature: 36.5,
      respiratoryRate: 15,
    },
    condition: "Allergic Reaction",
    ambulanceId: "AMB-19",
    age: 30,
    gender: "M",
    status: "incoming",
  },
  {
    id: "PAT-006",
    ticketNumber: "T0006",
    severity: "critical",
    eta: "1 min",
    location: { lat: 0, lng: 0, address: "Airport Terminal" },
    vitals: {
      heartRate: 125,
      bloodPressure: { systolic: 145, diastolic: 95 },
      oxygenSaturation: 90,
      temperature: 39.5,
      respiratoryRate: 30,
    },
    condition: "Severe Laceration",
    ambulanceId: "AMB-2",
    age: 51,
    gender: "M",
    status: "incoming",
  },
  {
    id: "PAT-007",
    ticketNumber: "T0007",
    severity: "critical",
    eta: "1 min",
    location: { lat: 0, lng: 0, address: "Airport Terminal" },
    vitals: {
      heartRate: 130,
      bloodPressure: { systolic: 150, diastolic: 100 },
      oxygenSaturation: 88,
      temperature: 40,
      respiratoryRate: 32,
    },
    condition: "Chest Pain",
    ambulanceId: "AMB-8",
    age: 65,
    gender: "F",
    status: "incoming",
  },
  {
    id: "PAT-008",
    ticketNumber: "T0008",
    severity: "critical",
    eta: "1 min",
    location: { lat: 0, lng: 0, address: "Highway 101 Mile 15" },
    vitals: {
      heartRate: 135,
      bloodPressure: { systolic: 155, diastolic: 105 },
      oxygenSaturation: 85,
      temperature: 41,
      respiratoryRate: 34,
    },
    condition: "Burns",
    ambulanceId: "AMB-18",
    age: 53,
    gender: "M",
    status: "incoming",
  },
];

const HospitalDashboard: React.FC = () => {
  // Replace mockPatients with real data from backend when available
  const patients = mockPatients;

  const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(
    null
  );
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
    // Add reject logic here if needed
    setModalOpen(false);
    setSelectedPatient(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <HospitalHeader hospital={mockHospital} totalPatients={patients.length} />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold mb-2 text-foreground">
          Incoming Patients
        </h2>
        <p className="text-muted-foreground mb-6">
          Real-time patient tracking and emergency management dashboard
        </p>
        <div className="grid md:grid-cols-4 sm:grid-cols-2 gap-6">
          {patients.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              onClick={() => handleCardClick(patient)}
            />
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
