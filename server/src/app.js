const express = require('express');
const cors = require('cors');
const auth = require('./routes/auth');
const garages = require('./routes/garages');
const spots = require('./routes/spots');
const parking = require('./routes/parking');

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'ParkEase API' }));
app.use('/api/auth', auth);
app.use('/api/garages', garages);
app.use('/api/spots', spots);
app.use('/api/parking', parking);
app.use((error, req, res, next) => {
  console.error(error);
  if (error.code === 11000) return res.status(409).json({ message: 'A record with that value already exists' });
  res.status(500).json({ message: 'Something went wrong' });
});
module.exports = app;
