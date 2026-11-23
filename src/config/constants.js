module.exports = Object.freeze({
  MAX_APPOINTMENTS_PER_DAY: 12,
  SLOT_MINUTES: 30,
  WORKING_HOURS: Object.freeze({ START_HOUR: 9, END_HOUR: 17 }),

  REFUND_POLICY: Object.freeze({
    FULL_REFUND_ABOVE_HOURS: 48,
    PARTIAL_REFUND_FROM_HOURS: 24,
    PARTIAL_REFUND_RATE: 0.5,
  }),

  BUSY_DAY_THRESHOLD: 0.8,
  STATS_WINDOW_DAYS: 7,

  APPOINTMENT_STATUS: Object.freeze({
    BOOKED: 'booked',
    CANCELLED: 'cancelled',
  }),

  WORKER: Object.freeze({
    POLL_TIMEOUT_SECONDS: 5,
    MAX_JOB_ATTEMPTS: 3,
    RETRY_DELAY_MS: 2000,
  }),
});
