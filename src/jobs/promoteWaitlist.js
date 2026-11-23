const waitlistQueue = require('../queues/waitlistQueue');
const appointmentService = require('../services/appointmentService');
const { logAudit } = require('../services/auditLogger');
const { validateAppointmentSlot } = require('../utils/slotValidator');

const { CONFLICT } = appointmentService;

async function dropEntry(doctorId, day, raw, entry, reason) {
  await waitlistQueue.remove(doctorId, day, raw);
  logAudit('WAITLIST_ENTRY_DROPPED', { ...entry, reason });
}

async function promoteWaitlist({ doctorId, day }) {
  const entries = await waitlistQueue.list(doctorId, day);

  for (const { raw, entry } of entries) {
    const slot = validateAppointmentSlot(entry.appointmentDatetime);
    if (slot.error) {
      await dropEntry(doctorId, day, raw, entry, slot.error.message);
      continue;
    }

    try {
      const appointment = await appointmentService.bookAppointment({
        patientId: entry.patientId,
        doctorId,
        slot,
        source: 'waitlist',
      });
      await waitlistQueue.remove(doctorId, day, raw);
      logAudit('WAITLIST_PROMOTED', { ...entry, appointmentId: appointment.id });
      console.log(`[worker] promoted patient ${entry.patientId} into appointment ${appointment.id}`);
      return;
    } catch (err) {
      const reason = err.details?.reason;
      if (reason === CONFLICT.SLOT_TAKEN) continue;
      if (reason === CONFLICT.DAY_FULL) return;
      if (reason === CONFLICT.PATIENT_BUSY || err.statusCode === 404) {
        await dropEntry(doctorId, day, raw, entry, err.message);
        continue;
      }
      throw err;
    }
  }
}

module.exports = promoteWaitlist;
