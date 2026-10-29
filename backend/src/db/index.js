import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool using environment variables
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'campusprice_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

/**
 * Standard Promise-based query helper
 * @param {string} sql - SQL query string
 * @param {Array<any>} params - Query parameters
 * @returns {Promise<[any, any]>} - Result rows and fields
 */
export async function query(sql, params = []) {
  return pool.execute(sql, params);
}

/**
 * Transaction-based execution helper template
 * Executes a callback with an active connection within a single ACID transaction.
 * Automatically commits on success, and rolls back on error.
 * 
 * @param {(connection: mysql.PoolConnection) => Promise<any>} callback
 * @returns {Promise<any>}
 */
export async function withTransaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export default pool;
