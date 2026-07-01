import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { useBusiness } from '../../context/BusinessContext'
import { useUserRole } from '../../hooks/useUserRole'
import api from '../../config/api'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import toast from 'react-hot-toast'
import ServicesList from './services/ServicesList'
import ServiceForm from './services/ServiceForm'
import ServiceDetails from './services/ServiceDetails'
import styles from './DashboardPages.module.css'

export default function ServicesPage() {
  const { activeBusiness } = useBusiness()
  const { isAdmin } = useUserRole()

  const [services, setServices]           = useState([])
  const [loading, setLoading]             = useState(true)
  const [selectedService, setSelected]    = useState(null)
  const [editingService, setEditing]      = useState(null)
  const [showDetails, setShowDetails]     = useState(false)
  const [showForm, setShowForm]           = useState(false)
  const [formLoading, setFormLoading]     = useState(false)

  const fetchServices = useCallback(async () => {
    if (!activeBusiness) return
    setLoading(true)
    try {
      const res = await api.get(`/services/business/${activeBusiness.id}`)
      if (res.success) setServices(res.data || [])
    } catch {
      toast.error('Error al cargar servicios')
    } finally {
      setLoading(false)
    }
  }, [activeBusiness])

  useEffect(() => { fetchServices() }, [fetchServices])

  const openCreate = () => {
    setEditing(null)
    setShowForm(true)
  }

  const openEdit = (svc) => {
    setEditing(svc)
    setShowDetails(false)
    setShowForm(true)
  }

  const openDetails = (svc) => {
    setSelected(svc)
    setShowDetails(true)
  }

  const handleFormSubmit = async (formData) => {
    if (!formData.name) { toast.error('El nombre es requerido'); return }
    setFormLoading(true)
    try {
      if (editingService) {
        await api.put(`/services/${editingService.id}?businessId=${activeBusiness.id}`, formData)
        toast.success('Servicio actualizado')
      } else {
        await api.post('/services', { ...formData, business_id: activeBusiness.id })
        toast.success('Servicio creado')
      }
      setShowForm(false)
      fetchServices()
    } catch (err) {
      toast.error(err.message || 'Error al guardar')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (svc) => {
    if (!confirm(`¿Eliminar "${svc.name}"?`)) return
    try {
      await api.delete(`/services/${svc.id}?businessId=${activeBusiness.id}`)
      toast.success('Servicio eliminado')
      setShowDetails(false)
      fetchServices()
    } catch (err) {
      toast.error(err.message || 'Error al eliminar')
    }
  }

  if (!activeBusiness) return <EmptyState title="Selecciona un negocio" />
  if (loading) return <Spinner fullPage size="lg" />

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Servicios</h1>
          <p className={styles.pageSubtitle}>Servicios que ofrece {activeBusiness.name}</p>
        </div>
        {isAdmin && (
          <Button icon={Plus} onClick={openCreate}>Nuevo Servicio</Button>
        )}
      </div>

      <ServicesList
        services={services}
        isAdmin={isAdmin}
        onView={openDetails}
        onEdit={openEdit}
        onDelete={handleDelete}
        onCreateFirst={openCreate}
      />

      {/* Modal: detalle del servicio */}
      <Modal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title="Detalle del servicio"
      >
        <ServiceDetails
          service={selectedService}
          isAdmin={isAdmin}
          onEdit={() => openEdit(selectedService)}
          onDelete={() => handleDelete(selectedService)}
        />
      </Modal>

      {/* Modal: crear / editar servicio */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button type="submit" form="service-form" loading={formLoading}>Guardar</Button>
          </>
        }
      >
        <ServiceForm
          key={editingService?.id ?? 'new'}
          initialValues={editingService}
          onSubmit={handleFormSubmit}
        />
      </Modal>
    </div>
  )
}
