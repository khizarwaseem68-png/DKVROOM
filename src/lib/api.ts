// DK Vroom API Client - All backend communication goes through this layer
const API_BASE = '/api'

// Token management
let authToken: string | null = null

export function setToken(token: string | null) {
  authToken = token
  if (token) {
    localStorage.setItem('dkvroom_token', token)
  } else {
    localStorage.removeItem('dkvroom_token')
  }
}

export function getToken(): string | null {
  if (authToken) return authToken
  if (typeof window !== 'undefined') {
    authToken = localStorage.getItem('dkvroom_token')
  }
  return authToken
}

export function clearToken() {
  authToken = null
  if (typeof window !== 'undefined') {
    localStorage.removeItem('dkvroom_token')
  }
}

// Generic fetch wrapper with auth
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong')
  }

  return data
}

// File upload (multipart)
async function apiUpload(endpoint: string, file: File) {
  const token = getToken()
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Upload failed')
  return data
}

// ========================
// AUTH API
// ========================
export const authApi = {
  login: async (email: string, password: string) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    if (data.token) setToken(data.token)
    return data
  },

  register: async (userData: any) => {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
    if (data.token) setToken(data.token)
    return data
  },

  me: async () => {
    return apiFetch('/auth/me')
  },

  logout: () => {
    clearToken()
  },
}

// ========================
// CARS API
// ========================
export const carsApi = {
  list: async (params: Record<string, string | number | boolean> = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value))
      }
    })
    return apiFetch(`/cars?${searchParams.toString()}`)
  },

  get: async (id: string) => {
    return apiFetch(`/cars/${id}`)
  },

  create: async (carData: any) => {
    return apiFetch('/cars', {
      method: 'POST',
      body: JSON.stringify(carData),
    })
  },

  update: async (id: string, carData: any) => {
    return apiFetch(`/cars/${id}`, {
      method: 'PUT',
      body: JSON.stringify(carData),
    })
  },

  delete: async (id: string) => {
    return apiFetch(`/cars/${id}`, {
      method: 'DELETE',
    })
  },
}

// ========================
// BOOKINGS API
// ========================
export const bookingsApi = {
  list: async (params: Record<string, string> = {}) => {
    const searchParams = new URLSearchParams(params)
    return apiFetch(`/bookings?${searchParams.toString()}`)
  },

  get: async (id: string) => {
    return apiFetch(`/bookings/${id}`)
  },

  create: async (bookingData: any) => {
    return apiFetch('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    })
  },

  update: async (id: string, data: any) => {
    return apiFetch(`/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
}

// ========================
// PAYMENTS API
// ========================
export const paymentsApi = {
  list: async (params: Record<string, string> = {}) => {
    const searchParams = new URLSearchParams(params)
    return apiFetch(`/payments?${searchParams.toString()}`)
  },

  get: async (id: string) => {
    return apiFetch(`/payments/${id}`)
  },

  uploadReceipt: async (id: string, file: File) => {
    const uploadResult = await apiUpload('/upload', file)
    return apiFetch(`/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        receiptUrl: uploadResult.url,
        status: 'uploaded',
      }),
    })
  },

  verify: async (id: string) => {
    return apiFetch(`/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'verified' }),
    })
  },

  reject: async (id: string, reason: string) => {
    return apiFetch(`/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'rejected', rejectionReason: reason }),
    })
  },
}

