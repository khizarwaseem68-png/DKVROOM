// DK Vroom API Client — Type-safe backend communication layer
const API_BASE = '/api'

// ===== TOKEN MANAGEMENT =====

const TOKEN_KEY = 'dkvroom_token'
const PROTECTED_CLIENT_ROUTES = ['/admin-dashboard', '/dealer-dashboard', '/dealer-status', '/customer-dashboard']

let authToken: string | null = null

function isProtectedClientRoute(pathname: string): boolean {
  return PROTECTED_CLIENT_ROUTES.some((route) => pathname.startsWith(route))
}

function shouldRedirectOnUnauthorized(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean(getToken()) || isProtectedClientRoute(window.location.pathname)
}

function notifyUnauthorized(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('auth:expired'))
}

export function setToken(token: string | null): void {
  authToken = token
  if (typeof window === 'undefined') return
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export function getToken(): string | null {
  if (authToken) return authToken
  if (typeof window !== 'undefined') {
    authToken = localStorage.getItem(TOKEN_KEY)
  }
  return authToken
}

export function clearToken(): void {
  authToken = null
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY)
  }
}

// ===== API TYPES =====

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface LoginResponse {
  success: boolean
  token: string
  user: {
    id: string
    email: string
    name: string
    phone: string | null
    whatsapp: string | null
    role: 'customer' | 'dealer' | 'admin'
    verified: boolean
    avatar: string | null
    dealer?: {
      id: string
      companyName: string
      verified: boolean
      rejectedAt?: string | null
      rejectionReason?: string | null
      rating: number
      [key: string]: unknown
    } | null
  }
}

export interface CarData {
  id: string
  brand: string
  model: string
  year: number
  color: string | null
  mileage: number | null
  fuelType: string | null
  transmission: string | null
  seats: number | null
  condition: string | null
  price: number
  weeklyPrice: number | null
  monthlyPrice: number | null
  deposit: number | null
  bookingFee: number | null
  monthlyInstallment: number | null
  remainingMonths: number | null
  remainingBalance: number | null
  takeoverAmount: number | null
  bankName: string | null
  vehicleCondition: string | null
  requiredDocs: string | null
  auctionStartBid: number | null
  auctionReserve: number | null
  currentBid: number | null
  auctionEnd: string | null
  auctionActive: boolean
  conditionCategory: string | null
  damageDescription: string | null
  runningStatus: string | null
  salvageStatus: string | null
  repairEstimate: number | null
  rentalTerms: string | null
  pickupAvailable: boolean
  deliveryAvailable: boolean
  deliveryFee: number | null
  availableFrom: string | null
  availableTo: string | null
  location: string | null
  city: string | null
  state: string | null
  description: string | null
  features: string | null
  photos: string | null
  videoUrl: string | null
  featured: boolean
  status: string
  views: number
  enquiries: number
  type: 'rent' | 'sale' | 'auction' | 'continueLoan'
  dealerId: string
  dealer?: {
    id: string
    companyName: string
    city: string | null
    verified: boolean
    rating: number
    totalListings: number
    [key: string]: unknown
  }
  dealerUser?: {
    id: string
    name: string
    [key: string]: unknown
  }
  _count?: {
    auctionBids: number
    reviews: number
    [key: string]: number
  }
  [key: string]: unknown
}

// ===== GENERIC FETCH WRAPPER =====

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function apiFetch<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {}

  // Only set Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  Object.assign(headers, options.headers as Record<string, string> || {})

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  const data = await response.json()

  if (!response.ok) {
    if (response.status === 401) {
      const shouldRedirect = shouldRedirectOnUnauthorized()
      clearToken()
      if (shouldRedirect) notifyUnauthorized()
    }
    throw new ApiError(data.error || 'Something went wrong', response.status)
  }

  return data as T
}

function buildFormData(data: Record<string, unknown>, fileMap?: Record<string, File | File[] | null | undefined>): FormData {
  const formData = new FormData()
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value))
    }
  }
  if (fileMap) {
    for (const [key, file] of Object.entries(fileMap)) {
      if (file instanceof File) {
        formData.append(key, file)
      } else if (Array.isArray(file)) {
        for (const f of file) {
          formData.append(key, f)
        }
      }
    }
  }
  return formData
}

