const { validateAppointmentSlot } = require('../src/utils/slotValidator');

const NOW = new Date(2026, 11, 1, 8, 0, 0);

function check(value) {
  return validateAppointmentSlot(value, NOW);
}

describe('validateAppointmentSlot', () => {
  test('accepts a future slot on the hour within working hours', () => {
    const result = check('2026-12-02T09:00');
    expect(result.error).toBeUndefined();
    expect(result.slot).toBe('2026-12-02 09:00:00');
    expect(result.day).toBe('2026-12-02');
    expect(result.nextDay).toBe('2026-12-03');
  });

  test('accepts 16:30, the last slot of the day', () => {
    expect(check('2026-12-02 16:30').error).toBeUndefined();
  });

  test('rejects 17:00 because the slot would end after closing time', () => {
    expect(check('2026-12-02T17:00').error).toEqual({
      status: 422,
      message: expect.stringContaining('working hours'),
    });
  });

  test('rejects 08:30, before opening time', () => {
    expect(check('2026-12-02T08:30').error.status).toBe(422);
  });

  test('rejects 09:15 because it is not on a 30-minute boundary', () => {
    expect(check('2026-12-02T09:15').error).toEqual({
      status: 422,
      message: expect.stringContaining('30-minute boundary'),
    });
  });

  test('rejects a time with non-zero seconds', () => {
    expect(check('2026-12-02 09:00:10').error.status).toBe(422);
  });

  test('rejects a slot in the past', () => {
    expect(check('2026-11-30T10:00').error).toEqual({
      status: 422,
      message: 'Appointments can only be booked in the future',
    });
  });

  test.each(['not-a-date', '2026-02-30T10:00', '2026-12-02T25:00', '', '02/12/2026 10:00'])(
    'rejects the malformed value %p with a 400',
    (value) => {
      expect(check(value).error.status).toBe(400);
    },
  );

  test('rejects a non-string value with a 400', () => {
    expect(check(1764662400000).error.status).toBe(400);
  });
});
