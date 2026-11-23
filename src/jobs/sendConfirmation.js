const { appendAuditEntry } = require('../services/auditLogger');

async function sendConfirmation(job) {
  const message =
    `Hello ${job.patientName}, your appointment with ${job.doctorName} ` +
    `(room ${job.room}) is confirmed for ${job.appointmentDatetime}.`;

  await appendAuditEntry('CONFIRMATION_SENT', {
    appointmentId: job.appointmentId,
    channels: ['sms', 'email'],
    to: { phone: job.patientPhone, email: job.patientEmail },
    message,
  });
  console.log(`[worker] confirmation sent for appointment ${job.appointmentId}`);
}

module.exports = sendConfirmation;
