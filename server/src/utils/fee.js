const FIRST_HOUR_RATE = 50;
const ADDITIONAL_HOUR_RATE = 30;
const DAILY_CAP = 250;

function calculateFee(checkIn, checkOut = new Date()) {
  const durationMinutes = Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 60000));
  const billableHours = Math.ceil(durationMinutes / 60);
  const fee = billableHours <= 1
    ? FIRST_HOUR_RATE
    : FIRST_HOUR_RATE + (billableHours - 1) * ADDITIONAL_HOUR_RATE;

  return { durationMinutes, billableHours, fee: Math.min(fee, DAILY_CAP) };
}

module.exports = { calculateFee, FIRST_HOUR_RATE, ADDITIONAL_HOUR_RATE, DAILY_CAP };
