# ParkEase

ParkEase is a full-stack parking garage desk for attendants. It handles vehicle check-in and check-out, compatible spot assignment, EV availability, billing, search, and parking history.

## Features

- Registration and JWT login
- Multiple garages and multi-level spots
- Compact, standard, and EV spot types
- EV-only allocation for EV vehicles
- Atomic available-spot reservation
- Tiered fee calculation: $50 first hour, $30 additional hour, $250 continuous-stay cap
- Case-insensitive plate search
- Paginated and sortable parking history
- Responsive landing page and attendant dashboard

## Stack

React + Vite, Node.js + Express, MongoDB + Mongoose, JWT, and bcryptjs.

## Run Locally

1. Start MongoDB.
2. Backend: `cd server`, `npm install`, copy `.env.example` to `.env`, set `MONGO_URI` and `JWT_SECRET`, then run `npm run dev`.
3. Optional demo data: `node seed.js` from `server`. Demo login is `attendant@parkease.local` / `password123`.
4. Frontend: `cd client`, `npm install`, then `npm run dev`. Set `VITE_API_URL` only if the API is not at `http://localhost:5000/api`.

## API Endpoints

All endpoints except registration, login, and health require `Authorization: Bearer <token>`.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Create an attendant |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Current user |
| GET/POST | `/api/garages` | List/create garages |
| GET | `/api/garages/:id` | Get one garage |
| GET | `/api/spots?garageId=` | List spots |
| GET | `/api/spots/availability?garageId=` | Availability counts including EV |
| POST | `/api/parking/check-in` | Assign a compatible spot |
| POST | `/api/parking/check-out` | Calculate fee and release spot |
| GET | `/api/parking/search?plate=` | Search by plate |
| GET | `/api/parking?page=1&limit=10&sort=checkInTime&order=desc` | History with pagination/sorting |
| GET | `/api/parking/:id` | Session details |

## Debugging

Check that MongoDB is running and `server/.env` contains both required values. Use `GET /api/health` to separate API startup problems from database or authentication problems. The fee unit tests run with `cd server && npm test`.

## Next Features

1. Online reservations
2. Digital payments
3. Parking analytics and reports
