// src/lib/gemini.ts
// Utility to call Gemini API for triage instructions via local proxy

// Fallback triage logic when Gemini API is unavailable
function generateFallbackTriage(patientData: any): { score: string; instructions: string } {
  let score = 5; // Default medium priority
  
  // Simple rule-based scoring
  const criticalSymptoms = ['chest pain', 'unconsciousness', 'severe bleeding', 'difficulty breathing'];
  const urgentSymptoms = ['trauma', 'seizures', 'confusion'];
  const symptoms = patientData.symptoms?.map((s: string) => s.toLowerCase()) || [];
  
  // Check vitals for abnormalities
  const heartRate = parseInt(patientData.heartRate) || 70;
  const systolic = parseInt(patientData.systolicBP) || 120;
  const temp = parseFloat(patientData.temperature) || 98.6;
  const oxygen = parseInt(patientData.oxygenSaturation) || 98;
  
  // Critical indicators
  if (symptoms.some(s => criticalSymptoms.some(cs => s.includes(cs))) ||
      heartRate > 120 || heartRate < 50 ||
      systolic > 180 || systolic < 90 ||
      temp > 104 || oxygen < 90) {
    score = 9;
  }
  // Urgent indicators  
  else if (symptoms.some(s => urgentSymptoms.some(us => s.includes(us))) ||
           heartRate > 100 || systolic > 160 || temp > 101) {
    score = 7;
  }
  // Semi-urgent
  else if (symptoms.length > 2 || temp > 100) {
    score = 5;
  }
  // Non-urgent
  else {
    score = 3;
  }

  const instructions = `Criticality Score: ${score}/10

1. Assess airway, breathing, and circulation immediately
2. Monitor vital signs continuously every 15 minutes
3. Establish IV access if score ≥ 6
4. Administer oxygen if saturation < 95%
5. Obtain complete medical history and allergies
6. Perform focused physical examination
7. Order appropriate diagnostic tests based on symptoms
8. Consider pain management if indicated
9. Notify attending physician of patient status
10. Document all findings and interventions thoroughly`;

  return { score: score.toString(), instructions };
}

export async function getGeminiInstructions(patientData: any): Promise<string> {
  try {
    const response = await fetch('http://localhost:5002/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientData })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      
      // Check if it's a quota exceeded error
      if (response.status === 500 && errorData?.details?.includes('429')) {
        console.warn('Gemini API quota exceeded, using fallback triage logic');
        const fallback = generateFallbackTriage(patientData);
        return fallback.instructions;
      }
      
      // For other errors, try to extract error message
      let errorMsg = 'Failed to fetch instructions from Gemini proxy';
      if (errorData?.error) errorMsg += `: ${errorData.error}`;
      if (errorData?.details) errorMsg += ` (${errorData.details})`;
      throw new Error(errorMsg);
    }
    
    const data = await response.json();
    return data.instructions || 'No instructions received from Gemini.';
  } catch (err: any) {
    // If it's a network error or Gemini is down, use fallback
    if (err.message.includes('fetch') || err.message.includes('quota') || err.message.includes('429')) {
      console.warn('Gemini API unavailable, using fallback triage logic');
      const fallback = generateFallbackTriage(patientData);
      return fallback.instructions;
    }
    return `Error: ${err.message || err}`;
  }
}
