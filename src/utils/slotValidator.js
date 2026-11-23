const { SLOT_MINUTES, WORKING_HOURS } = require('../config/constants');
const { pad, parseLocalDateTime, toSqlDate, toSqlDateTime, addDays } = require('./dateTime');

const MINUTES_PER_HOUR = 60;
const OPENING_MINUTE = WORKING_HOURS.START_HOUR * MINUTES_PER_HOUR;
const CLOSING_MINUTE = WORKING_HOURS.END_HOUR * MINUTES_PER_HOUR;
const HOURS_LABEL = `${pad(WORKING_HOURS.START_HOUR)}:00-${pad(WORKING_HOURS.END_HOUR)}:00`;

function slotError(status, message) {
  return { error: { status, message } };
}

function validateAppointmentSlot(value, now = new Date()) {
  const date = parseLocalDateTime(value);
  if (!date) {
    return slotError(400, 'appointmentDatetime must be a valid date and time in the format YYYY-MM-DDTHH:mm');
  }

  if (date <= now) {
    return slotError(422, 'Appointments can only be booked in the future');
  }

  if (date.getMinutes() % SLOT_MINUTES !== 0 || date.getSeconds() !== 0) {
    return slotError(422, `Appointments must start on a ${SLOT_MINUTES}-minute boundary (e.g. 09:00 or 09:30)`);
  }

  const startMinute = date.getHours() * MINUTES_PER_HOUR + date.getMinutes();
  if (startMinute < OPENING_MINUTE || startMinute + SLOT_MINUTES > CLOSING_MINUTE) {
    return slotError(422, `Appointments must fall within working hours (${HOURS_LABEL})`);
  }

  return {
    date,
    slot: toSqlDateTime(date),
    day: toSqlDate(date),
    nextDay: toSqlDate(addDays(date, 1)),
  };
}

module.exports = { validateAppointmentSlot };
