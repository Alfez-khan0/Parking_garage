# Reasoning

## Problem Understanding

The product is an attendant desk, not a general consumer parking app. The highest-risk operations are assigning one available spot to one active vehicle, restricting EV vehicles to EV spots, checking out reliably, and calculating a predictable fee.

## Assumptions

The brief does not provide prices, so the implementation uses $50 for the first billed hour, $30 for each additional billed hour, and a $250 cap for one continuous stay. Any positive partial hour is rounded up. Plates are trimmed and uppercased so `ab 12` and `ab 12` do not diverge by casing.

## Data Design

Users own garages. Garages own spots. Parking sessions reference both a garage and a spot, with `ACTIVE` and `COMPLETED` states. A compound index supports plate/status lookups, while a garage/spot-number uniqueness rule prevents duplicate physical spots.

## Allocation and Double Parking

The backend, rather than the UI, is authoritative. Check-in first rejects an existing active session for the normalized plate. It then atomically changes one matching `AVAILABLE` spot to `OCCUPIED` before creating the session. If session creation fails, the spot is released again. Check-out completes the session and releases its spot.

## Testing and Fixes

The fee utility was tested for a 30-minute stay, a 61-minute stay, and a 10-hour capped stay. API validation also checks authentication, garage ownership, invalid vehicle types, missing spots, unknown plates, duplicate registration, and duplicate active parking. The UI uses the same REST APIs that are documented in the README.

## Tradeoffs

The implementation keeps the assessment scope focused: no payment gateway, reservations, real-time sockets, or role system. Those are listed as future work so the core attendant workflow remains understandable and testable within the time limit.
