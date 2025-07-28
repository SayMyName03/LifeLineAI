// src/lib/gemini.ts
// Utility to call Gemini API for triage instructions via local proxy

export async function getGeminiInstructions(patientData: any): Promise<string> {
  try {
    const response = await fetch('http://localhost:5002/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientData })
    });
    if (!response.ok) {
      // Try to extract error message from proxy response
      let errorMsg = 'Failed to fetch instructions from Gemini proxy';
      try {
        const errData = await response.json();
        if (errData?.error) errorMsg += `: ${errData.error}`;
        if (errData?.details) errorMsg += ` (${errData.details})`;
      } catch {}
      throw new Error(errorMsg);
    }
    const data = await response.json();
    return data.instructions || 'No instructions received from Gemini.';
  } catch (err: any) {
    return `Error: ${err.message || err}`;
  }
}
