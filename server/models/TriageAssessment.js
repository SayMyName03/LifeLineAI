import mongoose from "mongoose";

const TriageAssessmentSchema = new mongoose.Schema({
  patient:        { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  user:           { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vitals:         { type: mongoose.Schema.Types.ObjectId, ref: 'Vitals' },
  symptoms:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'Symptom' }],
  additionalInfo: { type: String },
  aiScore:        { type: Number },
  aiInstructions: { type: [String] },
  createdAt:      { type: Date, default: Date.now }
});

export default mongoose.model("TriageAssessment", TriageAssessmentSchema);