const { getRedisClient } = require('../config/redis');
const { NOTIFICATION_JOBS } = require('./keys');

async function enqueueConfirmation(appointment) {
  const job = {
    type: 'APPOINTMENT_CONFIRMATION',
    appointmentId: appointment.id,
    patientName: appointment.patientName,
    patientEmail: appointment.patientEmail,
    patientPhone: appointment.patientPhone,
    doctorName: appointment.doctorName,
    room: appointment.room,
    appointmentDatetime: appointment.appointmentDatetime,
    attempts: 0,
  };
  await getRedisClient().lpush(NOTIFICATION_JOBS, JSON.stringify(job));
}

module.exports = { enqueueConfirmation };
