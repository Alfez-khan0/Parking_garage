require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const port = process.env.PORT || 5000;
async function start() {
  if (!process.env.MONGO_URI || !process.env.JWT_SECRET) throw new Error('MONGO_URI and JWT_SECRET must be configured');
  await mongoose.connect(process.env.MONGO_URI);
  app.listen(port, () => console.log(`ParkEase API listening on http://localhost:${port}`));
}
start().catch((error) => { console.error(`Startup failed: ${error.message}`); process.exit(1); });
