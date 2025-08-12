import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CriticalityDoughnutChart from "./CriticalityDoughnutChart";
import { useToast } from "@/hooks/use-toast";

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
  additionalInfo: string;
}

interface TriageFormProps {
  onSubmit: (data: PatientData) => void;
}

const symptoms = [
  'Chest Pain',
  'Dizziness',
  'Trauma',
  'Fever',
  'Unconsciousness',
  'Difficulty Breathing',
  'Severe Bleeding',
  'Nausea/Vomiting',
  'Abdominal Pain',
  'Headache',
  'Confusion',
  'Seizures'
];

const TriageForm: React.FC<TriageFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<PatientData>({
    patientName: '',
    age: '',
    gender: '',
    heartRate: '',
    systolicBP: '',
    diastolicBP: '',
    temperature: '',
    oxygenSaturation: '',
    symptoms: [],
    additionalInfo: ''
  });

  const { toast } = useToast();

  const handleInputChange = (field: keyof PatientData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSymptomChange = (symptom: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      symptoms: checked
        ? [...prev.symptoms, symptom]
        : prev.symptoms.filter(s => s !== symptom)
    }));
  };


  const [instructions, setInstructions] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [hasPredicted, setHasPredicted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (!formData.patientName || !formData.age || !formData.gender) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in patient name, age, and gender.",
        variant: "destructive"
      });
      return;
    }
  setLoading(true);
  setInstructions("");
  setHasPredicted(false);
    try {
      const response = await fetch("http://localhost:5002/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientData: formData })
      });
      if (!response.ok) throw new Error("Gemini API error");
      const data = await response.json();
      // score is like "7/10"; extract number
      let scoreNum = 4;
      if (typeof data.score === "string" && /^\d+\/10$/.test(data.score)) {
        scoreNum = parseInt(data.score.split("/")[0], 10);
      }
      setCriticalityScore(scoreNum);
      setInstructions(data.instructions || "");
      setHasPredicted(true);
  // No toast for score, chart will show result or error
    } catch (err) {
  setCriticalityScore(-1); // Show error in chart
  setHasPredicted(true);
    } finally {
      setLoading(false);
    }
    onSubmit(formData);
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5001/auth/logout', { method: 'POST', credentials: 'include' });
      window.location.href = '/login';
    } catch (err) {
      toast({ title: 'Logout Failed', description: 'Could not log out. Please try again.', variant: 'destructive' });
    }
  };

  // For demonstration, use a mock score. Replace with real logic as needed.
  const [criticalityScore, setCriticalityScore] = useState<number>(4);

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-xl">
      <CardHeader className="bg-medical-600 text-white rounded-t-lg flex flex-row items-center justify-between">
        <CardTitle className="text-2xl font-bold">Emergency Triage Assessment</CardTitle>
        <Button onClick={handleLogout} variant="outline" className="text-medical-600 border-medical-600 hover:bg-medical-50">Logout</Button>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Patient Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="patientName" className="text-lg font-semibold text-foreground-700">
                Patient Name *
              </Label>
              <Input
                id="patientName"
                value={formData.patientName}
                onChange={(e) => handleInputChange('patientName', e.target.value)}
                className="h-14 text-lg border-2 rounded-xl shadow-sm focus:border-medical-500 focus:ring-medical-500"
                placeholder="Enter patient name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age" className="text-lg font-semibold text-foreground-700">
                Age *
              </Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                className="h-14 text-lg border-2 rounded-xl shadow-sm focus:border-medical-500 focus:ring-medical-500"
                placeholder="Age in years"
                min="0"
                max="150"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender" className="text-lg font-semibold text-foreground-700">
                Gender *
              </Label>
              <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                <SelectTrigger className="h-14 text-lg border-2 rounded-xl shadow-sm focus:border-medical-500 focus:ring-medical-500">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Vital Signs */}
          <div className="bg-background-50 p-6 rounded-xl">
            <h3 className="text-xl font-bold text-foreground-800 mb-6">Vital Signs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="heartRate" className="text-lg font-semibold text-foreground-700">
                  Heart Rate (bpm)
                </Label>
                <Input
                  id="heartRate"
                  type="number"
                  value={formData.heartRate}
                  onChange={(e) => handleInputChange('heartRate', e.target.value)}
                  className="h-14 text-lg border-2 rounded-xl shadow-sm focus:border-medical-500 focus:ring-medical-500"
                  placeholder="60-100"
                  min="0"
                  max="300"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-lg font-semibold text-foreground-700">
                  Blood Pressure (mmHg)
                </Label>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    value={formData.systolicBP}
                    onChange={(e) => handleInputChange('systolicBP', e.target.value)}
                    className="h-14 text-lg border-2 rounded-xl shadow-sm focus:border-medical-500 focus:ring-medical-500"
                    placeholder="Systolic"
                    min="0"
                    max="300"
                  />
                  <span className="flex items-center text-xl font-bold text-foreground-500">/</span>
                  <Input
                    type="number"
                    value={formData.diastolicBP}
                    onChange={(e) => handleInputChange('diastolicBP', e.target.value)}
                    className="h-14 text-lg border-2 rounded-xl shadow-sm focus:border-medical-500 focus:ring-medical-500"
                    placeholder="Diastolic"
                    min="0"
                    max="200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperature" className="text-lg font-semibold text-foreground-700">
                  Temperature (°C)
                </Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => handleInputChange('temperature', e.target.value)}
                  className="h-14 text-lg border-2 rounded-xl shadow-sm focus:border-medical-500 focus:ring-medical-500"
                  placeholder="36.0-37.5"
                  min="30"
                  max="45"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="oxygenSaturation" className="text-lg font-semibold text-foreground-700">
                  Oxygen Saturation (%)
                </Label>
                <Input
                  id="oxygenSaturation"
                  type="number"
                  value={formData.oxygenSaturation}
                  onChange={(e) => handleInputChange('oxygenSaturation', e.target.value)}
                  className="h-14 text-lg border-2 rounded-xl shadow-sm focus:border-medical-500 focus:ring-medical-500"
                  placeholder="95-100"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>



          {/* Symptoms */}
          <div className="space-y-4">
            <Label className="text-xl font-bold text-foreground-800">Symptoms (Select all that apply)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6 bg-background-50 rounded-xl">
              {symptoms.map((symptom) => (
                <div key={symptom} className="flex items-center space-x-3">
                  <Checkbox
                    id={symptom}
                    checked={formData.symptoms.includes(symptom)}
                    onCheckedChange={(checked) => handleSymptomChange(symptom, checked as boolean)}
                    className="h-5 w-5 text-medical-600 border-2 rounded-md"
                  />
                  <Label
                    htmlFor={symptom}
                    className="text-base font-medium text-foreground-700 cursor-pointer"
                  >
                    {symptom}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          {/* Criticality Score Chart Section - only visible after prediction */}
          {hasPredicted && (
            <div className="flex flex-col items-center mt-10 mb-4">
              <h3 className="text-2xl font-bold text-foreground-800 mb-2">Criticality Score</h3>
              <div style={{ width: '12rem', height: '12rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #e5e7eb', borderRadius: '1rem', background: '#f9fafb' }}>
                {loading ? (
                  <span style={{ color: '#2563eb', fontWeight: 600 }}>Predicting...</span>
                ) : (
                  <CriticalityDoughnutChart score={criticalityScore} />
                )}
              </div>
            </div>
          )}

         {/* Additional Information */}
          <div className="space-y-2">
            <Label htmlFor="additionalInfo" className="text-xl font-bold text-foreground">
              Additional Information: 
            </Label>
            <textarea
              id="additionalInfo"
              value={formData.additionalInfo}
              onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
              className="w-full h-24 p-4 text-lg border-2 rounded-xl shadow-sm focus:border-medical-500 focus:ring-medical-500 resize-none bg-background text-foreground placeholder:text-foreground/60"
              placeholder="Enter any additional information here..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-6">
            <Button
              type="submit"
              className="h-16 px-12 text-xl font-bold bg-emergency-600 hover:bg-emergency-700 text-white rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
              disabled={loading}
            >
              {loading ? "Evaluating..." : "Evaluate Triage"}
            </Button>
          </div>

          {/* (Removed duplicate chart rendering) */}
          {/* Show Gemini instructions if available */}
          {instructions && (
            <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
              <h4 className="text-lg font-bold mb-2 text-blue-900">Gemini Recommendations</h4>
              <pre className="whitespace-pre-wrap text-base text-blue-900">{instructions}</pre>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default TriageForm;
