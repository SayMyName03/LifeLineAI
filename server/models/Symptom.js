import mongoose from "mongoose";

const SymptomSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }
});

export default mongoose.model("Symptom", SymptomSchema);