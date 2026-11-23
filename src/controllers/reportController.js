const AppError = require('../utils/AppError');
const doctorModel = require('../models/doctorModel');
const reportModel = require('../models/reportModel');
const { requireId } = require('../utils/requestParams');
const {
  MAX_APPOINTMENTS_PER_DAY,
  STATS_WINDOW_DAYS,
  BUSY_DAY_THRESHOLD,
  APPOINTMENT_STATUS,
} = require('../config/constants');

async function getDoctorStats(req, res) {
  const id = requireId(req.params.id, 'Doctor');
  const doctor = await doctorModel.findById(id);
  if (!doctor) throw new AppError(404, `Doctor ${id} not found`);

  const options = {
    dailyCap: MAX_APPOINTMENTS_PER_DAY,
    windowDays: STATS_WINDOW_DAYS,
    bookedStatus: APPOINTMENT_STATUS.BOOKED,
  };
  const [summary, dailyCounts] = await Promise.all([
    reportModel.getDoctorSummary(id, options),
    reportModel.getDoctorDailyCounts(id, options),
  ]);

  res.json({
    data: {
      doctor: { id: doctor.id, fullName: doctor.fullName, specialty: doctor.specialty },
      revenueCollected: summary.revenueCollected,
      upcomingAppointments: summary.upcomingAppointments,
      nextDays: {
        days: STATS_WINDOW_DAYS,
        dailyCap: MAX_APPOINTMENTS_PER_DAY,
        bookedAppointments: summary.bookedInWindow,
        utilizationPct: summary.utilizationPct,
        perDay: dailyCounts,
      },
    },
  });
}

async function getDoctorsReport(req, res) {
  const rows = await reportModel.getDoctorsReport({
    bookedStatus: APPOINTMENT_STATUS.BOOKED,
    cancelledStatus: APPOINTMENT_STATUS.CANCELLED,
  });
  res.json({ data: rows });
}

async function getBusyDaysReport(req, res) {
  const rows = await reportModel.getBusyDays({
    dailyCap: MAX_APPOINTMENTS_PER_DAY,
    threshold: BUSY_DAY_THRESHOLD,
  });
  res.json({
    criteria: `More than ${BUSY_DAY_THRESHOLD * 100}% of the ${MAX_APPOINTMENTS_PER_DAY}-slot daily capacity booked`,
    data: rows,
  });
}

module.exports = { getDoctorStats, getDoctorsReport, getBusyDaysReport };
