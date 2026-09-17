# AI Logs
The storyline
"A busy multi-level city-centre parking garage. Cars come and go all day, and the attendant needs to check a car in, check it out, and charge the right fee. Rates are tiered — the first hour is one price, each extra hour is cheaper, and there’s a daily cap so nobody is overcharged for a long stay; part-hours round up. Spots are limited and come in types — compact, standard, and EV (with a charger) — and an EV must get an EV spot. Drivers keep asking ‘is an EV spot free right now?’ and the attendant hunts for a car by its plate. By evening the log is huge."
I want to design and build a generic Parking Garage Management System using the MERN stack (MongoDB, Express.js, React.js, Node.js).
My approach is to implement vehicle check-in/check-out, dynamic parking spot allocation based on vehicle and spot type, plate-based session lookup, and accurate tiered fee calculation with hourly rounding and a daily cap.
The system should prevent double-booking of spots and ensure EV vehicles are assigned only to EV charging spots.
Build the attendant something so every car is charged correctly and no spot is double-parked.
(The attendant’s day is the spec — build it for any garage, not one. Get check-in / check-out and the fee right first, then the spot types and lookups.)

Yes. This is a very different round from a normal coding/DSA assessment. They are testing whether you can take an incomplete real-world requirement and turn it into a working product in 2.5 hours.

For your parking-garage problem, I would not try to build a fancy parking-management system. The winning strategy is: get the core workflow correct, make the UI usable, and satisfy every mandatory requirement.

1. What your problem actually requires

Your core system is:

Admin/Attendant
      │
      ├── Login/Register
      │
      ├── Dashboard
      │     ├── Available spots
      │     ├── Occupied spots
      │     ├── EV availability
      │     └── Today's revenue
      │
      ├── Check In
      │     ├── Vehicle plate
      │     ├── Vehicle type
      │     └── Assign available spot
      │
      ├── Check Out
      │     ├── Search plate
      │     ├── Calculate duration
      │     └── Calculate fee
      │
      ├── Search parking records
      │
      └── Parking history

The most important business rule is:

A spot cannot be occupied by two active parking sessions.

And:

EV vehicles can only use EV spots.

2. I recommend MERN for you

Don't suddenly switch to Spring Boot, Django, etc. You already know MERN.

Use:

Frontend
React + Vite
        │
        │ REST API
        ▼
Backend
Node.js + Express
        │
        ▼
MongoDB

For this assessment, I would skip Redis, Socket.IO, Docker, Kubernetes, TypeScript, Tailwind setup headaches, etc.

You have 2.5 hours.

Every additional technology is another place to lose time.

Suggested stack
React
Axios
React Router
Express
MongoDB + Mongoose
JWT
bcryptjs

That's enough.

3. Database design

Keep the schema simple.

User
{
  name,
  email,
  password
}
Garage

Because the brief says:

"build it for any garage, not one"

Don't hardcode one garage.

{
  name,
  address
}
ParkingSpot
{
  garageId,
  spotNumber,
  floor,
  type: "COMPACT" | "STANDARD" | "EV",
  status: "AVAILABLE" | "OCCUPIED"
}

Example:

A-101 → COMPACT
A-102 → STANDARD
A-103 → EV
B-201 → STANDARD
B-202 → EV
ParkingSession
{
  garageId,
  spotId,
  plateNumber,
  vehicleType,
  checkInTime,
  checkOutTime,
  durationMinutes,
  fee,
  status: "ACTIVE" | "COMPLETED"
}

This is the most important collection.

4. Vehicle types

I'd use:

COMPACT
STANDARD
EV

And map them directly to spots.

For example:

Vehicle	Allowed spots
Compact	Compact
Standard	Standard
EV	EV

You could potentially allow a compact car to use a standard spot, but don't introduce unnecessary allocation rules unless the brief requires them.

The brief specifically says:

"an EV must get an EV spot."

So that rule is mandatory.

5. Fee calculation

This is where you need to be careful.

The brief says:

first hour is one price, each extra hour is cheaper, and there's a daily cap; part-hours round up.

But it doesn't give actual prices.

Therefore, you need to define the rates yourself and clearly document your assumption in REASONING.md.

For example:

First hour       ₹50
Each extra hour  ₹30
Daily maximum    ₹250

Then:

30 minutes

Round up → 1 hour

₹50
1 hour
₹50
2 hours
₹50 + ₹30
= ₹80
5 hours
₹50 + (4 × ₹30)
= ₹170
10 hours
₹50 + (9 × ₹30)
= ₹320

Daily cap = ₹250

Final = ₹250
6. JavaScript fee calculation

This can be extremely simple:

function calculateFee(checkIn, checkOut) {
    const diffMs = new Date(checkOut) - new Date(checkIn);

    const minutes = Math.ceil(diffMs / (1000 * 60));

    const hours = Math.ceil(minutes / 60);

    if (hours <= 1) {
        return 50;
    }

    const fee = 50 + (hours - 1) * 30;

    return Math.min(fee, 250);
}

But there's one subtle point:

Exactly 2 hours 1 minute

That's:

3 hours

because:

part-hours round up.

So:

2h 1m → 3 hours

Make sure your implementation handles this.

7. Check-in algorithm

This should be your core logic:

Receive plate + vehicle type

        ↓

Check whether plate already has ACTIVE session

        ↓
     Yes → Reject
        ↓
       No

        ↓

Find available spot compatible with vehicle type

        ↓
     None → "No spot available"

        ↓
      Found

        ↓

Create ParkingSession

        ↓

Mark ParkingSpot OCCUPIED

        ↓

Return ticket/session details
Important

Don't trust the frontend to prevent double parking.

The backend must enforce it.

For example:

const existing = await ParkingSession.findOne({
    plateNumber,
    status: "ACTIVE"
});

if (existing) {
    return res.status(400).json({
        message: "Vehicle is already parked"
    });
}

Then find the spot.

8. Check-out algorithm
Enter plate number
       ↓
