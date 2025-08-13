// server/gemini-proxy.mjs
// Simple Express server to proxy Gemini API requests (ESM version)

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import dotenv from "dotenv"; 

dotenv.config();

const app = express();
const PORT = 5002;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Replace with your Gemini API key
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

app.use(cors());
app.use(bodyParser.json());

app.post('/api/gemini', async (req, res) => {
  try {
    const { patientData } = req.body;
    // Updated prompt to request a criticality score and 10 numbered, step-by-step instructions
    const prompt = `You are a medical triage assistant. Given the following patient data, first provide a single line with a "Criticality Score" for the patient on a scale of 1 (not critical) to 10 (most critical), formatted as "Criticality Score: X/10". Then, provide exactly 10 concise, step-by-step instructions for the next actions a healthcare provider should take. Number each step from 1 to 10. Each step should be short and clear.\n\nPatient Data: ${JSON.stringify(patientData, null, 2)}`;
    const body = {
      contents: [{ parts: [{ text: prompt }] }]
    };
    const response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error:', errorData);
      
      // Check if it's a quota exceeded error (429)
      if (errorData?.error?.code === 429) {
        return res.status(500).json({ 
          error: 'Gemini API quota exceeded', 
          details: 'Daily quota limit reached. Please try again tomorrow or upgrade your plan.',
          quotaExceeded: true
        });
      }
      
      return res.status(500).json({ 
        error: 'Gemini API error', 
        details: errorData?.error?.message || 'Unknown API error' 
      });
    }
    const data = await response.json();
    let instructions = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No instructions received from Gemini.';

    // Extract the criticality score (expects "Criticality Score: X/10" as the first line)
    const lines = instructions.split('\n').map(line => line.trim()).filter(Boolean);
    let scoreLine = lines.find(line => /^Criticality Score: \d+\/10/.test(line));
    let score = scoreLine ? scoreLine.replace('Criticality Score: ', '') : null;
    // If not found, fallback to 1/10
    if (!score || !/^\d+\/10$/.test(score)) {
      score = '1/10';
      scoreLine = 'Criticality Score: 1/10';
    }

    // Extract up to 10 numbered steps (e.g., "1. ...", "2. ...")
    const steps = lines
      .filter(line => /^\d+\./.test(line))
      .slice(0, 10);

    // If not enough steps, fallback to first 10 non-empty lines after the score line
    const formattedInstructions = steps.length === 10
      ? steps.join('\n')
      : lines
          .filter(line => line && !/^Criticality Score: \d+\/10/.test(line))
          .slice(0, 10)
          .join('\n');

    // Always include the score line at the top for clarity
    res.json({
      score,
      instructions: `${scoreLine}\n${formattedInstructions}`
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Gemini proxy server running on http://localhost:${PORT}`);
});
