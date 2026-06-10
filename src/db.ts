import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("DATABASE_URL environment variable is missing. Database connection will likely fail.");
}

const sql = postgres(connectionString || '');

export default sql;
