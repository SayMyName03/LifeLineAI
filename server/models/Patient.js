import mongoose from "mongoose";

const PatientSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  age:       { type: Number },
  gender:    { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Patient", PatientSchema);