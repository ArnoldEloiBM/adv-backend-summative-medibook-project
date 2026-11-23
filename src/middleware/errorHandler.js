const AppError = require('../utils/AppError');

const MYSQL_ERRORS = {
  ER_DUP_ENTRY: [409, 'A record with the same unique value already exists'],
  ER_ROW_IS_REFERENCED_2: [409, 'This record has appointments and cannot be deleted'],
  ER_NO_REFERENCED_ROW_2: [422, 'The referenced patient or doctor does not exist'],
  ER_CHECK_CONSTRAINT_VIOLATED: [422, 'The data violates a database rule'],
};

const DUPLICATE_KEY_MESSAGES = {
  uq_patients_email: 'A patient with this email already exists',
};

function sendError(res, statusCode, message, details) {
  const body = { error: { message } };
  if (details) body.error.details = details;
  return res.status(statusCode).json(body);
}

function duplicateKeyMessage(err) {
  const key = Object.keys(DUPLICATE_KEY_MESSAGES).find((name) => err.sqlMessage?.includes(name));
  return key ? DUPLICATE_KEY_MESSAGES[key] : null;
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.message, err.details);
  }

  if (err.type === 'entity.parse.failed') {
    return sendError(res, 400, 'Request body is not valid JSON');
  }

  const mysqlError = MYSQL_ERRORS[err.code];
  if (mysqlError) {
    const message = (err.code === 'ER_DUP_ENTRY' && duplicateKeyMessage(err)) || mysqlError[1];
    return sendError(res, mysqlError[0], message);
  }

  console.error(err);
  return sendError(res, 500, 'Internal server error');
}

module.exports = errorHandler;
