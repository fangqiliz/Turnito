import api from '../config/api'

function extractList(res) {
  const list = res?.data?.data ?? res?.data?.appointments ?? res?.data ?? []
  return Array.isArray(list) ? list : []
}

const appointmentsService = {
  async getByBusiness(businessId, { status = 'all', date = '', employeeId = '', page = 1, limit = 50 } = {}) {
    let url = `/appointments/business/${businessId}?limit=${limit}&page=${page}`
    if (status && status !== 'all') url += `&status=${status}`
    if (date) url += `&date=${date}`
    if (employeeId) url += `&employee_id=${employeeId}`
    const res = await api.get(url)
    return extractList(res)
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
