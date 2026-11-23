const pool = require('../config/db');

async function getDoctorSummary(doctorId, { dailyCap, windowDays, bookedStatus }) {
  const [rows] = await pool.execute(
    `SELECT
        COALESCE(SUM(a.amount_paid - a.refund_amount), 0) AS revenueCollected,
        COUNT(CASE WHEN a.status = ? AND a.appointment_datetime > NOW() THEN 1 END) AS upcomingAppointments,
        COUNT(CASE WHEN a.active_slot >= CURDATE()
                    AND a.active_slot < CURDATE() + INTERVAL ? DAY THEN 1 END) AS bookedInWindow,
        ROUND(
          COUNT(CASE WHEN a.active_slot >= CURDATE()
                      AND a.active_slot < CURDATE() + INTERVAL ? DAY THEN 1 END)
          / (? * ?) * 100, 1) AS utilizationPct
       FROM appointments a
      WHERE a.doctor_id = ?`,
    [bookedStatus, windowDays, windowDays, dailyCap, windowDays, doctorId],
  );
  return rows[0];
}

async function getDoctorDailyCounts(doctorId, { dailyCap, windowDays }) {
  const [rows] = await pool.execute(
    `WITH RECURSIVE window_days (day, day_number) AS (
        SELECT CURDATE(), 1
        UNION ALL
        SELECT day + INTERVAL 1 DAY, day_number + 1
          FROM window_days
         WHERE day_number < ?
     )
     SELECT DATE_FORMAT(w.day, '%Y-%m-%d') AS date,
            COUNT(a.id) AS appointments,
            ROUND(COUNT(a.id) / ? * 100, 1) AS utilizationPct
       FROM window_days w
       LEFT JOIN appointments a
         ON a.doctor_id = ?
        AND a.active_slot >= w.day
        AND a.active_slot < w.day + INTERVAL 1 DAY
      GROUP BY w.day
      ORDER BY w.day`,
    [windowDays, dailyCap, doctorId],
  );
  return rows;
}

async function getDoctorsReport({ bookedStatus, cancelledStatus }) {
  const [rows] = await pool.execute(
    `SELECT d.id AS doctorId,
            d.full_name AS doctorName,
            d.specialty,
            COUNT(a.id) AS totalAppointments,
            COUNT(CASE WHEN a.status = ? THEN 1 END) AS activeAppointments,
            COUNT(CASE WHEN a.status = ? THEN 1 END) AS cancelledAppointments,
            COALESCE(SUM(a.amount_paid - a.refund_amount), 0) AS revenueCollected
       FROM doctors d
       LEFT JOIN appointments a ON a.doctor_id = d.id
      GROUP BY d.id, d.full_name, d.specialty
      ORDER BY revenueCollected DESC, d.id`,
    [bookedStatus, cancelledStatus],
  );
  return rows;
}

async function getBusyDays({ dailyCap, threshold }) {
  const [rows] = await pool.execute(
    `SELECT d.id AS doctorId,
            d.full_name AS doctorName,
            busy.day AS date,
            busy.booked AS bookedAppointments,
            ROUND(busy.booked / ? * 100, 1) AS utilizationPct
       FROM (
             SELECT doctor_id,
                    DATE_FORMAT(active_slot, '%Y-%m-%d') AS day,
                    COUNT(*) AS booked
               FROM appointments
              WHERE active_slot IS NOT NULL
              GROUP BY doctor_id, day
             HAVING COUNT(*) > ? * ?
            ) AS busy
       JOIN doctors d ON d.id = busy.doctor_id
      ORDER BY busy.day, d.id`,
    [dailyCap, dailyCap, threshold],
  );
  return rows;
}

module.exports = { getDoctorSummary, getDoctorDailyCounts, getDoctorsReport, getBusyDays };
