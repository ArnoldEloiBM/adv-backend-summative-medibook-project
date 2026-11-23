const pool = require('../config/db');
const { buildSetClause } = require('./sqlHelpers');

const COLUMNS = 'id, full_name AS fullName, email, phone, created_at AS createdAt';
const COLUMN_MAP = { fullName: 'full_name', email: 'email', phone: 'phone' };

async function findAll() {
  const [rows] = await pool.execute(`SELECT ${COLUMNS} FROM patients ORDER BY id`);
  return rows;
}

async function findById(id, db = pool) {
  const [rows] = await db.execute(`SELECT ${COLUMNS} FROM patients WHERE id = ?`, [id]);
  return rows[0] || null;
}

async function create({ fullName, email, phone }) {
  const [result] = await pool.execute(
    'INSERT INTO patients (full_name, email, phone) VALUES (?, ?, ?)',
    [fullName, email, phone],
  );
  return findById(result.insertId);
}

async function update(id, fields) {
  const { clause, values } = buildSetClause(fields, COLUMN_MAP);
  const [result] = await pool.execute(`UPDATE patients SET ${clause} WHERE id = ?`, [...values, id]);
  return result.affectedRows === 0 ? null : findById(id);
}

async function remove(id) {
  const [result] = await pool.execute('DELETE FROM patients WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = { findAll, findById, create, update, remove };
