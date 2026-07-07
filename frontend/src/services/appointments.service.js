import api from '../config/api'

function extractList(res) {
  const list = res?.data?.data ?? res?.data?.appointments ?? res?.data ?? []
  return Array.isArray(list) ? list : []
}

// El backend limita `limit` a un máximo de 100 por página.
const MAX_LIMIT = 100

function buildBusinessUrl(businessId, { status = 'all', date = '', employeeId = '', page = 1, limit = 50 }) {
  let url = `/appointments/business/${businessId}?limit=${limit}&page=${page}`
  if (status && status !== 'all') url += `&status=${status}`
  if (date) url += `&date=${date}`
  if (employeeId) url += `&employee_id=${employeeId}`
  return url
}

const appointmentsService = {
  async getByBusiness(businessId, { status = 'all', date = '', employeeId = '', page = 1, limit = MAX_LIMIT } = {}) {
    const res = await api.get(buildBusinessUrl(businessId, { status, date, employeeId, page, limit }))
    return extractList(res)
  },

  /**
   * Trae TODAS las citas del negocio recorriendo la paginación del backend.
   * Útil para el panel principal y la exportación, donde necesitamos el histórico
   * completo y no solo la primera página.
   */
  async getAllByBusiness(businessId, { status = 'all', date = '', employeeId = '' } = {}) {
    const filters = { status, date, employeeId, limit: MAX_LIMIT }

    // Primera página: nos da los datos + el total para calcular cuántas faltan.
    const firstRes = await api.get(buildBusinessUrl(businessId, { ...filters, page: 1 }))
    let all = extractList(firstRes)
    const total = Number(firstRes?.data?.total ?? all.length)

    const totalPages = Math.min(Math.ceil(total / MAX_LIMIT), 50) // tope de seguridad: 5000 citas
    if (totalPages > 1) {
      const restResponses = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) =>
          api.get(buildBusinessUrl(businessId, { ...filters, page: i + 2 }))
        )
      )
      for (const res of restResponses) all = all.concat(extractList(res))
    }

    return all
  },

  async getByUser({ status = '', page = 1, limit = 50 } = {}) {
    let url = `/appointments/user?limit=${limit}&page=${page}`
    if (status) url += `&status=${status}`
    const res = await api.get(url)
    return extractList(res)
  },

  async create(body) {
    const res = await api.post('/appointments', body)
    return res.data
  },

  async updateStatus(appointmentId, businessId, status) {
    const res = await api.put(
      `/appointments/${appointmentId}/status?businessId=${businessId}`,
      { status }
    )
    return res.data
  },

  async cancel(appointmentId, businessId) {
    const res = await api.delete(`/appointments/${appointmentId}?businessId=${businessId}`)
    return res.data
  },
}

export default appointmentsService
