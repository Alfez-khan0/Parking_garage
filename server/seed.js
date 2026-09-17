require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Garage = require('./src/models/Garage');
const ParkingSpot = require('./src/models/ParkingSpot');
const bcrypt = require('bcryptjs');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  const email = 'attendant@parkease.local';
  const user = await User.findOneAndUpdate({ email }, { name: 'Demo Attendant', email, password: await bcrypt.hash('password123', 10) }, { upsert: true, new: true, setDefaultsOnInsert: true });
  const garage = await Garage.findOneAndUpdate({ owner: user._id, name: 'City Centre Garage' }, { owner: user._id, name: 'City Centre Garage', address: 'Jaipur City Centre' }, { upsert: true, new: true, setDefaultsOnInsert: true });
  await ParkingSpot.deleteMany({ garage: garage._id });
  const spots = [];
  for (const floor of [1, 2]) {
    for (let index = 1; index <= 10; index += 1) spots.push({ garage: garage._id, floor, spotNumber: `C${floor}${String(index).padStart(2, '0')}`, type: 'COMPACT' });
    for (let index = 1; index <= 10; index += 1) spots.push({ garage: garage._id, floor, spotNumber: `S${floor}${String(index).padStart(2, '0')}`, type: 'STANDARD' });
    for (let index = 1; index <= 5; index += 1) spots.push({ garage: garage._id, floor, spotNumber: `E${floor}${String(index).padStart(2, '0')}`, type: 'EV' });
  }
  await ParkingSpot.insertMany(spots);
  console.log(`Seeded ${garage.name} with ${spots.length} spots.`);
  console.log(`Demo login: ${email} / password123`);
  await mongoose.disconnect();
}
seed().catch((error) => { console.error(error); process.exit(1); });
