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
passport.use(new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
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

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// === AUTH ROUTES ===
app.post("/auth/login", passport.authenticate("local"), (req, res) => {
  res.json({ user: req.user });
});

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/auth/google/failure" }), (req, res) => {
  res.redirect(process.env.FRONTEND_POST_LOGIN || "http://localhost:8080/triage");
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
    res.json({ user: req.user });
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

// === USER REGISTRATION ===
app.post("/api/users", async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const user = new User({ ...rest, password: hash });
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

// === GET INCOMING ALERTS FOR HOSPITAL ===
app.get('/api/alerts/incoming', async (req,res) => {
  if (!req.user || req.user.role !== 'hospital') return res.status(403).json({ error: 'Forbidden' });
  const alerts = await EnRouteAlert.find({ hospitalId: req.user.hospitalId }).sort({ createdAt: -1 }).limit(200);
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
    });

    res.status(201).json({ triage });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// === SERVER START ===
server.listen(5001, () => console.log("Server + Socket.io running on port 5001"));
