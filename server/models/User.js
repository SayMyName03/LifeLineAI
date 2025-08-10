import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email:      { type: String, required: true, unique: true },
  password:   { type: String }, // hashed, for local auth
  googleId:   { type: String },
  githubId:   { type: String },
  name:       { type: String },
  role:       { type: String, enum: ['clinician','hospital','admin'], default: 'clinician' },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
  createdAt:  { type: Date, default: Date.now }
});

export default mongoose.model("User", UserSchema);