async function apiUpload<T = unknown>(endpoint: string, file: File, category?: string): Promise<T> {
  const token = getToken()
  const formData = new FormData()
  formData.append('file', file)
  if (category) {
    formData.append('category', category)
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  })

  const data = await response.json()
  if (!response.ok) {
    if (response.status === 401) {
      const shouldRedirect = shouldRedirectOnUnauthorized()
      clearToken()
      if (shouldRedirect) notifyUnauthorized()
    }
    throw new ApiError(data.error || 'Upload failed', response.status)
  }
  return data as T
}

// ===== AUTH API =====

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const data = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    if (data.token) setToken(data.token)
    return data
  },

  register: async (userData: Record<string, unknown>, fileMap?: Record<string, File | null | undefined>): Promise<LoginResponse> => {
    const hasFiles = fileMap && Object.values(fileMap).some(Boolean)
    const body = hasFiles
      ? buildFormData(userData, fileMap as Record<string, File | File[] | null | undefined>)
      : JSON.stringify(userData)
    const data = await apiFetch<LoginResponse>('/auth/register', {
      method: 'POST',
      body,
    })
    if (data.token) setToken(data.token)
    return data
  },

  sendOtp: async (email: string, purpose: 'registration' | 'forgot_password'): Promise<ApiResponse> => {
    return apiFetch('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email, purpose }),
    })
  },

  verifyOtp: async (
    email: string,
    otp: string,
    purpose: 'registration' | 'forgot_password'
  ): Promise<ApiResponse<{ verificationToken: string }> & { verificationToken?: string }> => {
    return apiFetch('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp, purpose }),
    })
  },

  resetPassword: async (email: string, password: string, verificationToken: string): Promise<ApiResponse> => {
    return apiFetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, password, verificationToken }),
    })
  },

  me: async (): Promise<LoginResponse> => {
    return apiFetch('/auth/me')
  },

  logout: (): void => {
    clearToken()
  },
}

// ===== CARS API =====

export const carsApi = {
  list: async (params: Record<string, string | number | boolean | undefined> = {}): Promise<ApiResponse<CarData[]>> => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value))
      }
    })
    return apiFetch(`/cars?${searchParams.toString()}`)
  },

  get: async (id: string): Promise<ApiResponse<CarData>> => {
    return apiFetch(`/cars/${id}`)
  },

  create: async (carData: Record<string, unknown>, photoFiles?: File[]): Promise<ApiResponse<CarData>> => {
    const hasFiles = photoFiles && photoFiles.length > 0
    if (hasFiles) {
      const formData = new FormData()
      for (const [key, value] of Object.entries(carData)) {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value))
        }
      }
      for (let i = 0; i < photoFiles!.length; i++) {
        formData.append(`photo_${i}`, photoFiles![i])
      }
      return apiFetch('/cars', {
        method: 'POST',
        body: formData,
      })
    }
    return apiFetch('/cars', {
      method: 'POST',
      body: JSON.stringify(carData),
    })
  },

  update: async (id: string, carData: Record<string, unknown>): Promise<ApiResponse<CarData>> => {
    return apiFetch(`/cars/${id}`, {
      method: 'PUT',
      body: JSON.stringify(carData),
    })
  },

  delete: async (id: string): Promise<ApiResponse> => {
    return apiFetch(`/cars/${id}`, { method: 'DELETE' })
  },
}

// ===== BOOKINGS API =====

