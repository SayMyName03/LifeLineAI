import mongoose from 'mongoose';
import Hospital from '../models/Hospital.js';
import dotenv from 'dotenv';

dotenv.config();

async function listHospitals() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const hospitals = await Hospital.find({}).select('name email password');
    console.log(`\nTotal hospitals: ${hospitals.length}\n`);
    
    hospitals.forEach((h, i) => {
      console.log(`${i+1}. Name: "${h.name}"`);
      console.log(`   Email: ${h.email}`);
      console.log(`   Has Password: ${h.password ? 'Yes' : 'No'}`);
      console.log('---');
    });
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listHospitals();
