import pkg from 'pg';
const { Pool } = pkg;

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Helper function to execute queries
export async function queryDB(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Helper for SQL template literals
export function sql(strings, ...values) {
  return {
    text: strings.reduce((prev, curr, i) => prev + '$' + i + curr),
    values: values
  };
}

export default pool;