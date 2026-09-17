const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Garage = require('../models/Garage');
const ParkingSpot = require('../models/ParkingSpot');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const makeToken = (user) => jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6) {
    return res.status(400).json({ message: 'Name, email and a password of at least 6 characters are required' });
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ message: 'Email is already registered' });
  let user;
  let garage;
  try {
    user = await User.create({ name: name.trim(), email: normalizedEmail, password: await bcrypt.hash(password, 10) });
    garage = await Garage.create({ name: 'ParkEase Main Garage', address: 'Jaipur, Rajasthan', owner: user._id });
    await ParkingSpot.insertMany([
      { garage: garage._id, spotNumber: 'C-01', floor: 1, type: 'COMPACT', status: 'AVAILABLE' },
      { garage: garage._id, spotNumber: 'S-01', floor: 1, type: 'STANDARD', status: 'AVAILABLE' },
      { garage: garage._id, spotNumber: 'EV-01', floor: 1, type: 'EV', status: 'AVAILABLE' }
    ]);
  } catch (error) {
    if (garage) {
      await ParkingSpot.deleteMany({ garage: garage._id });
      await Garage.deleteOne({ _id: garage._id });
    }
    if (user) await User.deleteOne({ _id: user._id });
    console.error('Registration onboarding failed:', error);
    return res.status(500).json({ message: 'Unable to complete account setup' });
  }
  res.status(201).json({ token: makeToken(user), user: { id: user._id, name: user.name, email: user.email } });
});

router.post('/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email?.trim().toLowerCase() }).select('+password');
  if (!user || !(await bcrypt.compare(req.body.password || '', user.password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  res.json({ token: makeToken(user), user: { id: user._id, name: user.name, email: user.email } });
});

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));
module.exports = router;
