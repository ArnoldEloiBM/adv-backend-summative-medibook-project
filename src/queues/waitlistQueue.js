const { getRedisClient } = require('../config/redis');
const { WAITLIST_JOBS, waitlistKey } = require('./keys');

function parseEntries(rawEntries) {
  return rawEntries.map((raw) => ({ raw, entry: JSON.parse(raw) }));
}

async function list(doctorId, day) {
  const rawEntries = await getRedisClient().lrange(waitlistKey(doctorId, day), 0, -1);
  return parseEntries(rawEntries);
}

async function join({ patientId, doctorId, appointmentDatetime, day }) {
  const redis = getRedisClient();
  const key = waitlistKey(doctorId, day);

  const existing = await list(doctorId, day);
  const position = existing.findIndex(
    ({ entry }) => entry.patientId === patientId && entry.appointmentDatetime === appointmentDatetime,
  );
  if (position !== -1) return { alreadyWaiting: true, position: position + 1 };

  const entry = { patientId, doctorId, appointmentDatetime, joinedAt: new Date().toISOString() };
  const length = await redis.rpush(key, JSON.stringify(entry));
  return { alreadyWaiting: false, position: length, entry };
}

async function remove(doctorId, day, rawEntry) {
  await getRedisClient().lrem(waitlistKey(doctorId, day), 1, rawEntry);
}

async function requestPromotion(doctorId, day) {
  const job = { type: 'WAITLIST_PROMOTION', doctorId, day, attempts: 0 };
  await getRedisClient().lpush(WAITLIST_JOBS, JSON.stringify(job));
}

module.exports = { list, join, remove, requestPromotion };
