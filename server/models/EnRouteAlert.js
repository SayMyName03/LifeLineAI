import mongoose from 'mongoose';

const EnRouteAlertSchema = new mongoose.Schema({
  triageId: { type: mongoose.Schema.Types.ObjectId, ref: 'TriageAssessment', required: true },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending','acknowledged','arrived','cancelled'], default: 'pending' },
  etaSeconds: { type: Number },
  priority: { type: String },
  vitalsSummary: String,
  symptomsSummary: String,
  patientSnapshot: {
    patientName: String,
    age: Number,
    gender: String,
    heartRate: Number,
    systolicBP: Number,
    diastolicBP: Number,
    temperature: Number,
    oxygenSaturation: Number,
    symptoms: [String],
    additionalInfo: String
  },
  aiScore: Number,
  aiInstructions: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

EnRouteAlertSchema.pre('save', function(next){
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('EnRouteAlert', EnRouteAlertSchema);
