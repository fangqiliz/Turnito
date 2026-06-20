import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import api from '../config/api'

const BusinessContext = createContext(null)

export function BusinessProvider({ children }) {
  const { isAuthenticated, profile } = useAuth()
  const [activeBusiness, setActiveBusiness] = useState(null)
  const [ownedBusinesses, setOwnedBusinesses] = useState([])
  const [employeeRoles, setEmployeeRoles] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchBusinessData = useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    try {
      const response = await api.get('/users/me')
      if (response.success && response.data.roles) {
        const owned = response.data.roles.ownedBusinesses || []
        const empRoles = response.data.roles.employeeRoles || []
        setOwnedBusinesses(owned)
        setEmployeeRoles(empRoles)

        // Auto-seleccionar el primer negocio si no hay uno activo
        if (!activeBusiness && owned.length > 0) {
          setActiveBusiness(owned[0])
        }
      }
    } catch (error) {
      console.error('Error al cargar datos de negocio:', error)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, activeBusiness])

  useEffect(() => {
    if (isAuthenticated) {
      fetchBusinessData()
    } else {
      setActiveBusiness(null)
      setOwnedBusinesses([])
      setEmployeeRoles([])
    }
  }, [isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

  const switchBusiness = (business) => {
    setActiveBusiness(business)
  }

  const isOwner = activeBusiness?.owner_id === profile?.id

  const value = {
    activeBusiness,
    ownedBusinesses,
    employeeRoles,
    loading,
    isOwner,
    switchBusiness,
    refreshBusinessData: fetchBusinessData,
    hasBusinesses: ownedBusinesses.length > 0 || employeeRoles.length > 0,
  }

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  )
}

export function useBusiness() {
  const context = useContext(BusinessContext)
  if (!context) {
    throw new Error('useBusiness debe usarse dentro de un BusinessProvider')
  }
  return context
}

export default BusinessContext