Find ACTIVE session
       ↓
Not found → Error
       ↓
Calculate duration
       ↓
Calculate fee
       ↓
Set checkoutTime
       ↓
Set status = COMPLETED
       ↓
Free parking spot
       ↓
Return receipt

This is the workflow the evaluator is most likely to care about.

9. Search

The requirement explicitly says:

Search.

Your easiest useful implementation:

Search by plate
GET /api/parking/search?plate=RJ14AB1234

Backend:

const sessions = await ParkingSession.find({
    plateNumber: {
        $regex: plate,
        $options: "i"
    }
});

UI:

┌───────────────────────────────────┐
│ Search vehicle by plate           │
│                                   │
│ RJ14AB1234              [Search]  │
└───────────────────────────────────┘

Results:

Plate       Spot       Status       Check In
RJ14AB1234  B-204      ACTIVE       10:32 AM
10. EV availability

This should be visible directly on the dashboard.

For example:

Parking Overview

┌────────────┐ ┌────────────┐ ┌────────────┐
│ Total      │ │ Available  │ │ Occupied   │
│ 120        │ │ 73         │ │ 47         │
└────────────┘ └────────────┘ └────────────┘

┌─────────────────────────────┐
│ EV SPOTS                    │
│                             │
│ Available: 4 / 10           │
└─────────────────────────────┘

The attendant shouldn't have to search manually to answer:

"Is an EV spot free?"

11. Pagination + sorting

This is mandatory, so don't forget it.

Your parking history API:

GET /api/parking?page=1&limit=10&sort=checkInTime&order=desc

Backend:

const page = Number(req.query.page) || 1;
const limit = Number(req.query.limit) || 10;

const skip = (page - 1) * limit;

const sessions = await ParkingSession.find()
    .sort({
        [sort]: order === "asc" ? 1 : -1
    })
    .skip(skip)
    .limit(limit);

Frontend:

Parking History

Plate       Spot    Duration    Fee     Status
------------------------------------------------
RJ14AB1234  A-102   2h 20m      ₹110    Completed
RJ14CD5678  B-203   1h 05m      ₹80     Completed
...

[Previous]   Page 2   [Next]

Sorting options:

Newest
Oldest
Highest Fee
Lowest Fee

That's enough.

12. REST APIs

I'd keep the API list around 10–12 endpoints.

Authentication
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
Garage
GET    /api/garages
GET    /api/garages/:id
Parking spots
GET    /api/spots
GET    /api/spots/availability
Parking
POST   /api/parking/check-in
POST   /api/parking/check-out
GET    /api/parking/search
GET    /api/parking
GET    /api/parking/:id

That's already enough.

13. UI pages

Don't build 10 pages.

I'd build:

/
Landing Page

/login
/register

/dashboard

And use dashboard sections/modals for:

Check In
Check Out
Search
History
Availability
Landing page

Mandatory.

Something like:

ParkEase
Smart Parking Management

Manage vehicles, parking spots and payments
from one simple dashboard.

[Get Started]

Features
✓ Fast vehicle check-in
✓ Automatic fee calculation
✓ Real-time spot availability
✓ EV spot management

Built for
Parking attendants and garage operators

How it helps
Reduce manual tracking
Prevent double parking
Calculate accurate fees

Coming next
1. Online reservations
2. Payment gateway
3. Parking analytics

The three future features are explicitly required.

14. Dashboard design

Your dashboard should be the main screen.

Something like:

┌──────────────────────────────────────────────────┐
│ ParkEase                         Attendant ▼     │
├──────────────────────────────────────────────────┤
│                                                  │
│  Total       Available      Occupied      EV     │
│   120            73            47        4/10    │
│                                                  │
├──────────────────────────────────────────────────┤
│                                                  │
│ [ Check In ]       [ Check Out ]                 │
│                                                  │
├──────────────────────────────────────────────────┤
│ Search Vehicle                                   │
│ [ RJ14AB1234____________ ] [Search]              │
│                                                  │
├──────────────────────────────────────────────────┤
│ Recent Parking Sessions                          │
│                                                  │
│ Plate       Spot     Status      Fee             │
│ RJ14...     A-101    Active      --              │
│ RJ11...     B-203    Completed   ₹140            │
│                                                  │
│             [Previous] [1] [2] [3] [Next]        │
└──────────────────────────────────────────────────┘

This is enough.

15. The biggest mistake you can make

Don't spend 60–90 minutes making the UI beautiful.

This isn't a design round.

Your priority should be:

1. Backend
2. Database
3. Check-in
4. Check-out + fee
5. Spot allocation
6. Auth
7. Search
8. Pagination
9. Sorting
10. UI
11. README
12. REASONING
13. AI_LOGS

Actually, I'd modify the order slightly because authentication is mandatory:

Database
↓
Backend/API
↓
Auth
↓
Check-in
↓
Check-out
↓
Spot management
↓
Search
↓
Pagination/sorting
↓
Frontend
↓
Landing page
↓
Documentation
16. Your 2.5-hour plan

You have 150 minutes.

I'd divide it like this:

Time	Work
0–10 min	Understand requirements + architecture
10–35 min	Backend + MongoDB schemas
35–60 min	Auth + middleware
60–85 min	Check-in + spot allocation
85–105 min	Check-out + fee calculation
105–115 min	Search + EV availability
115–125 min	Pagination + sorting
125–140 min	React UI
140–145 min	Landing page
145–150 min	README + REASONING + push

But there is a problem: 5 minutes for documentation is too risky.

So I'd actually start documentation while building it, or reserve 15 minutes at the end and reduce UI time.

A better split:

0–10       Planning
10–35      Backend + DB
35–55      Auth
55–85      Check-in
85–105     Check-out + fee
105–115    Search + EV
115–125    Pagination/sorting
125–140    UI
140–150    Docs + final testing
17. AI usage — this is actually an advantage

They explicitly allow AI.

