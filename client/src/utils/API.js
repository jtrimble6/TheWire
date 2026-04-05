import axios from 'axios'

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  withCredentials: true
})

const API = {
  auth: {
    register: (data) => instance.post('/api/auth/register', data),
    login: (data) => instance.post('/api/auth/login', data),
    logout: () => instance.post('/api/auth/logout'),
    me: () => instance.get('/api/auth/me'),
    forgotPassword: (data) => instance.post('/api/auth/forgot-password', data),
    resetPassword: (token, data) => instance.post(`/api/auth/reset-password/${token}`, data)
  }
}

export default API
