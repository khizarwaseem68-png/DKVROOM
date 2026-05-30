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
  
  navigate: (view: View) => void
  goBack: () => void
  selectCar: (carId: string, carType: string) => void
  setSearch: (query: string) => void
  setCity: (city: string) => void
  setFilter: (type: string) => void
  login: (role: 'customer' | 'dealer' | 'admin', name: string) => void
  logout: () => void
  toggleMobileMenu: () => void
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

  navigate: (view) => set({ previousView: get().currentView, currentView: view, showMobileMenu: false }),
  goBack: () => set((state) => ({ currentView: state.previousView || 'home', previousView: null })),
  selectCar: (carId, carType) => set({ selectedCarId: carId, selectedCarType: carType, currentView: 'carDetail', previousView: get().currentView }),
  setSearch: (query) => set({ searchQuery: query }),
  setCity: (city) => set({ selectedCity: city }),
  setFilter: (type) => set({ filterType: type }),
  login: (role, name) => set({ isLoggedIn: true, userRole: role, userName: name }),
  logout: () => set({ isLoggedIn: false, userRole: null, userName: null, currentView: 'home' }),
  toggleMobileMenu: () => set((state) => ({ showMobileMenu: !state.showMobileMenu })),
}))
