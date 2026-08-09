import fs from 'fs'
import 'dotenv/config'

async function runMigration() {
  try {
    const migrationPath = './supabase/migrations/20260806000000_reviews_module.sql'
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    // Split by statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s.length > 5)

    console.log(`Found ${statements.length} SQL statements to execute`)
    console.log('=' .repeat(60))

    // For each statement, execute via Supabase SQL API
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i]
      console.log(`\n[${i + 1}/${statements.length}] Executing statement...`)
      console.log(stmt.substring(0, 80) + '...')

      try {
        const response = await fetch(
          `${process.env.SUPABASE_URL}/rest/v1/rpc/sql`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'params=single-object',
            },
            body: JSON.stringify({ query: stmt }),
          }
        )

        if (response.ok) {
          console.log('✅ OK')
        } else {
          const text = await response.text()
          console.log(`⚠️  Status ${response.status}:`, text.substring(0, 100))
        }
      } catch (err) {
        console.log(`⚠️  Error:`, err.message)
      }
    }

    console.log('\n' + '=' .repeat(60))
    console.log('Migration execution completed!')
    console.log('\nIf you see errors about PGRST errors, the migration may have already run.')
  } catch (error) {
    console.error('Fatal error:', error.message)
  }
}

runMigration()
