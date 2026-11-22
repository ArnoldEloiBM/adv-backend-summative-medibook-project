-- MediBook sample data. Dates are relative to the day you run this script,
-- so "upcoming" appointments and the 7-day statistics always have data.
-- Covers: a doctor with zero appointments (Dr. Uwase), a near-cap day
-- (Dr. Boateng, 11 of 12 slots in two days' time), past appointments
-- (revenue), and a cancellation with a 50% refund (refund history).

USE medibook;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE appointments;
TRUNCATE TABLE doctors;
TRUNCATE TABLE patients;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO patients (full_name, email, phone) VALUES
  ('Ama Mensah', 'ama@mail.com', '0244111222'),
  ('Kojo Owusu', 'kojo@mail.com', '0555333444'),
  ('Aline Uwimana', 'aline@mail.com', '0788123456'),
  ('Eric Nkurunziza', 'eric@mail.com', '0722987654'),
  ('Grace Mukamana', 'grace@mail.com', '0733456789');

INSERT INTO doctors (full_name, specialty, consultation_fee, room) VALUES
  ('Dr. Boateng', 'Dermatology', 150.00, 'R-12'),
  ('Dr. Adjei', 'Paediatrics', 100.00, 'R-03'),
  ('Dr. Uwase', 'Cardiology', 200.00, 'R-07');

-- Dr. Boateng, 11 appointments two days from today (09:00-14:00).
INSERT INTO appointments (patient_id, doctor_id, appointment_datetime, amount_paid) VALUES
  (1, 1, TIMESTAMP(CURDATE() + INTERVAL 2 DAY, '09:00:00'), 150.00),
  (2, 1, TIMESTAMP(CURDATE() + INTERVAL 2 DAY, '09:30:00'), 150.00),
  (3, 1, TIMESTAMP(CURDATE() + INTERVAL 2 DAY, '10:00:00'), 150.00),
  (4, 1, TIMESTAMP(CURDATE() + INTERVAL 2 DAY, '10:30:00'), 150.00),
  (5, 1, TIMESTAMP(CURDATE() + INTERVAL 2 DAY, '11:00:00'), 150.00),
  (1, 1, TIMESTAMP(CURDATE() + INTERVAL 2 DAY, '11:30:00'), 150.00),
  (2, 1, TIMESTAMP(CURDATE() + INTERVAL 2 DAY, '12:00:00'), 150.00),
  (3, 1, TIMESTAMP(CURDATE() + INTERVAL 2 DAY, '12:30:00'), 150.00),
  (4, 1, TIMESTAMP(CURDATE() + INTERVAL 2 DAY, '13:00:00'), 150.00),
  (5, 1, TIMESTAMP(CURDATE() + INTERVAL 2 DAY, '13:30:00'), 150.00),
  (1, 1, TIMESTAMP(CURDATE() + INTERVAL 2 DAY, '14:00:00'), 150.00);

-- Past appointments (revenue already collected); one paid at a discount.
INSERT INTO appointments (patient_id, doctor_id, appointment_datetime, amount_paid, booked_on) VALUES
  (2, 1, TIMESTAMP(CURDATE() - INTERVAL 5 DAY, '09:30:00'), 120.00, NOW() - INTERVAL 20 DAY),
  (3, 2, TIMESTAMP(CURDATE() - INTERVAL 3 DAY, '09:00:00'), 100.00, NOW() - INTERVAL 10 DAY);

-- Upcoming appointments with Dr. Adjei.
INSERT INTO appointments (patient_id, doctor_id, appointment_datetime, amount_paid) VALUES
  (1, 2, TIMESTAMP(CURDATE() + INTERVAL 3 DAY, '10:00:00'), 100.00),
  (2, 2, TIMESTAMP(CURDATE() + INTERVAL 5 DAY, '11:00:00'), 100.00);

-- A cancellation with a 50% refund; the row is kept and the slot is free again.
INSERT INTO appointments
  (patient_id, doctor_id, appointment_datetime, status, amount_paid, refund_amount, cancelled_at)
VALUES
  (4, 2, TIMESTAMP(CURDATE() + INTERVAL 4 DAY, '09:30:00'), 'cancelled', 100.00, 50.00, NOW());