So use it aggressively, but don't blindly paste generated code.

For example, you can ask your AI agent:

Build the Express/Mongoose backend for a parking management system. Requirements: users, garages, parking spots, parking sessions, JWT authentication, check-in, check-out, automatic tiered fee calculation, EV-only spots, search by plate, pagination and sorting. Keep the architecture simple because this is a 2.5-hour coding assessment.

Then inspect what it creates.

Then ask:

Implement check-in API. Prevent a vehicle from having multiple active sessions. EV vehicles must only receive EV spots. Make sure spot assignment cannot select an occupied spot.

Then test it.

18. But there is one VERY important requirement: AI_LOGS.md

This line matters:

"The complete conversation with the AI tool, pasted as-is."

And:

"any alteration will lead to a deduction"

Therefore don't rely on memory to create AI_LOGS.md at the end.

If you're using GitHub Copilot/another AI agent, preserve the actual conversation.

For example:

AI_LOGS.md

[Complete original AI conversation]

Don't clean it.

Don't summarize it.

Don't remove failed prompts.

Don't modify it to make yourself look better.

If they specifically say complete conversation, include the actual conversation.

19. REASONING.md

This is different from AI logs.

You should explain your decisions, not paste AI output.

Example structure:

# Reasoning

## 1. Understanding the Problem

The system is designed for parking attendants to manage
vehicle entry, vehicle exit, parking spots and parking fees.

## 2. Assumptions

The problem statement does not specify exact prices.

I therefore used:

- First hour: ₹50
- Additional hour: ₹30
- Daily cap: ₹250

Part-hours are rounded up.

## 3. Database Design

The system uses four main entities:

- User
- Garage
- ParkingSpot
- ParkingSession

## 4. Spot Allocation

EV vehicles can only be assigned EV spots.

A spot is considered occupied only when it is associated
with an active parking session.

## 5. Fee Calculation

Duration is calculated using the check-in and check-out
timestamps.

Partial hours are rounded up.

The calculated fee is capped at the daily maximum.

## 6. Preventing Double Parking

Before check-in, the system verifies that:

1. The vehicle does not already have an active session.
2. The selected spot is available.
3. The spot type is compatible with the vehicle.

## 7. Testing

Tested:

- Normal check-in
- Duplicate vehicle check-in
- EV without EV spot
- Successful check-out
- Invalid checkout
- Partial-hour billing
- Daily fee cap
- Search
- Pagination
- Sorting

That's exactly the kind of reasoning they want.

20. One thing I would change from your normal projects

For your CricVerse, you built a fairly complicated architecture with Redis, caching, API limits, polling, etc.

Don't do that here.

Your instinct may be:

"Let's make this production-level."

Wrong move for this assessment.

They explicitly say:

"Get check-in / check-out and the fee right first"

That tells you exactly where your time should go.

A simple working system with:

4 MongoDB models
10 APIs
4–5 React components/pages
JWT
correct billing
correct spot allocation
search
pagination
sorting
good README

is far more useful in this round than a sophisticated architecture that isn't finished.

21. Your minimum viable product

If you run out of time, this is the minimum you should protect:

✅ Register/Login
✅ Garage
✅ Parking spots
✅ Check-in
✅ Check-out
✅ Correct fee
✅ EV restriction
✅ No double parking
✅ Search plate
✅ Pagination
✅ Sorting
✅ Working UI
✅ Landing page
✅ README.md
✅ REASONING.md
✅ AI_LOGS.md

Everything else is optional.

22. One more important issue: "any garage, not one"

Don't create this:

const spots = [
  { number: "A1", type: "EV" },
  { number: "A2", type: "STANDARD" }
];

and call it done.

Instead, let the garage have its own spots:

Garage
  │
  ├── Floor 1
  │    ├── C101
  │    ├── C102
  │    └── EV103
  │
  └── Floor 2
       ├── S201
       ├── S202
       └── EV203

Then your application works for:

Garage A → 50 spots
Garage B → 200 spots
Garage C → 1000 spots

without changing the code.

That's a small design decision that directly addresses the wording of the problem.

My recommendation for you

Since you already know MERN, build this as:

React + Vite → Express → MongoDB → JWT

and keep the UI simple.

If you want, I can take this one step further and give you a complete assessment-ready project blueprint: exact folder structure, MongoDB schemas, all REST APIs, fee algorithm, React pages/components, API request/response formats, and the exact sequence of prompts to give GitHub Copilot so you can build it within the 2.5-hour window.

yes

Yes. Here's the assessment-ready blueprint I'd use in your position.

The goal is not to build the most sophisticated parking system. The goal is to build a complete, working product within 150 minutes and satisfy every explicit evaluator requirement.

1. Final architecture
parking-management/
│
├── client/                  # React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── StatCard.jsx
│   │   │   ├── CheckInModal.jsx
│   │   │   ├── CheckOutModal.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   └── SessionTable.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Dashboard.jsx
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   └── package.json
│
├── server/
│   ├── models/
│   │   ├── User.js
│   │   ├── Garage.js
│   │   ├── ParkingSpot.js
│   │   └── ParkingSession.js
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── garage.js
│   │   ├── spots.js
│   │   └── parking.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   └── parkingController.js
│   │
│   ├── middleware/
│   │   └── auth.js
│   │
│   ├── utils/
│   │   └── calculateFee.js
│   │
│   ├── seed.js
│   ├── server.js
│   ├── .env
│   └── package.json
│
├── README.md
├── REASONING.md
└── AI_LOGS.md

Don't create unnecessary folders just because some AI-generated architecture tells you to.

2. Database schema
User
{
  name: String,
  email: String,
  password: String
}

Add:

email: {
  type: String,
  unique: true,
  required: true
}

Password should be hashed using bcryptjs.

Garage
{
  name: String,
  address: String
}

Example:

City Centre Parking
Jaipur
ParkingSpot
{
  garageId: ObjectId,
  spotNumber: String,
  floor: Number,
  type: String,
  status: String
}

