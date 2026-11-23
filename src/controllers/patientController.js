const AppError = require('../utils/AppError');
const patientModel = require('../models/patientModel');
const { validatePatient } = require('../utils/validators');
const { requireId, assertValid } = require('../utils/requestParams');

async function listPatients(req, res) {
  res.json({ data: await patientModel.findAll() });
}

async function getPatient(req, res) {
  const id = requireId(req.params.id, 'Patient');
  const patient = await patientModel.findById(id);
  if (!patient) throw new AppError(404, `Patient ${id} not found`);
  res.json({ data: patient });
}

async function createPatient(req, res) {
  const { errors, data } = validatePatient(req.body);
  assertValid(errors, 'Invalid patient data');
  res.status(201).json({ data: await patientModel.create(data) });
}

async function updatePatient(req, res) {
  const id = requireId(req.params.id, 'Patient');
  const { errors, data } = validatePatient(req.body, { partial: true });
  assertValid(errors, 'Invalid patient data');
  const patient = await patientModel.update(id, data);
  if (!patient) throw new AppError(404, `Patient ${id} not found`);
  res.json({ data: patient });
}

async function deletePatient(req, res) {
  const id = requireId(req.params.id, 'Patient');
  const deleted = await patientModel.remove(id);
  if (!deleted) throw new AppError(404, `Patient ${id} not found`);
  res.status(204).end();
}

module.exports = { listPatients, getPatient, createPatient, updatePatient, deletePatient };
