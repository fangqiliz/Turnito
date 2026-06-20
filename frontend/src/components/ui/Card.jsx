import styles from './Card.module.css'

export default function Card({
  children,
  variant = 'default',
  hoverable = false,
  compact = false,
  className = '',
  ...props
}) {
  const classes = [
    styles.card,
    variant !== 'default' && styles[variant],
    hoverable && styles.hoverable,
    compact && styles.compact,
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ children, title, description, action }) {
  return (
    <div className={styles.cardHeader}>
      <div>
        {title && <h3 className={styles.cardTitle}>{title}</h3>}
        {description && <p className={styles.cardDescription}>{description}</p>}
        {children}
      </div>
      {action}
    </div>
  )
}
