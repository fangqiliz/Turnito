import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, CalendarDays, Users, Scissors,
  Clock, Settings, ChevronLeft, ChevronRight, Calendar, Building2
} from 'lucide-react'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Inicio', end: true },
  { to: '/dashboard/businesses', icon: Building2, label: 'Negocios' },
  { to: '/dashboard/appointments', icon: CalendarDays, label: 'Citas' },
  { to: '/dashboard/employees', icon: Users, label: 'Empleados' },
  { to: '/dashboard/services', icon: Scissors, label: 'Servicios' },
  { to: '/dashboard/schedules', icon: Clock, label: 'Horarios' },
  { to: '/dashboard/settings', icon: Settings, label: 'Configuración' },
]

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation()

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <Calendar size={28} className={styles.logoIcon} />
          {!collapsed && <span className={styles.logoText}>Turnito</span>}
        </div>
        <button
          className={styles.toggleBtn}
          onClick={onToggle}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={20} className={styles.navIcon} />
            {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
            {!collapsed && (
              <NavLink to={item.to} end={item.end}>
                {({ isActive }) => isActive && <div className={styles.activeIndicator} />}
              </NavLink>
            )}
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        <NavLink
          to="/my-appointments"
          className={({ isActive }) =>
            `${styles.navItem} ${isActive ? styles.active : ''}`
          }
          title={collapsed ? 'Mis Citas' : undefined}
        >
          <CalendarDays size={20} className={styles.navIcon} />
          {!collapsed && <span className={styles.navLabel}>Mis Citas</span>}
        </NavLink>
      </div>
    </aside>
  )
}