Enums:

type: ["COMPACT", "STANDARD", "EV"]

status: ["AVAILABLE", "OCCUPIED"]

Add unique constraint:

{
  garageId: 1,
  spotNumber: 1
}

This prevents duplicate spot numbers within the same garage.

3. ParkingSession

This is your most important model.

{
  garageId: ObjectId,
  spotId: ObjectId,

  plateNumber: String,

  vehicleType: String,

  checkInTime: Date,

  checkOutTime: Date,

  durationMinutes: Number,

  fee: Number,

  status: String
}

Enums:

vehicleType:
["COMPACT", "STANDARD", "EV"]

status:
["ACTIVE", "COMPLETED"]

Add an index:

{ plateNumber: 1, status: 1 }

This makes plate search and active-session checking faster.

4. Fee system

Because the problem doesn't specify actual prices, you must make an assumption.

Use:

First hour       ₹50
Every extra hour ₹30
Daily cap        ₹250

Document this in REASONING.md.

Formula

For:

hours = ceil(duration in minutes / 60)

Then:

if hours <= 1:
    fee = 50

else:
    fee = 50 + (hours - 1) × 30

fee = min(fee, 250)
Examples
Duration	Billable hours	Fee
20 min	1	₹50
1 hr	1	₹50
1 hr 10 min	2	₹80
2 hr	2	₹80
2 hr 1 min	3	₹110
5 hr	5	₹170
10 hr	10	₹250
5. Critical issue: daily cap

Be careful about what "daily cap" means.

For the assessment, the simplest defensible interpretation is:

A single continuous parking stay is capped at ₹250 per 24-hour billing period.

So don't implement complicated calendar-day billing unless the evaluator specifically defines it.

Your reasoning can say:

The problem statement specifies a daily cap but does not define
calendar-day versus rolling-24-hour behavior. I interpreted it
as a maximum charge of ₹250 for a continuous parking stay.

That's a reasonable assumption.

6. Check-in API
POST /api/parking/check-in

Request:

{
  "garageId": "...",
  "plateNumber": "RJ14AB1234",
  "vehicleType": "EV"
}

Backend logic:

1. Validate input
2. Check whether plate already has ACTIVE session
3. Find AVAILABLE compatible spot
4. If no spot → return 400
5. Create ParkingSession
6. Change spot status → OCCUPIED
7. Return session
Core query

For EV:

const spot = await ParkingSpot.findOne({
  garageId,
  type: "EV",
  status: "AVAILABLE"
});

For standard:

const spot = await ParkingSpot.findOne({
  garageId,
  type: "STANDARD",
  status: "AVAILABLE"
});

For compact:

const spot = await ParkingSpot.findOne({
  garageId,
  type: "COMPACT",
  status: "AVAILABLE"
});
7. Prevent duplicate parking

Before assigning a spot:

const activeSession = await ParkingSession.findOne({
  plateNumber: plateNumber.toUpperCase(),
  status: "ACTIVE"
});

if (activeSession) {
  return res.status(400).json({
    message: "Vehicle is already parked"
  });
}

Normalize plates:

const plate = plateNumber.trim().toUpperCase();

Therefore:

RJ14AB1234

and

 rj14ab1234

are treated as the same vehicle.

8. Prevent double parking properly

Here's the subtle part.

Don't do this:

find spot
↓
create session
↓
update spot

without thinking about concurrent requests.

For a simple 2.5-hour assessment, you can use a MongoDB transaction if your MongoDB environment supports it.

Conceptually:

START TRANSACTION

Find available spot

Create session

Mark spot occupied

COMMIT

If transaction setup becomes a time sink, don't waste 30 minutes fighting it. At minimum, enforce:

spot.status === AVAILABLE

on assignment and explain your design.

9. Check-out API
POST /api/parking/check-out

Request:

{
  "plateNumber": "RJ14AB1234"
}

Logic:

Find ACTIVE session
       ↓
Calculate duration
       ↓
Calculate fee
       ↓
Set checkoutTime
       ↓
Set durationMinutes
       ↓
Set fee
       ↓
Set status = COMPLETED
       ↓
Set spot = AVAILABLE
       ↓
Return receipt

Response:

{
  "plateNumber": "RJ14AB1234",
  "spotNumber": "EV-04",
  "durationMinutes": 125,
  "billableHours": 3,
  "fee": 110,
  "checkOutTime": "..."
}
10. Search API
GET /api/parking/search?plate=RJ14

Use:

{
  plateNumber: {
    $regex: plate,
    $options: "i"
  }
}

This lets the attendant search:

RJ14

instead of typing the entire plate.

Return:

Plate
Spot
Vehicle Type
Check-in
Check-out
Fee
Status
11. Dashboard API

Create:

GET /api/spots/availability?garageId=...

Response:

{
  "total": 50,
  "available": 32,
  "occupied": 18,
  "evTotal": 10,
  "evAvailable": 4,
  "compactAvailable": 15,
  "standardAvailable": 13
}

This makes the dashboard very easy to build.

12. Parking history API
GET /api/parking?page=1&limit=10&sort=checkInTime&order=desc

Response:

{
  "sessions": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 37,
    "pages": 4
  }
}

Supported sorting:

checkInTime
checkOutTime
fee
plateNumber

And:

asc
desc

This directly satisfies pagination + sorting.

13. Complete API list for README

Use this:

AUTH
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GARAGES
GET    /api/garages
GET    /api/garages/:id

PARKING SPOTS
GET    /api/spots
GET    /api/spots/availability

PARKING
POST   /api/parking/check-in
POST   /api/parking/check-out
GET    /api/parking/search
GET    /api/parking
GET    /api/parking/:id

That's plenty.

14. Frontend routes

Only four major pages:

/
├── Landing
│
├── /login
│
├── /register
│
└── /dashboard

Don't create separate pages for:

/check-in
/check-out
/search
/history
/spots

