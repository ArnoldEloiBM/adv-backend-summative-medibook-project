const PREFIX = 'medibook';

module.exports = Object.freeze({
  WAITLIST_JOBS: `${PREFIX}:jobs:waitlist-promotion`,
  NOTIFICATION_JOBS: `${PREFIX}:jobs:notifications`,
  FAILED_JOBS: `${PREFIX}:jobs:failed`,
  waitlistKey: (doctorId, day) => `${PREFIX}:waitlist:doctor:${doctorId}:${day}`,
});
