require('dotenv').config({ quiet: true });

function required(name) {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: required('DB_USER'),
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'medibook',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  },
};
