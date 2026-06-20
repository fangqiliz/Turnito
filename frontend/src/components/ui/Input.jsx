import { useState } from 'react'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import styles from './Input.module.css'

export default function Input({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  icon: Icon,
  required = false,
  disabled = false,
  className = '',
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

  return (
    <div className={`${styles.inputGroup} ${className}`}>
      {label && (
        <label htmlFor={name} className={styles.label}>
          {label}
          {required && <span style={{ color: 'var(--color-danger)', marginLeft: '2px' }}>*</span>}
        </label>
      )}
      <div className={styles.inputWrapper}>
        {Icon && <Icon size={18} className={styles.iconLeft} />}
        <input
          id={name}
          name={name}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className={`${styles.input} ${error ? styles.hasError : ''} ${Icon ? styles.hasIcon : ''}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className={styles.togglePassword}
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <span className={styles.errorMessage}>
          <AlertCircle size={12} />
          {error}
        </span>
      )}
    </div>
  )
}
