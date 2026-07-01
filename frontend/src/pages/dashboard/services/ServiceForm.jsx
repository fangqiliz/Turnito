import { useState } from 'react'
import Input from '../../../components/ui/Input'

export default function ServiceForm({ initialValues = null, onSubmit }) {
  const isEdit = initialValues !== null

  const [form, setForm] = useState({
    name:             initialValues?.name             ?? '',
    description:      initialValues?.description      ?? '',
    price:            initialValues?.price            != null ? String(initialValues.price) : '',
    duration_minutes: initialValues?.duration_minutes != null ? String(initialValues.duration_minutes) : '',
    is_active:        initialValues?.is_active        ?? true,
  })

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      name:             form.name.trim(),
      description:      form.description.trim() || null,
      price:            parseFloat(form.price)            || 0,
      duration_minutes: parseInt(form.duration_minutes, 10) || 30,
      ...(isEdit && { is_active: form.is_active }),
    })
  }

  return (
    <form
      id="service-form"
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
    >
      <Input
        label="Nombre *"
        name="name"
        value={form.name}
        onChange={set('name')}
        required
        placeholder="Ej: Corte Clásico"
      />

      <Input
        label="Descripción"
        name="description"
        value={form.description}
        onChange={set('description')}
        placeholder="Descripción breve del servicio"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <Input
          label="Precio (RD$) *"
          name="price"
          type="number"
          min="0"
          step="0.01"
          value={form.price}
          onChange={set('price')}
          required
          placeholder="0.00"
        />
        <Input
          label="Duración (min) *"
          name="duration_minutes"
          type="number"
          min="1"
          value={form.duration_minutes}
          onChange={set('duration_minutes')}
          required
          placeholder="30"
        />
      </div>

      {isEdit && (
        <label
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        'var(--space-2)',
            fontSize:   'var(--font-size-sm)',
            color:      'var(--color-text-secondary)',
            cursor:     'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
            style={{ width: 16, height: 16, accentColor: 'var(--color-accent)', cursor: 'pointer' }}
          />
          Servicio activo
        </label>
      )}
    </form>
  )
}
