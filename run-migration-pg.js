import fs from 'fs'
import pkg from 'pg'
import 'dotenv/config'

const { Client } = pkg

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()
    console.log('Connected to database')

    const migrationPath = './supabase/migrations/20260806000000_reviews_module.sql'
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    console.log('\nExecuting migration: 20260806000000_reviews_module.sql')
    console.log('=' .repeat(60))

    const result = await client.query(migrationSQL)
    
    console.log('✅ Migration completed successfully!')
    console.log('\nDatabase schema updated with reviews table')
  } catch (error) {
    console.error('❌ Error running migration:')
    console.error('Message:', error.message)
    console.error('Code:', error.code)
    console.error('Full error:', error)
    if (error.position) {
      console.error(`At position: ${error.position}`)
    }
  } finally {
    await client.end()
  }
}

runMigration()
