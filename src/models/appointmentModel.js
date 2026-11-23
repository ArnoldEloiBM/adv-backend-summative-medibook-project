const pool = require('../config/db');

const DETAIL_COLUMNS = `
  a.id,
  a.patient_id AS patientId,
  p.full_name AS patientName,
  p.email AS patientEmail,
  p.phone AS patientPhone,
  a.doctor_id AS doctorId,
  d.full_name AS doctorName,
  d.specialty,
  d.room,
  a.appointment_datetime AS appointmentDatetime,
  a.status,
  a.amount_paid AS amountPaid,
  a.refund_amount AS refundAmount,
  a.booked_on AS bookedOn,
  a.cancelled_at AS cancelledAt`;

async function findById(id, db = pool) {
  const [rows] = await db.execute(
    `SELECT ${DETAIL_COLUMNS}
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       JOIN doctors d ON d.id = a.doctor_id
      WHERE a.id = ?`,
    [id],
  );
  return rows[0] || null;
}

async function findByIdForUpdate(connection, id) {
  const [rows] = await connection.execute(
    `SELECT id, doctor_id AS doctorId, appointment_datetime AS appointmentDatetime,
            status, amount_paid AS amountPaid
       FROM appointments
      WHERE id = ?
        FOR UPDATE`,
    [id],
  );
  return rows[0] || null;
}

async function countBookedForDoctorOnDay(connection, doctorId, dayStart, nextDayStart) {
  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS bookedCount
       FROM appointments
      WHERE doctor_id = ?
        AND active_slot >= ?
        AND active_slot < ?`,
    [doctorId, dayStart, nextDayStart],
  );
  return rows[0].bookedCount;
}

async function insert(connection, { patientId, doctorId, appointmentDatetime, amountPaid }) {
  const [result] = await connection.execute(
    `INSERT INTO appointments (patient_id, doctor_id, appointment_datetime, amount_paid)
     VALUES (?, ?, ?, ?)`,
    [patientId, doctorId, appointmentDatetime, amountPaid],
  );
  return result.insertId;
}

async function markCancelled(connection, id, { refundAmount, cancelledAt, cancelledStatus, bookedStatus }) {
  const [result] = await connection.execute(
    `UPDATE appointments
        SET status = ?, refund_amount = ?, cancelled_at = ?
      WHERE id = ? AND status = ?`,
    [cancelledStatus, refundAmount, cancelledAt, id, bookedStatus],
  );
  return result.affectedRows > 0;
}

module.exports = {
  findById,
  findByIdForUpdate,
  countBookedForDoctorOnDay,
  insert,
  markCancelled,
};
