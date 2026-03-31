const { Pool } = require('pg')

async function tryPorts() {
  // Try many possible mapped ports
  const ports = [5432, 5433, 5434, 5435, 5436, 5440, 3306, 3307, 3308, 3309, 3310, 3311, 3312, 3313, 3314, 3315, 5400, 5401, 5402, 5500, 15432, 25432, 54320]
  
  for (const port of ports) {
    const pool = new Pool({
      host: '192.168.0.111',
      port: port,
      database: 'cotizador',
      user: 'admin',
      password: 'admin',
      connectionTimeoutMillis: 1500,
    })
    try {
      const res = await pool.query('SELECT 1 as ok')
      console.log(`✅ Puerto ${port} FUNCIONA!`)
      await pool.end()
      return port
    } catch (err) {
      // silent
      await pool.end()
    }
  }
  return null
}

console.log('Escaneando puertos...')
tryPorts().then(port => {
  if (port) console.log(`\n✅ Puerto correcto: ${port}`)
  else console.log('\n❌ Ningún puerto funcionó. El puerto de PostgreSQL probablemente no está expuesto.')
  process.exit(0)
})