Those can all be dashboard sections/modals.

15. Dashboard

Make these four cards:

┌─────────────┐ ┌─────────────┐
│ Total Spots │ │ Available   │
│     50      │ │     32      │
└─────────────┘ └─────────────┘

┌─────────────┐ ┌─────────────┐
│ Occupied    │ │ EV Available│
│     18      │ │     4 / 10  │
└─────────────┘ └─────────────┘

Then:

[ Check In ]   [ Check Out ]

Then:

Search Vehicle
[ RJ14AB __________ ] [Search]

Then history.

That's enough.

16. Check-in UI

Modal:

CHECK IN VEHICLE

License Plate
[ RJ14AB1234 ]

Vehicle Type
[ EV ▼ ]

Garage
[ City Centre Parking ▼ ]

[ Check In ]

After successful check-in:

✓ Vehicle Checked In

Plate: RJ14AB1234
Spot: EV-04
Floor: 1
Check-in: 2:42 PM

This is a nice touch because the attendant immediately knows where the car went.

17. Check-out UI
CHECK OUT

License Plate
[ RJ14AB1234 ]

[ Find Vehicle ]

Then:

Vehicle Found

Plate: RJ14AB1234
Spot: EV-04
Duration: 2h 17m

Billable Hours: 3
Fee: ₹110

[ Confirm Check Out ]

After checkout:

✓ Payment Due: ₹110

Spot EV-04 is now available.
18. Landing page

Don't overdesign it.

Hero
ParkEase

Simple parking management for busy garages.

Track vehicles, manage parking spots and calculate
parking fees automatically.

[Get Started]
Features
Smart Check-in
Quickly assign available parking spots.

Automatic Billing
Calculate fees based on parking duration.

EV Spot Management
Ensure EV vehicles only use EV charging spots.

Vehicle Search
Find parked vehicles instantly using their plate number.
Target audience
Built for parking attendants and garage operators
managing multi-level parking facilities.
How it helps
• Reduces manual record keeping
• Prevents duplicate spot allocation
• Calculates parking fees consistently
Next features

Exactly three:

1. Online parking reservations
2. Digital payments
3. Parking analytics and reports
19. Seed data

This is extremely useful.

Create seed.js.

Generate:

Garage
  ↓
Floor 1
  10 Compact
  10 Standard
  5 EV

Floor 2
  10 Compact
  10 Standard
  5 EV

Total:

50 spots

Then your evaluator can immediately test the application.

You can also create a few completed sessions.

20. Don't make the evaluator create 50 spots manually

This would be stupid.

Your seed script should automatically create everything.

For example:

node seed.js

Then:

✓ Garage created
✓ 50 parking spots created
✓ Sample data inserted

Document this in README.

21. Environment variables

Backend:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret
CLIENT_URL=http://localhost:5173

Frontend:

VITE_API_URL=http://localhost:5000/api

Do not commit the real .env.

Commit:

.env.example
22. README structure

Your README should look like:

# ParkEase

A full-stack parking garage management system.

## Features

- User registration and login
- Vehicle check-in
- Vehicle check-out
- Automatic fee calculation
- Parking spot allocation
- EV-only spot enforcement
- Vehicle search
- Parking history
- Pagination
- Sorting

## Tech Stack

Frontend:
React, Vite, Axios

Backend:
Node.js, Express

Database:
MongoDB

Authentication:
JWT + bcrypt

## Setup

### Backend

cd server
npm install

Create .env

npm run dev

### Frontend

cd client
npm install

Create .env

npm run dev

## Seed Database

cd server
node seed.js

## API Endpoints

...

## Fee Rules

First hour: ₹50
Additional hour: ₹30
Daily cap: ₹250

Partial hours are rounded up.

## Debugging

Common issues...

## Future Features

1. Online reservations
2. Digital payments
3. Parking analytics
23. REASONING.md

Don't write some fake philosophical essay.

Explain actual engineering decisions.

Use:

# Reasoning

## Problem Understanding

The main problem is managing parking sessions reliably while
ensuring correct billing and preventing a parking spot from
being assigned to multiple vehicles.

## Priority

The implementation prioritizes:

1. Check-in
2. Check-out
3. Fee calculation
4. Spot allocation
5. EV restrictions
6. Vehicle search
7. Pagination and sorting

## Database Design

...

## Fee Calculation

...

## Spot Allocation

...

## Duplicate Parking Prevention

...

## Assumptions

The problem does not provide exact pricing, so I assumed:

- First hour: ₹50
- Additional hour: ₹30
- Daily cap: ₹250

...

## Testing

### Test 1: Normal check-in

Input:
RJ14AB1234, STANDARD

Expected:
Available STANDARD spot assigned.

Result:
Passed.

### Test 2: Duplicate check-in

...

### Test 3: EV restriction

...

### Test 4: Partial hour

...

### Test 5: Daily cap

...

### Test 6: Checkout

...

### Test 7: Search

...

### Test 8: Pagination

...

### Test 9: Sorting

...
24. AI_LOGS.md — extremely important

Because they specifically say:

complete conversation

Don't create a polished version.

If your AI interaction is:

You: Build X

AI: Sure...

You: Fix X

AI: ...

You: Why is this error happening?

AI: ...

then preserve all of it.

Including failed attempts.

Including debugging.

Including corrections.

Including prompts.

Don't turn it into:

AI helped me create the backend.

That would defeat the requirement.

25. Exact AI workflow I'd use

Since AI is allowed, don't ask it:

"Build my entire project."

That's lazy and dangerous.

You'll get 5,000 lines of code and spend the rest of the assessment debugging AI-generated architecture.

Instead use small, controlled prompts.

Prompt 1 — architecture
I have a 2.5-hour coding assessment.

Build a full-stack parking garage management system using:
React + Vite frontend, Node.js + Express backend and MongoDB.

