import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function deleteExistingReview() {
  try {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (error) {
      console.error('Error:', error)
      return
    }

    console.log('✅ All reviews deleted')
  } catch (error) {
    console.error('Error:', error)
  }
}

deleteExistingReview()
