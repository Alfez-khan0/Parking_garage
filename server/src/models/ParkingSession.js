const mongoose = require('mongoose');

const parkingSessionSchema = new mongoose.Schema({
  garage: { type: mongoose.Schema.Types.ObjectId, ref: 'Garage', required: true },
  spot: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingSpot', required: true },
  plateNumber: { type: String, required: true, uppercase: true, trim: true, index: true },
  vehicleType: { type: String, enum: ['COMPACT', 'STANDARD', 'EV'], required: true },
  checkInTime: { type: Date, default: Date.now },
  checkOutTime: Date,
  durationMinutes: { type: Number, min: 0 },
  billableHours: { type: Number, min: 0 },
  fee: { type: Number, min: 0 },
  status: { type: String, enum: ['ACTIVE', 'COMPLETED'], default: 'ACTIVE', index: true }
}, { timestamps: true });

parkingSessionSchema.index({ plateNumber: 1, status: 1 });
module.exports = mongoose.model('ParkingSession', parkingSessionSchema);