export const bookingsApi = {
  list: async (params: Record<string, string> = {}): Promise<ApiResponse> => {
    const searchParams = new URLSearchParams(params)
    return apiFetch(`/bookings?${searchParams.toString()}`)
  },

  get: async (id: string): Promise<ApiResponse> => {
    return apiFetch(`/bookings/${id}`)
  },

  create: async (bookingData: Record<string, unknown> | { carId: string; type: string; totalAmount: number; startDate?: string; endDate?: string }): Promise<ApiResponse> => {
    return apiFetch('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    })
  },

  update: async (id: string, data: Record<string, unknown>): Promise<ApiResponse> => {
    return apiFetch(`/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
}

// ===== PAYMENTS API =====

export const paymentsApi = {
  list: async (params: Record<string, string> = {}): Promise<ApiResponse> => {
    const searchParams = new URLSearchParams(params)
    return apiFetch(`/payments?${searchParams.toString()}`)
  },

  get: async (id: string): Promise<ApiResponse> => {
    return apiFetch(`/payments/${id}`)
  },

  uploadReceipt: async (id: string, file: File): Promise<ApiResponse> => {
    const formData = new FormData()
    formData.append('receipt', file)
    return apiFetch(`/payments/${id}`, {
      method: 'PUT',
      body: formData,
    })
  },

  verify: async (id: string): Promise<ApiResponse> => {
    return apiFetch(`/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'verified' }),
    })
  },

  reject: async (id: string, reason: string): Promise<ApiResponse> => {
    return apiFetch(`/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'rejected', rejectionReason: reason }),
    })
  },
}

// ===== CONTINUE LOAN API =====

export const continueLoanApi = {
  list: async (params: Record<string, string> = {}): Promise<ApiResponse> => {
    const searchParams = new URLSearchParams(params)
    return apiFetch(`/continue-loan?${searchParams.toString()}`)
  },

  get: async (id: string): Promise<ApiResponse> => {
    return apiFetch(`/continue-loan/${id}`)
  },

  create: async (data: Record<string, unknown>): Promise<ApiResponse> => {
    return apiFetch('/continue-loan', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id: string, data: Record<string, unknown>, fileMap?: Record<string, File | null | undefined>): Promise<ApiResponse> => {
    const hasFiles = fileMap && Object.values(fileMap).some(Boolean)
    const body = hasFiles
      ? buildFormData(data, fileMap as Record<string, File | File[] | null | undefined>)
      : JSON.stringify(data)
    return apiFetch(`/continue-loan/${id}`, {
      method: 'PUT',
      body,
    })
  },
}

// ===== LOANS API =====

export const loansApi = {
  list: async (params: Record<string, string> = {}): Promise<ApiResponse> => {
    const searchParams = new URLSearchParams(params)
    return apiFetch(`/loans?${searchParams.toString()}`)
  },

  get: async (id: string): Promise<ApiResponse> => {
    return apiFetch(`/loans/${id}`)
  },

  create: async (data: Record<string, unknown>): Promise<ApiResponse> => {
    return apiFetch('/loans', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id: string, data: Record<string, unknown>): Promise<ApiResponse> => {
    return apiFetch(`/loans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
}

// ===== AUCTIONS API =====

export const auctionsApi = {
  list: async (params: Record<string, string> = {}): Promise<ApiResponse> => {
    const searchParams = new URLSearchParams(params)
    return apiFetch(`/auctions?${searchParams.toString()}`)
  },

  placeBid: async (data: { carId: string; amount: number }): Promise<ApiResponse> => {
    return apiFetch('/auctions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}

// ===== WORKSHOPS API =====

export const workshopsApi = {
  list: async (params: Record<string, string> = {}): Promise<ApiResponse> => {
    const searchParams = new URLSearchParams(params)
    return apiFetch(`/workshops?${searchParams.toString()}`)
  },

  createAppointment: async (data: Record<string, unknown>): Promise<ApiResponse> => {
    return apiFetch('/workshops', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}

// ===== INSURANCE API =====

export const insuranceApi = {
  list: async (params: Record<string, string> = {}): Promise<ApiResponse> => {
    const searchParams = new URLSearchParams(params)
    return apiFetch(`/insurance?${searchParams.toString()}`)
  },

  createEnquiry: async (data: Record<string, unknown>): Promise<ApiResponse> => {
    return apiFetch('/insurance', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}

// ===== DEALER API =====

export const dealerApi = {
  getCars: async (params: Record<string, string> = {}): Promise<ApiResponse> => {
    const searchParams = new URLSearchParams(params)
    return apiFetch(`/dealer/cars?${searchParams.toString()}`)
  },

  getBookings: async (params: Record<string, string> = {}): Promise<ApiResponse> => {
    const searchParams = new URLSearchParams(params)
    return apiFetch(`/dealer/bookings?${searchParams.toString()}`)
  },

  getStats: async (): Promise<ApiResponse> => {
    return apiFetch('/dealer/stats')
  },
}

// ===== ADMIN API =====

export const adminApi = {
  getStats: async (): Promise<ApiResponse> => {
    return apiFetch('/admin/stats?summary=true')
  },

  getDealers: async (params: Record<string, string> = {}): Promise<ApiResponse> => {
    const searchParams = new URLSearchParams(params)
    return apiFetch(`/admin/dealers?${searchParams.toString()}`)
  },

  verifyDealer: async (id: string, action: 'verify' | 'reject', reason?: string): Promise<ApiResponse> => {
    return apiFetch('/admin/dealers', {
      method: 'PUT',
      body: JSON.stringify({ dealerId: id, action, rejectionReason: reason }),
    })
  },

  getCars: async (params: Record<string, string> = {}): Promise<ApiResponse> => {
    const searchParams = new URLSearchParams(params)
    return apiFetch(`/admin/cars?${searchParams.toString()}`)
  },

  approveCar: async (id: string, action: 'approve' | 'reject', reason?: string, bookingFee?: number): Promise<ApiResponse> => {
    return apiFetch('/admin/cars', {
      method: 'PUT',
      body: JSON.stringify({ carId: id, action, rejectionReason: reason, bookingFee }),
    })
  },

  getPayments: async (params: Record<string, string> = {}): Promise<ApiResponse> => {
    const searchParams = new URLSearchParams(params)
    return apiFetch(`/admin/payments?${searchParams.toString()}`)
  },

  verifyPayment: async (id: string, action: 'verify' | 'reject', reason?: string): Promise<ApiResponse> => {
    return apiFetch('/admin/payments', {
      method: 'PUT',
      body: JSON.stringify({ paymentId: id, action, rejectionReason: reason }),
    })
  },
}

// ===== NOTIFICATIONS API =====

export const notificationsApi = {
  list: async (): Promise<ApiResponse> => {
    return apiFetch('/notifications')
  },

  markRead: async (id?: string): Promise<ApiResponse> => {
    return apiFetch('/notifications', {
      method: 'PUT',
      body: JSON.stringify(id ? { notificationIds: [id] } : { markAllRead: true }),
    })
  },
}

// ===== WISHLIST API =====

export const wishlistApi = {
  list: async (): Promise<ApiResponse> => {
    return apiFetch('/wishlist')
  },

  add: async (carId: string): Promise<ApiResponse> => {
    return apiFetch('/wishlist', {
      method: 'POST',
      body: JSON.stringify({ carId }),
    })
  },

  remove: async (carId: string): Promise<ApiResponse> => {
    return apiFetch(`/wishlist?carId=${encodeURIComponent(carId)}`, {
      method: 'DELETE',
    })
  },
}

// ===== REVIEWS API =====

export const reviewApi = {
  list: async (params: Record<string, string | number | boolean | undefined> = {}): Promise<ApiResponse> => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value))
      }
    })
    return apiFetch(`/reviews?${searchParams.toString()}`)
  },

  get: async (id: string): Promise<ApiResponse> => {
    return apiFetch(`/reviews/${id}`)
  },

  create: async (data: {
    carId?: string
    dealerId?: string
    targetType: 'car' | 'dealer'
    rating: number
    comment?: string
    bookingId?: string
  }): Promise<ApiResponse> => {
    return apiFetch('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id: string, data: Record<string, unknown>): Promise<ApiResponse> => {
    return apiFetch(`/reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  delete: async (id: string): Promise<ApiResponse> => {
    return apiFetch(`/reviews/${id}`, { method: 'DELETE' })
  },
}

// ===== UPLOAD API =====

export const uploadApi = {
  upload: async (file: File, category?: string): Promise<{ url: string }> => {
    return apiUpload('/upload', file, category)
  },
}
