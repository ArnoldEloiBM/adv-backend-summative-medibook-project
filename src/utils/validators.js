const FIELD_LIMITS = {
  fullName: 120,
  email: 255,
  phone: 30,
  specialty: 80,
  room: 20,
};
const MAX_FEE = 99999999.99;
const MAX_UNSIGNED_INT = 4294967295;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?\d{7,14}$/;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseId(value) {
  if (typeof value === 'number') return Number.isInteger(value) && value > 0 && value <= MAX_UNSIGNED_INT ? value : null;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return id > 0 && id <= MAX_UNSIGNED_INT ? id : null;
}

function readText(body, field, errors, partial) {
  const value = body[field];
  if (value === undefined) {
    if (!partial) errors.push(`${field} is required`);
    return undefined;
  }
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${field} must be a non-empty string`);
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length > FIELD_LIMITS[field]) {
    errors.push(`${field} must be at most ${FIELD_LIMITS[field]} characters`);
    return undefined;
  }
  return trimmed;
}

function readEmail(body, errors, partial) {
  const email = readText(body, 'email', errors, partial);
  if (email === undefined) return undefined;
  if (!EMAIL_PATTERN.test(email)) {
    errors.push('email must be a valid email address');
    return undefined;
  }
  return email.toLowerCase();
}

function readPhone(body, errors, partial) {
  const phone = readText(body, 'phone', errors, partial);
  if (phone === undefined) return undefined;
  const normalized = phone.replace(/[\s-]/g, '');
  if (!PHONE_PATTERN.test(normalized)) {
    errors.push('phone must contain 7 to 14 digits, optionally starting with +');
    return undefined;
  }
  return normalized;
}

function readFee(body, errors, partial) {
  const value = body.consultationFee;
  if (value === undefined) {
    if (!partial) errors.push('consultationFee is required');
    return undefined;
  }
  const valid =
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= MAX_FEE &&
    Number(value.toFixed(2)) === value;
  if (!valid) {
    errors.push(`consultationFee must be a number between 0 and ${MAX_FEE} with at most 2 decimal places`);
    return undefined;
  }
  return value;
}

function collect(readers, body, partial, emptyMessage) {
  if (!isPlainObject(body)) return { errors: ['Request body must be a JSON object'], data: {} };

  const errors = [];
  const data = {};
  for (const [field, read] of Object.entries(readers)) {
    const value = read(body, errors, partial);
    if (value !== undefined) data[field] = value;
  }
  if (partial && errors.length === 0 && Object.keys(data).length === 0) errors.push(emptyMessage);
  return { errors, data };
}

function validatePatient(body, { partial = false } = {}) {
  const readers = {
    fullName: (b, e, p) => readText(b, 'fullName', e, p),
    email: readEmail,
    phone: readPhone,
  };
  return collect(readers, body, partial, 'Provide at least one of: fullName, email, phone');
}

function validateDoctor(body, { partial = false } = {}) {
  const readers = {
    fullName: (b, e, p) => readText(b, 'fullName', e, p),
    specialty: (b, e, p) => readText(b, 'specialty', e, p),
    consultationFee: readFee,
    room: (b, e, p) => readText(b, 'room', e, p),
  };
  return collect(readers, body, partial, 'Provide at least one of: fullName, specialty, consultationFee, room');
}

function validateBookingRequest(body) {
  if (!isPlainObject(body)) return { errors: ['Request body must be a JSON object'], data: {} };

  const errors = [];
  const patientId = parseId(body.patientId);
  const doctorId = parseId(body.doctorId);
  if (patientId === null) errors.push('patientId must be a positive integer');
  if (doctorId === null) errors.push('doctorId must be a positive integer');
  if (typeof body.appointmentDatetime !== 'string') errors.push('appointmentDatetime is required (YYYY-MM-DDTHH:mm)');
  if (body.joinWaitlist !== undefined && typeof body.joinWaitlist !== 'boolean') {
    errors.push('joinWaitlist must be true or false');
  }

  return {
    errors,
    data: {
      patientId,
      doctorId,
      appointmentDatetime: body.appointmentDatetime,
      joinWaitlist: body.joinWaitlist === true,
    },
  };
}

module.exports = {
  parseId,
  validatePatient,
  validateDoctor,
  validateBookingRequest,
};
