const express = require('express');
const patientRoutes = require('./patientRoutes');
const doctorRoutes = require('./doctorRoutes');
const appointmentRoutes = require('./appointmentRoutes');
const reportRoutes = require('./reportRoutes');
const feedbackRoutes = require('./feedbackRoutes');

const router = express.Router();

router.use('/patients', patientRoutes);
router.use('/doctors', doctorRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/reports', reportRoutes);
router.use('/feedback', feedbackRoutes);

module.exports = router;
