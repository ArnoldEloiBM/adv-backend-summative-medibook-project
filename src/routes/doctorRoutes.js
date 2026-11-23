const express = require('express');
const doctorController = require('../controllers/doctorController');
const reportController = require('../controllers/reportController');
const appointmentController = require('../controllers/appointmentController');

const router = express.Router();

router.get('/', doctorController.listDoctors);
router.post('/', doctorController.createDoctor);
router.get('/:id', doctorController.getDoctor);
router.patch('/:id', doctorController.updateDoctor);
router.delete('/:id', doctorController.deleteDoctor);
router.get('/:id/stats', reportController.getDoctorStats);
router.get('/:id/waitlist', appointmentController.getDoctorWaitlist);

module.exports = router;
