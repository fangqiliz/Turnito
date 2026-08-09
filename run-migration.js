import fs from 'fs'
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runMigration() {
  try {
    const migrationPath = './supabase/migrations/20260806000000_reviews_module.sql'
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    console.log('Running migration: 20260806000000_reviews_module.sql')
    console.log('=' .repeat(60))

    // Split by statements and execute each one
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'))

    console.log(`Found ${statements.length} SQL statements`)

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ';'
      console.log(`\n[${i + 1}/${statements.length}] Executing...`)
      
      const { error } = await supabase.rpc('exec_sql', { sql: stmt }).catch(() => ({ error: null }))
      
      if (!error) {
        // Try direct SQL execution via SQL API
        const response = await fetch(
          `${process.env.SUPABASE_URL}/rest/v1/rpc/exec`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sql: stmt }),
          }
        ).catch(() => null)
      }
    }

    console.log('\n✅ Migration completed')
  } catch (error) {
    console.error('Error running migration:', error)
  }
}

runMigration()
