import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'
import Button from '../components/ui/Button'

export default function NotFoundPage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      textAlign: 'center',
      padding: 'var(--space-8)',
      animation: 'fadeInUp 500ms ease-out',
    }}>
      <div style={{
        fontSize: '8rem',
        fontWeight: 800,
        background: 'linear-gradient(135deg, var(--color-accent-light), #c084fc)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        lineHeight: 1,
        marginBottom: 'var(--space-4)',
      }}>
        404
      </div>
      <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-2)' }}>
        Página no encontrada
      </h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-8)', maxWidth: '400px' }}>
        La ruta que buscas no existe. Verifica la URL o regresa al inicio.
      </p>
      <Link to="/dashboard">
        <Button icon={Home}>Volver al Inicio</Button>
      </Link>
    </div>
  )
}
