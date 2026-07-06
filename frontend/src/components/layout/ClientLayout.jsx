import { useState, useRef, useEffect } from 'react'
import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Calendar, CalendarDays, ClipboardList, Store, ChevronDown, LogOut, LayoutDashboard, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useUserRole } from '../../hooks/useUserRole'
import Avatar from '../ui/Avatar'
import NotificationCenter from '../notifications/NotificationCenter'
import IsotipoTurnito from '../../assets/IsotipoTurnito.png'
import styles from './ClientLayout.module.css'

export default function ClientLayout() {
  const { profile, logout } = useAuth()
  const { isAdmin, isEmployee } = useUserRole()
  const navigate = useNavigate()
  const location = useLocation()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef(null)

  const profilePath = location.pathname.startsWith('/employee')
    ? '/employee/profile'
    : '/client/profile'

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false)
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
    <div className={styles.layout}>
      <header className={styles.navbar}>
        {/* Logo */}
        <Link to="/client/appointments" className={styles.logo}>
          <img 
            src={IsotipoTurnito} 
            alt="Turnito" 
            className={styles.logoIcon}
            style={{ width: 40, height: 40, objectFit: 'contain' }}
          />
          <span className={styles.logoText}>Turnito</span>
        </Link>

        {/* Nav links */}
        <nav className={styles.nav}>
          {isEmployee && (
            <NavLink
              to="/employee"
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
            >
              <ClipboardList size={16} />
              Mi Agenda
            </NavLink>
          )}
          <NavLink
            to="/client/businesses"
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
          >
            <Store size={16} />
            Reservar
          </NavLink>
          <NavLink
            to="/client/appointments"
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
          >
            <CalendarDays size={16} />
            Mis Citas
          </NavLink>
        </nav>

        {/* Right: dashboard shortcut (only for admins) + notifications + user menu */}
        <div className={styles.right}>
          {isAdmin && (
            <Link to="/dashboard" className={styles.dashboardLink}>
              <LayoutDashboard size={14} />
              Panel de negocio
            </Link>
          )}

          <NotificationCenter />

          <div className={styles.userMenu} ref={menuRef}>
            <button
              className={styles.userBtn}
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <Avatar name={profile?.full_name} url={profile?.avatar_url} size="sm" />
              <span className={styles.userName}>{profile?.full_name || 'Usuario'}</span>
              <ChevronDown size={14} />
            </button>

            {showUserMenu && (
              <div className={styles.dropdown}>
                <button
                  className={styles.dropdownItem}
                  onClick={() => { navigate(profilePath); setShowUserMenu(false) }}
                >
                  <User size={14} />
                  Mi Perfil
                </button>
                <div className={styles.divider} />
                <button
                  className={`${styles.dropdownItem} ${styles.dangerItem}`}
                  onClick={handleLogout}
                >
                  <LogOut size={14} />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  )
}
