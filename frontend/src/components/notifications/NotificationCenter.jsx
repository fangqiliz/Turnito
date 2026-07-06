import { useState } from 'react'
import { Bell, X, Check, Trash2 } from 'lucide-react'
import { useNotifications } from '../../hooks/useNotifications'
import styles from './NotificationCenter.module.css'

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markMultipleAsRead,
    deleteNotification,
    clearReadNotifications,
  } = useNotifications()

  const unreadNotifications = notifications.filter((n) => !n.is_read)

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id)
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Ahora'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`

    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'appointment_created':
      case 'appointment_confirmed':
        return '📅'
      case 'appointment_reminder_24h':
      case 'appointment_reminder_1h':
        return '⏰'
      case 'appointment_cancelled':
        return '❌'
      case 'appointment_assigned':
        return '👤'
      default:
        return '📢'
    }
  }

  return (
    <div className={styles.container}>
      {/* Botón campana */}
      <button
        className={styles.bellButton}
        onClick={() => setIsOpen(!isOpen)}
        title="Notificaciones"
      >
        <Bell size={20} />
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={styles.dropdown}>
          {/* Header */}
          <div className={styles.header}>
            <h3 className={styles.title}>Notificaciones</h3>
            <button
              className={styles.closeBtn}
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${styles.active}`}>
              Todas ({notifications.length})
            </button>
            <button className={styles.tab}>
              No leídas ({unreadNotifications.length})
            </button>
          </div>

          {/* Contenido */}
          <div className={styles.content}>
            {loading && (
              <div className={styles.empty}>
                <p>Cargando notificaciones...</p>
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className={styles.empty}>
                <p>No tienes notificaciones</p>
              </div>
            )}

            {!loading && notifications.length > 0 && (
              <ul className={styles.list}>
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={`${styles.item} ${!notification.is_read ? styles.unread : ''}`}
                  >
                    {/* Icono */}
                    <div className={styles.icon}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Contenido */}
                    <div
                      className={styles.content}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <p className={styles.notificationTitle}>{notification.title}</p>
                      <p className={styles.notificationMessage}>{notification.message}</p>
                      <time className={styles.time}>
                        {formatTime(notification.created_at)}
                      </time>
                    </div>

                    {/* Acciones */}
                    <div className={styles.actions}>
                      {!notification.is_read && (
                        <button
                          className={styles.iconBtn}
                          onClick={() => markAsRead(notification.id)}
                          title="Marcar como leído"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <button
                        className={styles.iconBtn}
                        onClick={() => deleteNotification(notification.id)}
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {!loading && notifications.length > 0 && (
            <div className={styles.footer}>
              <button
                className={styles.footerBtn}
                onClick={() => markMultipleAsRead(unreadNotifications.map((n) => n.id))}
              >
                Marcar todo como leído
              </button>
              <button className={styles.footerBtn} onClick={clearReadNotifications}>
                Limpiar leídas
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
