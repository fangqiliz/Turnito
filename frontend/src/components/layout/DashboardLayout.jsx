import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import styles from './DashboardLayout.module.css'

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={styles.layout}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div
        className={styles.main}
        style={{ marginLeft: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)' }}
      >
        <TopBar onMenuToggle={() => setCollapsed(!collapsed)} />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
