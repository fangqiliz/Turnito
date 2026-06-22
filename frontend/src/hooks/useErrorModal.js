import { useState, useCallback } from 'react'

/**
 * Hook personalizado para manejar errores con un modal emergente
 * @param {number} [defaultDuration=5000] - Duración en ms antes de auto-cerrar el error
 * @returns {object} { errorMessage, showError, closeError, ErrorModal }
 */
export function useErrorModal(defaultDuration = 5000) {
  const [errorMessage, setErrorMessage] = useState(null)

  const showError = useCallback((message) => {
    // Extraer mensaje de error si es un objeto
    if (typeof message === 'object') {
      if (message.response?.data?.message) {
        setErrorMessage(message.response.data.message)
      } else if (message.message) {
        setErrorMessage(message.message)
      } else {
        setErrorMessage('Ocurrió un error inesperado. Intenta nuevamente.')
      }
    } else if (typeof message === 'string') {
      setErrorMessage(message)
    }
  }, [])

  const closeError = useCallback(() => {
    setErrorMessage(null)
  }, [])

  return {
    errorMessage,
    showError,
    closeError,
    duration: defaultDuration,
  }
}
