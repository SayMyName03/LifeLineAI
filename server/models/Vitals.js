import mongoose from "mongoose";

const VitalsSchema = new mongoose.Schema({
  patient:          { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  heartRate:        { type: Number },
  systolicBP:       { type: Number },
  diastolicBP:      { type: Number },
  temperature:      { type: Number },
  oxygenSaturation: { type: Number },
  recordedAt:       { type: Date, default: Date.now }
});

export default mongoose.model("Vitals", VitalsSchema);