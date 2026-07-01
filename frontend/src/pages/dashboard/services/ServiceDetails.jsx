import { DollarSign, Clock, Calendar, Hash, Pencil, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'

export default function ServiceDetails({ service, isAdmin, onEdit, onDelete }) {
  if (!service) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Título y estado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
        <div>
          <h3 style={{
            fontSize:   'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-semibold)',
            color:      'var(--color-text-primary)',
            marginBottom: service.description ? 'var(--space-2)' : 0,
          }}>
            {service.name}
          </h3>
          {service.description && (
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              {service.description}
            </p>
          )}
        </div>
        <Badge status={service.is_active ? 'active' : 'inactive'} />
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
        <StatCard
          icon={DollarSign}
          label="Precio"
          value={`RD$${Number(service.price).toFixed(2)}`}
        />
        <StatCard
          icon={Clock}
          label="Duración"
          value={`${service.duration_minutes} min`}
        />
        <StatCard
          icon={Calendar}
          label="Registrado"
          value={format(new Date(service.created_at), "dd MMM yyyy", { locale: es })}
        />
        <StatCard
          icon={Hash}
          label="ID"
          value={`${service.id.slice(0, 8)}…`}
          title={service.id}
        />
      </div>

      {/* Acciones admin */}
      {isAdmin && (
        <div style={{
          display:    'flex',
          gap:        'var(--space-3)',
          paddingTop: 'var(--space-4)',
          borderTop:  '1px solid var(--color-border)',
        }}>
          <Button variant="ghost" icon={Pencil} onClick={onEdit}>
            Editar servicio
          </Button>
          <Button variant="danger" icon={Trash2} onClick={onDelete}>
            Eliminar
          </Button>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, title }) {
  return (
    <div style={{
      display:      'flex',
      alignItems:   'center',
      gap:          'var(--space-3)',
      padding:      'var(--space-3)',
      background:   'var(--color-bg-tertiary)',
      borderRadius: 'var(--radius-md)',
      border:       '1px solid var(--color-border)',
    }}>
      <div style={{
        width:          32,
        height:         32,
        borderRadius:   'var(--radius-sm)',
        background:     'var(--color-accent-subtle)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexShrink:     0,
      }}>
        <Icon size={16} style={{ color: 'var(--color-accent)' }} />
      </div>
      <div>
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 2 }}>
          {label}
        </div>
        <div
          style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}
          title={title}
        >
          {value}
        </div>
      </div>
    </div>
  )
}
