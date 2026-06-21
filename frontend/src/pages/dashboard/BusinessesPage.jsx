import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Plus } from 'lucide-react'
import { useBusiness } from '../../context/BusinessContext'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import styles from './DashboardPages.module.css'

export default function BusinessesPage() {
  const navigate = useNavigate()
  const { ownedBusinesses, loading, switchBusiness } = useBusiness()

  if (loading) return <Spinner fullPage size="lg" />

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Negocios</h1>
          <p className={styles.pageSubtitle}>Administra tus negocios registrados</p>
        </div>
        <Button icon={Plus} onClick={() => navigate('/dashboard/businesses/create')}>
          Nuevo Negocio
        </Button>
      </div>

      {ownedBusinesses.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Sin negocios"
          description="Crea tu primer negocio para comenzar a gestionar citas, empleados y servicios."
          actionLabel="Crear Negocio"
          onAction={() => navigate('/dashboard/businesses/create')}
        />
      ) : (
        <div className={styles.dataGrid}>
          {ownedBusinesses.map((biz, i) => (
            <div
              key={biz.id}
              className={styles.itemCard}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className={styles.itemHeader}>
                <div className={styles.businessCardHeader}>
                  {biz.logo_url ? (
                    <img
                      src={biz.logo_url}
                      alt={`Logo de ${biz.name}`}
                      className={styles.businessLogo}
                    />
                  ) : (
                    <div className={styles.businessLogoPlaceholder}>
                      <Building2 size={20} />
                    </div>
                  )}
                  <div>
                    <div className={styles.itemTitle}>{biz.name}</div>
                    <div className={styles.itemMeta}>/{biz.slug}</div>
                  </div>
                </div>
              </div>
              {biz.created_at && (
                <div className={styles.itemMeta}>
                  Creado el {new Date(biz.created_at).toLocaleDateString('es-ES')}
                </div>
              )}
              <div className={styles.itemActions}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    switchBusiness(biz)
                    navigate('/dashboard')
                  }}
                >
                  Ir al panel
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    switchBusiness(biz)
                    navigate('/dashboard/settings')
                  }}
                >
                  Configurar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
