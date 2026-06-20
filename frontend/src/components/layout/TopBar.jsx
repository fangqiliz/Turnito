import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Bell, ChevronDown, LogOut, User, Building2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useBusiness } from '../../context/BusinessContext'
import Avatar from '../ui/Avatar'
import styles from './TopBar.module.css'

export default function TopBar({ onMenuToggle }) {
  const { profile, logout } = useAuth()
  const { activeBusiness, ownedBusinesses, switchBusiness } = useBusiness()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showBusinessMenu, setShowBusinessMenu] = useState(false)
  const userMenuRef = useRef(null)
  const businessMenuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false)
      }
      if (businessMenuRef.current && !businessMenuRef.current.contains(e.target)) {
        setShowBusinessMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onMenuToggle} aria-label="Menú">
          <Menu size={20} />
        </button>

        {/* Business Selector */}
        {ownedBusinesses.length > 0 && (
          <div className={styles.businessSelector} ref={businessMenuRef}>
            <button
              className={styles.businessBtn}
              onClick={() => setShowBusinessMenu(!showBusinessMenu)}
            >
              <Building2 size={16} />
              <span className={styles.businessName}>
                {activeBusiness?.name || 'Seleccionar negocio'}
              </span>
              <ChevronDown size={14} />
            </button>

            {showBusinessMenu && ownedBusinesses.length > 1 && (
              <div className={styles.dropdown}>
                {ownedBusinesses.map(biz => (
                  <button
                    key={biz.id}
                    className={`${styles.dropdownItem} ${biz.id === activeBusiness?.id ? styles.activeItem : ''}`}
                    onClick={() => { switchBusiness(biz); setShowBusinessMenu(false) }}
                  >
                    <Building2 size={14} />
                    {biz.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.right}>
        <button className={styles.iconBtn} aria-label="Notificaciones">
          <Bell size={20} />
        </button>

        {/* User Menu */}
        <div className={styles.userMenu} ref={userMenuRef}>
          <button
            className={styles.userBtn}
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <Avatar
              name={profile?.full_name}
              url={profile?.avatar_url}
              size="sm"
            />
            <span className={styles.userName}>{profile?.full_name || 'Usuario'}</span>
            <ChevronDown size={14} />
          </button>

          {showUserMenu && (
            <div className={styles.dropdown}>
              <button
                className={styles.dropdownItem}
                onClick={() => { navigate('/dashboard/profile'); setShowUserMenu(false) }}
              >
                <User size={14} />
                Mi Perfil
              </button>
              <div className={styles.divider} />
              <button className={`${styles.dropdownItem} ${styles.dangerItem}`} onClick={handleLogout}>
                <LogOut size={14} />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
