import mongoose from 'mongoose';
import Hospital from '../models/Hospital.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the parent directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Sample hospital data for major cities in India
const sampleHospitals = [
  // Bangalore Hospitals
  {
    name: "Manipal Hospital Whitefield",
    email: "admin@manipal-whitefield.com",
    address: "#143, 212-2015, EPIP Industrial Area, Whitefield, Bangalore, Karnataka 560066",
    location: {
      type: "Point",
      coordinates: [77.7499, 12.9699] // [lng, lat]
    },
    contactPhone: "+91-80-6692-2222",
    services: ["Emergency", "Cardiology", "Neurology", "Oncology", "ICU"],
    isVerified: true
  },
  {
    name: "Fortis Hospital Bannerghatta Road",
    email: "admin@fortis-bannerghatta.com", 
    address: "154/9, Bannerghatta Road, Opposite IIM, Bangalore, Karnataka 560076",
    location: {
      type: "Point",
      coordinates: [77.6081, 12.8897]
    },
    contactPhone: "+91-80-6621-4444",
    services: ["Emergency", "Trauma", "Cardiology", "Orthopedics", "ICU"],
    isVerified: true
  },
  {
    name: "Apollo Hospital Sheshadripuram",
    email: "admin@apollo-sheshadripuram.com",
    address: "154/11, Opposite IIM, Bannerghatta Road, Bangalore, Karnataka 560076",
    location: {
      type: "Point", 
      coordinates: [77.5946, 12.9716]
    },
    contactPhone: "+91-80-2612-2121",
    services: ["Emergency", "Cardiology", "Neurosurgery", "Pediatrics", "ICU"],
    isVerified: true
  },
  {
    name: "Narayana Health City",
    email: "admin@narayana-healthcity.com",
    address: "258/A, Bommasandra Industrial Area, Anekal Taluk, Bangalore, Karnataka 560099",
    location: {
      type: "Point",
      coordinates: [77.6648, 12.8051]
    },
    contactPhone: "+91-80-7122-2222",
    services: ["Emergency", "Cardiac Surgery", "Transplants", "Oncology", "ICU"],
    isVerified: true
  },
  {
    name: "NIMHANS (National Institute of Mental Health & Neurosciences)",
    email: "admin@nimhans.com",
    address: "Hosur Road, Bangalore, Karnataka 560029",
    location: {
      type: "Point",
      coordinates: [77.5945, 12.9435]
    },
    contactPhone: "+91-80-2699-5555",
    services: ["Emergency", "Neurology", "Psychiatry", "Neurosurgery", "ICU"],
    isVerified: true
  },

  // Mumbai Hospitals
  {
    name: "Lilavati Hospital and Research Centre",
    email: "admin@lilavati.com",
    address: "A-791, Bandra Reclamation, Bandra West, Mumbai, Maharashtra 400050",
    location: {
      type: "Point",
      coordinates: [72.8198, 19.0596]
    },
    contactPhone: "+91-22-2640-0888",
    services: ["Emergency", "Cardiology", "Oncology", "Organ Transplant", "ICU"],
    isVerified: true
  },
  {
    name: "Kokilaben Dhirubhai Ambani Hospital",
    email: "admin@kokilabenhospital.com",
    address: "Rao Saheb Achutrao Patwardhan Marg, Four Bunglows, Andheri West, Mumbai, Maharashtra 400053",
    location: {
      type: "Point",
      coordinates: [72.8064, 19.1136]
    },
    contactPhone: "+91-22-4269-6969",
    services: ["Emergency", "Robotic Surgery", "Transplants", "Cancer Care", "ICU"],
    isVerified: true
  },

  // Delhi Hospitals  
  {
    name: "All India Institute of Medical Sciences (AIIMS)",
    email: "admin@aiims.edu",
    address: "Sri Aurobindo Marg, New Delhi, Delhi 110029",
    location: {
      type: "Point",
      coordinates: [77.2073, 28.5672]
    },
    contactPhone: "+91-11-2658-8500",
    services: ["Emergency", "All Specialties", "Research", "Teaching", "ICU"],
    isVerified: true
  },
  {
    name: "Fortis Escorts Heart Institute",
    email: "admin@fortis-escorts.com",
    address: "Okhla Road, New Delhi, Delhi 110025",
    location: {
      type: "Point", 
      coordinates: [77.2420, 28.5355]
    },
    contactPhone: "+91-11-4713-5000",
    services: ["Emergency", "Cardiology", "Cardiac Surgery", "Heart Transplant", "ICU"],
    isVerified: true
  },

  // Chennai Hospitals
  {
    name: "Apollo Main Hospital",
    email: "admin@apollo-chennai.com", 
    address: "21, Greams Lane, Off Greams Road, Chennai, Tamil Nadu 600006",
    location: {
      type: "Point",
      coordinates: [80.2450, 13.0569]
    },
    contactPhone: "+91-44-2829-3333",
    services: ["Emergency", "Cardiology", "Oncology", "Transplants", "ICU"],
    isVerified: true
  }
];

async function populateHospitals() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing hospitals
    await Hospital.deleteMany({});
    console.log('Cleared existing hospitals');

    // Insert sample hospitals
    const insertedHospitals = await Hospital.insertMany(sampleHospitals);
    console.log(`Inserted ${insertedHospitals.length} hospitals`);

    // Create 2dsphere index for geospatial queries
    await Hospital.createIndexes();
    console.log('Created geospatial indexes');

    console.log('Sample hospitals populated successfully!');
    
  } catch (error) {
    console.error('Error populating hospitals:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

populateHospitals();
