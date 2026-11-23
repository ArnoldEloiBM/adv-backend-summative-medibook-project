const AppError = require('../utils/AppError');
const doctorModel = require('../models/doctorModel');
const { validateDoctor } = require('../utils/validators');
const { requireId, assertValid } = require('../utils/requestParams');

async function listDoctors(req, res) {
  res.json({ data: await doctorModel.findAll() });
}

async function getDoctor(req, res) {
  const id = requireId(req.params.id, 'Doctor');
  const doctor = await doctorModel.findById(id);
  if (!doctor) throw new AppError(404, `Doctor ${id} not found`);
  res.json({ data: doctor });
}

async function createDoctor(req, res) {
  const { errors, data } = validateDoctor(req.body);
  assertValid(errors, 'Invalid doctor data');
  res.status(201).json({ data: await doctorModel.create(data) });
}

async function updateDoctor(req, res) {
  const id = requireId(req.params.id, 'Doctor');
  const { errors, data } = validateDoctor(req.body, { partial: true });
  assertValid(errors, 'Invalid doctor data');
  const doctor = await doctorModel.update(id, data);
  if (!doctor) throw new AppError(404, `Doctor ${id} not found`);
  res.json({ data: doctor });
}

async function deleteDoctor(req, res) {
  const id = requireId(req.params.id, 'Doctor');
  const deleted = await doctorModel.remove(id);
  if (!deleted) throw new AppError(404, `Doctor ${id} not found`);
  res.status(204).end();
}

module.exports = { listDoctors, getDoctor, createDoctor, updateDoctor, deleteDoctor };
