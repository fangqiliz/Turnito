import supabase from './src/config/supabase.js'
import 'dotenv/config'

async function checkReviewsTable() {
  try {
    // Try to insert a test review
    const testReview = {
      business_id: '6fb797f8-6cdd-4f63-84ca-ee5e6fa86cba',
      appointment_id: 'ff07677f-9cc0-47de-9f22-e92ed9fed944',
      client_id: '1156789b-2008-4ca3-b929-07991b1cb1d0',
      rating: 5,
      comment: 'TEST REVIEW',
    }

    console.log('Attempting to insert test review...')
    const { data, error } = await supabase
      .from('reviews')
      .insert([testReview])
      .select()

    if (error) {
      console.log('Error:', error.code)
      console.log('Message:', error.message)
      
      if (error.code === 'PGRST116') {
        console.log('\n❌ Reviews table does NOT exist')
        console.log('You need to run the migration SQL in Supabase console')
      }
      return
    }

    console.log('✅ Review inserted successfully!')
    console.log('Reviews table EXISTS')
    console.log('\nInserting test data...')
    console.log(JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Connection error:', error)
  }
}

checkReviewsTable()
