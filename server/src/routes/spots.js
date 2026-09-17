const express = require('express');
const mongoose = require('mongoose');
const ParkingSpot = require('../models/ParkingSpot');
const Garage = require('../models/Garage');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);
async function ownedGarage(req, id) { return Garage.exists({ _id: id, owner: req.user._id }); }

router.post('/', async (req, res) => {
  const { garageId, spotNumber, floor, type } = req.body;
  const validTypes = ['COMPACT', 'STANDARD', 'EV'];

  if (!mongoose.Types.ObjectId.isValid(garageId)) {
    return res.status(400).json({ message: 'A valid garageId is required' });
  }
  if (typeof spotNumber !== 'string' || !spotNumber.trim()) {
    return res.status(400).json({ message: 'spotNumber is required' });
  }
  if (!Number.isInteger(floor) || floor < 1) {
    return res.status(400).json({ message: 'floor must be a positive integer' });
  }
  if (!validTypes.includes(type)) {
    return res.status(400).json({ message: 'type must be COMPACT, STANDARD or EV' });
  }
  if (!(await ownedGarage(req, garageId))) {
    return res.status(404).json({ message: 'Garage not found' });
  }

  const spot = await ParkingSpot.create({
    garage: garageId,
    spotNumber: spotNumber.trim(),
    floor,
    type,
    status: 'AVAILABLE'
  });
  res.status(201).json({ spot });
});

router.get('/', async (req, res) => {
  if (!(await ownedGarage(req, req.query.garageId))) return res.status(404).json({ message: 'Garage not found' });
  const spots = await ParkingSpot.find({ garage: req.query.garageId }).sort({ floor: 1, spotNumber: 1 });
  res.json({ spots });
});

router.get('/availability', async (req, res) => {
  if (!(await ownedGarage(req, req.query.garageId))) return res.status(404).json({ message: 'Garage not found' });
  const spots = await ParkingSpot.find({ garage: req.query.garageId });
  const available = spots.filter((spot) => spot.status === 'AVAILABLE');
  res.json({
    total: spots.length,
    available: available.length,
    occupied: spots.length - available.length,
    evTotal: spots.filter((spot) => spot.type === 'EV').length,
    evAvailable: available.filter((spot) => spot.type === 'EV').length,
    compactAvailable: available.filter((spot) => spot.type === 'COMPACT').length,
    standardAvailable: available.filter((spot) => spot.type === 'STANDARD').length
  });
});
module.exports = router;