Requirements:
- User registration/login
- Multiple garages
- Multi-level parking
- Compact, Standard and EV spots
- EV vehicles must only receive EV spots
- Check-in
- Check-out
- Tiered parking fee
- First hour has one price, additional hours are cheaper
- Daily cap
- Partial hours round up
- Search by license plate
- Pagination
- Sorting
- REST APIs
- Landing page

Keep the architecture simple and suitable for a 2.5-hour assessment.
Do not add unnecessary technologies.
First give me the database schema, API design and folder structure.
Do not write the implementation yet.

This is a much better first prompt.

26. Then backend
Now implement the backend based on the approved architecture.

Create:
User
Garage
ParkingSpot
ParkingSession

Use Express and Mongoose.

Implement:
register
login
me
garage retrieval
spot retrieval
availability
check-in
check-out
search
pagination
sorting

Keep the implementation simple.

Do not add Redis, Socket.IO, microservices, Docker or unnecessary abstractions.
27. Then fee calculation
Implement the parking fee calculation.

Assumptions:
First hour = ₹50
Each additional hour = ₹30
Maximum fee for a continuous stay = ₹250
Partial hours are rounded up.

Examples:
30 minutes = ₹50
1 hour = ₹50
1 hour 1 minute = ₹80
2 hours = ₹80
2 hours 1 minute = ₹110
10 hours = ₹250

Create a reusable utility function and include edge cases.

This is important because billing is the heart of the problem.

28. Then frontend
Now create a simple React frontend for the existing REST APIs.

Pages:
Landing
Login
Register
Dashboard

Dashboard must show:
- total spots
- available spots
- occupied spots
- EV availability
- check-in
- check-out
- vehicle search
- parking history
- pagination
- sorting

Use a clean responsive UI.
Do not spend time on advanced animations.
29. Then test the business logic

This is where you need to stop blindly trusting AI.

Ask:

Review the implementation specifically for business logic bugs.

Check:
1. Can one vehicle have two active sessions?
2. Can two vehicles receive the same spot?
3. Can an EV receive a non-EV spot?
4. Is an occupied spot ever selected?
5. Does checkout free the spot?
6. Are partial hours rounded up?
7. Is the daily cap applied?
8. Does search work case-insensitively?
9. Do pagination and sorting work correctly?

Do not rewrite unrelated code. Identify and fix only actual issues.

Then manually test each one.

30. Your manual test cases

You should test these before submission.

Test 1
Vehicle: RJ14AB1234
Type: STANDARD

Expected:

STANDARD spot assigned
Test 2

Same vehicle:

RJ14AB1234

again.

Expected:

Vehicle is already parked
Test 3
Vehicle: RJ14EV1234
Type: EV

Expected:

EV spot assigned
Test 4

Remove all EV availability.

Try EV check-in.

Expected:

No EV parking spot available
Test 5

Checkout:

RJ14AB1234

Expected:

Fee calculated
Session completed
Spot becomes AVAILABLE
Test 6

Check the same spot.

Expected:

Spot can now be assigned again
Test 7

Parking duration:

1h 1m

Expected:

₹80
Test 8

Parking duration:

10h

Expected:

₹250
Test 9

Search:

RJ14

Expected:

All matching plates
Test 10

History:

page=1
limit=10

Expected:

10 records maximum
Test 11

Sort:

fee desc

Expected:

Highest fee first
31. The 150-minute execution strategy

When the actual assessment starts, I would literally follow this clock:

0–10 minutes

Read problem.

Write:

Entities
API list
Fee assumptions
UI pages

Don't code yet.

10–30

Create:

React
Express
MongoDB

Install dependencies.

Get server connected to MongoDB.

30–50

Implement:

User
Garage
ParkingSpot
ParkingSession

Then authentication.

50–75

Implement:

POST /check-in

This is your highest priority.

Test it.

75–95

Implement:

POST /check-out

and fee calculation.

Test it heavily.

95–110

Implement:

search
availability
pagination
sorting
110–130

React dashboard.

Don't waste time making it beautiful.

130–140

Landing page + authentication UI.

140–150

Run final tests.

Then:

README.md
REASONING.md
AI_LOGS.md
git add .
git commit
git push

Then submit the public GitHub URL.

32. What NOT to build

This is just as important.

Don't build:

❌ Redis
❌ Socket.IO
❌ Docker
❌ Kubernetes
❌ Microservices
❌ Payment gateway
❌ Google Maps
❌ Email notifications
❌ SMS
❌ Admin roles
❌ Analytics dashboard
❌ AI chatbot
❌ QR code system
❌ Complex Redux architecture
❌ Advanced animations

Those are future features, not assessment requirements.

You have 150 minutes, not 15 days.

33. One thing you should prepare before the assessment

Because you already know MERN, practice this exact mini-project once before the actual round, but don't copy the finished project into the assessment.

Practice creating from scratch:

MongoDB
   ↓
Express
   ↓
4 models
   ↓
JWT
   ↓
check-in
   ↓
check-out
   ↓
fee calculation
   ↓
React dashboard

You should be able to get a basic Express + MongoDB server running in under 10 minutes.

That's more valuable than learning another framework before this round.

Your core mental model during the assessment

When you see the problem, immediately reduce it to:

                PARKING SYSTEM
                      │
          ┌───────────┴───────────┐
          │                       │
       SPOTS                  SESSIONS
          │                       │
 Available/Occupied          Active/Completed
          │                       │
 Compact/Standard/EV        Check-in/Check-out
                                  │
                                  ↓
                              FEE ENGINE
                                  │
                         ceil(hours) + cap

If these pieces work correctly, you have solved the actual problem.

The rest is UI and documentation.

Perfect. Backend is now running successfully. ✅

ParkEase API listening on http://localhost:5000

So these are working:

Node.js ✅
Express ✅
.env loading ✅
PORT=5000 ✅
Server startup ✅
But one thing is still unverified

Your terminal doesn't show:

MongoDB connected

So we need to determine whether the application is actually connecting to MongoDB or simply starting the HTTP server.

