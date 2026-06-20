import { useState, useCallback } from 'react'

/**
 * Hook para manejar formularios controlados con validación.
 * @param {object} initialValues - Valores iniciales del formulario
 * @param {function} onSubmit - Función a ejecutar al enviar (recibe values)
 * @param {function} validate - Función de validación (recibe values, retorna errors object)
 */
export function useForm(initialValues = {}, onSubmit, validate) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target
    setValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    // Limpiar error al cambiar
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }, [errors])

  const handleBlur = useCallback((e) => {
    const { name } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
  }, [])

  const setValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }))
  }, [])

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault()

    // Marcar todos como touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {})
    setTouched(allTouched)

    // Validar
    if (validate) {
      const validationErrors = validate(values)
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        return
      }
    }

    setLoading(true)
    try {
      await onSubmit(values)
    } catch (error) {
      if (error.errors) {
        const fieldErrors = {}
        error.errors.forEach(err => {
          if (err.field) fieldErrors[err.field] = err.message
        })
        setErrors(fieldErrors)
      }
    } finally {
      setLoading(false)
    }
  }, [values, validate, onSubmit])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  const getFieldError = useCallback((name) => {
    return touched[name] ? errors[name] : undefined
  }, [touched, errors])

  return {
    values,
    errors,
    touched,
    loading,
    handleChange,
    handleBlur,
    handleSubmit,
    setValue,
    setValues,
    setErrors,
    reset,
    getFieldError,
    isValid: Object.keys(errors).length === 0,
  }
}

export default useForm
