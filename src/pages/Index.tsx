import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import TriageForm from '@/components/TriageForm';
import PatientDataPreview from '@/components/PatientDataPreview';
import { useToast } from "@/hooks/use-toast";
import { getGeminiInstructions } from '@/lib/gemini';

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

interface Hospital {
  _id?: string;
  place_id?: string;
  name: string;
  location?: { type: string; coordinates: [number, number] };
  address?: string;
  services?: string[];
  contactPhone?: string;
  distKm?: number;
  rating?: number;
  isOpen?: boolean;
}

import { useNavigate } from 'react-router-dom';

const Index = () => {

  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  // Removed in simplified flow: hospital selection handled on separate page
  const [instructions, setInstructions] = useState<string | null>(null);
  const [loadingInstructions, setLoadingInstructions] = useState(false);
  const { toast } = useToast();
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();

  // Store AI score and instructions for MongoDB
  const [aiScore, setAiScore] = useState<string | null>(null);
  const [aiInstructions, setAiInstructions] = useState<string | null>(null);

  // Auth check on mount
  useEffect(() => {
    fetch('http://localhost:5001/auth/me', { credentials: 'include' })
      .then(res => {
        if (res.status === 401) {
          navigate('/login');
        } else {
          setAuthChecked(true);
        }
      })
      .catch(() => {
        navigate('/login');
      });
  }, [navigate]);

  // Helper to extract score from Gemini instructions
  function extractScore(instructions: string | null): string | null {
    if (!instructions) return null;
    const match = instructions.match(/Criticality Score: (\d+)\/10/);
    return match ? match[1] : null;
  }

  const handleFormSubmit = async (data: PatientData) => {
    setPatientData(data);
    setShowPreview(true);
    setInstructions(null);
    setLoadingInstructions(true);
    try {
      const result = await getGeminiInstructions(data);
      setInstructions(result);
      setAiScore(extractScore(result));
      setAiInstructions(result);
      
      // Check if this was a fallback response
      if (result.includes('Criticality Score:') && !result.includes('Error:')) {
        // Success - either from Gemini or fallback triage logic
        if (!result.includes('Gemini')) {
          toast({
            title: "AI Assessment Complete",
            description: "Using clinical decision support system (Gemini API temporarily unavailable)",
          });
        }
      }
    } catch (err) {
      setInstructions('Clinical assessment temporarily unavailable. Please proceed with manual triage.');
      setAiScore('5'); // Default medium priority
      setAiInstructions(null);
      toast({
        title: "AI Assessment Unavailable",
        description: "Proceeding with manual triage protocols. Please assess patient using clinical judgment.",
        variant: "destructive"
      });
    } finally {
      setLoadingInstructions(false);
    }
  };

  const handleEdit = () => {
    setShowPreview(false);
    // nothing extra now
  };

  const handleConfirm = async () => {
    if (!patientData) return;
    // Directly submit triage then navigate to nearest hospital page
    try {
      const response = await fetch("http://localhost:5001/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...patientData,
          additionalInfo: patientData.additionalInfo || "",
          aiScore: aiScore ? Number(aiScore) : null,
          aiInstructions: aiInstructions || instructions || "",
        }),
      });
      if (!response.ok) throw new Error('Submission failed');
      // Expect backend returns created triage record (with _id)
  const triageResp = await response.json().catch(()=> null);
  const triageRecord = triageResp && (triageResp.triage || triageResp);
  if (triageRecord && triageRecord._id) {
        // Persist minimal data so hospital selection page can dispatch it
        sessionStorage.setItem('currentTriage', JSON.stringify({
          triageId: triageRecord._id,
          patient: patientData,
          aiScore: aiScore ? Number(aiScore) : null,
          aiInstructions: aiInstructions || instructions || ""
        }));
      }
      toast({
        title: 'Triage Submitted',
        description: 'Patient triage saved. Choose a hospital to notify next.'
      });
      // reset local triage state and navigate
      setPatientData(null);
      setShowPreview(false);
      setInstructions(null);
      setAiScore(null);
      setAiInstructions(null);
      navigate('/nearest-hospital');
    } catch (err){
      toast({ title: 'Submission Failed', description: 'Could not save triage.', variant: 'destructive' });
    }
  };

  if (!authChecked) return null; // or a spinner

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-medical-800">Lifeline AI</h1>
              <p className="text-lg text-gray-600 mt-2">Emergency Medical Triage System</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
  {!showPreview ? (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <TriageForm onSubmit={handleFormSubmit} />
          </motion.div>
        ) : (
          <>
            {patientData && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <PatientDataPreview
                  data={patientData}
                  criticalityScore={aiScore ? Number(aiScore) : null}
                  onEdit={handleEdit}
                  onConfirm={handleConfirm}
                />
              </motion.div>
            )}
            <div className="mt-8 p-6 bg-white rounded-xl shadow-md">
              <h2 className="text-2xl font-bold mb-4 text-medical-800">AI Instructions</h2>
              {loadingInstructions ? (
                <p className="text-gray-500">Loading instructions from Gemini...</p>
              ) : (
                <pre className="whitespace-pre-wrap text-lg text-gray-800">{instructions}</pre>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white py-6 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            © 2024 Lifeline AI - Emergency Medical Triage System
          </p>
          <p className="text-xs text-gray-400 mt-1">
            For emergency medical use by qualified healthcare professionals
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