Open another PowerShell window and test:

curl http://localhost:5000

Or open this in your browser:

http://localhost:5000

Also, show me the current src/server.js:

Get-Content src/server.js

Paste that output here.

I'll check whether MongoDB connection is properly implemented before we move on to Round 2's authentication + parking models.

PS D:\Parking_garage\server> Get-Content src/server.js
require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const port = process.env.PORT || 5000;
async function start() {
  if (!process.env.MONGO_URI || !process.env.JWT_SECRET) thrownew Error('MONGO_URI and JWT_SECRET must be configured');
  await mongoose.connect(process.env.MONGO_URI);
  app.listen(port, () => console.log(ParkEase API listening on http://localhost:${port}));
}
start().catch((error) => { console.error(Startup failed: ${error.message}); process.exit(1); });
PS D:\Parking_garage\server> 

Yes. Now we can see exactly what is happening.

Your server.js does connect to MongoDB:

await mongoose.connect(process.env.MONGO_URI);

And because you got:

ParkEase API listening on http://localhost:5000

that means mongoose.connect() succeeded. If MongoDB connection failed, execution would jump to .catch() and the server would not start.

So your backend foundation is good. ✅

One small improvement

Your current code:

if (!process.env.MONGO_URI || !process.env.JWT_SECRET) thrownew Error(...)

has:

thrownew

which looks like a typo. Surprisingly, if that's literally what's in the file, Node should throw a syntax error. Since your server is running, your actual file may have throw new and the PowerShell output just displayed it oddly. Still, verify it is:

if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
    throw new Error('MONGO_URI and JWT_SECRET must be configured');
}

Don't spend time changing anything else right now.
Sure. Copy-paste this entire block into PowerShell from:

D:\Parking_garage\server
Write-Host "`n========== PROJECT STRUCTURE ==========" -ForegroundColor Cyan
Get-ChildItem src

Write-Host "`n========== ROUTES ==========" -ForegroundColor Cyan
Get-ChildItem src\routes

Write-Host "`n========== MODELS ==========" -ForegroundColor Cyan
Get-ChildItem src\models

Write-Host "`n========== USER MODEL ==========" -ForegroundColor Cyan
Get-Content src\models\User.js

Write-Host "`n========== GARAGE MODEL ==========" -ForegroundColor Cyan
Get-Content src\models\Garage.js

Write-Host "`n========== PARKING SPOT MODEL ==========" -ForegroundColor Cyan
Get-Content src\models\ParkingSpot.js

Write-Host "`n========== PARKING SESSION MODEL ==========" -ForegroundColor Cyan
Get-Content src\models\ParkingSession.js

Write-Host "`n========== AUTH ROUTE ==========" -ForegroundColor Cyan
Get-Content src\routes\auth.js

Write-Host "`n========== GARAGES ROUTE ==========" -ForegroundColor Cyan
Get-Content src\routes\garages.js

Write-Host "`n========== SPOTS ROUTE ==========" -ForegroundColor Cyan
Get-Content src\routes\spots.js

Write-Host "`n========== PARKING ROUTE ==========" -ForegroundColor Cyan
Get-Content src\routes\parking.js

Write-Host "`n========== APP.JS ==========" -ForegroundColor Cyan
Get-Content src\app.js

Write-Host "`n========== SERVER.JS ==========" -ForegroundColor Cyan
Get-Content src\server.js

Write-Host "`n========== PACKAGE.JSON ==========" -ForegroundColor Cyan
Get-Content package.json

Write-Host "`n========== HEALTH CHECK ==========" -ForegroundColor Cyan
try {
    Invoke-RestMethod http://localhost:5000/api/health
} catch {
    Write-Host "Server health check failed. Make sure npm run dev is running." -ForegroundColor Red
}

Write-Host "`n========== DONE ==========" -ForegroundColor Green

Keep npm run dev running in another terminal while this executes, because the final health-check command calls your API.

Then paste the entire output here. I'll inspect the existing implementation and tell you exactly what needs to be built/fixed next.

Pasted text(20260917-101547).txt
Document

I checked the complete output. The backend scaffold is already substantially implemented, not just a basic Express server.

What you already have
Feature	Status
Express server	✅
MongoDB connection	✅
JWT authentication	✅
User model	✅
Garage model	✅
Parking spot model	✅
Parking session model	✅
Garage APIs	✅
Spot availability API	✅
Check-in API	✅
Check-out API	✅
Fee calculation integration	✅
Plate-number search	✅
Pagination	✅
Sorting	✅
Health check	✅

The parking routes already implement check-in, check-out, search, pagination and sorting.

One important thing I noticed

Your server.js contains:

thrownew Error(...)

in the output.

But because your server is actually starting successfully, this is worth checking rather than assuming it's broken. Ask Copilot to inspect/fix only that syntax if necessary.
Pasted text(20260917-101858).txt
Document

Exactly. Stop testing individual backend pieces for now. Your goal is a working demo, not a perfectly tested backend.

You already have a functional backend foundation: auth, garage, spots, parking sessions, availability, search, pagination, and fee logic.

From now: build the MVP fast

Target this:

LOGIN
  ↓
DASHBOARD
  ├── Garage
  ├── Parking spot availability
  ├── Park Vehicle
  ├── Active Vehicles
  └── Parking History
Priority order

1. Backend

Already ~80% there ✅
Don't add more features unless the frontend requires them.

2. Frontend
Build:

Login/Register
Dashboard
Spot availability cards
Check-in form
Active parking table
Checkout button
Receipt/fee display
History

3. Integration
Connect React → existing APIs.

4. Final

README
screenshots
.gitignore
GitHub push
Use Copilot Agent now

Don't manually code the frontend. Give Agent this:

Build ParkEase MVP Frontend

Build the frontend MVP for the existing ParkEase parking garage backend.

First inspect the entire existing repository and understand the current backend API routes before making changes.

Backend runs at:
http://localhost:5000

Existing API endpoints include:

POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
GET/POST /api/garages
GET/POST /api/spots
GET /api/spots/availability
POST /api/parking/check-in
POST /api/parking/check-out
GET /api/parking/search
GET /api/parking
GET /api/parking/

Create a React + Vite frontend if one does not already exist.

Use a simple, clean professional UI. Prioritize functionality over visual complexity.

Required pages/components:

Login
email
password
login
store JWT
redirect to dashboard
Register
name
email
password
Dashboard
garage information
total spots
available spots
occupied spots
EV availability
compact availability
standard availability
Park Vehicle
vehicle plate number
vehicle type: COMPACT / STANDARD / EV
submit check-in
show assigned spot
Active Parking
plate number
vehicle type
spot number
check-in time
checkout button
Checkout
call checkout API
show duration
billable hours
fee
receipt
Parking History
plate number
spot
check-in
check-out
fee
basic pagination

Important:

Use the existing backend APIs exactly as they currently work.
Send JWT as Authorization: Bearer <token>.
Handle loading and API errors.
Protect dashboard routes when not logged in.
Do not modify working backend logic unless absolutely necessary.
Do not add Redux, TypeScript, complex state management, or unnecessary libraries.
Keep the implementation assessment-friendly and easy to explain.
Make the application actually runnable with npm run dev.
After implementation, tell me the frontend folder, files created, and exact commands to run frontend and backend.
what is this if i register using new email 

Yes. The current dashboard is functional, but it looks more like an internal admin form than a polished parking-management product.

Don't redesign the whole thing. Make a targeted UI upgrade while keeping the existing functionality.

Changes I'd make
Top header
ParkEase logo/name on left
Dashboard
Logged-in user
Logout
Garage name + address underneath/near header
Stats cards
Instead of four giant equal-width blocks, use compact cards:
🅿️ Total Spots
✓ Available
🚗 Occupied
⚡ EV Available

Active parking alert
The current yellow:

RJ60SD2222 owes $50 for 1 hour(s)

should become a proper Active Vehicle card:

Plate
Spot
Type
Duration
Current estimated fee
Check-in / Check-out
Keep the two-column layout, but make them visually distinct:
Vehicle Arrival
Vehicle Departure
Better labels above inputs
Cleaner buttons
Clear success/error messages
Parking overview
Add a small visual breakdown:
COMPACT      1 / 1 available
STANDARD     1 / 1 available
EV           1 / 1 available
Recent sessions
Keep the table, but improve:
status badges
₹ formatting
better spacing
empty-state message
search positioned cleanly
Responsive design
Two-column sections should become one column on smaller screens.
Give this to Copilot Agent
Improve the ParkEase frontend dashboard UI without changing the backend or core functionality.

The current dashboard is functional, but improve its layout so it looks like a polished modern parking-management dashboard.

IMPORTANT:
- Preserve all existing API integrations.
- Do not change backend routes/models.
- Do not break login, garage loading, availability, check-in, checkout, search, or history.
- Do not add unnecessary libraries.
- Keep the current visual style: clean, minimal, professional, warm off-white background with dark text and subtle green/orange accents.
- Prioritize functionality and readability over flashy animations.

UI improvements:

1. HEADER
- Add a clear ParkEase brand/title.
- Show current garage name and address.
- Keep logged-in user and Logout visible.
- Make navigation/header spacing cleaner.

2. STATS SECTION
Replace the current oversized four-column stats with four compact responsive cards:
- Total Spots
- Available
- Occupied
- EV Available
Each card should have a clear label, large number, and subtle visual distinction.
Show EV as "available / total".

3. ACTIVE PARKING
Create a dedicated Active Vehicle section.
Display:
- plate number
- parking spot
- vehicle type
- check-in time
- duration/current fee if available

If there are no active vehicles, show a clean empty state.

4. CHECK-IN / CHECK-OUT
Keep the two-column layout on desktop and stack on mobile.

Check-in:
- Section title "Vehicle Arrival"
- Clear labels for plate number and vehicle type
- Clean input/select styling
- Primary orange "Assign Spot" button
- Show success message after successful check-in including assigned spot.

Check-out:
- Section title "Vehicle Departure"
- Plate input
- Dark "Calculate & Release" button
- After successful checkout show a receipt-style result:
  plate
  spot
  duration
  billable hours
  fee

5. AVAILABILITY BREAKDOWN
Add a compact parking availability breakdown near the stats:
COMPACT
STANDARD
EV
Show available/total for each type.

6. RECENT SESSIONS
Improve the existing table:
- Plate
- Spot
- Type
- Status
- Fee
- Better status badges for ACTIVE and COMPLETED
- Show ₹ instead of $
- Add a useful empty state if there are no sessions.
- Keep existing search functionality.

7. RESPONSIVE DESIGN
- Desktop: two-column check-in/check-out.
- Mobile/tablet: stack sections vertically.
- Stats cards should wrap cleanly.

8. ERROR AND LOADING STATES
- Keep the existing error handling.
- Improve visual presentation of loading and API errors.
- Never access garage._id before garage has loaded.
- If no garage exists, show a clean setup/onboarding message.

9. REMOVE DEMO HARDCODED VALUES
- Check-in plate should be empty by default.
- Check-out plate should be empty by default.
- Do not hardcode RJ60SD2222, RJ45SB3333, or any other test vehicle.

10. CURRENCY
Use Indian Rupee symbol:
₹50
₹80
₹250

Do not change numerical fee calculation.

Do not redesign unrelated pages. Make the dashboard feel polished but keep implementation simple.

After completing the changes:
- run the frontend
- verify login
- verify garage loads
- verify stats load
- verify check-in
- verify checkout
- verify recent sessions
- report files changed and any issues found.
One important correction

Your screenshot shows $50, which is wrong for this project. Make the ₹ fix part of this same Copilot task rather than sending separate prompts.

And don't let Copilot spend 20 minutes adding animations. Layout + usability + working flow is enough.
