import { create } from 'zustand'
import { authApi, setToken, getToken, clearToken } from '@/lib/api'

// ===== VIEW TYPES (kept for reference, navigation now uses URLs) =====

export type PaymentStatus = 'none' | 'pending' | 'uploaded' | 'verified' | 'rejected'

// ===== STATE INTERFACES =====

interface BookingState {
  bookingId: string | null
  bookingType: 'rent' | 'sale' | 'continueLoan' | 'auction' | 'insurance' | 'workshop' | null
  amount: number
  paymentStatus: PaymentStatus
  receiptUploaded: boolean
  contactUnlocked: boolean
  paymentId: string | null
}

export interface UserState {
  id: string | null
  email: string | null
  name: string | null
  phone: string | null
  whatsapp: string | null
  role: 'customer' | 'dealer' | 'admin' | null
  verified: boolean
  avatar: string | null
  dealerId?: string | null
  dealer?: Record<string, unknown> | null
}

interface AppState {
  // Navigation (URL-based now, no more view state)
  selectedCarId: string | null
  selectedCarType: string | null

  // Search & Filters
  searchQuery: string
  selectedCity: string
  filterType: string

  // Auth
  isLoggedIn: boolean
  user: UserState | null

  // UI
  showMobileMenu: boolean
  loading: boolean

  // Booking Flow
  booking: BookingState

  // Actions — Car selection
  selectCar: (carId: string, carType: string) => void

  // Actions — Search
  setSearch: (query: string) => void
  setCity: (city: string) => void
  setFilter: (type: string) => void

  // Actions — Auth
  login: (user: UserState, token: string) => void
  logout: () => void
  checkAuth: () => Promise<void>

  // Actions — UI
  toggleMobileMenu: () => void
  setLoading: (loading: boolean) => void

  // Actions — Booking
  startBooking: (type: BookingState['bookingType'], amount: number, bookingId?: string, paymentId?: string) => void
  uploadReceipt: () => void
  verifyPayment: () => void
  rejectPayment: () => void
  resetBooking: () => void
}

// ===== INITIAL STATES =====

const initialBooking: BookingState = {
  bookingId: null,
  bookingType: null,
  amount: 0,
  paymentStatus: 'none',
  receiptUploaded: false,
  contactUnlocked: false,
  paymentId: null,
}

// ===== STORE =====

let authCheckPromise: Promise<void> | null = null

export const useAppStore = create<AppState>((set) => ({
  selectedCarId: null,
  selectedCarType: null,
  searchQuery: '',
  selectedCity: '',
  filterType: 'all',
  isLoggedIn: false,
  user: null,
  showMobileMenu: false,
  loading: false,
  booking: { ...initialBooking },

  // Car selection — stores car ID, navigation happens via router
  selectCar: (carId, carType) => set({ selectedCarId: carId, selectedCarType: carType }),

  // Search
  setSearch: (query) => set({ searchQuery: query }),
  setCity: (city) => set({ selectedCity: city }),
  setFilter: (type) => set({ filterType: type }),

  // Auth
  login: (user, token) => {
    setToken(token)
    set({ isLoggedIn: true, user })
  },

  logout: () => {
    clearToken()
    set({
      isLoggedIn: false,
      user: null,
      booking: { ...initialBooking },
    })
    // Redirect to home page
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.location.href = '/'
    }
  },

  checkAuth: async () => {
    if (!getToken()) {
      clearToken()
      set({ isLoggedIn: false, user: null })
      return
    }

    // Prevent duplicate auth checks
    if (authCheckPromise) return authCheckPromise

    authCheckPromise = (async () => {
      try {
        const data = await authApi.me()
        if (data.user) {
          const u = data.user
          set({
            isLoggedIn: true,
            user: {
              id: u.id,
              email: u.email,
              name: u.name,
              phone: u.phone,
              whatsapp: u.whatsapp,
              role: u.role,
              verified: u.verified,
              avatar: u.avatar,
              dealerId: u.dealer?.id || null,
              dealer: u.dealer || null,
            },
          })
        }
      } catch {
        clearToken()
        set({ isLoggedIn: false, user: null })
      } finally {
        authCheckPromise = null
      }
    })()

    return authCheckPromise
  },

  // UI
  toggleMobileMenu: () => set((state) => ({ showMobileMenu: !state.showMobileMenu })),
  setLoading: (loading) => set({ loading }),

  // Booking Flow
  startBooking: (type, amount, bookingId, paymentId) => set({
    booking: {
      bookingId: bookingId || 'BK' + Date.now().toString(36).toUpperCase(),
      bookingType: type,
      amount,
      paymentStatus: 'pending',
      receiptUploaded: false,
      contactUnlocked: false,
      paymentId: paymentId || null,
    },
  }),

  uploadReceipt: () => set((state) => ({
    booking: { ...state.booking, receiptUploaded: true, paymentStatus: 'uploaded' as PaymentStatus },
  })),

  verifyPayment: () => set((state) => ({
    booking: { ...state.booking, paymentStatus: 'verified' as PaymentStatus, contactUnlocked: true },
  })),

  rejectPayment: () => set((state) => ({
    booking: { ...state.booking, paymentStatus: 'rejected' as PaymentStatus, receiptUploaded: false },
  })),

  resetBooking: () => set({ booking: { ...initialBooking } }),
}))
