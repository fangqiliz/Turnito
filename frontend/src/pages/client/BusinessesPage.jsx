import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarPlus, Store, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../../config/api'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import toast from 'react-hot-toast'
import styles from '../dashboard/DashboardPages.module.css'

const PAGE_LIMIT = 20

export default function BusinessesPage() {
  const navigate = useNavigate()
  const [businesses, setBusinesses] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        // GET /businesses ahora devuelve { data, total, page, limit } (paginado)
        const res = await api.get(`/businesses?page=${page}&limit=${PAGE_LIMIT}`)
        if (res.success) {
          setBusinesses(res.data?.data || [])
          setTotal(res.data?.total ?? 0)
        }
      } catch { toast.error('Error al cargar negocios') }
      finally { setLoading(false) }
    }
    load()
  }, [page])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT))

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

      {totalPages > 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 'var(--space-4)', marginTop: 'var(--space-6)',
        }}>
          <Button
            variant="secondary"
            size="sm"
            icon={ChevronLeft}
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
            Página {page} de {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            icon={ChevronRight}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  )
}
