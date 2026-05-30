import { create } from 'zustand'
import { authApi, setToken, clearToken } from '@/lib/api'

export type View = 
  | 'home' 
  | 'rent' 
  | 'buy' 
  | 'repair' 
  | 'insurance' 
  | 'auction' 
  | 'loan' 
  | 'continueLoan'
  | 'carDetail'
  | 'dealerDashboard'
  | 'adminDashboard'
  | 'login'
  | 'register'
  | 'profile'
  | 'applyLoan'
  | 'trackStatus'
  | 'payment'
  | 'continueLoanEnquiry'

export type PaymentStatus = 'none' | 'pending' | 'uploaded' | 'verified' | 'rejected'

interface BookingState {
  bookingId: string | null
  bookingType: 'rent' | 'sale' | 'continueLoan' | 'auction' | 'insurance' | 'workshop' | null
  amount: number
  paymentStatus: PaymentStatus
  receiptUploaded: boolean
  contactUnlocked: boolean
  paymentId: string | null
}

interface UserState {
  id: string | null
  email: string | null
  name: string | null
  phone: string | null
  whatsapp: string | null
  role: 'customer' | 'dealer' | 'admin' | null
  verified: boolean
  avatar: string | null
  dealerId?: string | null
  dealer?: any | null
}

interface AppState {
  currentView: View
  previousView: View | null
  selectedCarId: string | null
  selectedCarType: string | null
  searchQuery: string
  selectedCity: string
  filterType: string
  isLoggedIn: boolean
  user: UserState | null
  showMobileMenu: boolean
  booking: BookingState
  loading: boolean
  
  navigate: (view: View) => void
  goBack: () => void
  selectCar: (carId: string, carType: string) => void
  setSearch: (query: string) => void
  setCity: (city: string) => void
  setFilter: (type: string) => void
  login: (user: UserState, token: string) => void
  logout: () => void
  toggleMobileMenu: () => void
  startBooking: (type: BookingState['bookingType'], amount: number, bookingId?: string, paymentId?: string) => void
  uploadReceipt: () => void
  verifyPayment: () => void
  rejectPayment: () => void
  resetBooking: () => void
  setLoading: (loading: boolean) => void
  checkAuth: () => Promise<void>
}

const initialBooking: BookingState = {
  bookingId: null,
  bookingType: null,
  amount: 0,
  paymentStatus: 'none',
  receiptUploaded: false,
  contactUnlocked: false,
  paymentId: null,
}

const initialUser: UserState = {
  id: null,
  email: null,
  name: null,
  phone: null,
  whatsapp: null,
  role: null,
  verified: false,
  avatar: null,
  dealerId: null,
  dealer: null,
}

export const useAppStore = create<AppState>((set, get) => ({
  currentView: 'home',
  previousView: null,
  selectedCarId: null,
  selectedCarType: null,
  searchQuery: '',
  selectedCity: '',
  filterType: 'all',
  isLoggedIn: false,
  user: null,
  showMobileMenu: false,
  booking: { ...initialBooking },
  loading: false,

  navigate: (view) => set({ previousView: get().currentView, currentView: view, showMobileMenu: false }),
  goBack: () => set((state) => ({ currentView: state.previousView || 'home', previousView: null })),
  selectCar: (carId, carType) => set({ selectedCarId: carId, selectedCarType: carType, currentView: 'carDetail', previousView: get().currentView }),
  setSearch: (query) => set({ searchQuery: query }),
  setCity: (city) => set({ selectedCity: city }),
  setFilter: (type) => set({ filterType: type }),
  
  login: (user, token) => {
    setToken(token)
    set({
      isLoggedIn: true,
      user,
    })
  },

  logout: () => {
    clearToken()
    set({
      isLoggedIn: false,
      user: null,
      currentView: 'home',
      booking: { ...initialBooking },
    })
  },

  toggleMobileMenu: () => set((state) => ({ showMobileMenu: !state.showMobileMenu })),
  
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
    currentView: 'payment',
    previousView: get().currentView,
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
  
  setLoading: (loading) => set({ loading }),

  checkAuth: async () => {
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
      // Token invalid or expired
      clearToken()
      set({ isLoggedIn: false, user: null })
    }
  },
}))
