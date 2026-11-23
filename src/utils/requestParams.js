const AppError = require('./AppError');
const { parseId } = require('./validators');

function requireId(value, resource) {
  const id = parseId(value);
  if (id === null) throw new AppError(400, `${resource} id must be a positive integer`);
  return id;
}

function assertValid(errors, message) {
  if (errors.length > 0) throw new AppError(400, message, errors);
}

module.exports = { requireId, assertValid };
