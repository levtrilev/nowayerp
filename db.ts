import { Pool } from 'pg';

const pool_localhost = new Pool({
  // host: process.env.DB_HOST,
  host: process.env.DB_HOST_127,
  // host: process.env.DB_HOST_MYSITE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: 5432, // порт PostgreSQL по умолчанию
  max: 20, // максимальное количество клиентов в пуле
  idleTimeoutMillis: 300000, // время ожидания перед закрытием неактивного соединения
});

const pool_neon = new Pool({
  host: process.env.NEON_PGHOST,
  // host: process.env.POSTGRES_URL,
  user: process.env.NEON_POSTGRES_USER,
  password: process.env.NEON_POSTGRES_PASSWORD,
  database: process.env.NEON_POSTGRES_DATABASE,
  port: 5432, // порт PostgreSQL по умолчанию
  max: 20, // максимальное количество клиентов в пуле
  idleTimeoutMillis: 300000, // время ожидания перед закрытием неактивного соединения
  ssl: { rejectUnauthorized: true },
});

const pool = pool_neon;
// const pool = pool_localhost;

export default pool;