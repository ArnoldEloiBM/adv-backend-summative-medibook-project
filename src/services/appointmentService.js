const AppError = require('../utils/AppError');
const { withTransaction } = require('../models/transaction');
const appointmentModel = require('../models/appointmentModel');
const doctorModel = require('../models/doctorModel');
const patientModel = require('../models/patientModel');
const waitlistQueue = require('../queues/waitlistQueue');
const notificationQueue = require('../queues/notificationQueue');
const { logAudit } = require('./auditLogger');
const { calculateRefund } = require('../utils/refundCalculator');
const { parseLocalDateTime, toSqlDateTime } = require('../utils/dateTime');
const { MAX_APPOINTMENTS_PER_DAY, APPOINTMENT_STATUS } = require('../config/constants');

const CONFLICT = Object.freeze({
  SLOT_TAKEN: 'SLOT_TAKEN',
  DAY_FULL: 'DAY_FULL',
  PATIENT_BUSY: 'PATIENT_BUSY',
});

const WAITLISTABLE = new Set([CONFLICT.SLOT_TAKEN, CONFLICT.DAY_FULL]);

function conflict(message, reason) {
  return new AppError(409, message, { reason });
}

function toBookingConflict(err) {
  if (err.code !== 'ER_DUP_ENTRY') return err;
  if (err.sqlMessage?.includes('uq_doctor_active_slot')) {
    return conflict('This slot is already booked with the doctor', CONFLICT.SLOT_TAKEN);
  }
  if (err.sqlMessage?.includes('uq_patient_active_slot')) {
    return conflict('The patient already has an appointment at this time', CONFLICT.PATIENT_BUSY);
  }
  return err;
}

function isWaitlistable(err) {
  return err instanceof AppError && WAITLISTABLE.has(err.details?.reason);
}

async function bookAppointment({ patientId, doctorId, slot, source = 'api' }) {
  const appointment = await withTransaction(async (connection) => {
    const doctor = await doctorModel.findByIdForUpdate(connection, doctorId);
    if (!doctor) throw new AppError(404, `Doctor ${doctorId} not found`);

    const patient = await patientModel.findById(patientId, connection);
    if (!patient) throw new AppError(404, `Patient ${patientId} not found`);

    const bookedCount = await appointmentModel.countBookedForDoctorOnDay(
      connection, doctorId, slot.day, slot.nextDay,
    );
    if (bookedCount >= MAX_APPOINTMENTS_PER_DAY) {
      throw conflict(
        `${doctor.fullName} is fully booked on ${slot.day} (${MAX_APPOINTMENTS_PER_DAY} of ${MAX_APPOINTMENTS_PER_DAY} appointments)`,
        CONFLICT.DAY_FULL,
      );
    }

    let appointmentId;
    try {
      appointmentId = await appointmentModel.insert(connection, {
        patientId,
        doctorId,
        appointmentDatetime: slot.slot,
        amountPaid: doctor.consultationFee,
      });
    } catch (err) {
      throw toBookingConflict(err);
    }
    return appointmentModel.findById(appointmentId, connection);
  });

  logAudit('APPOINTMENT_BOOKED', {
    source,
    appointmentId: appointment.id,
    patientId,
    doctorId,
    appointmentDatetime: appointment.appointmentDatetime,
    amountPaid: appointment.amountPaid,
  });

  try {
    await notificationQueue.enqueueConfirmation(appointment);
  } catch (err) {
    console.error('[queue] could not enqueue confirmation:', err.message);
  }

  return appointment;
}

async function joinWaitlist({ patientId, doctorId, slot, reason }) {
  const patient = await patientModel.findById(patientId);
  if (!patient) throw new AppError(404, `Patient ${patientId} not found`);

  let result;
  try {
    result = await waitlistQueue.join({ patientId, doctorId, appointmentDatetime: slot.slot, day: slot.day });
  } catch (err) {
    console.error('[queue] could not join waitlist:', err.message);
    throw new AppError(503, 'The waitlist is temporarily unavailable, please try again later');
  }

  if (result.alreadyWaiting) {
    throw new AppError(409, `Patient is already on the waitlist for this slot (position ${result.position})`);
  }

  logAudit('WAITLIST_JOINED', { patientId, doctorId, appointmentDatetime: slot.slot, reason, position: result.position });
  return { patientId, doctorId, appointmentDatetime: slot.slot, position: result.position };
}

async function getWaitlist(doctorId, day) {
  const entries = await waitlistQueue.list(doctorId, day);
  return entries.map(({ entry }, index) => ({ position: index + 1, ...entry }));
}

async function cancelAppointment(id, now = new Date()) {
  const { appointment, refund } = await withTransaction(async (connection) => {
    const existing = await appointmentModel.findByIdForUpdate(connection, id);
    if (!existing) throw new AppError(404, `Appointment ${id} not found`);
    if (existing.status === APPOINTMENT_STATUS.CANCELLED) {
      throw new AppError(409, 'This appointment has already been cancelled');
    }

    const appointmentDate = parseLocalDateTime(existing.appointmentDatetime);
    if (appointmentDate <= now) {
      throw new AppError(422, 'Appointments that have already started or passed cannot be cancelled');
    }

    const refundResult = calculateRefund(existing.amountPaid, appointmentDate, now);
    await appointmentModel.markCancelled(connection, id, {
      refundAmount: refundResult.refundAmount,
      cancelledAt: toSqlDateTime(now),
      cancelledStatus: APPOINTMENT_STATUS.CANCELLED,
      bookedStatus: APPOINTMENT_STATUS.BOOKED,
    });

    return { appointment: await appointmentModel.findById(id, connection), refund: refundResult };
  });

  logAudit('APPOINTMENT_CANCELLED', {
    appointmentId: appointment.id,
    patientId: appointment.patientId,
    doctorId: appointment.doctorId,
    appointmentDatetime: appointment.appointmentDatetime,
    noticeHours: refund.noticeHours,
    refundRate: refund.refundRate,
    refundAmount: refund.refundAmount,
  });

  try {
    await waitlistQueue.requestPromotion(appointment.doctorId, appointment.appointmentDatetime.slice(0, 10));
  } catch (err) {
    console.error('[queue] could not notify the waitlist:', err.message);
    logAudit('WAITLIST_NOTIFY_FAILED', { appointmentId: appointment.id, error: err.message });
  }

  return { appointment, refund };
}

module.exports = {
  CONFLICT,
  isWaitlistable,
  bookAppointment,
  joinWaitlist,
  getWaitlist,
  cancelAppointment,
};