// ========================
// CONTINUE LOAN API
// ========================
export const continueLoanApi = {
  list: async (params: Record<string, string> = {}) => {
    const searchParams = new URLSearchParams(params)
    return apiFetch(`/continue-loan?${searchParams.toString()}`)
  },

  get: async (id: string) => {
    return apiFetch(`/continue-loan/${id}`)
  },

  create: async (data: any) => {
    return apiFetch('/continue-loan', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id: string, data: any) => {
    return apiFetch(`/continue-loan/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
}

// ========================
// LOANS API
// ========================
export const loansApi = {
  list: async (params: Record<string, string> = {}) => {
    const searchParams = new URLSearchParams(params)
    return apiFetch(`/loans?${searchParams.toString()}`)
  },

  get: async (id: string) => {
    return apiFetch(`/loans/${id}`)
  },

  create: async (data: any) => {
    return apiFetch('/loans', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id: string, data: any) => {
    return apiFetch(`/loans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
}

// ========================
// AUCTIONS API
// ========================
export const auctionsApi = {
  list: async (params: Record<string, string> = {}) => {
    const searchParams = new URLSearchParams(params)
    return apiFetch(`/auctions?${searchParams.toString()}`)
  },

  placeBid: async (data: { carId: string; amount: number }) => {
    return apiFetch('/auctions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}

// ========================
// WORKSHOPS API
// ========================
export const workshopsApi = {
  list: async (params: Record<string, string> = {}) => {
    const searchParams = new URLSearchParams(params)
    return apiFetch(`/workshops?${searchParams.toString()}`)
  },

  createAppointment: async (data: any) => {
    return apiFetch('/workshops', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}

// ========================
// INSURANCE API
// ========================
export const insuranceApi = {
  list: async (params: Record<string, string> = {}) => {
    const searchParams = new URLSearchParams(params)
    return apiFetch(`/insurance?${searchParams.toString()}`)
  },

  createEnquiry: async (data: any) => {
    return apiFetch('/insurance', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}

// ========================
// DEALER API
// ========================
export const dealerApi = {
  getCars: async (params: Record<string, string> = {}) => {
    const searchParams = new URLSearchParams(params)
    return apiFetch(`/dealer/cars?${searchParams.toString()}`)
  },

  getBookings: async (params: Record<string, string> = {}) => {
    const searchParams = new URLSearchParams(params)
    return apiFetch(`/dealer/bookings?${searchParams.toString()}`)
  },

  getStats: async () => {
    return apiFetch('/dealer/stats')
  },
}

// ========================
// ADMIN API
// ========================
export const adminApi = {
  getStats: async () => {
    return apiFetch('/admin/stats')
  },

  getDealers: async (params: Record<string, string> = {}) => {
    const searchParams = new URLSearchParams(params)
    return apiFetch(`/admin/dealers?${searchParams.toString()}`)
  },

  verifyDealer: async (id: string, action: 'verify' | 'reject', reason?: string) => {
    return apiFetch('/admin/dealers', {
      method: 'PUT',
      body: JSON.stringify({ dealerId: id, action, reason }),
    })
  },

  getCars: async (params: Record<string, string> = {}) => {
    const searchParams = new URLSearchParams(params)
    return apiFetch(`/admin/cars?${searchParams.toString()}`)
  },

  approveCar: async (id: string, action: 'approve' | 'reject', reason?: string) => {
    return apiFetch('/admin/cars', {
      method: 'PUT',
      body: JSON.stringify({ carId: id, action, reason }),
    })
  },

  getPayments: async (params: Record<string, string> = {}) => {
    const searchParams = new URLSearchParams(params)
    return apiFetch(`/admin/payments?${searchParams.toString()}`)
  },

  verifyPayment: async (id: string, action: 'verify' | 'reject', reason?: string) => {
    return apiFetch('/admin/payments', {
      method: 'PUT',
      body: JSON.stringify({ paymentId: id, action, reason }),
    })
  },
}

// ========================
// NOTIFICATIONS API
// ========================
export const notificationsApi = {
  list: async () => {
    return apiFetch('/notifications')
  },

  markRead: async (id?: string) => {
    return apiFetch('/notifications', {
      method: 'PUT',
      body: JSON.stringify(id ? { notificationId: id } : { markAll: true }),
    })
  },
}

// ========================
// UPLOAD API
// ========================
export const uploadApi = {
  upload: async (file: File) => {
    return apiUpload('/upload', file)
  },
}
