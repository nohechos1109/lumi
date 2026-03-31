const { Pool } = require('pg')
const bcrypt = require('bcryptjs')

const pool = new Pool({
  host: '192.168.0.111',
  port: 3305,
  database: 'cotizador',
  user: 'admin',
  password: 'admin',
})

async function migrate() {
  const client = await pool.connect()
  try {
    // Step 1: Check if columns already exist before adding
    const colCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name IN ('username', 'password_hash')
    `)
    const existingCols = colCheck.rows.map(r => r.column_name)

    if (!existingCols.includes('username')) {
      console.log('Adding username column to users...')
      await client.query(`ALTER TABLE users ADD COLUMN username text UNIQUE NOT NULL DEFAULT ''`)
      await client.query(`ALTER TABLE users ALTER COLUMN username DROP DEFAULT`)
      console.log('  ✓ username column added')
    } else {
      console.log('  ⏭ username column already exists')
    }

    if (!existingCols.includes('password_hash')) {
      console.log('Adding password_hash column to users...')
      await client.query(`ALTER TABLE users ADD COLUMN password_hash text NOT NULL DEFAULT ''`)
      await client.query(`ALTER TABLE users ALTER COLUMN password_hash DROP DEFAULT`)
      console.log('  ✓ password_hash column added')
    } else {
      console.log('  ⏭ password_hash column already exists')
    }

    // Step 2: Add user_id to quotes if not exists
    const quoteColCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'quotes' AND column_name = 'user_id'
    `)
    if (quoteColCheck.rows.length === 0) {
      console.log('Adding user_id column to quotes...')
      await client.query(`ALTER TABLE quotes ADD COLUMN user_id uuid REFERENCES users(id)`)
      console.log('  ✓ user_id column added to quotes')
    } else {
      console.log('  ⏭ user_id column already exists in quotes')
    }

    // Step 3: Generate bcrypt hash for demo1234
    const hash = await bcrypt.hash('demo1234', 10)
    console.log(`\nGenerated bcrypt hash: ${hash}`)

    // Step 4: Seed usernames and passwords
    console.log('\nSeeding users...')

    // Admin
    const adminResult = await client.query(
      `UPDATE users SET username = 'admin', password_hash = $1 WHERE role = 'admin' RETURNING id, username, role`,
      [hash]
    )
    console.log(`  ✓ admin: ${adminResult.rowCount} row(s) updated`)

    // Manager
    const managerResult = await client.query(
      `UPDATE users SET username = 'manager', password_hash = $1 WHERE role = 'manager' RETURNING id, username, role`,
      [hash]
    )
    console.log(`  ✓ manager: ${managerResult.rowCount} row(s) updated`)

    // Sales 1
    const sales1Result = await client.query(
      `UPDATE users SET username = 'sales1', password_hash = $1 
       WHERE id = (SELECT id FROM users WHERE role = 'sales' ORDER BY id LIMIT 1) 
       RETURNING id, username, role`,
      [hash]
    )
    console.log(`  ✓ sales1: ${sales1Result.rowCount} row(s) updated`)

    // Sales 2
    const sales2Result = await client.query(
      `UPDATE users SET username = 'sales2', password_hash = $1 
       WHERE id = (SELECT id FROM users WHERE role = 'sales' ORDER BY id OFFSET 1 LIMIT 1) 
       RETURNING id, username, role`,
      [hash]
    )
    console.log(`  ✓ sales2: ${sales2Result.rowCount} row(s) updated`)

    // Step 5: Verify
    console.log('\n--- Verification ---')
    const users = await client.query('SELECT id, username, role FROM users ORDER BY role, username')
    console.table(users.rows)

  } catch (err) {
    console.error('Migration error:', err.message)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

migrate().then(() => {
  console.log('\n✅ All migrations completed successfully!')
  process.exit(0)
}).catch(err => {
  console.error('\n❌ Migration failed:', err)
  process.exit(1)
})
