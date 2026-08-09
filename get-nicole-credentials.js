import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function getNicoleInfo() {
  try {
    const nicoleId = '1156789b-2008-4ca3-b929-07991b1cb1d0'

    // Get Nicole's profile info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', nicoleId)
      .single()

    if (profileError) {
      console.log('Profile error:', profileError)
      return
    }

    console.log('Nicole Profile:')
    console.log('  Name:', profile.full_name)
    console.log('  Email:', profile.email)
    console.log('  ID:', profile.id)

    // Get auth user info (may not be accessible via service role)
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()
    
    if (!authError) {
      const nicoleAuth = users.find(u => u.id === nicoleId)
      if (nicoleAuth) {
        console.log('\nNicole Auth:')
        console.log('  Email:', nicoleAuth.email)
        console.log('  ID:', nicoleAuth.id)
      }
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

getNicoleInfo()
