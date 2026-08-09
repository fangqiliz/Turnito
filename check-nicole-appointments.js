import supabase from './src/config/supabase.js';

(async () => {
  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, status, start_time, client_name')
    .eq('client_id', '1156789b-2008-4ca3-b929-07991b1cb1d0')
    .order('start_time', { ascending: false });
  
  console.log('\n=== CITAS DE NICOLE CLIENTE ===\n');
  if (appointments) {
    appointments.forEach(a => {
      const dateStr = new Date(a.start_time).toLocaleString('es-ES');
      console.log(`Status: ${a.status.padEnd(10)} | Start: ${dateStr} | ${a.client_name}`);
    });
    
    console.log('\n=== RESUMEN POR STATUS ===');
    const byStatus = {};
    appointments.forEach(a => {
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
    });
    console.table(byStatus);
    
    console.log('\n=== ESPERADO EN CADA PESTAÑA ===');
    console.log('Pestaña "Todas" (status=""): ' + appointments.length + ' citas');
    console.log('Pestaña "Pendientes" (status="pending"): ' + (byStatus.pending || 0) + ' citas');
    console.log('Pestaña "Confirmadas" (status="confirmed"): ' + (byStatus.confirmed || 0) + ' citas');
    console.log('Pestaña "Historial" (status="completed"): ' + (byStatus.completed || 0) + ' citas');
  }
})();
