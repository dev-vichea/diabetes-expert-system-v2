import axios from 'axios'

export const ACCESS_TOKEN_KEY = 'access_token'
export const REFRESH_TOKEN_KEY = 'refresh_token'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api',
  timeout: 10000,
})

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem('token')
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setAuthTokens(accessToken, refreshToken) {
  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    localStorage.removeItem('token')
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }
}

export function clearAuthStorage() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise = null

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config
    const status = error?.response?.status

    if (!originalRequest || status !== 401) {
      return Promise.reject(error)
    }

    const requestUrl = originalRequest.url || ''
    const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/refresh')
    if (originalRequest._retry || isAuthEndpoint) {
      return Promise.reject(error)
    }

    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      clearAuthStorage()
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      if (!refreshPromise) {
        refreshPromise = axios.post(`${api.defaults.baseURL}/auth/refresh`, { refresh_token: refreshToken })
      }

      const refreshResponse = await refreshPromise
      const refreshData = getApiData(refreshResponse)
      setAuthTokens(refreshData.access_token, refreshData.refresh_token)
      if (refreshData.user) {
        localStorage.setItem('user', JSON.stringify(refreshData.user))
      }

      const accessToken = getAccessToken()
      if (accessToken) {
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
      }

      return api(originalRequest)
    } catch (refreshError) {
      clearAuthStorage()
      return Promise.reject(refreshError)
    } finally {
      refreshPromise = null
    }
  },
)

export function getApiData(response) {
  if (!response || !response.data) {
    return null
  }

  if (typeof response.data.success === 'boolean') {
    return response.data.data
  }

  return response.data
}

export function getApiErrorMessage(error, fallbackMessage = 'Request failed') {
  const serverMessage = error?.response?.data?.error?.message
  const legacyMessage = error?.response?.data?.error
  if (serverMessage) return serverMessage
  if (legacyMessage) return legacyMessage
  return fallbackMessage
}

export default api
