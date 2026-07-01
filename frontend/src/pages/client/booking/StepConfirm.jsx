import styles from '../BookingPage.module.css'

export default function StepConfirm({ service, employee, date, time, clientData }) {
  return (
    <div>
      <h3 className={styles.stepTitle}>Confirmar Reserva</h3>
      <div className={styles.summary}>
        <SummaryItem label="Servicio"    value={service?.name} />
        <SummaryItem label="Profesional" value={employee?.full_name} />
        <SummaryItem label="Fecha"       value={date} />
        <SummaryItem label="Hora"        value={time} />
        <SummaryItem label="Precio"      value={`RD$${Number(service?.price || 0).toFixed(2)}`} />
        <SummaryItem label="Duración"    value={`${service?.duration_minutes} min`} />
        <SummaryItem label="Cliente"     value={clientData?.client_name} />
        <SummaryItem label="Email"       value={clientData?.client_email} />
      </div>
    </div>
  )
}

function SummaryItem({ label, value }) {
  return (
    <div className={styles.summaryItem}>
      <strong>{label}:</strong> {value}
    </div>
  )
}
