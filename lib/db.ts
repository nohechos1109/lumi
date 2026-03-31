import { Pool } from 'pg'

if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
  console.warn('⚠️ WARNING: DATABASE_URL is not set in production. Trying fallback local connection (which will likely fail on Vercel).')
}

// We evaluate this dynamically to ensure Next.js build caching doesn't lock "undefined" 
// if the variable was missing during initial compile.
const getPoolConfig = () => {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    }
  }
  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  }
}

const pool = new Pool(getPoolConfig())

export default pool
