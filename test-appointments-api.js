import supabase from './src/config/supabase.js';
import appointmentService from './src/modules/appointments/appointment.service.js';

async function testGetUserAppointments() {
  try {
    // Este es el UUID del usuario autenticado que necesitas obtener de tu sesión
    // Para este test, usaremos un UUID ficticio
    
    // Primero, obtén un usuario real de la base de datos
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);
    
    if (userError || !users || users.length === 0) {
      console.log('No se encontraron usuarios');
      return;
    }
    
    const userId = users[0].id;
    console.log('Testando con usuario:', { id: userId, email: users[0].email });
    
    // Prueba 1: Obtén todas las citas
    console.log('\n=== Test 1: Todas las citas ===');
    const all = await appointmentService.findByUser(userId, { limit: 100 });
    console.log('Resultado:', {
      total: all.total,
      count: all.data.length,
      data: all.data,
    });
    
    // Prueba 2: Obtén solo citas completadas
    console.log('\n=== Test 2: Citas completadas ===');
    const completed = await appointmentService.findByUser(userId, { status: 'completed', limit: 100 });
    console.log('Resultado:', {
      total: completed.total,
      count: completed.data.length,
      data: completed.data,
    });
    
    // Prueba 3: Obtén citas pendientes
    console.log('\n=== Test 3: Citas pendientes ===');
    const pending = await appointmentService.findByUser(userId, { status: 'pending', limit: 100 });
    console.log('Resultado:', {
      total: pending.total,
      count: pending.data.length,
      data: pending.data,
    });
    
  } catch (err) {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
  }
}

testGetUserAppointments();
