import mongoose from 'mongoose';

const HospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // hashed
  address: { type: String },
  services: [{ type: String }],
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' } // [lng, lat]
  },
  contactPhone: String,
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Ensure geospatial index on location
HospitalSchema.index({ location: '2dsphere' });

export default mongoose.model('Hospital', HospitalSchema);
