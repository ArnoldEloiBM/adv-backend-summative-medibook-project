const { REFUND_POLICY } = require('../config/constants');
const { hoursBetween } = require('./dateTime');

function roundToCents(amount) {
  return Math.round(amount * 100) / 100;
}

function getRefundRate(noticeHours) {
  if (noticeHours > REFUND_POLICY.FULL_REFUND_ABOVE_HOURS) return 1;
  if (noticeHours >= REFUND_POLICY.PARTIAL_REFUND_FROM_HOURS) return REFUND_POLICY.PARTIAL_REFUND_RATE;
  return 0;
}

function calculateRefund(amountPaid, appointmentDate, cancelledAt) {
  const noticeHours = hoursBetween(cancelledAt, appointmentDate);
  const refundRate = getRefundRate(noticeHours);
  return {
    noticeHours: roundToCents(noticeHours),
    refundRate,
    refundAmount: roundToCents(amountPaid * refundRate),
  };
}

module.exports = { getRefundRate, calculateRefund };
