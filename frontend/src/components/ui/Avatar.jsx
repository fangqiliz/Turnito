import styles from './Avatar.module.css'

export default function Avatar({ name, url, size = 'md', className = '' }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  if (url) {
    return (
      <div className={`${styles.avatar} ${styles[size]} ${className}`}>
        <img src={url} alt={name || 'Avatar'} className={styles.img} />
      </div>
    )
  }

  return (
    <div className={`${styles.avatar} ${styles.initials} ${styles[size]} ${className}`}>
      {initials}
    </div>
  )
}
