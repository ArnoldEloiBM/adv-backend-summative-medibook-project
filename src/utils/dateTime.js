const DATE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_HOUR = 60 * 60 * 1000;

function pad(value) {
  return String(value).padStart(2, '0');
}

function parseLocalDateTime(value) {
  if (typeof value !== 'string') return null;
  const match = DATE_TIME_PATTERN.exec(value.trim());
  if (!match) return null;

  const [year, month, day, hour, minute, second] = match.slice(1).map((part) => Number(part ?? 0));
  const date = new Date(year, month - 1, day, hour, minute, second);

  const roundTrips =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date.getHours() === hour &&
    date.getMinutes() === minute &&
    date.getSeconds() === second;

  return roundTrips ? date : null;
}

function parseLocalDate(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return null;
  return parseLocalDateTime(`${value} 00:00`);
}

function toSqlDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toSqlDateTime(date) {
  return `${toSqlDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function hoursBetween(from, to) {
  return (to - from) / MS_PER_HOUR;
}

module.exports = {
  pad,
  parseLocalDateTime,
  parseLocalDate,
  toSqlDate,
  toSqlDateTime,
  addDays,
  hoursBetween,
};
