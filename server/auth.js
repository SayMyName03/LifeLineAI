// server.js
import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import cors from "cors";

import User from "./models/User.js";
import Patient from "./models/Patient.js";
import Vitals from "./models/Vitals.js";
import Symptom from "./models/Symptom.js";
import TriageAssessment from "./models/TriageAssessment.js";
import dotenv from "dotenv";
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import Hospital from './models/Hospital.js';
import EnRouteAlert from './models/EnRouteAlert.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: 'http://localhost:8080', credentials: true }
});

io.on('connection', (socket) => {
  // client will emit join with hospitalId if hospital role
  socket.on('joinHospitalRoom', (hospitalId) => {
    if (hospitalId) socket.join(`hospital:${hospitalId}`);
  });
});

// === MONGODB CONNECTION ===
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected!"))
.catch((err) => console.error("MongoDB connection error:", err));

// === MIDDLEWARE ===
app.use(cors({
  origin: "http://localhost:8080",
  credentials: true,
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || "your_secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // set true if behind HTTPS proxy
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// === PASSPORT STRATEGIES ===
// Local Strategy for User (email + password)
passport.use('user-local', new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
  try {
    const user = await User.findOne({ email });
    if (!user) return done(null, false, { message: "Incorrect email." });
    if (!user.password) return done(null, false, { message: "No local password set." });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return done(null, false, { message: "Incorrect password." });
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

// Local Strategy for Hospital (name + password)
passport.use('hospital-local', new LocalStrategy({ 
  usernameField: "hospitalName",
  passwordField: "password" 
}, async (hospitalName, password, done) => {
  try {
    const hospital = await Hospital.findOne({ name: hospitalName });
    if (!hospital) return done(null, false, { message: "Hospital not found." });
    if (!hospital.password) return done(null, false, { message: "No password set for this hospital." });
    const match = await bcrypt.compare(password, hospital.password);
    if (!match) return done(null, false, { message: "Incorrect password." });
    // Add a type field to distinguish hospitals from users in session
    return done(null, { ...hospital.toObject(), type: 'hospital' });
  } catch (err) {
    return done(err);
  }
}));

const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:5001/auth/google/callback";
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  callbackURL: GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    if (!profile) return done(new Error('No profile from Google'));
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = await User.create({
        googleId: profile.id,
        email: profile.emails && profile.emails[0] ? profile.emails[0].value : undefined,
        name: profile.displayName,
      });
    }
    return done(null, user);
  } catch (err) {
    console.error('Google OAuth error:', err);
    return done(err);
  }
}));

passport.serializeUser((entity, done) => {
  if (entity.type === 'hospital') {
    done(null, { id: entity._id, type: 'hospital' });
  } else {
    done(null, { id: entity.id, type: 'user' });
  }
});

passport.deserializeUser(async (obj, done) => {
  try {
    if (obj.type === 'hospital') {
      const hospital = await Hospital.findById(obj.id);
      done(null, hospital ? { ...hospital.toObject(), type: 'hospital' } : null);
    } else {
      const user = await User.findById(obj.id);
      done(null, user);
    }
  } catch (err) {
    done(err);
  }
});

// === AUTH ROUTES ===
// User login (email + password)
app.post("/auth/login", passport.authenticate("user-local"), (req, res) => {
  res.json({ user: req.user });
});

// Hospital login (hospital name + password)
app.post("/auth/hospital-login", passport.authenticate("hospital-local"), (req, res) => {
  res.json({ hospital: req.user });
});

// Capture desired role via query (?role=clinician|hospital) before kicking off Google OAuth
app.get("/auth/google", (req, res, next) => {
  const { role } = req.query;
  let state;
  if (role === 'clinician' || role === 'hospital') {
    // store in session and also embed in OAuth state so we have two ways to retrieve
    req.session.oauthDesiredRole = role;
    state = role; // simple state string
  }
  passport.authenticate("google", { scope: ["profile", "email"], state })(req, res, next);
});

app.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/auth/google/failure" }), async (req, res) => {
  try {
    // prefer state param from Google callback, fallback to session
    const stateRole = (req.query.state === 'hospital' || req.query.state === 'clinician') ? req.query.state : undefined;
    const sessionRole = req.session.oauthDesiredRole;
    const desired = stateRole || sessionRole;
    if (desired && (desired === 'clinician' || desired === 'hospital') && req.user.role !== desired) {
      req.user.role = desired;
      await req.user.save();
    }
  } catch (e) {
    console.error('Post Google role assignment error:', e);
  } finally {
    let origin = 'http://localhost:8080';
    if (process.env.FRONTEND_ORIGIN) {
      origin = process.env.FRONTEND_ORIGIN.replace(/\/$/, '');
    } else if (process.env.FRONTEND_POST_LOGIN) {
      try { origin = new URL(process.env.FRONTEND_POST_LOGIN).origin; } catch {}
    }
    const destPath = req.user.role === 'hospital' ? '/hospital/dashboard' : '/triage';
    if (req.session.oauthDesiredRole) delete req.session.oauthDesiredRole;
    res.redirect(origin + destPath);
  }
});

