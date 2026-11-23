function buildSetClause(fields, columnMap) {
  const entries = Object.entries(fields).filter(([field]) => columnMap[field]);
  return {
    clause: entries.map(([field]) => `${columnMap[field]} = ?`).join(', '),
    values: entries.map(([, value]) => value),
  };
}

module.exports = { buildSetClause };
