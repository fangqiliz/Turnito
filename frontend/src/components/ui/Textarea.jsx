import { AlertCircle } from 'lucide-react'
import styles from './Textarea.module.css'

export default function Textarea({
  label,
  name,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  disabled = false,
  rows = 4,
  className = '',
  ...props
}) {
  return (
    <div className={`${styles.textareaGroup} ${className}`}>
      {label && (
        <label htmlFor={name} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        rows={rows}
        className={`${styles.textarea} ${error ? styles.hasError : ''}`}
        {...props}
      />
      {error && (
        <span className={styles.errorMessage}>
          <AlertCircle size={12} />
          {error}
        </span>
      )}
    </div>
  )
}
