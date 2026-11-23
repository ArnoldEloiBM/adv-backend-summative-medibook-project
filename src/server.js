const app = require('./app');
const pool = require('./config/db');
const { port } = require('./config/env');

async function start() {
  try {
    const connection = await pool.getConnection();
    connection.release();
    console.log('Connected to MySQL');
  } catch (err) {
    console.error('Could not connect to MySQL:', err.message);
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`MediBook API listening on http://localhost:${port}`);
  });
}

start();
