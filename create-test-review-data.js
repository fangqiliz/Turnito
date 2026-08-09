import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createTestReviewData() {
  try {
    const nicoleId = '1156789b-2008-4ca3-b929-07991b1cb1d0'
    console.log('Buscando citas de Nicole (ID:', nicoleId, ')...')

    // Buscar una cita de Nicole que no sea completed
    const { data: appointments, error: apptError } = await supabase
      .from('appointments')
      .select('id, status, start_time, business_id, service_id, client_name')
      .eq('client_id', nicoleId)
      .neq('status', 'completed')
      .order('start_time', { ascending: false })
      .limit(1)

    if (apptError) {
      console.error('Error buscando citas:', apptError)
      return
    }

    if (!appointments || appointments.length === 0) {
      console.log('No hay citas disponibles para Nicole')
      return
    }

    const appointment = appointments[0]
    console.log('Cita encontrada:', {
      id: appointment.id,
      status: appointment.status,
      client_name: appointment.client_name,
      start_time: appointment.start_time,
    })

    // Actualizar a status 'completed' con un start_time en el pasado
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 1) // Ayer

    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        status: 'completed',
        start_time: pastDate.toISOString(),
      })
      .eq('id', appointment.id)

    if (updateError) {
      console.error('Error actualizando cita:', updateError)
      return
    }

    console.log('\n✅ Cita actualizada a status completed:')
    console.log('   ID:', appointment.id)
    console.log('   Client ID:', nicoleId)
    console.log('   Client Name:', appointment.client_name)
    console.log('   Business ID:', appointment.business_id)
    console.log('\n→ Now Nicole can leave a review on this appointment!')
  } catch (error) {
    console.error('Error:', error)
  }
}

createTestReviewData()
