const express = require('express');
const Garage = require('../models/Garage');
const ParkingSpot = require('../models/ParkingSpot');
const ParkingSession = require('../models/ParkingSession');
const { requireAuth } = require('../middleware/auth');
const { calculateFee } = require('../utils/fee');

const router = express.Router();
router.use(requireAuth);
const normalizePlate = (plate) => plate?.trim().toUpperCase();
async function ownedGarage(userId, garageId) { return Garage.exists({ _id: garageId, owner: userId }); }

router.post('/check-in', async (req, res) => {
  const plateNumber = normalizePlate(req.body.plateNumber);
  const { garageId, vehicleType } = req.body;
  if (!plateNumber || !garageId || !['COMPACT', 'STANDARD', 'EV'].includes(vehicleType)) return res.status(400).json({ message: 'Garage, plate number and valid vehicle type are required' });
  if (!(await ownedGarage(req.user._id, garageId))) return res.status(404).json({ message: 'Garage not found' });
  if (await ParkingSession.exists({ garage: garageId, plateNumber, status: 'ACTIVE' })) return res.status(409).json({ message: 'Vehicle is already parked in this garage' });
  const spot = await ParkingSpot.findOneAndUpdate({ garage: garageId, type: vehicleType, status: 'AVAILABLE' }, { $set: { status: 'OCCUPIED' } }, { new: true });
  if (!spot) return res.status(409).json({ message: `No available ${vehicleType.toLowerCase()} spot` });
  try {
    const session = await ParkingSession.create({ garage: garageId, spot: spot._id, plateNumber, vehicleType });
    res.status(201).json({ session: await session.populate('spot') });
  } catch (error) {
    await ParkingSpot.findByIdAndUpdate(spot._id, { status: 'AVAILABLE' });
    throw error;
  }
});

router.post('/check-out', async (req, res) => {
  const plateNumber = normalizePlate(req.body.plateNumber);
  const session = await ParkingSession.findOne({ plateNumber, status: 'ACTIVE', ...(req.body.garageId ? { garage: req.body.garageId } : {}) });
  if (!session) return res.status(404).json({ message: 'No active parking session found for this plate' });
  if (!(await ownedGarage(req.user._id, session.garage))) return res.status(404).json({ message: 'Parking session not found' });
  const checkOutTime = new Date();
  const billing = calculateFee(session.checkInTime, checkOutTime);
  session.checkOutTime = checkOutTime;
  session.durationMinutes = billing.durationMinutes;
  session.billableHours = billing.billableHours;
  session.fee = billing.fee;
  session.status = 'COMPLETED';
  await session.save();
  await ParkingSpot.findByIdAndUpdate(session.spot, { status: 'AVAILABLE' });
  res.json({ receipt: await session.populate('spot') });
});

router.get('/search', async (req, res) => {
  const plate = normalizePlate(req.query.plate);
  if (!plate) return res.status(400).json({ message: 'Plate search text is required' });
  const garages = await Garage.find({ owner: req.user._id }).select('_id');
  const sessions = await ParkingSession.find({ garage: { $in: garages.map((garage) => garage._id) }, plateNumber: { $regex: plate, $options: 'i' } }).populate('spot').sort({ checkInTime: -1 });
  res.json({ sessions });
});

router.get('/', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const allowedSorts = ['checkInTime', 'checkOutTime', 'fee', 'plateNumber', 'status'];
  const sort = allowedSorts.includes(req.query.sort) ? req.query.sort : 'checkInTime';
  const direction = req.query.order === 'asc' ? 1 : -1;
  const garages = await Garage.find({ owner: req.user._id }).select('_id');
  const filter = { garage: { $in: garages.map((garage) => garage._id) } };
  const [sessions, total] = await Promise.all([
    ParkingSession.find(filter).populate('spot garage').sort({ [sort]: direction }).skip((page - 1) * limit).limit(limit),
    ParkingSession.countDocuments(filter)
  ]);
  res.json({ sessions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

router.get('/:id', async (req, res) => {
  const session = await ParkingSession.findById(req.params.id).populate('spot garage');
  if (!session || !(await ownedGarage(req.user._id, session.garage._id))) return res.status(404).json({ message: 'Parking session not found' });
  res.json({ session });
});
module.exports = router;
