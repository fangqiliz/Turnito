import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function setNicolePassword() {
  try {
    const nicoleId = '1156789b-2008-4ca3-b929-07991b1cb1d0'
    const newPassword = 'Nicole123!'

    const { data, error } = await supabase.auth.admin.updateUserById(
      nicoleId,
      { password: newPassword }
    )

    if (error) {
      console.error('Error setting password:', error)
      return
    }

    console.log('✅ Password set successfully for Nicole')
    console.log('  Email: proyectosnicole17@gmail.com')
    console.log('  Password: Nicole123!')
  } catch (error) {
    console.error('Error:', error)
  }
}

setNicolePassword()
