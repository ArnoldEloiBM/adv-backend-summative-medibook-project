const express = require('express');
const patientController = require('../controllers/patientController');

const router = express.Router();

router.get('/', patientController.listPatients);
router.post('/', patientController.createPatient);
router.get('/:id', patientController.getPatient);
router.patch('/:id', patientController.updatePatient);
router.delete('/:id', patientController.deletePatient);

module.exports = router;
