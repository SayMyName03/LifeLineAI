import React, { useEffect, useState, useRef } from "react";
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

// Incoming patients will be populated from alerts (socket + initial fetch)

const HospitalDashboard: React.FC = () => {
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [hospitalData, setHospitalData] = useState<HospitalData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const socketRef = useRef<any>(null);
  const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  // Fetch authenticated hospital data and set up real-time alert subscription
  useEffect(() => {
    let mounted = true;
    fetch('http://localhost:5001/auth/me', { credentials: 'include' })
      .then(res => {
        if (res.status === 401) {
          navigate('/login');
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (!mounted || !data?.hospital) return;
        setHospitalData(data.hospital);
        const hospitalInfo: Hospital = {
          name: data.hospital.name,
          location: { lat: 0, lng: 0 },
          totalBeds: 120,
          availableBeds: 28,
          status: "online",
        };
        setHospital(hospitalInfo);
        // dynamic import socket to avoid bundle weight
        import('socket.io-client').then(({ io }) => {
          if (!mounted) return;
          const s = io('http://localhost:5001', { withCredentials: true });
          socketRef.current = s;
            s.emit('joinHospitalRoom', data.hospital._id);
          s.on('alert:new', ({ alert }) => {
            const p = alert.patientSnapshot || {};
            const mapped: Patient = {
              id: alert._id,
              ticketNumber: alert._id.slice(-6),
              severity: alert.priority || 'routine',
              eta: alert.etaSeconds ? Math.round(alert.etaSeconds/60) + ' min' : '—',
              location: { lat: 0, lng: 0, address: p.additionalInfo || '—' },
              vitals: {
                heartRate: p.heartRate,
                bloodPressure: { systolic: p.systolicBP, diastolic: p.diastolicBP },
                oxygenSaturation: p.oxygenSaturation,
                temperature: p.temperature,
                respiratoryRate: undefined,
              },
              condition: p.symptoms ? p.symptoms.join(', ') : '—',
              ambulanceId: '—',
              age: p.age,
              gender: p.gender,
              status: alert.status || 'incoming'
            };
            setPatients(prev => [mapped, ...prev.filter(pt => pt.id !== mapped.id)]);
          });
        });
        // initial alerts load
        fetch('http://localhost:5001/api/alerts/incoming', { credentials: 'include' })
          .then(r => r.ok ? r.json() : [])
          .then((alerts = []) => {
            if (!mounted) return;
            const mapped = alerts.map(alert => {
              const p = alert.patientSnapshot || {};
              const patient: Patient = {
                id: alert._id,
                ticketNumber: alert._id.slice(-6),
                severity: alert.priority || 'routine',
                eta: alert.etaSeconds ? Math.round(alert.etaSeconds/60) + ' min' : '—',
                location: { lat: 0, lng: 0, address: p.additionalInfo || '—' },
                vitals: {
                  heartRate: p.heartRate,
                  bloodPressure: { systolic: p.systolicBP, diastolic: p.diastolicBP },
                  oxygenSaturation: p.oxygenSaturation,
                  temperature: p.temperature,
                  respiratoryRate: undefined,
                },
                condition: p.symptoms ? p.symptoms.join(', ') : '—',
                ambulanceId: '—',
                age: p.age,
                gender: p.gender,
                status: alert.status || 'incoming'
              };
              return patient;
            });
            setPatients(mapped);
          });
      })
      .catch(() => {
        if (mounted) navigate('/login');
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; if (socketRef.current) socketRef.current.disconnect(); };
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
