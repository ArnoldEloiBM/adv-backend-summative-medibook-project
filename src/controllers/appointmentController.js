const AppError = require('../utils/AppError');
const appointmentModel = require('../models/appointmentModel');
const doctorModel = require('../models/doctorModel');
const appointmentService = require('../services/appointmentService');
const { validateBookingRequest } = require('../utils/validators');
const { validateAppointmentSlot } = require('../utils/slotValidator');
const { parseLocalDate } = require('../utils/dateTime');
const { requireId, assertValid } = require('../utils/requestParams');

async function createAppointment(req, res) {
  const { errors, data } = validateBookingRequest(req.body);
  assertValid(errors, 'Invalid booking request');

  const slot = validateAppointmentSlot(data.appointmentDatetime);
  if (slot.error) throw new AppError(slot.error.status, slot.error.message);

  const request = { patientId: data.patientId, doctorId: data.doctorId, slot };
  try {
    const appointment = await appointmentService.bookAppointment(request);
    res.status(201).json({ data: appointment });
  } catch (err) {
    if (!appointmentService.isWaitlistable(err)) throw err;

    if (!data.joinWaitlist) {
      throw new AppError(409, err.message, {
        reason: err.details.reason,
        waitlist: 'A waitlist spot is available: resend this request with "joinWaitlist": true',
      });
    }

    const waitlistEntry = await appointmentService.joinWaitlist({ ...request, reason: err.details.reason });
    res.status(202).json({
      message: `${err.message}. The patient has been added to the waitlist.`,
      data: waitlistEntry,
    });
  }
}

async function getAppointment(req, res) {
  const id = requireId(req.params.id, 'Appointment');
  const appointment = await appointmentModel.findById(id);
  if (!appointment) throw new AppError(404, `Appointment ${id} not found`);
  res.json({ data: appointment });
}

async function cancelAppointment(req, res) {
  const id = requireId(req.params.id, 'Appointment');
  const { appointment, refund } = await appointmentService.cancelAppointment(id);
  res.json({
    message: `Appointment cancelled. Refund: ${refund.refundAmount.toFixed(2)} (${refund.refundRate * 100}%)`,
    data: { appointment, refund },
  });
}

async function getDoctorWaitlist(req, res) {
  const doctorId = requireId(req.params.id, 'Doctor');
  if (!parseLocalDate(req.query.date)) {
    throw new AppError(400, 'Query parameter date is required in the format YYYY-MM-DD');
  }
  const doctor = await doctorModel.findById(doctorId);
  if (!doctor) throw new AppError(404, `Doctor ${doctorId} not found`);
  res.json({ data: await appointmentService.getWaitlist(doctorId, req.query.date) });
}

module.exports = { createAppointment, getAppointment, cancelAppointment, getDoctorWaitlist };
