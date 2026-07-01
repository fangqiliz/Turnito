import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarPlus, Store } from 'lucide-react'
import api from '../../config/api'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import toast from 'react-hot-toast'
import styles from '../dashboard/DashboardPages.module.css'

export default function BusinessesPage() {
  const navigate = useNavigate()
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await api.get('/businesses')
        if (res.success) setBusinesses(res.data || [])
      } catch { toast.error('Error al cargar negocios') }
      finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return <Spinner fullPage size="lg" />

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: 'var(--space-6)' }}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Negocios disponibles</h1>
          <p className={styles.pageSubtitle}>Selecciona un negocio para reservar tu cita</p>
        </div>
      </div>

      {businesses.length === 0 ? (
        <EmptyState
          icon={Store}
          title="Sin negocios disponibles"
          description="Aún no hay negocios registrados en Turnito."
        />
      ) : (
        <div className={styles.dataGrid}>
          {businesses.map((biz, i) => (
            <div
              key={biz.id}
              className={styles.itemCard}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className={styles.itemHeader}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={styles.itemTitle}>{biz.name}</div>
                  {biz.description && (
                    <div className={styles.itemMeta} style={{ marginTop: 'var(--space-1)', display: 'block' }}>
                      {biz.description}
                    </div>
                  )}
                </div>
                {biz.logo_url ? (
                  <img
                    src={biz.logo_url}
                    alt={biz.name}
                    style={{
                      width: 48, height: 48, flexShrink: 0,
                      borderRadius: 'var(--radius-lg)',
                      objectFit: 'cover',
                      border: '1px solid var(--color-border)',
                    }}
                  />
                ) : (
                  <div style={{
                    width: 48, height: 48, flexShrink: 0,
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--color-accent-subtle)',
                    color: 'var(--color-accent-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Store size={20} />
                  </div>
                )}
              </div>

              <div className={styles.itemActions}>
                <Button
                  icon={CalendarPlus}
                  onClick={() => navigate(`/client/book/${biz.slug}`)}
                >
                  Reservar cita
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
