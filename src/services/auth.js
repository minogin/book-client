import api from '@/services/api'
import store from '@/services/store'

export default {
  async login(username, password) {
    const formData =
      `username=${encodeURIComponent(username)}` +
      `&password=${encodeURIComponent(password)}`
    const token = await api.post('/auth/login', formData)
    api.setAuthToken(token)
    store.dispatch('setAuthenticated')
  }
}
