const { calculateRefund, getRefundRate } = require('../src/utils/refundCalculator');

const APPOINTMENT = new Date(2026, 11, 10, 10, 0, 0);
const FEE = 150;

function cancelledHoursBefore(hours) {
  return new Date(APPOINTMENT.getTime() - hours * 60 * 60 * 1000);
}

describe('calculateRefund', () => {
  test('gives a 100% refund with more than 48 hours notice', () => {
    const result = calculateRefund(FEE, APPOINTMENT, cancelledHoursBefore(72));
    expect(result).toEqual({ noticeHours: 72, refundRate: 1, refundAmount: 150 });
  });

  test('gives a 50% refund with between 24 and 48 hours notice', () => {
    const result = calculateRefund(FEE, APPOINTMENT, cancelledHoursBefore(30));
    expect(result.refundRate).toBe(0.5);
    expect(result.refundAmount).toBe(75);
  });

  test('gives no refund with less than 24 hours notice', () => {
    const result = calculateRefund(FEE, APPOINTMENT, cancelledHoursBefore(5));
    expect(result.refundRate).toBe(0);
    expect(result.refundAmount).toBe(0);
  });

  test('exactly 48 hours notice is in the 50% tier (full refund needs MORE than 48h)', () => {
    const result = calculateRefund(FEE, APPOINTMENT, cancelledHoursBefore(48));
    expect(result.noticeHours).toBe(48);
    expect(result.refundAmount).toBe(75);
  });

  test('one minute over 48 hours notice gives a full refund', () => {
    const cancelledAt = new Date(cancelledHoursBefore(48).getTime() - 60 * 1000);
    expect(calculateRefund(FEE, APPOINTMENT, cancelledAt).refundAmount).toBe(150);
  });

  test('exactly 24 hours notice is in the 50% tier', () => {
    const result = calculateRefund(FEE, APPOINTMENT, cancelledHoursBefore(24));
    expect(result.noticeHours).toBe(24);
    expect(result.refundAmount).toBe(75);
  });

  test('one minute under 24 hours notice gives no refund', () => {
    const cancelledAt = new Date(cancelledHoursBefore(24).getTime() + 60 * 1000);
    expect(calculateRefund(FEE, APPOINTMENT, cancelledAt).refundAmount).toBe(0);
  });

  test('rounds the refund to cents', () => {
    expect(calculateRefund(99.99, APPOINTMENT, cancelledHoursBefore(30)).refundAmount).toBe(50);
  });
});

describe('getRefundRate', () => {
  test.each([
    [100, 1],
    [48.01, 1],
    [48, 0.5],
    [36, 0.5],
    [24, 0.5],
    [23.99, 0],
    [0, 0],
  ])('%p hours of notice gives a refund rate of %p', (hours, rate) => {
    expect(getRefundRate(hours)).toBe(rate);
  });
});
