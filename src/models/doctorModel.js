const pool = require('../config/db');
const { buildSetClause } = require('./sqlHelpers');

const COLUMNS =
  'id, full_name AS fullName, specialty, consultation_fee AS consultationFee, room, created_at AS createdAt';
const COLUMN_MAP = {
  fullName: 'full_name',
  specialty: 'specialty',
  consultationFee: 'consultation_fee',
  room: 'room',
};

async function findAll() {
  const [rows] = await pool.execute(`SELECT ${COLUMNS} FROM doctors ORDER BY id`);
  return rows;
}

async function findById(id, db = pool) {
  const [rows] = await db.execute(`SELECT ${COLUMNS} FROM doctors WHERE id = ?`, [id]);
  return rows[0] || null;
}

async function findByIdForUpdate(connection, id) {
  const [rows] = await connection.execute(`SELECT ${COLUMNS} FROM doctors WHERE id = ? FOR UPDATE`, [id]);
  return rows[0] || null;
}

async function create({ fullName, specialty, consultationFee, room }) {
  const [result] = await pool.execute(
    'INSERT INTO doctors (full_name, specialty, consultation_fee, room) VALUES (?, ?, ?, ?)',
    [fullName, specialty, consultationFee, room],
  );
  return findById(result.insertId);
}

async function update(id, fields) {
  const { clause, values } = buildSetClause(fields, COLUMN_MAP);
  const [result] = await pool.execute(`UPDATE doctors SET ${clause} WHERE id = ?`, [...values, id]);
  return result.affectedRows === 0 ? null : findById(id);
}

async function remove(id) {
  const [result] = await pool.execute('DELETE FROM doctors WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = { findAll, findById, findByIdForUpdate, create, update, remove };
