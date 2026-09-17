const express = require('express');
const Garage = require('../models/Garage');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);
router.get('/', async (req, res) => res.json({ garages: await Garage.find({ owner: req.user._id }).sort({ createdAt: 1 }) }));
router.post('/', async (req, res) => {
  if (!req.body.name || !req.body.address) return res.status(400).json({ message: 'Name and address are required' });
  res.status(201).json({ garage: await Garage.create({ name: req.body.name, address: req.body.address, owner: req.user._id }) });
});
router.get('/:id', async (req, res) => {
  const garage = await Garage.findOne({ _id: req.params.id, owner: req.user._id });
  if (!garage) return res.status(404).json({ message: 'Garage not found' });
  res.json({ garage });
});
module.exports = router;
