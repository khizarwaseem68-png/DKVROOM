import { create } from 'zustand'

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
  userRole: 'customer' | 'dealer' | 'admin' | null
  userName: string | null
  showMobileMenu: boolean
  booking: BookingState
  
  navigate: (view: View) => void
  goBack: () => void
  selectCar: (carId: string, carType: string) => void
  setSearch: (query: string) => void
  setCity: (city: string) => void
  setFilter: (type: string) => void
  login: (role: 'customer' | 'dealer' | 'admin', name: string) => void
  logout: () => void
  toggleMobileMenu: () => void
  startBooking: (type: BookingState['bookingType'], amount: number) => void
  uploadReceipt: () => void
  verifyPayment: () => void
  rejectPayment: () => void
  resetBooking: () => void
}

const initialBooking: BookingState = {
  bookingId: null,
  bookingType: null,
  amount: 0,
  paymentStatus: 'none',
  receiptUploaded: false,
  contactUnlocked: false,
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
  userRole: null,
  userName: null,
  showMobileMenu: false,
  booking: { ...initialBooking },

  navigate: (view) => set({ previousView: get().currentView, currentView: view, showMobileMenu: false }),
  goBack: () => set((state) => ({ currentView: state.previousView || 'home', previousView: null })),
  selectCar: (carId, carType) => set({ selectedCarId: carId, selectedCarType: carType, currentView: 'carDetail', previousView: get().currentView }),
  setSearch: (query) => set({ searchQuery: query }),
  setCity: (city) => set({ selectedCity: city }),
  setFilter: (type) => set({ filterType: type }),
  login: (role, name) => set({ isLoggedIn: true, userRole: role, userName: name }),
  logout: () => set({ isLoggedIn: false, userRole: null, userName: null, currentView: 'home', booking: { ...initialBooking } }),
  toggleMobileMenu: () => set((state) => ({ showMobileMenu: !state.showMobileMenu })),
  
  startBooking: (type, amount) => set({
    booking: {
      bookingId: 'BK' + Date.now().toString(36).toUpperCase(),
      bookingType: type,
      amount,
      paymentStatus: 'pending',
      receiptUploaded: false,
      contactUnlocked: false,
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
}))
