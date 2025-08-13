import mongoose from 'mongoose';
import Hospital from '../models/Hospital.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the parent directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function checkHospitals() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const hospitals = await Hospital.find({}, 'name email password').limit(5);
    
    console.log('First 5 hospitals in database:');
    hospitals.forEach((hospital, index) => {
      console.log(`${index + 1}. Name: "${hospital.name}"`);
      console.log(`   Email: ${hospital.email}`);
      console.log(`   Has Password: ${hospital.password ? 'Yes' : 'No'}`);
      if (hospital.password) {
        console.log(`   Password Hash: ${hospital.password.substring(0, 20)}...`);
      }
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error checking hospitals:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkHospitals();
