const mongoose = require('mongoose');

const parkingSpotSchema = new mongoose.Schema({
  garage: { type: mongoose.Schema.Types.ObjectId, ref: 'Garage', required: true },
  spotNumber: { type: String, required: true, trim: true },
  floor: { type: Number, required: true, min: 1 },
  type: { type: String, enum: ['COMPACT', 'STANDARD', 'EV'], required: true },
  status: { type: String, enum: ['AVAILABLE', 'OCCUPIED'], default: 'AVAILABLE' }
}, { timestamps: true });

parkingSpotSchema.index({ garage: 1, spotNumber: 1 }, { unique: true });
module.exports = mongoose.model('ParkingSpot', parkingSpotSchema);
