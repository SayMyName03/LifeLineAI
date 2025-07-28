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

dotenv.config();

const app = express();

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
  secret: "your_secret",
  resave: false,
  saveUninitialized: false,
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

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback",
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = await User.create({
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
      });
    }
    return done(null, user);
  } catch (err) {
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

app.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), (req, res) => {
  res.redirect("http://localhost:8080/triage");
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
app.listen(5001, () => console.log("Server running on port 5001"));