app.get('/auth/google/failure', (req,res) => {
  res.status(401).json({ error: 'Google authentication failed' });
});

app.post("/auth/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  });
});

app.get("/auth/me", (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    if (req.user.type === 'hospital') {
      res.json({ hospital: req.user });
    } else {
      res.json({ user: req.user });
    }
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

// === USER REGISTRATION ===
app.post("/api/users", async (req, res) => {
  try {
    const { password, role, ...rest } = req.body;
    const permittedRole = (role === 'hospital' || role === 'clinician') ? role : undefined; // admin cannot be self-assigned here
    const hash = await bcrypt.hash(password, 10);
    const user = new User({ ...rest, password: hash, ...(permittedRole ? { role: permittedRole } : {}) });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// === HOSPITAL REGISTRATION (basic) ===
app.post('/api/hospitals', async (req,res) => {
  try {
    const { name, email, password, address, services = [], lat, lng, contactPhone } = req.body;
    const hospital = await Hospital.create({
      name,
      email,
      password: password ? await bcrypt.hash(password,10) : undefined,
      address,
      services,
      location: { type: 'Point', coordinates: [lng, lat] },
      contactPhone,
      isVerified: true
    });
    // create a user record for login if password provided
    let user = await User.create({ email, password: hospital.password, role: 'hospital', hospitalId: hospital._id, name });
    res.status(201).json({ hospital, user });
  } catch(err){
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/hospitals', async (req,res) => {
  const { service } = req.query;
  const filter = service ? { services: service } : {};
  const list = await Hospital.find(filter).limit(100);
  res.json(list);
});

// Nearby hospitals by user lat,lng (query params: lat, lng, maxKm optional)
app.get('/api/hospitals/nearby', async (req,res) => {
  try {
    const { lat, lng, maxKm = 50 } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });
    const maxDistanceMeters = Number(maxKm) * 1000;
    const list = await Hospital.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          $maxDistance: maxDistanceMeters
        }
      }
    }).limit(50);
    res.json(list);
  } catch(err){
    res.status(400).json({ error: err.message });
  }
});

// Google Places API nearby hospitals search
app.get('/api/hospitals/places-nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 10000 } = req.query; // radius in meters
    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng required' });
    }

    const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
    if (!GOOGLE_PLACES_API_KEY) {
      return res.status(500).json({ error: 'Google Places API key not configured' });
    }

    // Use Google Places API to find nearby hospitals
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=hospital&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await fetch(placesUrl);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    // Filter and format results
    const hospitals = data.results
      .filter(place => 
        place.business_status === 'OPERATIONAL' && 
        place.types.some(type => ['hospital', 'medical_center', 'clinic', 'emergency_room'].includes(type))
      )
      .map(place => ({
        place_id: place.place_id,
        name: place.name,
        vicinity: place.vicinity,
        rating: place.rating,
        types: place.types,
        geometry: place.geometry,
        opening_hours: place.opening_hours,
        business_status: place.business_status
      }));

    res.json(hospitals);
  } catch (err) {
    console.error('Google Places API error:', err);
    res.status(500).json({ error: 'Failed to fetch nearby hospitals from Google Places' });
  }
});

// === ALERT CREATION ===
app.post('/api/alerts', async (req,res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { triageId, hospitalId, priority, vitalsSummary, symptomsSummary, etaSeconds } = req.body;
    const alert = await EnRouteAlert.create({
      triageId,
      hospitalId,
      createdBy: req.user._id,
      priority,
      vitalsSummary,
      symptomsSummary,
      etaSeconds
    });
    io.to(`hospital:${hospitalId}`).emit('alert:new', { alert });
    res.status(201).json({ alert });
  } catch(err){
    res.status(400).json({ error: err.message });
  }
});

