============================================================
README.md
============================================================

# ParkEase — Parking Garage Management System

ParkEase is a full-stack parking garage management system built for a coding assessment. It helps parking attendants manage vehicles, parking spots, availability, parking fees, and parking history.

## Problem Statement

A busy multi-level parking garage has limited parking spots of different types:

- Compact
- Standard
- EV

The system must allow an attendant to check vehicles in and out, assign compatible parking spots, calculate the correct parking fee, check EV availability, and search vehicles by their plate number.

The system must also prevent a parking spot from being assigned to multiple active vehicles.

## Features

- User registration and login
- JWT authentication
- Garage management
- Parking spot management
- Compact, Standard and EV spots
- EV-only parking allocation
- Vehicle check-in/check-out
- Duplicate active vehicle prevention
- Parking fee calculation
- EV availability
- Vehicle plate search
- Parking session history
- Pagination and sorting
- Responsive dashboard

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React.js, Vite, JavaScript, CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcryptjs |
| API | REST API |
| Development | Git, GitHub, VS Code |

## Fee Rules

| Rule | Value |
|---|---:|
| First hour | ₹50 |
| Additional hour | ₹30 |
| Daily maximum | ₹250 |
| Partial hour | Rounded up |

Examples:

1 hour   → ₹50
2 hours  → ₹80
3 hours  → ₹110
8+ hours → ₹250

## Parking Allocation Rules

EV vehicle → EV spot only

Other vehicles → Compatible available spot

Occupied spot → Cannot be allocated

Active vehicle → Cannot check in again

After checkout, the parking spot becomes available again.

## Main APIs

### Authentication

POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me

### Garage

GET  /api/garages
POST /api/garages
GET  /api/garages/:id

### Parking Spots

POST /api/spots
GET  /api/spots
GET  /api/spots/availability

### Parking

POST /api/parking/check-in
POST /api/parking/check-out
GET  /api/parking/search
GET  /api/parking
GET  /api/parking/:id

## Project Structure

Parking_garage/
├── client/
├── server/
│   └── src/
│       ├── models/
│       ├── routes/
│       ├── middleware/
│       └── utils/
├── README.md
├── REASONING.md
└── AI_LOGS.md

## Setup

### 1. Clone Repository

git clone https://github.com/Alfez-khan0/Parking_garage.git
cd Parking_garage

### 2. Backend

cd server
npm install

Create `server/.env`:

PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/parkEase
JWT_SECRET=your_secret
CLIENT_URL=http://localhost:5173

Start the backend:

npm run dev

Backend:
http://localhost:5000

### 3. Frontend

Open another terminal:

cd client
npm install
npm run dev

Frontend:
http://localhost:5173

## Application Flow

Register/Login
      ↓
Create Garage
      ↓
Create Parking Spots
      ↓
Check Availability
      ↓
Vehicle Check-In
      ↓
Compatible Spot Assigned
      ↓
Vehicle Check-Out
      ↓
Fee Calculated
      ↓
Spot Released
      ↓
Parking History

## Documentation

- REASONING.md — Engineering decisions
- AI_LOGS.md — AI-assisted development log

## Project Status

Working MVP implementing the core parking garage requirements from the assessment.


============================================================
REASONING.md
============================================================

# ParkEase — Engineering Reasoning

## 1. Problem Understanding

The system is designed for a multi-level parking garage where an attendant needs to:

- Check vehicles in and out
- Allocate available parking spots
- Support Compact, Standard and EV spots
- Ensure EV vehicles use EV spots
- Prevent double allocation
- Calculate parking fees
- Check EV availability
- Search vehicles by plate number
- Manage a large parking history

The implementation focuses on these core requirements without unnecessary complexity.

## 2. Tech Stack & Technology Choices

### Frontend

- React.js — component-based user interface
- Vite — frontend development and build tool
- JavaScript — application logic
- CSS — styling and responsive layout

### Backend

- Node.js — server-side JavaScript runtime
- Express.js — REST API development

### Database

- MongoDB — application data storage
- Mongoose — schema definition and database interaction

### Authentication

- JWT — user authentication
- bcryptjs — password hashing

### Development

- Git — version control
- GitHub — source code repository
- VS Code — development environment

The stack was selected because it is lightweight, familiar, and suitable for implementing the required functionality within a timed assessment.

## 3. Database Design

The application uses four main models:

- User
- Garage
- ParkingSpot
- ParkingSession

A Garage belongs to a User.

A ParkingSpot belongs to a Garage.

A ParkingSession stores the vehicle's parking information and references the garage and parking spot.

## 4. Parking Allocation

When a vehicle checks in:

1. Validate the garage and vehicle type.
2. Normalize the plate number.
3. Check whether the vehicle already has an active session.
4. Find an available compatible parking spot.
5. EV vehicles are assigned only to EV spots.
6. Mark the selected spot as occupied.
7. Create an active parking session.

If no compatible spot is available, check-in is rejected.

## 5. Preventing Double Allocation

Only parking spots with:

status = AVAILABLE

can be allocated.

After check-in:

AVAILABLE → OCCUPIED

After checkout:

OCCUPIED → AVAILABLE

The system also prevents the same vehicle from having multiple active parking sessions.

## 6. Fee Calculation

The implemented fee structure is:

First hour      = ₹50
Additional hour = ₹30
Maximum fee     = ₹250

Part-hours are rounded up.

For example:

61 minutes → 2 billable hours → ₹80

The final fee is capped at ₹250.

## 7. EV Availability

A dedicated availability API provides:

- Total spots
- Available spots
- Occupied spots
- Total EV spots
- Available EV spots
- Available Compact spots
- Available Standard spots

This allows the attendant to quickly check whether an EV spot is currently available.

## 8. Vehicle Search

Vehicles can be searched using their number plate.

Example:

GET /api/parking/search?plate=RJ14AB1234

Plate numbers are normalized to make searching more consistent.

## 9. Pagination and Sorting

Parking history can become large during the day.

Therefore the parking API supports pagination:

GET /api/parking?page=1&limit=10

It also supports sorting:

GET /api/parking?page=1&limit=10&sort=checkInTime&order=desc

Pagination is performed at the database query level rather than loading the entire history into the frontend.

## 10. Authentication & Authorization

JWT is used to authenticate users.

The client sends:

Authorization: Bearer <token>

The authentication middleware verifies the token and identifies the user.

Garage ownership is checked before allowing access to garage-related data.

Passwords are hashed using bcryptjs.

## 11. API Structure

The backend routes are separated by responsibility:

routes/
├── auth.js
├── garages.js
├── spots.js
└── parking.js

Authentication is handled through middleware.

Database schemas are kept in the models directory.

Fee calculation is separated into a utility.

This keeps the code organized and easy to understand.

## 12. Important Tradeoffs

The implementation uses a simple allocation approach suitable for the assessment.

A larger production system could use database transactions or atomic operations for stronger concurrency handling.

The project intentionally avoids microservices and other unnecessary infrastructure because the assessment focuses on the core parking workflow.

## 13. Main Design Goal

The implementation is centered around two main requirements:

1. Every vehicle should be charged the correct parking fee.
2. No parking spot should be allocated to multiple active vehicles.

The remaining features such as EV availability, plate search, pagination, authentication and the dashboard support these core requirements.