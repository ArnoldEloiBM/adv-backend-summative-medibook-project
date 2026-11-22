-- MediBook schema: three entities (patients, doctors, appointments), normalized to 3NF.
-- A doctor cannot hold two live appointments at the same date/time:
-- UNIQUE (doctor_id, active_slot) enforces it. active_slot is generated from status:
-- the appointment time while booked, NULL once cancelled, which frees the slot
-- and keeps the row for refund history. Requires MySQL 8.0.16+ (enforced CHECKs).

CREATE DATABASE IF NOT EXISTS medibook
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE medibook;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS doctors;
DROP TABLE IF EXISTS patients;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE patients (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_patients_email (email),
  CONSTRAINT chk_patients_name CHECK (CHAR_LENGTH(TRIM(full_name)) >= 1),
  CONSTRAINT chk_patients_email CHECK (email LIKE '%_@_%._%'),
  CONSTRAINT chk_patients_phone CHECK (CHAR_LENGTH(TRIM(phone)) >= 7)
) ENGINE=InnoDB;

CREATE TABLE doctors (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  specialty VARCHAR(80) NOT NULL,
  consultation_fee DECIMAL(10, 2) NOT NULL,
  room VARCHAR(20) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT chk_doctors_name CHECK (CHAR_LENGTH(TRIM(full_name)) >= 1),
  CONSTRAINT chk_doctors_specialty CHECK (CHAR_LENGTH(TRIM(specialty)) >= 1),
  CONSTRAINT chk_doctors_room CHECK (CHAR_LENGTH(TRIM(room)) >= 1),
  CONSTRAINT chk_doctors_fee CHECK (consultation_fee >= 0)
) ENGINE=InnoDB;

CREATE TABLE appointments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  patient_id INT UNSIGNED NOT NULL,
  doctor_id INT UNSIGNED NOT NULL,
  appointment_datetime DATETIME NOT NULL,
  status ENUM('booked', 'cancelled') NOT NULL DEFAULT 'booked',
  active_slot DATETIME
    GENERATED ALWAYS AS (IF(status = 'cancelled', NULL, appointment_datetime)) STORED,
  amount_paid DECIMAL(10, 2) NOT NULL,
  refund_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  booked_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cancelled_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_doctor_active_slot (doctor_id, active_slot),
  UNIQUE KEY uq_patient_active_slot (patient_id, active_slot),
  CONSTRAINT fk_appointments_patient
    FOREIGN KEY (patient_id) REFERENCES patients (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_appointments_doctor
    FOREIGN KEY (doctor_id) REFERENCES doctors (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_amount_paid CHECK (amount_paid >= 0),
  CONSTRAINT chk_refund_nonnegative CHECK (refund_amount >= 0),
  CONSTRAINT chk_refund_not_above_paid CHECK (refund_amount <= amount_paid),
  CONSTRAINT chk_booked_no_refund CHECK (status = 'cancelled' OR refund_amount = 0),
  CONSTRAINT chk_status_timestamps CHECK (
    (status = 'booked' AND cancelled_at IS NULL)
    OR (status = 'cancelled' AND cancelled_at IS NOT NULL)
  ),
  CONSTRAINT chk_slot_boundary CHECK (
    MINUTE(appointment_datetime) IN (0, 30)
    AND SECOND(appointment_datetime) = 0
  ),
  CONSTRAINT chk_working_hours CHECK (
    TIME(appointment_datetime) >= '09:00:00'
    AND TIME(appointment_datetime) < '17:00:00'
  )
) ENGINE=InnoDB;