// === DISPATCH TRIAGE TO SELECTED HOSPITAL ===
app.post('/api/alerts/dispatch', async (req,res) => {
  try {
    if(!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { hospitalId, triageId, patient, aiScore, aiInstructions } = req.body;
    if(!hospitalId || !triageId) return res.status(400).json({ error: 'hospitalId and triageId required' });
    // Build vitals summary
    let vitalsSummary = '';
    if (patient) {
      const parts = [];
      if (patient.heartRate != null) parts.push(`HR ${patient.heartRate}`);
      if (patient.systolicBP != null && patient.diastolicBP != null) parts.push(`BP ${patient.systolicBP}/${patient.diastolicBP}`);
      if (patient.temperature != null) parts.push(`Temp ${patient.temperature}`);
      if (patient.oxygenSaturation != null) parts.push(`SpO2 ${patient.oxygenSaturation}%`);
      vitalsSummary = parts.join(' | ');
    }
    const symptomsSummary = Array.isArray(patient?.symptoms) ? patient.symptoms.slice(0,4).join(', ') : '';
    const priority = aiScore != null ? (Number(aiScore) >= 8 ? 'critical' : Number(aiScore) >=5 ? 'urgent' : 'routine') : undefined;
    const patientSnapshot = patient ? {
      patientName: patient.patientName,
      age: patient.age,
      gender: patient.gender,
      heartRate: patient.heartRate,
      systolicBP: patient.systolicBP,
      diastolicBP: patient.diastolicBP,
      temperature: patient.temperature,
      oxygenSaturation: patient.oxygenSaturation,
      symptoms: patient.symptoms,
      additionalInfo: patient.additionalInfo
    } : undefined;
    const alert = await EnRouteAlert.create({ triageId, hospitalId, createdBy: req.user._id, vitalsSummary, symptomsSummary, priority, patientSnapshot, aiScore, aiInstructions });
    io.to(`hospital:${hospitalId}`).emit('alert:new', { alert });
    res.status(201).json({ alert });
  } catch(err){
    res.status(400).json({ error: err.message });
  }
});

// === GET INCOMING ALERTS FOR HOSPITAL ===
app.get('/api/alerts/incoming', async (req,res) => {
  if (!req.user || req.user.type !== 'hospital') return res.status(403).json({ error: 'Forbidden' });
  const hospitalId = req.user._id; // hospital document itself stored in session
  const alerts = await EnRouteAlert.find({ hospitalId }).sort({ createdAt: -1 }).limit(200);
  res.json(alerts);
});

// === UPDATE ALERT STATUS ===
app.patch('/api/alerts/:id/status', async (req,res) => {
  try {
    if (!req.user || req.user.role !== 'hospital') return res.status(403).json({ error: 'Forbidden' });
    const { status } = req.body;
    const alert = await EnRouteAlert.findOne({ _id: req.params.id, hospitalId: req.user.hospitalId });
    if (!alert) return res.status(404).json({ error: 'Not found' });
    alert.status = status;
    await alert.save();
    io.to(`hospital:${req.user.hospitalId}`).emit('alert:update', { alert });
    res.json({ alert });
  } catch(err){
    res.status(400).json({ error: err.message });
  }
});

// === TRIAGE SUBMISSION ===
app.post("/api/triage", async (req, res) => {
  try {
    const {
      patientName,
      age,
      gender,
      heartRate,
      systolicBP,
      diastolicBP,
      temperature,
      oxygenSaturation,
      symptoms,
      additionalInfo,
      aiScore,
      aiInstructions,
      selectedHospitalId,
      selectedHospitalName,
      selectedHospitalAddress,
      userId,
    } = req.body;

    let patient = await Patient.findOne({ name: patientName, age, gender });
    if (!patient) {
      patient = await Patient.create({ name: patientName, age, gender, createdBy: userId });
    }

    const vitals = await Vitals.create({
      patient: patient._id,
      heartRate,
      systolicBP,
      diastolicBP,
      temperature,
      oxygenSaturation,
    });

    let symptomIds = [];
    if (Array.isArray(symptoms)) {
      for (const s of symptoms) {
        let symptomDoc = await Symptom.findOne({ name: s });
        if (!symptomDoc) symptomDoc = await Symptom.create({ name: s });
        symptomIds.push(symptomDoc._id);
      }
    }

    const triage = await TriageAssessment.create({
      patient: patient._id,
      user: userId || null,
      vitals: vitals._id,
      symptoms: symptomIds,
      additionalInfo,
      aiScore,
      aiInstructions,
      selectedHospitalId,
      selectedHospitalName,
      selectedHospitalAddress,
    });

    res.status(201).json({ triage });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// === SERVER START ===
server.listen(5001, () => console.log("Server + Socket.io running on port 5001"));
