import supabase from './src/config/supabase.js'

async function testReviewQuery() {
  try {
    console.log('Testing review query...')
    
    // Get a review directly from the database
    const { data, error } = await supabase
      .from('reviews')
      .select(`id, rating, comment, created_at, profiles!client_id(full_name, avatar_url)`)
      .limit(1)
      .single()

    if (error) {
      console.error('Query error:', error)
      return
    }

    console.log('\nReview data from DB:')
    console.log(JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error:', error)
  }
}

testReviewQuery()
